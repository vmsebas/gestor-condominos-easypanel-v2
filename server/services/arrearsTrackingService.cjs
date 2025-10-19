const { db: knex } = require('../config/knex.cjs');

class ArrearsTrackingService {
  /**
   * Verificar y actualizar pagos vencidos
   * Este método debe ejecutarse diariamente
   */
  async checkAndUpdateOverduePayments() {
    const trx = await knex.transaction();
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 1. Buscar transacciones pendientes que ya están vencidas
      const overdueTransactions = await trx('transactions')
        .where('transaction_type', 'monthly_quota')
        .where(function() {
          this.where('status', 'pending').orWhereNull('status')
        })
        .where('due_date', '<', today)
        .select('*');
      
      console.log(`📊 Encontradas ${overdueTransactions.length} transacciones vencidas`);
      
      // 2. Actualizar status a 'overdue' en transactions
      if (overdueTransactions.length > 0) {
        await trx('transactions')
          .whereIn('id', overdueTransactions.map(t => t.id))
          .update({
            status: 'overdue',
            updated_at: new Date()
          });
      }
      
      // 3. Obtener configuración de morosidad para cada edificio
      const buildingConfigs = await trx('arrears_config')
        .select('*');
      
      const configMap = {};
      buildingConfigs.forEach(config => {
        configMap[config.building_id] = config;
      });
      
      // 4. Procesar cada transacción vencida
      for (const transaction of overdueTransactions) {
        const config = configMap[transaction.building_id] || {
          grace_period_days: 10,
          auto_generate_arrears: true
        };
        
        // Calcular días de atraso
        const daysOverdue = Math.floor((today - new Date(transaction.due_date)) / (1000 * 60 * 60 * 24));
        
        // Solo crear registro de morosidad si pasó el período de gracia
        if (daysOverdue > config.grace_period_days && config.auto_generate_arrears) {
          // Verificar si ya existe un registro de morosidad para esta transacción
          const existingArrear = await trx('arrears')
            .where('settlement_transaction_id', transaction.id)
            .first();
          
          if (!existingArrear) {
            // Crear registro en tabla arrears
            await trx('arrears').insert({
              id: knex.raw('gen_random_uuid()'),
              member_id: transaction.member_id,
              building_id: transaction.building_id,
              amount: transaction.amount,
              original_amount: transaction.amount,
              due_date: transaction.due_date,
              description: `Cuota impaga - ${transaction.description}`,
              status: 'pending',
              reminder_count: 0,
              settlement_transaction_id: transaction.id,
              created_at: new Date(),
              updated_at: new Date()
            });
            
            console.log(`⚠️ Registo de incumprimento criado para membro ${transaction.member_id}`);
          }
        }
      }
      
      await trx.commit();
      
      return {
        success: true,
        processed: overdueTransactions.length,
        message: `Procesadas ${overdueTransactions.length} transacciones vencidas`
      };
      
    } catch (error) {
      await trx.rollback();
      console.error('❌ Error en checkAndUpdateOverduePayments:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de morosidad para un edificio
   */
  async getBuildingArrearsSum(buildingId, options = {}) {
    try {
      const { includeDetails = false, memberFilter = null } = options;
      
      // Resumen general
      const summary = await knex('arrears')
        .where('building_id', buildingId)
        .where('status', 'pending')
        .select(
          knex.raw('COUNT(DISTINCT member_id) as members_in_debt'),
          knex.raw('COUNT(*) as total_arrears_count'),
          knex.raw('SUM(amount) as total_amount'),
          knex.raw('MIN(due_date) as oldest_debt_date'),
          knex.raw('MAX(due_date) as newest_debt_date')
        )
        .first();
      
      // Detalles por miembro si se solicita
      let memberDetails = [];
      if (includeDetails) {
        const query = knex('arrears as a')
          .join('members as m', 'a.member_id', 'm.id')
          .where('a.building_id', buildingId)
          .where('a.status', 'pending')
          .groupBy('m.id', 'm.name', 'm.apartment', 'm.email')
          .select(
            'm.id as member_id',
            'm.name as member_name',
            'm.apartment as unit_number',
            'm.email',
            knex.raw('COUNT(a.id) as arrears_count'),
            knex.raw('SUM(a.amount) as total_debt'),
            knex.raw('MIN(a.due_date) as oldest_due_date'),
            knex.raw('MAX(CURRENT_DATE - a.due_date::date) as max_days_overdue')
          )
          .orderBy('total_debt', 'desc');
        
        if (memberFilter) {
          query.where('m.id', memberFilter);
        }
        
        memberDetails = await query;
      }
      
      return {
        summary: {
          ...summary,
          total_amount: parseFloat(summary.total_amount || 0),
          average_debt: summary.members_in_debt > 0 
            ? parseFloat(summary.total_amount || 0) / summary.members_in_debt 
            : 0
        },
        memberDetails
      };
      
    } catch (error) {
      console.error('❌ Error en getBuildingArrearsSum:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de morosidad de un miembro
   */
  async getMemberArrearsHistory(memberId) {
    try {
      const currentArrears = await knex('arrears')
        .where('member_id', memberId)
        .where('status', 'pending')
        .orderBy('due_date', 'asc')
        .select('*');
      
      const historicalArrears = await knex('arrears')
        .where('member_id', memberId)
        .where('status', 'settled')
        .orderBy('settled_date', 'desc')
        .limit(10)
        .select('*');
      
      // Calcular estadísticas
      const stats = await knex('arrears')
        .where('member_id', memberId)
        .select(
          knex.raw('COUNT(*) as total_arrears'),
          knex.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending_count'),
          knex.raw('COUNT(CASE WHEN status = \'settled\' THEN 1 END) as settled_count'),
          knex.raw('SUM(CASE WHEN status = \'pending\' THEN amount ELSE 0 END) as pending_amount'),
          knex.raw('SUM(CASE WHEN status = \'settled\' THEN amount ELSE 0 END) as settled_amount')
        )
        .first();
      
      return {
        current: currentArrears,
        historical: historicalArrears,
        stats: {
          ...stats,
          pending_amount: parseFloat(stats.pending_amount || 0),
          settled_amount: parseFloat(stats.settled_amount || 0)
        }
      };
      
    } catch (error) {
      console.error('❌ Error en getMemberArrearsHistory:', error);
      throw error;
    }
  }

  /**
   * Marcar un pago como recibido y actualizar morosidad
   */
  async markPaymentReceived(transactionId, paymentData) {
    const trx = await knex.transaction();
    
    try {
      // 1. Actualizar transacción
      await trx('transactions')
        .where('id', transactionId)
        .update({
          status: 'paid',
          payment_date: paymentData.payment_date || new Date(),
          payment_method: paymentData.payment_method,
          payment_status: 'completed',
          reference_number: paymentData.reference,
          updated_at: new Date()
        });
      
      // 2. Buscar y actualizar registro de morosidad asociado
      const arrear = await trx('arrears')
        .where('settlement_transaction_id', transactionId)
        .where('status', 'pending')
        .first();
      
      if (arrear) {
        await trx('arrears')
          .where('id', arrear.id)
          .update({
            status: 'settled',
            settled_date: paymentData.payment_date || new Date(),
            updated_at: new Date()
          });
        
        console.log(`✅ Morosidad liquidada para transacción ${transactionId}`);
      }
      
      // 3. Registrar en historial de pagos
      const transaction = await trx('transactions')
        .where('id', transactionId)
        .first();
      
      await trx('payment_history').insert({
        id: knex.raw('gen_random_uuid()'),
        transaction_id: transactionId,
        member_id: transaction.member_id,
        building_id: transaction.building_id,
        amount: transaction.amount,
        payment_date: paymentData.payment_date || new Date(),
        payment_method: paymentData.payment_method,
        reference: paymentData.reference,
        notes: paymentData.notes,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await trx.commit();
      
      return {
        success: true,
        message: 'Pagamento registado com sucesso'
      };
      
    } catch (error) {
      await trx.rollback();
      console.error('❌ Error en markPaymentReceived:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración de morosidad para un edificio
   */
  async getArrearsConfig(buildingId) {
    try {
      let config = await knex('arrears_config')
        .where('building_id', buildingId)
        .first();
      
      // Si no existe, crear configuración por defecto
      if (!config) {
        config = {
          building_id: buildingId,
          grace_period_days: 10,
          late_fee_percentage: 0,
          send_reminders: true,
          reminder_frequency_days: 7,
          max_reminders: 3,
          auto_generate_arrears: true
        };
        
        await knex('arrears_config').insert({
          ...config,
          id: knex.raw('gen_random_uuid()'),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      return config;
      
    } catch (error) {
      console.error('❌ Error en getArrearsConfig:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuración de morosidad
   */
  async updateArrearsConfig(buildingId, configData) {
    try {
      const existing = await knex('arrears_config')
        .where('building_id', buildingId)
        .first();
      
      if (existing) {
        await knex('arrears_config')
          .where('building_id', buildingId)
          .update({
            ...configData,
            updated_at: new Date()
          });
      } else {
        await knex('arrears_config').insert({
          id: knex.raw('gen_random_uuid()'),
          building_id: buildingId,
          ...configData,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      return {
        success: true,
        message: 'Configuración actualizada'
      };
      
    } catch (error) {
      console.error('❌ Error en updateArrearsConfig:', error);
      throw error;
    }
  }

  /**
   * Generar reporte de morosidad
   */
  async generateArrearsReport(buildingId, dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      
      // Query base
      let query = knex('arrears as a')
        .join('members as m', 'a.member_id', 'm.id')
        .where('a.building_id', buildingId);
      
      // Aplicar filtros de fecha si existen
      if (startDate) {
        query = query.where('a.due_date', '>=', startDate);
      }
      if (endDate) {
        query = query.where('a.due_date', '<=', endDate);
      }
      
      // Obtener datos agrupados por estado
      const byStatus = await query
        .clone()
        .groupBy('a.status')
        .select(
          'a.status',
          knex.raw('COUNT(*) as count'),
          knex.raw('SUM(a.amount) as total_amount')
        );
      
      // Obtener top morosos
      const topDebtors = await query
        .clone()
        .where('a.status', 'pending')
        .groupBy('m.id', 'm.name', 'm.apartment')
        .select(
          'm.name',
          'm.apartment as unit_number',
          knex.raw('COUNT(*) as arrears_count'),
          knex.raw('SUM(a.amount) as total_debt')
        )
        .orderBy('total_debt', 'desc')
        .limit(10);
      
      // Evolución mensual
      const monthlyEvolution = await knex.raw(`
        SELECT 
          DATE_TRUNC('month', due_date) as month,
          COUNT(*) as new_arrears,
          SUM(amount) as monthly_amount
        FROM arrears
        WHERE building_id = ?
        ${startDate ? "AND due_date >= ?" : ""}
        ${endDate ? "AND due_date <= ?" : ""}
        GROUP BY DATE_TRUNC('month', due_date)
        ORDER BY month DESC
        LIMIT 12
      `, [buildingId, startDate, endDate].filter(Boolean));
      
      return {
        byStatus,
        topDebtors,
        monthlyEvolution: monthlyEvolution.rows,
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error('❌ Error en generateArrearsReport:', error);
      throw error;
    }
  }
}

module.exports = new ArrearsTrackingService();