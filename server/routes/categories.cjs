/**
 * API Routes for Transaction Categories Management
 * Handles income and expense categories for budgets and transactions
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');

console.log('🏷️ Categories router loaded at', new Date().toISOString());

/**
 * GET /api/categories
 * Get all categories
 */
router.get('/', async (req, res) => {
  console.log('📋 GET /categories called with query:', req.query);
  try {
    const { type, building_id } = req.query;

    let query = `
      SELECT
        id, name, type, description, icon, color,
        is_active, created_at, updated_at
      FROM transaction_categories
      WHERE deleted_at IS NULL
    `;

    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (building_id) {
      query += ` AND (building_id = $${paramIndex} OR building_id IS NULL)`;
      params.push(building_id);
      paramIndex++;
    }

    query += ` ORDER BY type, name`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/stats
 * Get category usage statistics
 */
router.get('/stats', async (req, res) => {
  console.log('📊 GET /categories/stats called');
  try {
    const { building_id, year } = req.query;

    if (!building_id) {
      return res.status(400).json({
        success: false,
        error: 'building_id is required'
      });
    }

    let query = `
      SELECT
        tc.id,
        tc.name,
        tc.type,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount,
        MIN(t.transaction_date) as first_transaction,
        MAX(t.transaction_date) as last_transaction
      FROM transaction_categories tc
      LEFT JOIN transactions t ON t.category_id = tc.id
        AND t.deleted_at IS NULL
        AND t.building_id = $1
    `;

    const params = [building_id];
    let paramIndex = 2;

    if (year) {
      query += ` AND t.year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    query += `
      WHERE tc.deleted_at IS NULL
      GROUP BY tc.id, tc.name, tc.type
      ORDER BY total_amount DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/:id
 * Get category by ID
 */
router.get('/:id', async (req, res) => {
  console.log('📄 GET /categories/:id called with id:', req.params.id);
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM transaction_categories
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/categories
 * Create new category
 */
router.post('/', async (req, res) => {
  console.log('➕ POST /categories called with body:', req.body);
  try {
    const {
      name,
      type,
      description,
      icon,
      color,
      building_id,
      is_active = true
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'name and type are required'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type must be either "income" or "expense"'
      });
    }

    // Check if category with same name and type already exists
    const existingResult = await pool.query(
      `SELECT id FROM transaction_categories
       WHERE LOWER(name) = LOWER($1)
       AND type = $2
       AND (building_id = $3 OR building_id IS NULL)
       AND deleted_at IS NULL`,
      [name, type, building_id || null]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Category "${name}" of type "${type}" already exists`
      });
    }

    const result = await pool.query(
      `INSERT INTO transaction_categories (
        name, type, description, icon, color, building_id, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [name, type, description || null, icon || null, color || null, building_id || null, is_active]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update category
 */
router.put('/:id', async (req, res) => {
  console.log('✏️ PUT /categories/:id called with id:', req.params.id);
  try {
    const { id } = req.params;
    const {
      name,
      type,
      description,
      icon,
      color,
      is_active
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'type must be either "income" or "expense"'
        });
      }
      updates.push(`type = $${paramIndex++}`);
      params.push(type);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      params.push(icon);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      params.push(color);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
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
      UPDATE transaction_categories
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Soft delete category
 */
router.delete('/:id', async (req, res) => {
  console.log('🗑️ DELETE /categories/:id called with id:', req.params.id);
  try {
    const { id } = req.params;

    // Check if category is being used in transactions
    const usageResult = await pool.query(
      `SELECT COUNT(*) as count FROM transactions
       WHERE category_id = $1 AND deleted_at IS NULL`,
      [id]
    );

    const usageCount = parseInt(usageResult.rows[0].count);

    if (usageCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete category: it is being used in ${usageCount} transaction(s). Consider deactivating it instead.`,
        usage_count: usageCount
      });
    }

    // Check if category is being used in budget items
    const budgetUsageResult = await pool.query(
      `SELECT COUNT(*) as count FROM budget_items
       WHERE category_id = $1 AND deleted_at IS NULL`,
      [id]
    );

    const budgetUsageCount = parseInt(budgetUsageResult.rows[0].count);

    if (budgetUsageCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete category: it is being used in ${budgetUsageCount} budget item(s). Consider deactivating it instead.`,
        budget_usage_count: budgetUsageCount
      });
    }

    const result = await pool.query(
      `UPDATE transaction_categories
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: `Category "${result.rows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/categories/:id/toggle
 * Toggle category active status
 */
router.patch('/:id/toggle', async (req, res) => {
  console.log('🔄 PATCH /categories/:id/toggle called with id:', req.params.id);
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE transaction_categories
       SET is_active = NOT is_active,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const category = result.rows[0];
    res.json({
      success: true,
      data: category,
      message: `Category "${category.name}" ${category.is_active ? 'activated' : 'deactivated'}`
    });
  } catch (error) {
    console.error('Error toggling category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
