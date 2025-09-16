const { db: knex } = require('../config/knex.cjs');

class ArrearsService {
  async checkOverduePayments() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all overdue monthly quotas grouped by member
      const overduePayments = await knex('transactions as t')
        .join('members as m', 't.member_id', 'm.id')
        .join('buildings as b', 't.building_id', 'b.id')
        .where('t.transaction_type', 'monthly_quota')
        .where('t.status', 'pending')
        .where('t.due_date', '<', today)
        .select(
          'm.id as member_id',
          'm.name as member_name',
          'm.email as member_email',
          'm.unit_number',
          'b.name as building_name',
          knex.raw('COUNT(t.id) as months_overdue'),
          knex.raw('SUM(t.amount) as total_overdue'),
          knex.raw('MIN(t.due_date) as oldest_due_date')
        )
        .groupBy('m.id', 'm.name', 'm.email', 'm.unit_number', 'b.name');
      
      // Add late fees if configured
      const membersWithFees = [];
      for (const member of overduePayments) {
        const daysSinceOldest = Math.floor((today - new Date(member.oldest_due_date)) / (1000 * 60 * 60 * 24));
        
        // Calculate late fee (e.g., 2% per month overdue)
        const lateFeePercentage = 0.02;
        const monthsLate = Math.floor(daysSinceOldest / 30);
        const lateFee = member.total_overdue * (lateFeePercentage * monthsLate);
        
        membersWithFees.push({
          ...member,
          late_fee: lateFee,
          total_with_fees: member.total_overdue + lateFee,
          days_overdue: daysSinceOldest
        });
        
        // Check if we need to create a late fee transaction
        if (lateFee > 0) {
          await this.addLateFeeTransaction(member.member_id, member.building_id, lateFee, monthsLate);
        }
      }
      
      return membersWithFees;
    } catch (error) {
      console.error('Error checking overdue payments:', error);
      throw error;
    }
  }

  async addLateFeeTransaction(memberId, buildingId, amount, monthsLate) {
    try {
      // Check if late fee already exists for this month
      const existingFee = await knex('transactions')
        .where('member_id', memberId)
        .where('transaction_type', 'late_fee')
        .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [new Date().getMonth() + 1])
        .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [new Date().getFullYear()])
        .first();
      
      if (!existingFee && amount > 0) {
        await knex('transactions').insert({
          building_id: buildingId,
          member_id: memberId,
          transaction_type: 'late_fee',
          category: 'income',
          amount: amount,
          description: `Juros de mora - ${monthsLate} meses em atraso`,
          due_date: new Date(),
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        });
        
        console.log(`Added late fee of €${amount.toFixed(2)} for member ${memberId}`);
      }
    } catch (error) {
      console.error('Error adding late fee transaction:', error);
      // Don't throw - late fees are not critical
    }
  }

  async getMemberArrears(memberId) {
    try {
      const arrears = await knex('transactions')
        .where('member_id', memberId)
        .where('status', 'pending')
        .where('due_date', '<', new Date())
        .whereIn('transaction_type', ['monthly_quota', 'late_fee'])
        .orderBy('due_date', 'asc')
        .select(
          'id',
          'amount',
          'description',
          'due_date',
          'transaction_type',
          knex.raw('CURRENT_DATE - due_date::date as days_overdue')
        );
      
      const totalArrears = arrears.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      const oldestDebt = arrears[0]?.due_date;
      
      return {
        items: arrears,
        total: totalArrears,
        count: arrears.length,
        oldest_debt: oldestDebt,
        member_id: memberId
      };
    } catch (error) {
      console.error('Error getting member arrears:', error);
      throw error;
    }
  }

  async getBuildingArrears(buildingId) {
    try {
      const arrears = await knex('transactions as t')
        .join('members as m', 't.member_id', 'm.id')
        .where('t.building_id', buildingId)
        .where('t.status', 'pending')
        .where('t.due_date', '<', new Date())
        .whereIn('t.transaction_type', ['monthly_quota', 'late_fee'])
        .select(
          'm.id as member_id',
          'm.name as member_name',
          'm.unit_number',
          'm.email',
          knex.raw('COUNT(t.id) as overdue_count'),
          knex.raw('SUM(t.amount) as total_amount'),
          knex.raw('MIN(t.due_date) as oldest_due_date'),
          knex.raw('MAX(CURRENT_DATE - t.due_date::date) as max_days_overdue')
        )
        .groupBy('m.id', 'm.name', 'm.unit_number', 'm.email')
        .orderBy('total_amount', 'desc');
      
      const totalBuildingArrears = arrears.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
      
      return {
        members: arrears,
        total: totalBuildingArrears,
        member_count: arrears.length,
        building_id: buildingId
      };
    } catch (error) {
      console.error('Error getting building arrears:', error);
      throw error;
    }
  }

  async createPaymentPlan(memberId, planData) {
    try {
      // Get all overdue amounts
      const arrears = await this.getMemberArrears(memberId);
      
      if (arrears.total === 0) {
        throw new Error('No arrears found for this member');
      }
      
      const {
        installments = 6,
        start_date = new Date(),
        include_late_fees = true
      } = planData;
      
      // Calculate installment amount
      const totalAmount = include_late_fees ? arrears.total : 
        arrears.items
          .filter(item => item.transaction_type !== 'late_fee')
          .reduce((sum, item) => sum + parseFloat(item.amount), 0);
      
      const installmentAmount = totalAmount / installments;
      
      // Create payment plan record
      const [paymentPlan] = await knex('payment_plans').insert({
        member_id: memberId,
        total_amount: totalAmount,
        installments: installments,
        installment_amount: installmentAmount,
        start_date: start_date,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');
      
      // Create installment transactions
      const installmentTransactions = [];
      for (let i = 0; i < installments; i++) {
        const dueDate = new Date(start_date);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        installmentTransactions.push({
          building_id: arrears.items[0]?.building_id,
          member_id: memberId,
          payment_plan_id: paymentPlan.id,
          transaction_type: 'payment_plan_installment',
          category: 'income',
          amount: installmentAmount,
          description: `Prestação ${i + 1}/${installments} - Plano de pagamento`,
          due_date: dueDate,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      await knex('transactions').insert(installmentTransactions);
      
      // Mark original arrears as part of payment plan
      await knex('transactions')
        .whereIn('id', arrears.items.map(item => item.id))
        .update({
          payment_plan_id: paymentPlan.id,
          status: 'payment_plan',
          updated_at: new Date()
        });
      
      return {
        payment_plan: paymentPlan,
        installments: installmentTransactions
      };
    } catch (error) {
      console.error('Error creating payment plan:', error);
      throw error;
    }
  }

  async getArrearsStatistics(buildingId) {
    try {
      const stats = await knex('transactions')
        .where('building_id', buildingId)
        .where('status', 'pending')
        .where('due_date', '<', new Date())
        .whereIn('transaction_type', ['monthly_quota', 'late_fee'])
        .select(
          knex.raw('COUNT(DISTINCT member_id) as members_in_arrears'),
          knex.raw('COUNT(*) as total_overdue_transactions'),
          knex.raw('SUM(amount) as total_amount_overdue'),
          knex.raw('AVG(CURRENT_DATE - due_date::date) as avg_days_overdue'),
          knex.raw('MAX(CURRENT_DATE - due_date::date) as max_days_overdue')
        )
        .first();
      
      // Get arrears by age ranges
      const ageRanges = await knex('transactions')
        .where('building_id', buildingId)
        .where('status', 'pending')
        .where('due_date', '<', new Date())
        .whereIn('transaction_type', ['monthly_quota', 'late_fee'])
        .select(
          knex.raw(`
            CASE 
              WHEN CURRENT_DATE - due_date::date <= 30 THEN '0-30 days'
              WHEN CURRENT_DATE - due_date::date <= 60 THEN '31-60 days'
              WHEN CURRENT_DATE - due_date::date <= 90 THEN '61-90 days'
              ELSE 'Over 90 days'
            END as age_range
          `),
          knex.raw('COUNT(*) as count'),
          knex.raw('SUM(amount) as total')
        )
        .groupBy('age_range');
      
      return {
        summary: stats,
        by_age: ageRanges
      };
    } catch (error) {
      console.error('Error getting arrears statistics:', error);
      throw error;
    }
  }

  async generateArrearsReport(buildingId) {
    try {
      const buildingArrears = await this.getBuildingArrears(buildingId);
      const statistics = await this.getArrearsStatistics(buildingId);
      
      // Get building details
      const building = await knex('buildings')
        .where('id', buildingId)
        .first();
      
      return {
        building: {
          id: building.id,
          name: building.name,
          address: building.address
        },
        generated_at: new Date(),
        summary: {
          total_arrears: buildingArrears.total,
          members_in_debt: buildingArrears.member_count,
          average_debt: buildingArrears.total / buildingArrears.member_count,
          ...statistics.summary
        },
        age_distribution: statistics.by_age,
        member_details: buildingArrears.members.map(member => ({
          ...member,
          risk_level: this.calculateRiskLevel(member.max_days_overdue, member.total_amount)
        }))
      };
    } catch (error) {
      console.error('Error generating arrears report:', error);
      throw error;
    }
  }

  calculateRiskLevel(daysOverdue, amount) {
    if (daysOverdue > 90 || amount > 1000) return 'high';
    if (daysOverdue > 60 || amount > 500) return 'medium';
    return 'low';
  }
}

module.exports = new ArrearsService();