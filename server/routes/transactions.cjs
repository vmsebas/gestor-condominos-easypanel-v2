const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { validate } = require('../middleware/validation.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');
const Joi = require('joi');

// Esquema de validación para transacciones
const transactionSchema = Joi.object({
  building_id: Joi.string().uuid().required(),
  transaction_date: Joi.date().required(),
  transaction_type: Joi.string().valid('income', 'expense').required(),
  description: Joi.string().required(),
  amount: Joi.number().positive().required(),
  category_id: Joi.string().uuid(),
  member_id: Joi.string().uuid(),
  payment_method: Joi.string(),
  reference: Joi.string(),
  notes: Joi.string()
});

// GET /api/transactions - Obtener todas las transacciones
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { buildingId, type, startDate, endDate, year } = req.query;
    
    let query = `
      SELECT 
        t.*,
        tc.name as category_name,
        m.name as member_name
      FROM transactions t
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      LEFT JOIN members m ON t.member_id = m.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (buildingId) {
      params.push(buildingId);
      query += ` AND t.building_id = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      query += ` AND t.transaction_type = $${params.length}`;
    }
    
    if (year) {
      params.push(year);
      query += ` AND t.year = $${params.length}`;
    }
    
    if (startDate) {
      params.push(startDate);
      query += ` AND t.transaction_date >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND t.transaction_date <= $${params.length}`;
    }
    
    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
    
    const result = await pool.query(query, params);
    
    return successResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/summary - Obtener resumen financiero
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { buildingId, year } = req.query;
    
    if (!buildingId) {
      return errorResponse(res, 'ID de edificio requerido', 400);
    }
    
    let whereClause = 'WHERE building_id = $1';
    const params = [buildingId];
    
    if (year) {
      params.push(year);
      whereClause += ` AND year = $${params.length}`;
    }
    
    const summaryQuery = `
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions
      ${whereClause}
      GROUP BY transaction_type
    `;
    
    const monthlyQuery = `
      SELECT 
        EXTRACT(MONTH FROM transaction_date) as month,
        transaction_type,
        SUM(amount) as total
      FROM transactions
      ${whereClause}
      GROUP BY EXTRACT(MONTH FROM transaction_date), transaction_type
      ORDER BY month
    `;
    
    const [summaryResult, monthlyResult] = await Promise.all([
      pool.query(summaryQuery, params),
      pool.query(monthlyQuery, params)
    ]);
    
    const summary = {
      income: 0,
      expense: 0,
      balance: 0,
      transactionCount: 0
    };
    
    summaryResult.rows.forEach(row => {
      if (row.transaction_type === 'income') {
        summary.income = parseFloat(row.total) || 0;
      } else if (row.transaction_type === 'expense') {
        summary.expense = parseFloat(row.total) || 0;
      }
      summary.transactionCount += parseInt(row.count);
    });
    
    summary.balance = summary.income - summary.expense;
    
    return successResponse(res, {
      summary,
      monthly: monthlyResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/transactions/:id - Obtener transacción por ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        t.*,
        tc.name as category_name,
        m.name as member_name
      FROM transactions t
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      LEFT JOIN members m ON t.member_id = m.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Transacción no encontrada', 404);
    }
    
    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/transactions - Crear nueva transacción
router.post('/', authenticate, validate(transactionSchema), async (req, res, next) => {
  try {
    const {
      building_id,
      transaction_date,
      transaction_type,
      description,
      amount,
      category_id,
      member_id,
      payment_method,
      reference,
      notes
    } = req.body;
    
    // Extraer año de la fecha
    const year = new Date(transaction_date).getFullYear();
    
    const result = await pool.query(`
      INSERT INTO transactions (
        building_id, transaction_date, year, transaction_type,
        description, amount, category_id, member_id,
        payment_method, reference, notes,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      building_id, transaction_date, year, transaction_type,
      description, amount, category_id, member_id,
      payment_method, reference, notes
    ]);
    
    return successResponse(res, result.rows[0], 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/transactions/:id - Actualizar transacción
router.put('/:id', authenticate, validate(transactionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Actualizar año si se cambió la fecha
    if (updateData.transaction_date) {
      updateData.year = new Date(updateData.transaction_date).getFullYear();
    }
    
    updateData.updated_at = new Date();
    
    // Construir query de actualización
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => 
      `${field} = $${index + 2}`
    ).join(', ');
    
    values.unshift(id);
    
    const result = await pool.query(
      `UPDATE transactions SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Transacción no encontrada', 404);
    }
    
    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/transactions/:id - Eliminar transacción
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Transacción no encontrada', 404);
    }
    
    return successResponse(res, { message: 'Transacción eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;