/**
 * API Routes for Financial Periods Management
 * Handles annual financial periods and member balances
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');

console.log('🔍 Financial periods router loaded at', new Date().toISOString());

/**
 * GET /api/financial-periods
 * Get all financial periods for a building
 */
router.get('/', async (req, res) => {
  console.log('📋 GET / called with query:', req.query);
  try {
    const { building_id } = req.query;

    if (!building_id) {
      return res.status(400).json({
        success: false,
        error: 'building_id is required'
      });
    }

    const result = await pool.query(
      `SELECT
        id, building_id, year, start_date, end_date,
        monthly_quota_150, monthly_quota_200, annual_budget_expected,
        is_closed, created_at, updated_at
       FROM financial_periods
       WHERE building_id = $1
       ORDER BY year DESC`,
      [building_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching financial periods:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/financial-periods/:year/summary
 * Get summary for a specific year including all member balances
 */
router.get('/:year/summary', async (req, res) => {
  try {
    const { year } = req.params;
    const { building_id } = req.query;

    if (!building_id) {
      return res.status(400).json({
        success: false,
        error: 'building_id is required'
      });
    }

    // Get period info
    const periodResult = await pool.query(
      `SELECT * FROM financial_periods
       WHERE building_id = $1 AND year = $2`,
      [building_id, year]
    );

    if (periodResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Period for year ${year} not found`
      });
    }

    const period = periodResult.rows[0];

    // Get all member balances for this period
    const balancesResult = await pool.query(
      `SELECT
        mpb.id,
        mpb.member_id,
        m.name as member_name,
        m.fraction,
        m.permilage,
        mpb.quota_expected_monthly,
        mpb.quota_expected_annual,
        mpb.quota_paid_total,
        mpb.balance,
        mpb.opening_balance,
        (mpb.opening_balance + mpb.balance) as balance_total_real,
        mpb.status,
        mpb.notes,
        mpb.last_payment_date
       FROM member_period_balance mpb
       JOIN members m ON mpb.member_id = m.id
       WHERE mpb.period_id = $1 AND m.deleted_at IS NULL
       ORDER BY m.name`,
      [period.id]
    );

    // Calculate totals
    const totals = balancesResult.rows.reduce((acc, row) => {
      acc.expected_total += parseFloat(row.quota_expected_annual || 0);
      acc.paid_total += parseFloat(row.quota_paid_total || 0);
      acc.balance_2025 += parseFloat(row.balance || 0);
      acc.opening_balance_total += parseFloat(row.opening_balance || 0);
      acc.balance_total_real += parseFloat(row.balance_total_real || 0);
      acc.members_count += 1;

      if (row.status === 'paid') acc.paid_count += 1;
      if (row.status === 'partial') acc.partial_count += 1;
      if (row.status === 'unpaid') acc.unpaid_count += 1;

      return acc;
    }, {
      expected_total: 0,
      paid_total: 0,
      balance_2025: 0,
      opening_balance_total: 0,
      balance_total_real: 0,
      members_count: 0,
      paid_count: 0,
      partial_count: 0,
      unpaid_count: 0
    });

    res.json({
      success: true,
      data: {
        period,
        balances: balancesResult.rows,
        totals
      }
    });
  } catch (error) {
    console.error('Error fetching period summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/financial-periods/member/:member_id/history
 * Get payment history for a specific member across all periods
 */
router.get('/member/:member_id/history', async (req, res) => {
  try {
    const { member_id } = req.params;

    const result = await pool.query(
      `SELECT
        fp.year,
        mpb.quota_expected_annual,
        mpb.quota_paid_total,
        mpb.balance,
        mpb.status,
        mpb.last_payment_date,
        mpb.notes
       FROM member_period_balance mpb
       JOIN financial_periods fp ON mpb.period_id = fp.id
       WHERE mpb.member_id = $1
       ORDER BY fp.year DESC`,
      [member_id]
    );

    // Get member account summary
    const accountResult = await pool.query(
      `SELECT
        current_balance,
        total_charged_all_time,
        total_paid_all_time,
        has_overdue_debt,
        overdue_amount
       FROM member_account
       WHERE member_id = $1`,
      [member_id]
    );

    res.json({
      success: true,
      data: {
        history: result.rows,
        account: accountResult.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching member history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/financial-periods/dashboard-summary
 * Get overall financial summary for dashboard
 */
router.get('/dashboard-summary', async (req, res) => {
  try {
    const { building_id } = req.query;

    if (!building_id) {
      return res.status(400).json({
        success: false,
        error: 'building_id is required'
      });
    }

    // Get current year (2025)
    const currentYear = new Date().getFullYear();

    // Get summary from view
    const summaryResult = await pool.query(
      `SELECT
        member_name,
        current_balance,
        financial_status,
        total_charged,
        total_paid,
        permilage,
        fraction
       FROM v_member_financial_summary
       WHERE building_id = $1
       ORDER BY current_balance ASC`,
      [building_id]
    );

    // Get period debt view for current year
    const currentYearResult = await pool.query(
      `SELECT * FROM v_member_period_debt
       WHERE year = $1
       ORDER BY balance ASC`,
      [currentYear]
    );

    // Calculate overall stats
    const stats = summaryResult.rows.reduce((acc, row) => {
      const balance = parseFloat(row.current_balance || 0);
      const charged = parseFloat(row.total_charged || 0);
      const paid = parseFloat(row.total_paid || 0);

      acc.total_debt += balance < 0 ? Math.abs(balance) : 0;
      acc.total_charged += charged;
      acc.total_paid += paid;
      acc.members_count += 1;

      if (row.financial_status === 'debtor') acc.debtors_count += 1;
      if (row.financial_status === 'settled') acc.settled_count += 1;

      return acc;
    }, {
      total_debt: 0,
      total_charged: 0,
      total_paid: 0,
      members_count: 0,
      debtors_count: 0,
      settled_count: 0
    });

    res.json({
      success: true,
      data: {
        members: summaryResult.rows,
        current_year_detail: currentYearResult.rows,
        stats,
        current_year: currentYear
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
