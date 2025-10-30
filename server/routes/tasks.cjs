const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { validate } = require('../middleware/validation.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');
const Joi = require('joi');

// Esquema de validación para tareas
const taskSchema = Joi.object({
  building_id: Joi.string().uuid().required(),
  minute_id: Joi.string().uuid(),
  title: Joi.string().required(),
  description: Joi.string(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').default('pending'),
  due_date: Joi.date(),
  assignee_id: Joi.string().uuid(),
  created_by: Joi.string().uuid()
});

// GET /api/tasks - Obtener todas las tareas
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { buildingId, status, priority, assigneeId, minuteId } = req.query;
    
    let query = `
      SELECT 
        t.*,
        u.name as assignee_id_name,
        cu.name as created_by_name,
        cb.name as completed_by_name,
        m.minute_number,
        m.meeting_date
      FROM tasks t
      LEFT JOIN members u ON t.assignee_id = u.id
      LEFT JOIN members cu ON t.created_by = cu.id
      LEFT JOIN members cb ON t.completed_by = cb.id
      LEFT JOIN minutes m ON t.minute_id = m.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (buildingId) {
      params.push(buildingId);
      query += ` AND t.building_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    
    if (priority) {
      params.push(priority);
      query += ` AND t.priority = $${params.length}`;
    }
    
    if (assigneeId) {
      params.push(assigneeId);
      query += ` AND t.assignee_id = $${params.length}`;
    }
    
    if (minuteId) {
      params.push(minuteId);
      query += ` AND t.minute_id = $${params.length}`;
    }
    
    query += ' ORDER BY t.due_date ASC, t.priority DESC, t.created_at DESC';
    
    const result = await pool.query(query, params);
    
    return successResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/stats/:buildingId - Obtener estadísticas de tareas
router.get('/stats/:buildingId', authenticate, async (req, res, next) => {
  try {
    const { buildingId } = req.params;
    
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue,
        COUNT(*) as total
      FROM tasks
      WHERE building_id = $1
    `;
    
    const priorityQuery = `
      SELECT 
        priority,
        COUNT(*) as count
      FROM tasks
      WHERE building_id = $1 AND status NOT IN ('completed', 'cancelled')
      GROUP BY priority
    `;
    
    const [statsResult, priorityResult] = await Promise.all([
      pool.query(statsQuery, [buildingId]),
      pool.query(priorityQuery, [buildingId])
    ]);
    
    const stats = statsResult.rows[0];
    const priorityStats = {};
    priorityResult.rows.forEach(row => {
      priorityStats[row.priority] = parseInt(row.count);
    });
    
    return successResponse(res, {
      status: {
        pending: parseInt(stats.pending),
        in_progress: parseInt(stats.in_progress),
        completed: parseInt(stats.completed),
        cancelled: parseInt(stats.cancelled),
        overdue: parseInt(stats.overdue)
      },
      priority: {
        low: priorityStats.low || 0,
        medium: priorityStats.medium || 0,
        high: priorityStats.high || 0
      },
      total: parseInt(stats.total)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id - Obtener tarea por ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        t.*,
        u.name as assignee_id_name,
        cu.name as created_by_name,
        cb.name as completed_by_name,
        m.minute_number,
        m.meeting_date
      FROM tasks t
      LEFT JOIN members u ON t.assignee_id = u.id
      LEFT JOIN members cu ON t.created_by = cu.id
      LEFT JOIN members cb ON t.completed_by = cb.id
      LEFT JOIN minutes m ON t.minute_id = m.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Tarefa não encontrada', 404);
    }
    
    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Crear nueva tarea
router.post('/', authenticate, validate(taskSchema), async (req, res, next) => {
  try {
    const {
      building_id,
      minute_id,
      title,
      description,
      priority,
      status,
      due_date,
      assignee_id,
      created_by
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO tasks (
        building_id, minute_id, title, description,
        priority, status, due_date, assignee_id, created_by,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      building_id, minute_id, title, description,
      priority, status, due_date, assignee_id, created_by || req.user.id
    ]);
    
    return successResponse(res, result.rows[0], 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id - Actualizar tarea
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date() };
    
    // Construir query de actualización
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => 
      `${field} = $${index + 2}`
    ).join(', ');
    
    values.unshift(id);
    
    const result = await pool.query(
      `UPDATE tasks SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Tarefa não encontrada', 404);
    }
    
    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id/complete - Marcar tarea como completada
router.put('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { completed_by } = req.body;
    
    const result = await pool.query(`
      UPDATE tasks 
      SET status = 'completed', 
          completed_at = NOW(), 
          completed_by = $2,
          updated_at = NOW()
      WHERE id = $1 
      RETURNING *
    `, [id, completed_by || req.user.id]);
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Tarefa não encontrada', 404);
    }
    
    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Eliminar tarea (Soft Delete)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    let userId = req.user?.id || null;

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
    const result = await pool.query(
      `UPDATE tasks
       SET deleted_at = NOW(), deleted_by = $2
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Tarefa não encontrada ou já foi eliminada', 404);
    }

    return successResponse(res, {
      message: 'Tarefa movida para o histórico',
      info: 'Pode restaurar a tarefa a partir do menu Histórico'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;