/**
 * History Routes - Histórico de Registos Eliminados (Soft Delete)
 *
 * Endpoints para gerir o histórico de registos eliminados logicamente.
 * Permite visualizar e restaurar registos de todas as entidades.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');

/**
 * GET /api/history/stats - Estatísticas do histórico
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const { buildingId } = req.query;

    const result = await pool.query(
      'SELECT * FROM get_deleted_stats($1)',
      [buildingId || null]
    );

    return successResponse(res, {
      stats: result.rows,
      total_deleted: result.rows.reduce((sum, row) => sum + parseInt(row.total_deleted), 0)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/:entityType - Listar registos eliminados de um tipo específico
 *
 * entityType: convocatorias, minutes, members, transactions, communication_logs, documents, tasks, buildings
 */
router.get('/:entityType', authenticate, async (req, res, next) => {
  try {
    const { entityType } = req.params;
    const { buildingId, limit = 100, offset = 0 } = req.query;

    // Validar entity type (segurança)
    const validEntities = [
      'convocatorias', 'minutes', 'members', 'transactions',
      'communication_logs', 'documents', 'tasks', 'buildings'
    ];

    if (!validEntities.includes(entityType)) {
      return errorResponse(res, 'Tipo de entidade inválido', 400);
    }

    // Construir query com base no tipo
    let query = `
      SELECT
        t.*,
        u.name as deleted_by_name,
        u.email as deleted_by_email
      FROM ${entityType} t
      LEFT JOIN users u ON t.deleted_by = u.id
      WHERE t.deleted_at IS NOT NULL
    `;

    const params = [];
    let paramCount = 1;

    // Filtro por building se aplicável
    if (buildingId && !['buildings'].includes(entityType)) {
      query += ` AND t.building_id = $${paramCount}`;
      params.push(buildingId);
      paramCount++;
    }

    // Ordenação e paginação
    query += ` ORDER BY t.deleted_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Contar total
    let countQuery = `SELECT COUNT(*) as total FROM ${entityType} WHERE deleted_at IS NOT NULL`;
    const countParams = [];

    if (buildingId && !['buildings'].includes(entityType)) {
      countQuery += ' AND building_id = $1';
      countParams.push(buildingId);
    }

    const countResult = await pool.query(countQuery, countParams);

    return successResponse(res, {
      items: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + result.rows.length) < parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/history/:entityType/:id/restore - Restaurar um registo eliminado
 */
router.post('/:entityType/:id/restore', authenticate, async (req, res, next) => {
  try {
    const { entityType, id } = req.params;

    // Validar entity type (segurança)
    const validEntities = [
      'convocatorias', 'minutes', 'members', 'transactions',
      'communication_logs', 'documents', 'tasks', 'buildings'
    ];

    if (!validEntities.includes(entityType)) {
      return errorResponse(res, 'Tipo de entidade inválido', 400);
    }

    // Usar função de restauro
    const result = await pool.query(
      'SELECT restore_record($1, $2) as restored',
      [entityType, id]
    );

    if (!result.rows[0].restored) {
      return errorResponse(res, 'Registo não encontrado', 404);
    }

    // Buscar registo restaurado
    const restoredResult = await pool.query(
      `SELECT * FROM ${entityType} WHERE id = $1`,
      [id]
    );

    return successResponse(res, {
      message: 'Registo restaurado com sucesso',
      item: restoredResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history/recent - Registos eliminados recentemente (últimos 30 dias)
 */
router.get('/recent', authenticate, async (req, res, next) => {
  try {
    const { buildingId } = req.query;

    // Query unificada para todos os tipos
    const queries = [
      { type: 'convocatorias', table: 'convocatorias', nameField: 'assembly_number', dateField: 'date' },
      { type: 'minutes', table: 'minutes', nameField: 'minute_number', dateField: 'meeting_date' },
      { type: 'members', table: 'members', nameField: 'name', dateField: 'created_at' },
      { type: 'transactions', table: 'transactions', nameField: 'description', dateField: 'date' },
      { type: 'communication_logs', table: 'communication_logs', nameField: 'subject', dateField: 'created_at' },
      { type: 'documents', table: 'documents', nameField: 'title', dateField: 'created_at' },
      { type: 'tasks', table: 'tasks', nameField: 'title', dateField: 'created_at' }
    ];

    const allResults = [];

    for (const q of queries) {
      let query = `
        SELECT
          '${q.type}' as entity_type,
          id,
          ${q.nameField} as name,
          ${q.dateField} as entity_date,
          deleted_at,
          deleted_by,
          building_id
        FROM ${q.table}
        WHERE deleted_at IS NOT NULL
          AND deleted_at > NOW() - INTERVAL '30 days'
      `;

      if (buildingId && q.type !== 'buildings') {
        query += ' AND building_id = $1';
      }

      query += ' ORDER BY deleted_at DESC LIMIT 10';

      const result = await pool.query(
        query,
        buildingId && q.type !== 'buildings' ? [buildingId] : []
      );

      allResults.push(...result.rows);
    }

    // Ordenar por data de eliminação
    allResults.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

    return successResponse(res, {
      recent_deletions: allResults.slice(0, 50) // Top 50
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
