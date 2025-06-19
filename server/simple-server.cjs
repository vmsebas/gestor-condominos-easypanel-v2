const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://Condominio_owner:npg_ifA75hTZVXQy@ep-tight-truth-a2ce2fq5-pooler.eu-central-1.aws.neon.tech/Condominio?sslmode=require'
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is working' });
});

// Database test
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({ 
      success: true, 
      data: {
        currentTime: result.rows[0].current_time,
        tables: tablesResult.rows.map(row => row.table_name)
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Get buildings
app.get('/api/buildings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buildings ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch buildings',
      details: error.message
    });
  }
});

// Get convocatorias
app.get('/api/convocatorias', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    let query = `
      SELECT 
        c.id,
        c.building_id,
        c.building_name,
        c.building_address,
        c.postal_code,
        c.assembly_number,
        c.assembly_type,
        c.date as meeting_date,
        c.time,
        c.location,
        c.second_call_enabled,
        c.second_call_time,
        c.second_call_date,
        c.administrator,
        c.secretary,
        c.legal_reference,
        c.minutes_created,
        c.created_at,
        c.updated_at,
        c.city
      FROM convocatorias c
      WHERE 1=1
    `;
    
    let params = [];
    if (buildingId) {
      query += ' AND c.building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY c.date DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching convocatorias:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch convocatorias',
      details: error.message
    });
  }
});

// Create convocatoria
app.post('/api/convocatorias', async (req, res) => {
  try {
    const { 
      building_id, 
      assembly_type, 
      meeting_date, 
      time, 
      location, 
      second_call_enabled = false,
      second_call_date,
      second_call_time,
      administrator,
      secretary,
      legal_reference,
      assembly_number
    } = req.body;
    
    // Get building info
    const buildingQuery = await pool.query('SELECT * FROM buildings WHERE id = $1', [building_id]);
    const building = buildingQuery.rows[0];
    
    if (!building) {
      return res.status(400).json({
        success: false,
        error: 'Building not found'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO convocatorias (
        building_id, assembly_type, date, time, location,
        second_call_enabled, second_call_date, second_call_time,
        administrator, secretary, legal_reference,
        assembly_number, minutes_created, created_at, updated_at,
        building_name, building_address, postal_code, city
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), $14, $15, $16, $17) RETURNING *`,
      [
        building_id, assembly_type, meeting_date, time, location,
        second_call_enabled, second_call_date, second_call_time,
        administrator, secretary, legal_reference,
        assembly_number, false,
        building.name, building.address, building.postal_code, building.city
      ]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating convocatoria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create convocatoria',
      details: error.message
    });
  }
});

// Mock endpoints for other APIs
app.get('/api/members', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/financial-summary', (req, res) => {
  res.json({ 
    success: true, 
    data: { income: 15000, expenses: 12000, balance: 3000 }
  });
});

app.get('/api/transactions', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/actas', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/letters', (req, res) => {
  res.json({ success: true, data: [] });
});

// Email endpoints (mock for now)
app.post('/api/email/configure', (req, res) => {
  res.json({ success: true, message: 'Email configured (mock)' });
});

app.post('/api/email/test', (req, res) => {
  res.json({ success: true, message: 'Email test successful (mock)' });
});

app.post('/api/email/send', (req, res) => {
  res.json({ success: true, messageId: 'mock-' + Date.now() });
});

app.listen(PORT, () => {
  console.log(`Simple server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});