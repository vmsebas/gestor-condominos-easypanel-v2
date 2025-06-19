import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    
    // Test connection
    const result = await client.query('SELECT NOW() as current_time');
    
    // Get tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    client.release();
    
    res.status(200).json({
      success: true,
      currentTime: result.rows[0].current_time,
      tables: tables.rows.map(row => row.table_name)
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to the database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
