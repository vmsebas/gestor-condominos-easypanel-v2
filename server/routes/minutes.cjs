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
      WHERE m.deleted_at IS NULL
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
                'notes', mai.decision,
                'vote_type', mai.vote_type,
                'type', CASE
                  WHEN mai.vote_type = 'informativo' THEN 'informativo'
                  WHEN mai.vote_type IN ('simple', 'qualified') THEN 'votacion'
                  ELSE 'discussion'
                END,
                'requiredMajority', CASE
                  WHEN mai.vote_type = 'simple' THEN 'simple'
                  WHEN mai.vote_type = 'qualified' THEN 'cualificada'
                  ELSE 'simple'
                END,
                'votes_in_favor', COALESCE(mai.votes_in_favor, 0),
                'votes_against', COALESCE(mai.votes_against, 0),
                'abstentions', COALESCE(mai.abstentions, 0),
                'voting_result', mai.decision
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
      WHERE m.id = $1 AND m.deleted_at IS NULL
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
        COALESCE(c.agenda_items, '[]'::jsonb) as agenda_items
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
    let agendaItems = convocatoria.agenda_items;

    // Parse if string (safety check)
    if (typeof agendaItems === 'string') {
      try {
        agendaItems = JSON.parse(agendaItems);
      } catch (e) {
        agendaItems = [];
      }
    }

    if (Array.isArray(agendaItems) && agendaItems.length > 0) {
      for (const item of agendaItems) {
        // Map requiredMajority to vote_type
        let voteType = null;
        if (item.type === 'votacion' || item.type === 'votación') {
          if (item.requiredMajority === 'simple') {
            voteType = 'simple';
          } else if (item.requiredMajority === 'cualificada' || item.requiredMajority === 'qualified') {
            voteType = 'qualified';
          }
        } else if (item.type === 'informativo') {
          voteType = 'informativo';
        }

        await client.query(`
          INSERT INTO minute_agenda_items (
            minutes_id,
            building_id,
            item_number,
            title,
            description,
            vote_type,
            votes_in_favor,
            votes_against,
            abstentions,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, NOW(), NOW())
        `, [
          minute.id,
          convocatoria.building_id,
          item.item_number,
          item.title,
          item.description || '',
          voteType
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
            SELECT json_agg(
              json_build_object(
                'id', mai.id,
                'item_number', mai.item_number,
                'title', mai.title,
                'description', mai.description,
                'decision', mai.decision,
                'discussion', mai.discussion,
                'notes', mai.decision,
                'vote_type', mai.vote_type,
                'type', CASE
                  WHEN mai.vote_type = 'informativo' THEN 'informativo'
                  WHEN mai.vote_type IN ('simple', 'qualified') THEN 'votacion'
                  ELSE 'discussion'
                END,
                'requiredMajority', CASE
                  WHEN mai.vote_type = 'simple' THEN 'simple'
                  WHEN mai.vote_type = 'qualified' THEN 'cualificada'
                  ELSE 'simple'
                END,
                'votes_in_favor', COALESCE(mai.votes_in_favor, 0),
                'votes_against', COALESCE(mai.votes_against, 0),
                'abstentions', COALESCE(mai.abstentions, 0),
                'voting_result', mai.decision
              ) ORDER BY mai.item_number
            )
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

// POST /api/minutes/:minuteId/agenda-items/:itemId/votes - Guardar votação completa
router.post('/:minuteId/agenda-items/:itemId/votes', authenticate, async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { minuteId, itemId } = req.params;
    const { voting_result } = req.body;

    if (!voting_result) {
      return errorResponse(res, 'voting_result é obrigatório', 400);
    }

    // Verificar que minute_agenda_item existe
    const itemCheck = await client.query(
      'SELECT id, minutes_id, building_id FROM minute_agenda_items WHERE id = $1',
      [itemId]
    );

    if (itemCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Ponto da agenda não encontrado', 404);
    }

    const agendaItem = itemCheck.rows[0];

    // 1. Limpar votos anteriores deste item (se houver)
    await client.query(
      'DELETE FROM member_votes WHERE minute_agenda_item_id = $1',
      [itemId]
    );

    await client.query(
      'DELETE FROM voting_results WHERE minute_agenda_item_id = $1',
      [itemId]
    );

    // 2. Guardar votos individuais em member_votes
    const memberVotes = [];
    for (const [memberId, vote] of Object.entries(voting_result.votes)) {
      // Buscar informação do membro
      const memberInfo = await client.query(
        'SELECT name, apartment, permilage FROM members WHERE id = $1',
        [memberId]
      );

      if (memberInfo.rows.length === 0) continue;

      const member = memberInfo.rows[0];

      // Mapear 'favor' → 'favor', 'contra' → 'against', 'abstencao' → 'abstention'
      const voteValue = vote === 'favor' ? 'favor' :
                        vote === 'contra' ? 'against' : 'abstention';

      const voteResult = await client.query(`
        INSERT INTO member_votes (
          minute_agenda_item_id,
          member_id,
          building_id,
          member_name,
          apartment,
          vote,
          voting_power,
          vote_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        itemId,
        memberId,
        agendaItem.building_id,
        member.name,
        member.apartment || 'N/A',
        voteValue,
        member.permilage || 1
      ]);

      memberVotes.push(voteResult.rows[0]);
    }

    // 3. Guardar resultado agregado em voting_results
    const votingResultRecord = await client.query(`
      INSERT INTO voting_results (
        minute_agenda_item_id,
        total_votes,
        votes_in_favor,
        votes_against,
        abstentions,
        quorum_percentage,
        is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      itemId,
      voting_result.votersInFavor.length + voting_result.votersAgainst.length + voting_result.votersAbstained.length,
      voting_result.votersInFavor.length,
      voting_result.votersAgainst.length,
      voting_result.votersAbstained.length,
      (voting_result.totalVotingPermilage > 0
        ? (voting_result.permilageInFavor / voting_result.totalVotingPermilage * 100).toFixed(2)
        : 0),
      voting_result.passed
    ]);

    // 4. Atualizar minute_agenda_items com totais
    await client.query(`
      UPDATE minute_agenda_items
      SET
        votes_in_favor = $1,
        votes_against = $2,
        abstentions = $3,
        is_approved = $4,
        updated_at = NOW()
      WHERE id = $5
    `, [
      voting_result.votersInFavor.length,
      voting_result.votersAgainst.length,
      voting_result.votersAbstained.length,
      voting_result.passed,
      itemId
    ]);

    // 5. Atualizar updated_at do acta
    await client.query(
      'UPDATE minutes SET updated_at = NOW() WHERE id = $1',
      [minuteId]
    );

    await client.query('COMMIT');

    return successResponse(res, {
      message: 'Votação guardada com sucesso',
      member_votes: memberVotes,
      voting_result: votingResultRecord.rows[0]
    }, 201);

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// DELETE /api/minutes/:id - Eliminar acta (Soft Delete)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    let userId = req.user?.id;

    // Verificar se o userId existe na tabela users
    if (userId) {
      const userCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        // User do token não existe na BD, usar NULL
        userId = null;
      }
    }

    // Soft delete: marca como eliminado em vez de apagar fisicamente
    const result = await pool.query(
      `UPDATE minutes
       SET deleted_at = NOW(), deleted_by = $2
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, minute_number, building_name`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Acta não encontrada ou já foi eliminada', 404);
    }

    const minute = result.rows[0];

    return successResponse(res, {
      message: `Acta #${minute.minute_number} movida para o histórico`,
      info: 'Pode restaurar a acta a partir do menu Histórico',
      item: minute
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;