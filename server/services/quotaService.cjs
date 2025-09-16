const { db: knex } = require('../config/knex.cjs');

class QuotaService {
  async generateMonthlyQuotas() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('pt-PT', { month: 'long' });
    
    try {
      // Get all active buildings
      const buildings = await knex('buildings')
        .where('is_active', true)
        .select('id', 'name', 'monthly_quota', 'reserve_fund_percentage');
      
      let totalQuotasGenerated = 0;
      
      for (const building of buildings) {
        // Get all active members for this building
        const members = await knex('members')
          .where('building_id', building.id)
          .where('is_active', true)
          .select('id', 'name', 'email', 'unit_number', 'ownership_percentage');
        
        // Check if quotas already exist for this month
        const existingQuotas = await knex('transactions')
          .where('building_id', building.id)
          .where('transaction_type', 'monthly_quota')
          .whereRaw('EXTRACT(MONTH FROM due_date) = ?', [currentMonth])
          .whereRaw('EXTRACT(YEAR FROM due_date) = ?', [currentYear])
          .first();
        
        if (existingQuotas) {
          console.log(`⚠️ Quotas already generated for ${building.name} in ${monthName}`);
          continue;
        }
        
        // Generate quotas for each member
        const quotaTransactions = [];
        for (const member of members) {
          const quotaAmount = building.monthly_quota * (member.ownership_percentage || 1);
          const reserveFundAmount = quotaAmount * (building.reserve_fund_percentage / 100 || 0.1);
          
          quotaTransactions.push({
            building_id: building.id,
            member_id: member.id,
            transaction_type: 'monthly_quota',
            category: 'income',
            amount: quotaAmount,
            reserve_fund_amount: reserveFundAmount,
            description: `Quota mensal - ${monthName} ${currentYear}`,
            due_date: new Date(currentYear, currentMonth - 1, 10), // Due on 10th of month
            status: 'pending',
            created_at: now,
            updated_at: now
          });
        }
        
        if (quotaTransactions.length > 0) {
          await knex('transactions').insert(quotaTransactions);
          totalQuotasGenerated += quotaTransactions.length;
          console.log(`✅ Generated ${quotaTransactions.length} quotas for ${building.name}`);
        }
      }
      
      return {
        count: totalQuotasGenerated,
        month: monthName,
        year: currentYear
      };
    } catch (error) {
      console.error('Error generating monthly quotas:', error);
      throw error;
    }
  }

  async getPendingPaymentsForMonth() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    try {
      const pendingPayments = await knex('transactions as t')
        .join('members as m', 't.member_id', 'm.id')
        .join('buildings as b', 't.building_id', 'b.id')
        .where('t.status', 'pending')
        .where('t.transaction_type', 'monthly_quota')
        .whereRaw('EXTRACT(MONTH FROM t.due_date) = ?', [currentMonth])
        .whereRaw('EXTRACT(YEAR FROM t.due_date) = ?', [currentYear])
        .select(
          't.id',
          't.amount',
          't.due_date',
          't.description',
          'm.name as member_name',
          'm.email as member_email',
          'm.unit_number',
          'b.name as building_name'
        );
      
      return pendingPayments;
    } catch (error) {
      console.error('Error getting pending payments:', error);
      throw error;
    }
  }

  async markPaymentAsReceived(transactionId, paymentData) {
    try {
      const transaction = await knex('transactions')
        .where('id', transactionId)
        .first();
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Update transaction status
      await knex('transactions')
        .where('id', transactionId)
        .update({
          status: 'paid',
          payment_date: paymentData.paymentDate || new Date(),
          payment_method: paymentData.paymentMethod || 'transfer',
          payment_reference: paymentData.reference,
          updated_at: new Date()
        });
      
      // Create income record
      await knex('transactions').insert({
        building_id: transaction.building_id,
        member_id: transaction.member_id,
        transaction_type: 'payment_received',
        category: 'income',
        amount: transaction.amount,
        description: `Payment received for ${transaction.description}`,
        transaction_date: paymentData.paymentDate || new Date(),
        status: 'completed',
        reference_transaction_id: transactionId,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error marking payment as received:', error);
      throw error;
    }
  }

  async generateMonthlyReport() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('pt-PT', { month: 'long' });
    
    try {
      const buildings = await knex('buildings')
        .where('is_active', true)
        .select('id', 'name');
      
      const reportData = [];
      
      for (const building of buildings) {
        // Get income for the month
        const income = await knex('transactions')
          .where('building_id', building.id)
          .where('category', 'income')
          .whereRaw('EXTRACT(MONTH FROM transaction_date) = ?', [currentMonth])
          .whereRaw('EXTRACT(YEAR FROM transaction_date) = ?', [currentYear])
          .sum('amount as total')
          .first();
        
        // Get expenses for the month
        const expenses = await knex('transactions')
          .where('building_id', building.id)
          .where('category', 'expense')
          .whereRaw('EXTRACT(MONTH FROM transaction_date) = ?', [currentMonth])
          .whereRaw('EXTRACT(YEAR FROM transaction_date) = ?', [currentYear])
          .sum('amount as total')
          .first();
        
        // Get pending quotas
        const pendingQuotas = await knex('transactions')
          .where('building_id', building.id)
          .where('transaction_type', 'monthly_quota')
          .where('status', 'pending')
          .whereRaw('EXTRACT(MONTH FROM due_date) = ?', [currentMonth])
          .whereRaw('EXTRACT(YEAR FROM due_date) = ?', [currentYear])
          .sum('amount as total')
          .count('id as count')
          .first();
        
        // Get paid quotas
        const paidQuotas = await knex('transactions')
          .where('building_id', building.id)
          .where('transaction_type', 'monthly_quota')
          .where('status', 'paid')
          .whereRaw('EXTRACT(MONTH FROM due_date) = ?', [currentMonth])
          .whereRaw('EXTRACT(YEAR FROM due_date) = ?', [currentYear])
          .sum('amount as total')
          .count('id as count')
          .first();
        
        // Get reserve fund balance
        const reserveFund = await knex('transactions')
          .where('building_id', building.id)
          .whereNotNull('reserve_fund_amount')
          .sum('reserve_fund_amount as total')
          .first();
        
        reportData.push({
          building: building.name,
          month: monthName,
          year: currentYear,
          income: income.total || 0,
          expenses: expenses.total || 0,
          balance: (income.total || 0) - (expenses.total || 0),
          pendingQuotas: {
            count: pendingQuotas.count || 0,
            amount: pendingQuotas.total || 0
          },
          paidQuotas: {
            count: paidQuotas.count || 0,
            amount: paidQuotas.total || 0
          },
          collectionRate: paidQuotas.count > 0 ? 
            ((paidQuotas.count / (paidQuotas.count + pendingQuotas.count)) * 100).toFixed(2) : 0,
          reserveFundBalance: reserveFund.total || 0
        });
      }
      
      return {
        month: monthName,
        year: currentYear,
        generatedAt: now,
        buildings: reportData
      };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  async getFinancialSummary(buildingId, year, month) {
    try {
      // Get total income
      const incomeQuery = knex('transactions')
        .where('building_id', buildingId)
        .where('category', 'income')
        .whereRaw('EXTRACT(YEAR FROM transaction_date) = ?', [year]);
      
      if (month) {
        incomeQuery.whereRaw('EXTRACT(MONTH FROM transaction_date) = ?', [month]);
      }
      
      const income = await incomeQuery.sum('amount as total').first();
      
      // Get total expenses
      const expenseQuery = knex('transactions')
        .where('building_id', buildingId)
        .where('category', 'expense')
        .whereRaw('EXTRACT(YEAR FROM transaction_date) = ?', [year]);
      
      if (month) {
        expenseQuery.whereRaw('EXTRACT(MONTH FROM transaction_date) = ?', [month]);
      }
      
      const expenses = await expenseQuery.sum('amount as total').first();
      
      // Get pending quotas
      const pendingQuery = knex('transactions')
        .where('building_id', buildingId)
        .where('transaction_type', 'monthly_quota')
        .where('status', 'pending')
        .whereRaw('EXTRACT(YEAR FROM due_date) = ?', [year]);
      
      if (month) {
        pendingQuery.whereRaw('EXTRACT(MONTH FROM due_date) = ?', [month]);
      }
      
      const pending = await pendingQuery.sum('amount as total').count('id as count').first();
      
      // Get overdue quotas
      const overdue = await knex('transactions')
        .where('building_id', buildingId)
        .where('transaction_type', 'monthly_quota')
        .where('status', 'pending')
        .where('due_date', '<', new Date())
        .sum('amount as total')
        .count('id as count')
        .first();
      
      return {
        income: income.total || 0,
        expenses: expenses.total || 0,
        balance: (income.total || 0) - (expenses.total || 0),
        pendingQuotas: {
          count: pending.count || 0,
          amount: pending.total || 0
        },
        overdueQuotas: {
          count: overdue.count || 0,
          amount: overdue.total || 0
        }
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }
}

module.exports = new QuotaService();