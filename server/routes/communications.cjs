const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');

/**
 * POST /api/communications/log
 * Log a communication sent to a member
 */
router.post('/log', async (req, res, next) => {
  const {
    member_id,
    building_id,
    communication_type,
    communication_subtype,
    channel,
    status,
    subject,
    body_preview,
    full_content,
    pdf_url,
    pdf_filename,
    related_convocatoria_id,
    related_minute_id,
    related_transaction_id,
    metadata
  } = req.body;

  // Validation
  if (!member_id || !building_id || !communication_type || !channel) {
    return errorResponse(res, 'Missing required fields: member_id, building_id, communication_type, channel', 400);
  }

  try {
    const query = `
      INSERT INTO communication_logs (
        member_id,
        building_id,
        communication_type,
        communication_subtype,
        channel,
        status,
        subject,
        body_preview,
        full_content,
        pdf_url,
        pdf_filename,
        related_convocatoria_id,
        related_minute_id,
        related_transaction_id,
        metadata,
        draft_created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *
    `;

    const values = [
      member_id,
      building_id,
      communication_type,
      communication_subtype || null,
      channel,
      status || 'draft_created',
      subject || null,
      body_preview || null,
      full_content || null,
      pdf_url || null,
      pdf_filename || null,
      related_convocatoria_id || null,
      related_minute_id || null,
      related_transaction_id || null,
      metadata ? JSON.stringify(metadata) : '{}'
    ];

    const result = await pool.query(query, values);

    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/communications/logs
 * Get communication logs for a building or member
 */
router.get('/logs', async (req, res, next) => {
  const { building_id, member_id, communication_type, channel, limit = 50, offset = 0 } = req.query;

  try {
    let whereConditions = [];
    let values = [];
    let paramIndex = 1;

    if (building_id) {
      whereConditions.push(`cl.building_id = $${paramIndex++}`);
      values.push(building_id);
    }

    if (member_id) {
      whereConditions.push(`cl.member_id = $${paramIndex++}`);
      values.push(member_id);
    }

    if (communication_type) {
      whereConditions.push(`cl.communication_type = $${paramIndex++}`);
      values.push(communication_type);
    }

    if (channel) {
      whereConditions.push(`cl.channel = $${paramIndex++}`);
      values.push(channel);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const query = `
      SELECT
        cl.*,
        m.name as member_name,
        m.apartment as member_apartment,
        m.email as member_email,
        m.whatsapp_number as member_whatsapp,
        b.name as building_name
      FROM communication_logs cl
      LEFT JOIN members m ON cl.member_id = m.id
      LEFT JOIN buildings b ON cl.building_id = b.id
      ${whereClause}
      ORDER BY cl.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM communication_logs cl
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    return successResponse(res, result.rows, {
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + result.rows.length < total
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/communications/logs/:id/status
 * Update communication status
 */
router.patch('/logs/:id/status', async (req, res, next) => {
  const { id } = req.params;
  const { status, error_message } = req.body;

  if (!status) {
    return errorResponse(res, 'Status is required', 400);
  }

  const validStatuses = ['draft_created', 'sent', 'opened', 'confirmed', 'failed'];
  if (!validStatuses.includes(status)) {
    return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  try {
    let timestampField = null;
    if (status === 'sent') timestampField = 'sent_at';
    else if (status === 'opened') timestampField = 'opened_at';
    else if (status === 'confirmed') timestampField = 'confirmed_at';
    else if (status === 'failed') timestampField = 'failed_at';

    const query = `
      UPDATE communication_logs
      SET
        status = $1,
        ${timestampField ? `${timestampField} = NOW(),` : ''}
        ${error_message ? 'error_message = $3,' : ''}
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const values = error_message ? [status, id, error_message] : [status, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Communication log not found', 404);
    }

    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/communications/stats/:building_id
 * Get communication statistics
 */
router.get('/stats/:building_id', async (req, res, next) => {
  const { building_id } = req.params;

  try {
    const query = `
      SELECT
        communication_type,
        channel,
        status,
        COUNT(*) as count,
        COUNT(DISTINCT member_id) as unique_members
      FROM communication_logs
      WHERE building_id = $1
      GROUP BY communication_type, channel, status
      ORDER BY communication_type, channel, status
    `;

    const result = await pool.query(query, [building_id]);

    const stats = {
      by_type: {},
      by_channel: {},
      by_status: {},
      total: 0
    };

    result.rows.forEach(row => {
      const count = parseInt(row.count);
      stats.total += count;

      if (!stats.by_type[row.communication_type]) {
        stats.by_type[row.communication_type] = 0;
      }
      stats.by_type[row.communication_type] += count;

      if (!stats.by_channel[row.channel]) {
        stats.by_channel[row.channel] = 0;
      }
      stats.by_channel[row.channel] += count;

      if (!stats.by_status[row.status]) {
        stats.by_status[row.status] = 0;
      }
      stats.by_status[row.status] += count;
    });

    return successResponse(res, stats);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/communications/logs/:id
 * Delete a communication log (Soft Delete)
 */
router.delete('/logs/:id', async (req, res, next) => {
  const { id } = req.params;
  let userId = req.user?.id || null;

  try {
    // Verificar si el usuario existe
    if (userId) {
      const userCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );
      if (userCheck.rows.length === 0) {
        userId = null;
      }
    }

    // Soft delete: marca como eliminado en vez de apagar fisicamente
    const query = `
      UPDATE communication_logs
      SET deleted_at = NOW(), deleted_by = $2
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Log de comunicação não encontrado ou já foi eliminado', 404);
    }

    return successResponse(res, {
      message: 'Log de comunicação movido para o histórico',
      info: 'Pode restaurar o log a partir do menu Histórico'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;