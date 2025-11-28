/**
 * API Routes for Budgets (Presupuestos) Management
 * Sistema de orçamentos obrigatório por lei (Art. 1432º Código Civil)
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');

console.log('💰 Budgets router loaded at', new Date().toISOString());

/**
 * GET /api/budgets
 * Get all budgets for a building
 */
router.get('/', async (req, res) => {
  console.log('📋 GET /budgets called with query:', req.query);
  try {
    const { building_id, year, status } = req.query;

    if (!building_id) {
      return res.status(400).json({
        success: false,
        error: 'building_id is required'
      });
    }

    let query = `
      SELECT
        b.id, b.building_id, b.period_id, b.budget_year, b.budget_name,
        b.budget_type, b.total_budgeted, b.total_spent, b.variance,
        b.variance_percentage, b.status, b.assembly_date, b.approved_by,
        b.approval_votes_favor, b.approval_votes_against, b.approval_votes_abstained,
        b.approval_permilage, b.description, b.notes,
        b.created_at, b.updated_at,
        fp.year as period_year,
        COUNT(bi.id) as items_count,
        ROUND((b.total_spent / NULLIF(b.total_budgeted, 0)) * 100, 2) as execution_percentage
      FROM budgets b
      JOIN financial_periods fp ON b.period_id = fp.id
      LEFT JOIN budget_items bi ON bi.budget_id = b.id AND bi.deleted_at IS NULL
      WHERE b.building_id = $1
      AND b.deleted_at IS NULL
    `;

    const params = [building_id];
    let paramIndex = 2;

    if (year) {
      query += ` AND b.budget_year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += `
      GROUP BY b.id, fp.year
      ORDER BY b.budget_year DESC, b.created_at DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/budgets/:id
 * Get budget by ID with all items
 */
router.get('/:id', async (req, res) => {
  console.log('📄 GET /budgets/:id called with id:', req.params.id);
  try {
    const { id } = req.params;

    // Get budget
    const budgetResult = await pool.query(
      `SELECT
        b.*,
        fp.year as period_year,
        bld.name as building_name
       FROM budgets b
       JOIN financial_periods fp ON b.period_id = fp.id
       JOIN buildings bld ON b.building_id = bld.id
       WHERE b.id = $1 AND b.deleted_at IS NULL`,
      [id]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    const budget = budgetResult.rows[0];

    // Get budget items
    const itemsResult = await pool.query(
      `SELECT
        bi.*,
        tc.name as category_name,
        tc.type as category_type
       FROM budget_items bi
       LEFT JOIN transaction_categories tc ON bi.category_id = tc.id
       WHERE bi.budget_id = $1 AND bi.deleted_at IS NULL
       ORDER BY bi.display_order, bi.item_name`,
      [id]
    );

    budget.items = itemsResult.rows;

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/budgets/:id/execution
 * Get budget execution report (comparison of budgeted vs spent by category)
 */
router.get('/:id/execution', async (req, res) => {
  console.log('📊 GET /budgets/:id/execution called with id:', req.params.id);
  try {
    const { id } = req.params;

    // Get budget summary
    const budgetResult = await pool.query(
      `SELECT * FROM budgets WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (budgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    const budget = budgetResult.rows[0];

    // Get items with actual spending
    const itemsResult = await pool.query(
      `SELECT
        bi.id,
        bi.item_name,
        bi.item_description,
        bi.amount_budgeted,
        bi.amount_spent,
        bi.amount_variance,
        bi.variance_percentage,
        bi.frequency,
        tc.name as category_name,
        tc.type as category_type,
        COUNT(t.id) as transaction_count
       FROM budget_items bi
       LEFT JOIN transaction_categories tc ON bi.category_id = tc.id
       LEFT JOIN transactions t ON t.category_id = bi.category_id
         AND t.period_id = $1
         AND t.transaction_type = 'expense'
         AND t.deleted_at IS NULL
       WHERE bi.budget_id = $2 AND bi.deleted_at IS NULL
       GROUP BY bi.id, tc.name, tc.type
       ORDER BY bi.display_order, bi.item_name`,
      [budget.period_id, id]
    );

    res.json({
      success: true,
      data: {
        budget: budget,
        items: itemsResult.rows,
        summary: {
          total_budgeted: budget.total_budgeted,
          total_spent: budget.total_spent,
          variance: budget.variance,
          variance_percentage: budget.variance_percentage,
          items_count: itemsResult.rows.length,
          items_over_budget: itemsResult.rows.filter(i => parseFloat(i.amount_variance) < 0).length,
          items_under_budget: itemsResult.rows.filter(i => parseFloat(i.amount_variance) > 0).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching budget execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/budgets
 * Create new budget
 */
router.post('/', async (req, res) => {
  console.log('➕ POST /budgets called with body:', req.body);
  try {
    const {
      building_id,
      period_id,
      budget_year,
      budget_name,
      budget_type = 'annual',
      description,
      items = []
    } = req.body;

    if (!building_id || !period_id || !budget_year) {
      return res.status(400).json({
        success: false,
        error: 'building_id, period_id, and budget_year are required'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create budget
      const budgetResult = await client.query(
        `INSERT INTO budgets (
          building_id, period_id, budget_year, budget_name,
          budget_type, status, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          building_id,
          period_id,
          budget_year,
          budget_name || `Orçamento ${budget_year}`,
          budget_type,
          'draft',
          description
        ]
      );

      const budget = budgetResult.rows[0];

      // Create budget items if provided
      if (items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO budget_items (
              budget_id, category_id, item_name, item_description,
              amount_budgeted, is_shared, frequency,
              estimated_monthly, display_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              budget.id,
              item.category_id || null,
              item.item_name,
              item.item_description || null,
              item.amount_budgeted,
              item.is_shared !== false,
              item.frequency || 'monthly',
              item.estimated_monthly || null,
              item.display_order || 0
            ]
          );
        }
      }

      await client.query('COMMIT');

      // Get the complete budget with items
      const completeResult = await pool.query(
        `SELECT
          b.*,
          COALESCE(json_agg(
            json_build_object(
              'id', bi.id,
              'item_name', bi.item_name,
              'amount_budgeted', bi.amount_budgeted,
              'category_id', bi.category_id
            )
          ) FILTER (WHERE bi.id IS NOT NULL), '[]') as items
         FROM budgets b
         LEFT JOIN budget_items bi ON bi.budget_id = b.id AND bi.deleted_at IS NULL
         WHERE b.id = $1
         GROUP BY b.id`,
        [budget.id]
      );

      res.status(201).json({
        success: true,
        data: completeResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/budgets/create-from-previous
 * Create budget from previous year
 */
router.post('/create-from-previous', async (req, res) => {
  console.log('🔄 POST /budgets/create-from-previous called with body:', req.body);
  try {
    const { building_id, new_year, increase_percentage = 3.0 } = req.body;

    if (!building_id || !new_year) {
      return res.status(400).json({
        success: false,
        error: 'building_id and new_year are required'
      });
    }

    const result = await pool.query(
      `SELECT create_budget_from_previous_year($1, $2, $3) as budget_id`,
      [building_id, new_year, increase_percentage]
    );

    const budgetId = result.rows[0].budget_id;

    // Get the created budget
    const budgetResult = await pool.query(
      `SELECT * FROM budgets WHERE id = $1`,
      [budgetId]
    );

    res.status(201).json({
      success: true,
      data: budgetResult.rows[0],
      message: `Budget for ${new_year} created successfully from previous year with ${increase_percentage}% increase`
    });
  } catch (error) {
    console.error('Error creating budget from previous:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/budgets/:id
 * Update budget
 */
router.put('/:id', async (req, res) => {
  console.log('✏️ PUT /budgets/:id called with id:', req.params.id);
  try {
    const { id } = req.params;
    const {
      budget_name,
      budget_type,
      status,
      description,
      notes,
      assembly_date,
      minute_id,
      approved_by,
      approval_votes_favor,
      approval_votes_against,
      approval_votes_abstained,
      approval_permilage
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (budget_name !== undefined) {
      updates.push(`budget_name = $${paramIndex++}`);
      params.push(budget_name);
    }
    if (budget_type !== undefined) {
      updates.push(`budget_type = $${paramIndex++}`);
      params.push(budget_type);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }
    if (assembly_date !== undefined) {
      updates.push(`assembly_date = $${paramIndex++}`);
      params.push(assembly_date);
    }
    if (minute_id !== undefined) {
      updates.push(`minute_id = $${paramIndex++}`);
      params.push(minute_id);
    }
    if (approved_by !== undefined) {
      updates.push(`approved_by = $${paramIndex++}`);
      params.push(approved_by);
    }
    if (approval_votes_favor !== undefined) {
      updates.push(`approval_votes_favor = $${paramIndex++}`);
      params.push(approval_votes_favor);
    }
    if (approval_votes_against !== undefined) {
      updates.push(`approval_votes_against = $${paramIndex++}`);
      params.push(approval_votes_against);
    }
    if (approval_votes_abstained !== undefined) {
      updates.push(`approval_votes_abstained = $${paramIndex++}`);
      params.push(approval_votes_abstained);
    }
    if (approval_permilage !== undefined) {
      updates.push(`approval_permilage = $${paramIndex++}`);
      params.push(approval_permilage);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE budgets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/budgets/:id
 * Soft delete budget
 */
router.delete('/:id', async (req, res) => {
  console.log('🗑️ DELETE /budgets/:id called with id:', req.params.id);
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE budgets
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, budget_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    res.json({
      success: true,
      message: `Budget "${result.rows[0].budget_name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/budgets/:id/items
 * Add budget item
 */
router.post('/:id/items', async (req, res) => {
  console.log('➕ POST /budgets/:id/items called');
  try {
    const { id: budget_id } = req.params;
    const {
      category_id,
      item_name,
      item_description,
      amount_budgeted,
      is_shared = true,
      frequency = 'monthly',
      estimated_monthly,
      display_order = 0
    } = req.body;

    if (!item_name || amount_budgeted === undefined) {
      return res.status(400).json({
        success: false,
        error: 'item_name and amount_budgeted are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO budget_items (
        budget_id, category_id, item_name, item_description,
        amount_budgeted, is_shared, frequency,
        estimated_monthly, display_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        budget_id,
        category_id || null,
        item_name,
        item_description || null,
        amount_budgeted,
        is_shared,
        frequency,
        estimated_monthly || null,
        display_order
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding budget item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/budgets/:id/items/:itemId
 * Update budget item
 */
router.put('/:id/items/:itemId', async (req, res) => {
  console.log('✏️ PUT /budgets/:id/items/:itemId called');
  try {
    const { id: budget_id, itemId } = req.params;
    const {
      item_name,
      item_description,
      amount_budgeted,
      is_shared,
      frequency,
      estimated_monthly,
      notes,
      display_order
    } = req.body;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (item_name !== undefined) {
      updates.push(`item_name = $${paramIndex++}`);
      params.push(item_name);
    }
    if (item_description !== undefined) {
      updates.push(`item_description = $${paramIndex++}`);
      params.push(item_description);
    }
    if (amount_budgeted !== undefined) {
      updates.push(`amount_budgeted = $${paramIndex++}`);
      params.push(amount_budgeted);
    }
    if (is_shared !== undefined) {
      updates.push(`is_shared = $${paramIndex++}`);
      params.push(is_shared);
    }
    if (frequency !== undefined) {
      updates.push(`frequency = $${paramIndex++}`);
      params.push(frequency);
    }
    if (estimated_monthly !== undefined) {
      updates.push(`estimated_monthly = $${paramIndex++}`);
      params.push(estimated_monthly);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      params.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(itemId);
    params.push(budget_id);

    const query = `
      UPDATE budget_items
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND budget_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget item not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating budget item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/budgets/:id/items/:itemId
 * Delete budget item
 */
router.delete('/:id/items/:itemId', async (req, res) => {
  console.log('🗑️ DELETE /budgets/:id/items/:itemId called');
  try {
    const { id: budget_id, itemId } = req.params;

    const result = await pool.query(
      `UPDATE budget_items
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND budget_id = $2 AND deleted_at IS NULL
       RETURNING id, item_name`,
      [itemId, budget_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget item not found'
      });
    }

    res.json({
      success: true,
      message: `Budget item "${result.rows[0].item_name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting budget item:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
