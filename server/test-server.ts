import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { getPool } from '../src/lib/database.ts';
import { EmailService } from '../src/services/emailService.ts';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = 3003;

// Initialize email service
const emailService = new EmailService();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is working' });
});

// Get table structure (debug)
app.get('/api/table-structure/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const pool = await getPool();
    
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = $1 
       ORDER BY ordinal_position`,
      [table]
    );
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(`Error fetching structure for table ${req.params.table}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch structure for table ${req.params.table}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all buildings
app.get('/api/buildings', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT * FROM buildings ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch buildings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get convocatorias
app.get('/api/convocatorias', async (req, res) => {
  try {
    const { buildingId } = req.query;
    const pool = await getPool();
    
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
    
    let params: any[] = [];
    let paramIndex = 1;
    
    if (buildingId) {
      query += ` AND c.building_id = $${paramIndex++}`;
      params.push(buildingId);
    }
    
    query += ' ORDER BY c.date DESC';
    
    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching convocatorias:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch convocatorias',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get members
app.get('/api/members', async (req, res) => {
  try {
    const { buildingId } = req.query;
    const pool = await getPool();
    
    let query = 'SELECT * FROM members WHERE 1=1';
    let params: any[] = [];
    
    if (buildingId) {
      query += ' AND building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get financial summary
app.get('/api/financial-summary', async (req, res) => {
  try {
    // Mock financial summary data
    const summary = {
      income: 15000,
      expenses: 12000,
      balance: 3000
    };
    
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT NOW() as current_time');
    
    // Get list of tables
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
    console.error('Error testing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get transactions
app.get('/api/transactions', async (req, res) => {
  try {
    // Mock transactions data for now
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get actas
app.get('/api/actas', async (req, res) => {
  try {
    // Mock actas data for now
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching actas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get letters
app.get('/api/letters', async (req, res) => {
  try {
    // Mock letters data for now
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching letters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch letters',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create convocatoria
app.post('/api/convocatorias', async (req, res) => {
  try {
    const pool = await getPool();
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
      delivery_methods,
      agenda_items,
      attached_documents,
      assembly_number,
      status = 'draft'
    } = req.body;
    
    console.log('Creating convocatoria with data:', req.body);
    
    // First, get building info
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
    
    console.log('Convocatoria created:', result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating convocatoria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create convocatoria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Email endpoints
app.post('/api/email/configure', (req, res) => {
  try {
    const { provider, config } = req.body;
    
    if (provider === 'gmail') {
      emailService.configureGmail(config.email, config.password);
    } else if (provider === 'outlook') {
      emailService.configureOutlook(config.email, config.password);
    } else {
      emailService.configure(config);
    }
    
    res.json({ success: true, message: 'Email service configured successfully' });
  } catch (error) {
    console.error('Error configuring email service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure email service',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/email/test', async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test email connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, html, attachments } = req.body;
    
    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      attachments
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/email/send-bulk', async (req, res) => {
  try {
    const { emails, delayMs = 1000 } = req.body;
    
    const results = await emailService.sendBulkEmails(emails, delayMs);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk emails', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/email/providers', (req, res) => {
  const examples = EmailService.getProviderExamples();
  res.json({ success: true, data: examples });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server is running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Email endpoints:`);
  console.log(`  POST /api/email/configure - Configure email service`);
  console.log(`  POST /api/email/test - Test email connection`);
  console.log(`  POST /api/email/send - Send single email`);
  console.log(`  POST /api/email/send-bulk - Send bulk emails`);
});