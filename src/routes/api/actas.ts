import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getActas(req, res);
    case 'POST':
      return createActa(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ 
        success: false,
        error: `Method ${req.method} Not Allowed` 
      });
  }
}

// Get actas (minutes) with optional buildingId filter
async function getActas(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { buildingId } = req.query;
    const client = await pool.connect();
    
    // Consultamos los campos exactos que podemos ver en la base de datos
    // y los renombramos para que coincidan con lo que espera el frontend
    let query = `
      SELECT 
        m.id,
        m.building_id,
        m.minute_number as number,
        m.assembly_type as assembly_type,
        m.meeting_date as date,
        m.location,
        m.content,
        m.status,
        m.created_at,
        m.updated_at,
        b.name as building_name,
        b.address as building_address
      FROM minutes m
      LEFT JOIN buildings b ON m.building_id = b.id
    `;
    
    const queryParams = [];
    if (buildingId) {
      query += ' WHERE m.building_id = $1';
      queryParams.push(buildingId);
    }
    
    // Order by most recent first
    query += ' ORDER BY m.meeting_date DESC';
    
    const result = await client.query(query, queryParams);
    client.release();
    
    console.log(`Retrieved ${result.rows.length} actas (minutes)`);
    
    // Realizamos un mapeo explícito para garantizar la estructura correcta
    const mappedData = result.rows.map(row => ({
      id: row.id,
      buildingId: row.building_id,
      number: row.number,
      assemblyType: row.assembly_type,
      date: row.date,
      location: row.location,
      content: row.content,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      buildingName: row.building_name,
      buildingAddress: row.building_address
    }));
    
    return res.status(200).json({
      success: true,
      data: mappedData
    });
  }
  } catch (error) {
    console.error('Error getting actas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error retrieving actas from database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Create a new acta (minute)
async function createActa(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      building_id,
      minute_number,
      assembly_type,
      meeting_date,
      location,
      content,
      attendees,
      status = 'draft' // Default to draft
    } = req.body;
    
    const client = await pool.connect();
    
    // Validate required fields
    if (!building_id || !minute_number || !assembly_type || !meeting_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: building_id, minute_number, assembly_type, meeting_date'
      });
    }
    
    const result = await client.query(
      `INSERT INTO minutes (
        building_id,
        minute_number, 
        assembly_type, 
        meeting_date, 
        location, 
        content,
        status,
        created_at,
        updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *`,
      [
        building_id,
        minute_number,
        assembly_type,
        meeting_date,
        location,
        content,
        status
      ]
    );
    
    // Si hay asistentes, los insertamos en la tabla de attendees
    if (attendees && attendees.length > 0) {
      const minuteId = result.rows[0].id;
      
      // Preparar inserción de múltiples asistentes
      const attendeesPromises = attendees.map(async (attendeeId: string) => {
        return client.query(
          `INSERT INTO attendees (minute_id, member_id, created_at)
           VALUES ($1, $2, NOW())`,
          [minuteId, attendeeId]
        );
      });
      
      await Promise.all(attendeesPromises);
    }
    
    client.release();
    
    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating acta:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creating acta in database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
