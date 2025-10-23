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
        b.name as building_name,
        b.address as building_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', mai.id,
                'item_number', mai.item_number,
                'title', mai.title,
                'description', mai.description,
                'decision', mai.decision,
                'discussion', mai.discussion,
                'votes_in_favor', COALESCE(mai.votes_in_favor, 0),
                'votes_against', COALESCE(mai.votes_against, 0),
                'abstentions', COALESCE(mai.abstentions, 0)
              ) ORDER BY mai.item_number
            )
            FROM minute_agenda_items mai
            WHERE mai.minutes_id = m.id OR mai.convocatoria_id = m.convocatoria_id
          ),
          '[]'
        ) as agenda_items
      FROM minutes m
      LEFT JOIN convocatorias c ON m.convocatoria_id = c.id
      LEFT JOIN buildings b ON m.building_id = b.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return errorResponse(res, 'Ata não encontrada', 404);
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
      return errorResponse(res, 'Ata não encontrada', 404);
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

// PUT /api/minutes/:id/agenda-items - Actualizar votaciones de agenda items
router.put('/:id/agenda-items', authenticate, async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { agenda_items } = req.body;

    if (!Array.isArray(agenda_items)) {
      return errorResponse(res, 'agenda_items debe ser un array', 400);
    }

    // Verificar que el acta existe
    const minuteCheck = await client.query(
      'SELECT id FROM minutes WHERE id = $1',
      [id]
    );

    if (minuteCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Ata não encontrada', 404);
    }

    const updatedItems = [];

    // Actualizar cada agenda item
    for (const item of agenda_items) {
      const {
        id: item_id,
        votes_in_favor = 0,
        votes_against = 0,
        abstentions = 0,
        discussion = '',
        decision = ''
      } = item;

      if (!item_id) {
        continue; // Skip items without ID
      }

      const result = await client.query(`
        UPDATE minute_agenda_items
        SET
          votes_in_favor = $1,
          votes_against = $2,
          abstentions = $3,
          discussion = $4,
          decision = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `, [votes_in_favor, votes_against, abstentions, discussion, decision, item_id]);

      if (result.rows.length > 0) {
        updatedItems.push(result.rows[0]);
      }
    }

    // Actualizar updated_at del acta
    await client.query(
      'UPDATE minutes SET updated_at = NOW() WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    return successResponse(res, {
      message: `${updatedItems.length} itens atualizados com sucesso`,
      items: updatedItems
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// POST /api/minutes/from-convocatoria/:convocatoriaId - Crear acta desde convocatoria
router.post('/from-convocatoria/:convocatoriaId', authenticate, async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { convocatoriaId } = req.params;

    // Obtener datos de la convocatoria
    const convocatoriaResult = await client.query(`
      SELECT
        c.*,
        b.name as building_name,
        b.address as building_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'title', mai.title,
                'description', mai.description,
                'item_number', mai.item_number
              ) ORDER BY mai.item_number
            )
            FROM minute_agenda_items mai
            WHERE mai.convocatoria_id = c.id
          ),
          '[]'
        ) as agenda_items
      FROM convocatorias c
      LEFT JOIN buildings b ON c.building_id = b.id
      WHERE c.id = $1
    `, [convocatoriaId]);

    if (convocatoriaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Convocatória não encontrada', 404);
    }

    const convocatoria = convocatoriaResult.rows[0];

    // Verificar si ya existe un acta para esta convocatoria
    const existingMinute = await client.query(
      'SELECT id FROM minutes WHERE convocatoria_id = $1',
      [convocatoriaId]
    );

    if (existingMinute.rows.length > 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Já existe uma ata para esta convocatória', 409);
    }

    // Crear el acta
    const minuteResult = await client.query(`
      INSERT INTO minutes (
        convocatoria_id,
        building_id,
        minute_number,
        meeting_date,
        meeting_time,
        location,
        assembly_type,
        building_name,
        building_address,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', NOW(), NOW())
      RETURNING *
    `, [
      convocatoriaId,
      convocatoria.building_id,
      convocatoria.assembly_number,
      convocatoria.date,
      convocatoria.time || '18:00',
      convocatoria.location || 'Por determinar',
      convocatoria.assembly_type,
      convocatoria.building_name,
      convocatoria.building_address
    ]);

    const minute = minuteResult.rows[0];

    // Copiar agenda items de la convocatoria al acta
    const agendaItems = convocatoria.agenda_items;
    if (Array.isArray(agendaItems) && agendaItems.length > 0) {
      for (const item of agendaItems) {
        await client.query(`
          INSERT INTO minute_agenda_items (
            minutes_id,
            building_id,
            item_number,
            title,
            description,
            votes_in_favor,
            votes_against,
            abstentions,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0, NOW(), NOW())
        `, [
          minute.id,
          convocatoria.building_id,
          item.item_number,
          item.title,
          item.description || ''
        ]);
      }
    }

    await client.query('COMMIT');

    // Retornar el acta creada con sus agenda items
    const finalResult = await pool.query(`
      SELECT
        m.*,
        COALESCE(
          (
            SELECT json_agg(mai.* ORDER BY mai.item_number)
            FROM minute_agenda_items mai
            WHERE mai.minutes_id = m.id
          ),
          '[]'
        ) as agenda_items
      FROM minutes m
      WHERE m.id = $1
    `, [minute.id]);

    return successResponse(res, finalResult.rows[0], 201);
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
      return errorResponse(res, 'Ata não encontrada', 404);
    }

    return successResponse(res, { message: 'Ata eliminada com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;