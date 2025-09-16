const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');

// GET /api/communications - Obtener comunicaciones (placeholder)
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Por ahora retornar array vacío
    // Esta funcionalidad se implementará más adelante
    return successResponse(res, []);
  } catch (error) {
    next(error);
  }
});

module.exports = router;