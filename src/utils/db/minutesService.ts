// Removed dbService imports - should use API instead
// import { 
//   executeQuery, 
//   executeQuerySingle, 
//   executeMutation,
//   executeTransaction,
//   buildInsertQuery,
//   buildUpdateQuery
// } from './dbService';
import { Minutes, AgendaItem, Attendee } from '@/types/minutesTypes';

// Obtener todas las actas
export const getAllMinutes = async (buildingId?: string): Promise<Minutes[]> => {
  let query = `
    SELECT 
      m.id,
      m.building_id,
      m.meeting_date,
      m.meeting_type,
      m.location,
      m.start_time,
      m.end_time,
      m.president_name,
      m.secretary_name,
      m.content,
      m.conclusions,
      m.is_signed,
      m.created_at,
      m.updated_at,
      b.name as building_name
    FROM minutes m
    LEFT JOIN buildings b ON m.building_id = b.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (buildingId) {
    query += ' AND m.building_id = $1';
    params.push(buildingId);
  }
  
  query += ' ORDER BY m.meeting_date DESC, m.created_at DESC';
  
  const results = await executeQuery<any>(query, params);
  
  // Para cada acta, obtener agenda y asistentes
  const minutesWithDetails = await Promise.all(
    results.map(async (minute) => {
      const agenda = await getAgendaItems(minute.id);
      const attendees = await getAttendees(minute.id);
      
      return mapDbMinutesToMinutes(minute, agenda, attendees);
    })
  );
  
  return minutesWithDetails;
};

// Obtener un acta por ID
export const getMinuteById = async (id: string): Promise<Minutes | null> => {
  const query = `
    SELECT 
      m.id,
      m.building_id,
      m.meeting_date,
      m.meeting_type,
      m.location,
      m.start_time,
      m.end_time,
      m.president_name,
      m.secretary_name,
      m.content,
      m.conclusions,
      m.is_signed,
      m.created_at,
      m.updated_at,
      b.name as building_name
    FROM minutes m
    LEFT JOIN buildings b ON m.building_id = b.id
    WHERE m.id = $1
  `;
  
  const result = await executeQuerySingle<any>(query, [id]);
  
  if (!result) return null;
  
  const agenda = await getAgendaItems(id);
  const attendees = await getAttendees(id);
  
  return mapDbMinutesToMinutes(result, agenda, attendees);
};

// Crear nueva acta
export const createMinute = async (minuteData: Partial<Minutes>): Promise<Minutes> => {
  // Usar transacción para crear acta con agenda y asistentes
  const queries = [];
  
  // 1. Insertar acta principal
  const minuteDbData = {
    building_id: minuteData.buildingId,
    meeting_date: minuteData.meetingDate,
    meeting_type: minuteData.meetingType || 'ordinary',
    location: minuteData.location,
    start_time: minuteData.startTime,
    end_time: minuteData.endTime || null,
    president_name: minuteData.presidentName,
    secretary_name: minuteData.secretaryName,
    content: minuteData.content || '',
    conclusions: minuteData.conclusions || null,
    is_signed: minuteData.isSigned || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { query: minuteQuery, params: minuteParams } = buildInsertQuery(
    'minutes', 
    minuteDbData,
    'id'
  );
  
  queries.push({ query: minuteQuery, params: minuteParams });
  
  // Ejecutar la transacción para obtener el ID
  const [minuteResult] = await executeTransaction([queries[0]]);
  const minuteId = minuteResult[0].id;
  
  // 2. Insertar elementos de agenda si existen
  if (minuteData.agendaItems && minuteData.agendaItems.length > 0) {
    for (let i = 0; i < minuteData.agendaItems.length; i++) {
      const item = minuteData.agendaItems[i];
      const agendaQuery = `
        INSERT INTO minute_agenda_items (
          minute_id, order_number, title, description, 
          discussion, decision, votes_favor, votes_against, votes_abstention
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      await executeMutation(agendaQuery, [
        minuteId,
        i + 1,
        item.title,
        item.description || null,
        item.discussion || null,
        item.decision || null,
        item.votesFavor || 0,
        item.votesAgainst || 0,
        item.votesAbstention || 0
      ]);
    }
  }
  
  // 3. Insertar asistentes si existen
  if (minuteData.attendees && minuteData.attendees.length > 0) {
    for (const attendee of minuteData.attendees) {
      const attendeeQuery = `
        INSERT INTO minute_attendees (
          minute_id, member_id, attendance_type, representation_member_id
        ) VALUES ($1, $2, $3, $4)
      `;
      
      await executeMutation(attendeeQuery, [
        minuteId,
        attendee.memberId,
        attendee.attendanceType || 'present',
        attendee.representationMemberId || null
      ]);
    }
  }
  
  // Obtener el acta completa con todos los detalles
  return getMinuteById(minuteId);
};

// Actualizar acta
export const updateMinute = async (
  id: string, 
  minuteData: Partial<Minutes>
): Promise<Minutes> => {
  const data: any = {
    updated_at: new Date().toISOString()
  };
  
  // Solo incluir campos que han sido proporcionados
  if (minuteData.meetingDate !== undefined) data.meeting_date = minuteData.meetingDate;
  if (minuteData.meetingType !== undefined) data.meeting_type = minuteData.meetingType;
  if (minuteData.location !== undefined) data.location = minuteData.location;
  if (minuteData.startTime !== undefined) data.start_time = minuteData.startTime;
  if (minuteData.endTime !== undefined) data.end_time = minuteData.endTime;
  if (minuteData.presidentName !== undefined) data.president_name = minuteData.presidentName;
  if (minuteData.secretaryName !== undefined) data.secretary_name = minuteData.secretaryName;
  if (minuteData.content !== undefined) data.content = minuteData.content;
  if (minuteData.conclusions !== undefined) data.conclusions = minuteData.conclusions;
  if (minuteData.isSigned !== undefined) data.is_signed = minuteData.isSigned;
  
  const { query, params } = buildUpdateQuery('minutes', data, { id });
  await executeMutation(query, params);
  
  // Actualizar agenda si se proporciona
  if (minuteData.agendaItems !== undefined) {
    // Eliminar agenda existente
    await executeMutation('DELETE FROM minute_agenda_items WHERE minute_id = $1', [id]);
    
    // Insertar nueva agenda
    for (let i = 0; i < minuteData.agendaItems.length; i++) {
      const item = minuteData.agendaItems[i];
      const agendaQuery = `
        INSERT INTO minute_agenda_items (
          minute_id, order_number, title, description, 
          discussion, decision, votes_favor, votes_against, votes_abstention
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      
      await executeMutation(agendaQuery, [
        id,
        i + 1,
        item.title,
        item.description || null,
        item.discussion || null,
        item.decision || null,
        item.votesFavor || 0,
        item.votesAgainst || 0,
        item.votesAbstention || 0
      ]);
    }
  }
  
  // Actualizar asistentes si se proporciona
  if (minuteData.attendees !== undefined) {
    // Eliminar asistentes existentes
    await executeMutation('DELETE FROM minute_attendees WHERE minute_id = $1', [id]);
    
    // Insertar nuevos asistentes
    for (const attendee of minuteData.attendees) {
      const attendeeQuery = `
        INSERT INTO minute_attendees (
          minute_id, member_id, attendance_type, representation_member_id
        ) VALUES ($1, $2, $3, $4)
      `;
      
      await executeMutation(attendeeQuery, [
        id,
        attendee.memberId,
        attendee.attendanceType || 'present',
        attendee.representationMemberId || null
      ]);
    }
  }
  
  return getMinuteById(id);
};

// Eliminar acta
export const deleteMinute = async (id: string): Promise<boolean> => {
  // Las eliminaciones en cascada deberían estar configuradas en la BD
  const query = 'DELETE FROM minutes WHERE id = $1';
  const result = await executeMutation(query, [id]);
  return result.rowCount > 0;
};

// Buscar actas
export const searchMinutes = async (
  searchTerm: string,
  buildingId?: string
): Promise<Minutes[]> => {
  let query = `
    SELECT 
      m.id,
      m.building_id,
      m.meeting_date,
      m.meeting_type,
      m.location,
      m.start_time,
      m.end_time,
      m.president_name,
      m.secretary_name,
      m.content,
      m.conclusions,
      m.is_signed,
      m.created_at,
      m.updated_at,
      b.name as building_name
    FROM minutes m
    LEFT JOIN buildings b ON m.building_id = b.id
    WHERE (
      LOWER(m.content) LIKE LOWER($1) OR
      LOWER(m.conclusions) LIKE LOWER($1) OR
      LOWER(m.president_name) LIKE LOWER($1) OR
      LOWER(m.secretary_name) LIKE LOWER($1)
    )
  `;
  
  const params: any[] = [`%${searchTerm}%`];
  
  if (buildingId) {
    query += ' AND m.building_id = $2';
    params.push(buildingId);
  }
  
  query += ' ORDER BY m.meeting_date DESC';
  
  const results = await executeQuery<any>(query, params);
  
  // Para cada acta, obtener agenda y asistentes
  const minutesWithDetails = await Promise.all(
    results.map(async (minute) => {
      const agenda = await getAgendaItems(minute.id);
      const attendees = await getAttendees(minute.id);
      
      return mapDbMinutesToMinutes(minute, agenda, attendees);
    })
  );
  
  return minutesWithDetails;
};

// === FUNCIONES AUXILIARES ===

// Obtener elementos de agenda de un acta
const getAgendaItems = async (minuteId: string): Promise<AgendaItem[]> => {
  const query = `
    SELECT 
      id,
      minute_id,
      order_number,
      title,
      description,
      discussion,
      decision,
      votes_favor,
      votes_against,
      votes_abstention
    FROM minute_agenda_items
    WHERE minute_id = $1
    ORDER BY order_number
  `;
  
  const results = await executeQuery<any>(query, [minuteId]);
  return results.map(mapDbAgendaToAgenda);
};

// Obtener asistentes de un acta
const getAttendees = async (minuteId: string): Promise<Attendee[]> => {
  const query = `
    SELECT 
      a.id,
      a.minute_id,
      a.member_id,
      a.attendance_type,
      a.representation_member_id,
      m.name as member_name,
      m.fraction as member_fraction,
      rm.name as representation_name
    FROM minute_attendees a
    JOIN members m ON a.member_id = m.id
    LEFT JOIN members rm ON a.representation_member_id = rm.id
    WHERE a.minute_id = $1
    ORDER BY m.fraction
  `;
  
  const results = await executeQuery<any>(query, [minuteId]);
  return results.map(mapDbAttendeeToAttendee);
};

// Firmar acta
export const signMinute = async (id: string): Promise<boolean> => {
  const query = `
    UPDATE minutes 
    SET is_signed = true, updated_at = $2 
    WHERE id = $1
  `;
  
  const result = await executeMutation(query, [id, new Date().toISOString()]);
  return result.rowCount > 0;
};

// === MAPPERS ===

const mapDbMinutesToMinutes = (
  db: any, 
  agenda: AgendaItem[], 
  attendees: Attendee[]
): Minutes => ({
  id: db.id,
  buildingId: db.building_id,
  buildingName: db.building_name,
  meetingDate: db.meeting_date,
  meetingType: db.meeting_type,
  location: db.location,
  startTime: db.start_time,
  endTime: db.end_time,
  presidentName: db.president_name,
  secretaryName: db.secretary_name,
  content: db.content,
  conclusions: db.conclusions,
  agendaItems: agenda,
  attendees: attendees,
  isSigned: db.is_signed,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapDbAgendaToAgenda = (db: any): AgendaItem => ({
  id: db.id,
  minuteId: db.minute_id,
  orderNumber: db.order_number,
  title: db.title,
  description: db.description,
  discussion: db.discussion,
  decision: db.decision,
  votesFavor: db.votes_favor,
  votesAgainst: db.votes_against,
  votesAbstention: db.votes_abstention
});

const mapDbAttendeeToAttendee = (db: any): Attendee => ({
  id: db.id,
  minuteId: db.minute_id,
  memberId: db.member_id,
  memberName: db.member_name,
  memberFraction: db.member_fraction,
  attendanceType: db.attendance_type,
  representationMemberId: db.representation_member_id,
  representationName: db.representation_name
});

export default {
  getAllMinutes,
  getMinuteById,
  createMinute,
  updateMinute,
  deleteMinute,
  searchMinutes,
  signMinute
};