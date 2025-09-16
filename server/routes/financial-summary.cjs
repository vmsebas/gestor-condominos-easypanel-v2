const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');

// GET /api/financial-summary/:buildingId - Obtener resumen financiero del edificio
router.get('/:buildingId', authenticate, async (req, res, next) => {
  try {
    let { buildingId } = req.params;
    
    // Handle 'undefined' string parameter
    if (buildingId === 'undefined' || !buildingId) {
      buildingId = req.user?.buildingId;
    }
    
    if (!buildingId) {
      return errorResponse(res, 'Building ID is required', 400);
    }
    const currentYear = new Date().getFullYear();
    
    // Obtener totales de ingresos y gastos
    const transactionSummaryQuery = `
      SELECT 
        transaction_type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE building_id = $1 AND year = $2
      GROUP BY transaction_type
    `;
    
    // Obtener cuotas anuales pagadas
    const annualFeesQuery = `
      SELECT 
        COUNT(DISTINCT member_id) as members_paid,
        COALESCE(SUM(paid_amount), 0) as total_collected
      FROM member_annual_fees
      WHERE building_id = $1 AND year = $2 AND is_paid = true
    `;
    
    // Obtener morosidad
    const arrearsQuery = `
      SELECT 
        COUNT(DISTINCT member_id) as members_in_arrears,
        COALESCE(SUM(amount), 0) as total_arrears
      FROM arrears
      WHERE building_id = $1 AND status = 'pending'
    `;
    
    // Obtener total de miembros
    const membersCountQuery = `
      SELECT COUNT(*) as total_members
      FROM members
      WHERE building_id = $1
    `;
    
    const [transactionResults, annualFeesResults, arrearsResults, membersResults] = await Promise.all([
      pool.query(transactionSummaryQuery, [buildingId, currentYear]),
      pool.query(annualFeesQuery, [buildingId, currentYear]),
      pool.query(arrearsQuery, [buildingId]),
      pool.query(membersCountQuery, [buildingId])
    ]);
    
    // Procesar resultados de transacciones
    let income = 0;
    let expense = 0;
    transactionResults.rows.forEach(row => {
      if (row.transaction_type === 'income') {
        income = parseFloat(row.total);
      } else if (row.transaction_type === 'expense') {
        expense = parseFloat(row.total);
      }
    });
    
    const annualFees = annualFeesResults.rows[0] || { members_paid: 0, total_collected: 0 };
    const arrears = arrearsResults.rows[0] || { members_in_arrears: 0, total_arrears: 0 };
    const totalMembers = parseInt(membersResults.rows[0]?.total_members || 0);
    
    const summary = {
      year: currentYear,
      transactions: {
        income: income,
        expense: expense,
        balance: income - expense
      },
      annual_fees: {
        total_members: totalMembers,
        members_paid: parseInt(annualFees.members_paid),
        members_pending: totalMembers - parseInt(annualFees.members_paid),
        total_collected: parseFloat(annualFees.total_collected),
        collection_rate: totalMembers > 0 ? (parseInt(annualFees.members_paid) / totalMembers) * 100 : 0
      },
      arrears: {
        members_in_arrears: parseInt(arrears.members_in_arrears),
        total_amount: parseFloat(arrears.total_arrears)
      },
      overall_balance: income - expense + parseFloat(annualFees.total_collected)
    };
    
    return successResponse(res, summary);
  } catch (error) {
    next(error);
  }
});

module.exports = router;