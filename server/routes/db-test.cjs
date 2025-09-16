const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');

// GET /api/db-test - Test database connection
router.get('/', async (req, res, next) => {
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    
    // Get table count
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    return successResponse(res, {
      status: 'connected',
      database: {
        current_time: result.rows[0].current_time,
        version: result.rows[0].db_version,
        table_count: parseInt(tablesResult.rows[0].table_count)
      }
    });
  } catch (error) {
    return errorResponse(res, 'Database connection failed: ' + error.message, 500);
  }
});

module.exports = router;