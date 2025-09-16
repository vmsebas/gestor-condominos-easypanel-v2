const express = require('express');
const router = express.Router();
const { pool } = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { validate } = require('../middleware/validation.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');
const Joi = require('joi');

// Esquema de validación para crear/actualizar actas
const minuteSchema = Joi.object({
  convocatoria_id: Joi.string().uuid(),
  building_id: Joi.string().uuid().required(),
  minute_number: Joi.string().required(),
  meeting_date: Joi.date().required(),
  meeting_time: Joi.string().required(),
  location: Joi.string().required(),
  assembly_type: Joi.string().valid('ordinary', 'extraordinary').required(),
  building_name: Joi.string().required(),
  building_address: Joi.string().required(),
  president_name: Joi.string().required(),
  secretary_name: Joi.string().required(),
  agenda_items: Joi.array().items(Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    resolution: Joi.string()
  }))
});

// GET /api/minutes - Obtener todas las actas
router.get('/', authenticate, async (req, res, next) => {
  try {
    let { buildingId } = req.query;
    
    // Use buildingId from query, or from authenticated user
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    let query = `
      SELECT 
        m.*,
        c.title as convocatoria_title,
        c.date as convocatoria_date
      FROM minutes m
      LEFT JOIN convocatorias c ON m.convocatoria_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (effectiveBuildingId) {
      params.push(effectiveBuildingId);
      query += ` AND m.building_id = $${params.length}`;
    }
    
    query += ' ORDER BY m.meeting_date DESC';
    
    const result = await pool.query(query, params);
    
    return successResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/minutes/:id - Obtener acta por ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        m.*,
        c.title as convocatoria_title,
        c.date as convocatoria_date,
        COALESCE(
          (
            SELECT json_agg(mai.* ORDER BY mai.order_number)
            FROM minute_agenda_items mai
            WHERE mai.minute_id = m.id
          ),
          '[]'
        ) as agenda_items
      FROM minutes m
      LEFT JOIN convocatorias c ON m.convocatoria_id = c.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Acta no encontrada', 404);
    }
    
    return successResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/minutes - Crear nueva acta
router.post('/', authenticate, validate(minuteSchema), async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      convocatoria_id,
      building_id,
      minute_number,
      meeting_date,
      meeting_time,
      location,
      assembly_type,
      building_name,
      building_address,
      president_name,
      secretary_name,
      agenda_items = []
    } = req.body;
    
    // Insertar el acta
    const minuteResult = await client.query(`
      INSERT INTO minutes (
        convocatoria_id, building_id, minute_number, meeting_date, 
        meeting_time, location, assembly_type, building_name, 
        building_address, president_name, secretary_name,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      convocatoria_id, building_id, minute_number, meeting_date,
      meeting_time, location, assembly_type, building_name,
      building_address, president_name, secretary_name
    ]);
    
    const minute = minuteResult.rows[0];
    
    // Insertar los puntos de la agenda si existen
    if (agenda_items.length > 0) {
      for (let i = 0; i < agenda_items.length; i++) {
        const item = agenda_items[i];
        await client.query(`
          INSERT INTO minute_agenda_items (
            minute_id, order_number, title, description, resolution
          ) VALUES ($1, $2, $3, $4, $5)
        `, [minute.id, i + 1, item.title, item.description, item.resolution]);
      }
    }
    
    await client.query('COMMIT');
    
    return successResponse(res, minute, 201);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// PUT /api/minutes/:id - Actualizar acta
router.put('/:id', authenticate, validate(minuteSchema), async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date() };
    delete updateData.agenda_items;
    
    // Construir query de actualización
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => 
      `${field} = $${index + 2}`
    ).join(', ');
    
    values.unshift(id);
    
    const result = await client.query(
      `UPDATE minutes SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Acta no encontrada', 404);
    }
    
    await client.query('COMMIT');
    
    return successResponse(res, result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// DELETE /api/minutes/:id - Eliminar acta
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM minutes WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Acta no encontrada', 404);
    }
    
    return successResponse(res, { message: 'Acta eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;