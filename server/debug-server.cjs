const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection with detailed logging
const pool = new Pool({
  connectionString: 'postgresql://Condominio_owner:npg_ifA75hTZVXQy@ep-tight-truth-a2ce2fq5-pooler.eu-central-1.aws.neon.tech/Condominio?sslmode=require'
});

// Test database connection on startup
async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connected successfully');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].db_version.substring(0, 50) + '...');
    
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Available tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Test route
app.get('/api/test', (req, res) => {
  console.log('📡 Test endpoint called');
  res.json({ 
    success: true, 
    message: 'Server is working',
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  console.log('🔍 Database test endpoint called');
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('✅ Database test successful');
    res.json({ 
      success: true, 
      data: {
        currentTime: result.rows[0].current_time,
        tables: tablesResult.rows.map(row => row.table_name)
      }
    });
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Run database migrations
app.post('/api/migrations/run', async (req, res) => {
  console.log('🔧 Migration endpoint called');
  try {
    const client = await pool.connect();
    
    try {
      console.log('🏃 Running migrations...');
      
      // Migration 1: Add secondary address to members
      console.log('📍 Adding secondary address fields to members...');
      await client.query(`
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'members' AND column_name = 'secondary_address') THEN
                ALTER TABLE members 
                ADD COLUMN secondary_address TEXT,
                ADD COLUMN secondary_postal_code VARCHAR(10),
                ADD COLUMN secondary_city VARCHAR(100),
                ADD COLUMN secondary_country VARCHAR(100) DEFAULT 'Portugal';
                
                RAISE NOTICE 'Added secondary address fields to members table';
            ELSE
                RAISE NOTICE 'Secondary address fields already exist in members table';
            END IF;
        END $$;
      `);
      
      // Migration 2: Update documents member relation
      console.log('📄 Adding member relation to documents...');
      await client.query(`
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'documents' AND column_name = 'member_id') THEN
                ALTER TABLE documents 
                ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;
                
                RAISE NOTICE 'Added member_id to documents table';
            ELSE
                RAISE NOTICE 'member_id already exists in documents table';
            END IF;
        END $$;
      `);
      
      // Create index for documents
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_documents_member_id ON documents(member_id);
      `);
      
      // Migration 3: Improve transactions management
      console.log('💳 Enhancing transactions management...');
      await client.query(`
        DO $$ 
        BEGIN 
            -- Add member_id to transactions
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'member_id') THEN
                ALTER TABLE transactions ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;
                RAISE NOTICE 'Added member_id to transactions table';
            ELSE
                RAISE NOTICE 'member_id already exists in transactions table';
            END IF;
            
            -- Add is_confirmed field
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'is_confirmed') THEN
                ALTER TABLE transactions ADD COLUMN is_confirmed BOOLEAN DEFAULT true;
                RAISE NOTICE 'Added is_confirmed to transactions table';
            ELSE
                RAISE NOTICE 'is_confirmed already exists in transactions table';
            END IF;
            
            -- Add last_modified_by field
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'last_modified_by') THEN
                ALTER TABLE transactions ADD COLUMN last_modified_by VARCHAR(255);
                RAISE NOTICE 'Added last_modified_by to transactions table';
            ELSE
                RAISE NOTICE 'last_modified_by already exists in transactions table';
            END IF;
            
            -- Add admin_notes field
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'admin_notes') THEN
                ALTER TABLE transactions ADD COLUMN admin_notes TEXT;
                RAISE NOTICE 'Added admin_notes to transactions table';
            ELSE
                RAISE NOTICE 'admin_notes already exists in transactions table';
            END IF;
        END $$;
      `);
      
      // Create index for transactions
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
      `);
      
      console.log('✅ Migrations completed successfully');
      
      res.json({
        success: true,
        message: 'Migrations executed successfully',
        migrations: [
          'Added secondary address fields to members',
          'Added member_id to documents with index',
          'Enhanced transactions with member_id and admin fields'
        ]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to run migrations',
      details: error.message
    });
  }
});

// Get buildings with detailed logging
app.get('/api/buildings', async (req, res) => {
  console.log('🏢 Buildings endpoint called');
  try {
    const result = await pool.query('SELECT * FROM buildings ORDER BY name');
    console.log(`✅ Found ${result.rows.length} buildings`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching buildings:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch buildings',
      details: error.message
    });
  }
});

// Debug endpoint to check table structure
app.get('/api/debug/table-structure/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    res.json({
      success: true,
      table: tableName,
      columns: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get convocatorias with detailed logging
app.get('/api/convocatorias', async (req, res) => {
  console.log('📋 Convocatorias endpoint called');
  console.log('Query params:', req.query);
  
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
        c.city,
        c.agenda_items
      FROM convocatorias c
      WHERE 1=1
    `;
    
    let params = [];
    if (buildingId) {
      query += ' AND c.building_id = $1';
      params.push(buildingId);
      console.log('Filtering by building_id:', buildingId);
    }
    
    query += ' ORDER BY c.date DESC';
    
    console.log('Executing query:', query.replace(/\s+/g, ' ').trim());
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} convocatorias`);
    
    // Get agenda items for each convocatoria
    for (let convocatoria of result.rows) {
      const agendaQuery = `
        SELECT id, title, description, order_number
        FROM minute_agenda_items
        WHERE convocatoria_id = $1
        ORDER BY order_number ASC
      `;
      const agendaResult = await pool.query(agendaQuery, [convocatoria.id]);
      convocatoria.agenda_items = agendaResult.rows;
      console.log(`Convocatoria ${convocatoria.id} has ${agendaResult.rows.length} agenda items`);
    }
    
    // Log first row for debugging
    if (result.rows.length > 0) {
      console.log('Sample convocatoria:', {
        id: result.rows[0].id,
        building_name: result.rows[0].building_name,
        assembly_type: result.rows[0].assembly_type,
        meeting_date: result.rows[0].meeting_date,
        agenda_items_count: result.rows[0].agenda_items?.length || 0
      });
    }
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching convocatorias:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch convocatorias',
      details: error.message
    });
  }
});

// Create convocatoria
app.post('/api/convocatorias', async (req, res) => {
  console.log('📋 Creating new convocatoria');
  console.log('Request body:', req.body);
  
  try {
    const {
      building_id,
      assembly_type,
      meeting_date,
      time,
      location,
      second_call_enabled,
      second_call_date,
      second_call_time,
      administrator,
      secretary,
      legal_reference,
      assembly_number,
      agenda_items
    } = req.body;
    
    // Get building info
    const buildingResult = await pool.query(
      'SELECT name, address, postal_code, city FROM buildings WHERE id = $1',
      [building_id]
    );
    
    if (buildingResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Building not found'
      });
    }
    
    const building = buildingResult.rows[0];
    
    // First, create the convocatoria without agenda_items
    const query = `
      INSERT INTO convocatorias (
        building_id, building_name, building_address, postal_code, city,
        assembly_number, assembly_type, date, time, location,
        second_call_enabled, second_call_date, second_call_time,
        administrator, secretary, legal_reference
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;
    
    const values = [
      building_id,
      building.name,
      building.address,
      building.postal_code,
      building.city,
      assembly_number,
      assembly_type,
      meeting_date,
      time,
      location,
      second_call_enabled,
      second_call_date,
      second_call_time,
      administrator,
      secretary,
      legal_reference
    ];
    
    const result = await pool.query(query, values);
    const convocatoriaId = result.rows[0].id;
    console.log('✅ Convocatoria created:', convocatoriaId);
    
    // Now insert agenda items if they exist
    if (agenda_items && agenda_items.length > 0) {
      console.log('📝 Creating agenda items:', agenda_items.length);
      
      for (let i = 0; i < agenda_items.length; i++) {
        const item = agenda_items[i];
        const itemQuery = `
          INSERT INTO minute_agenda_items (
            convocatoria_id, title, description, order_number
          ) VALUES ($1, $2, $3, $4)
        `;
        
        await pool.query(itemQuery, [
          convocatoriaId,
          item.title,
          item.description || null,
          i + 1
        ]);
      }
      
      console.log('✅ Agenda items created');
    }
    
    // Return the convocatoria with its agenda items
    const fullResult = await pool.query(`
      SELECT * FROM convocatorias WHERE id = $1
    `, [convocatoriaId]);
    
    const agendaResult = await pool.query(`
      SELECT id, title, description, order_number
      FROM minute_agenda_items
      WHERE convocatoria_id = $1
      ORDER BY order_number ASC
    `, [convocatoriaId]);
    
    fullResult.rows[0].agenda_items = agendaResult.rows;
    
    res.json({ success: true, data: fullResult.rows[0] });
  } catch (error) {
    console.error('❌ Error creating convocatoria:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create convocatoria',
      details: error.message
    });
  }
});

// Update convocatoria
app.put('/api/convocatorias/:id', async (req, res) => {
  console.log('📋 Updating convocatoria:', req.params.id);
  console.log('Update data:', req.body);
  
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const query = `
      UPDATE convocatorias 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Convocatoria not found'
      });
    }
    
    console.log('✅ Convocatoria updated');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating convocatoria:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update convocatoria',
      details: error.message
    });
  }
});

// Delete convocatoria
app.delete('/api/convocatorias/:id', async (req, res) => {
  console.log('📋 Deleting convocatoria:', req.params.id);
  
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM convocatorias WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Convocatoria not found'
      });
    }
    
    console.log('✅ Convocatoria deleted');
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting convocatoria:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete convocatoria',
      details: error.message
    });
  }
});

// Real database endpoints
app.get('/api/members', async (req, res) => {
  console.log('👥 Members endpoint called');
  try {
    const { buildingId } = req.query;
    
    let query = 'SELECT * FROM members';
    let params = [];
    
    if (buildingId) {
      query += ' WHERE building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} members`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching members:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members',
      details: error.message
    });
  }
});

// Get individual member by ID
app.get('/api/members/:memberId', async (req, res) => {
  console.log('👤 Individual member endpoint called:', req.params.memberId);
  try {
    const { memberId } = req.params;
    
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [memberId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    
    console.log(`✅ Found member: ${result.rows[0].name}`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error fetching member:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member',
      details: error.message
    });
  }
});

// Get member profile with related data
app.get('/api/members/:memberId/profile', async (req, res) => {
  console.log('👤📋 Member profile endpoint called:', req.params.memberId);
  try {
    const { memberId } = req.params;
    
    // Get member basic information
    const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [memberId]);
    
    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    
    const member = memberResult.rows[0];
    
    // Get related data in parallel
    const [
      transactionsResult,
      documentsResult,
      // We can add more related data queries here in the future
    ] = await Promise.all([
      // Member's transactions
      pool.query(`
        SELECT * FROM transactions 
        WHERE member_id = $1 
        ORDER BY transaction_date DESC 
        LIMIT 50
      `, [memberId]),
      
      // Member's documents
      pool.query(`
        SELECT * FROM documents 
        WHERE member_id = $1 
        ORDER BY created_at DESC 
        LIMIT 20
      `, [memberId])
    ]);
    
    // Calculate financial summary for this member
    const financialResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(amount), 0) as balance,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE member_id = $1
    `, [memberId]);
    
    const financialSummary = financialResult.rows[0] || {
      total_income: 0,
      total_expenses: 0,
      balance: 0,
      total_transactions: 0
    };
    
    // Build complete profile
    const profile = {
      member,
      transactions: transactionsResult.rows,
      documents: documentsResult.rows,
      financialSummary: {
        totalIncome: parseFloat(financialSummary.total_income) || 0,
        totalExpenses: parseFloat(financialSummary.total_expenses) || 0,
        balance: parseFloat(financialSummary.balance) || 0,
        totalTransactions: parseInt(financialSummary.total_transactions) || 0
      },
      statistics: {
        documentsCount: documentsResult.rows.length,
        transactionsCount: transactionsResult.rows.length,
        lastActivity: transactionsResult.rows[0]?.transaction_date || documentsResult.rows[0]?.created_at || null
      }
    };
    
    console.log(`✅ Member profile loaded: ${member.name}`);
    console.log(`📊 Profile stats: ${profile.statistics.transactionsCount} transactions, ${profile.statistics.documentsCount} documents`);
    
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('❌ Error fetching member profile:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member profile',
      details: error.message
    });
  }
});

// Create new member
app.post('/api/members', async (req, res) => {
  console.log('👤➕ Create member endpoint called');
  try {
    const {
      building_id,
      name,
      email,
      phone,
      apartment,
      fraction,
      votes,
      new_monthly_fee,
      new_annual_fee,
      permilage,
      nif,
      notes,
      is_active = true,
      secondary_address,
      secondary_postal_code,
      secondary_city,
      secondary_country
    } = req.body;

    if (!building_id || !name || !apartment) {
      return res.status(400).json({
        success: false,
        error: 'Building ID, name, and apartment are required'
      });
    }

    const query = `
      INSERT INTO members (
        building_id, name, email, phone, apartment, fraction, votes,
        new_monthly_fee, new_annual_fee, permilage, nif, notes, is_active,
        secondary_address, secondary_postal_code, secondary_city, secondary_country
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
    const values = [
      building_id,
      name,
      email || null,
      phone || null,
      apartment,
      fraction || null,
      votes || 1,
      new_monthly_fee || 0,
      new_annual_fee || 0,
      permilage || 0,
      nif || null,
      notes || null,
      is_active,
      secondary_address || null,
      secondary_postal_code || null,
      secondary_city || null,
      secondary_country || null
    ];

    const result = await pool.query(query, values);
    
    console.log(`✅ Member created: ${result.rows[0].name}`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error creating member:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create member',
      details: error.message
    });
  }
});

// Update member
app.put('/api/members/:memberId', async (req, res) => {
  console.log('👤✏️ Update member endpoint called:', req.params.memberId);
  try {
    const { memberId } = req.params;
    const updateData = req.body;
    
    // Remove id from update data if it exists
    delete updateData.id;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided for update'
      });
    }

    // Build dynamic update query
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [memberId, ...Object.values(updateData)];
    
    const query = `
      UPDATE members 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    
    console.log(`✅ Member updated: ${result.rows[0].name}`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating member:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update member',
      details: error.message
    });
  }
});

// Delete member
app.delete('/api/members/:memberId', async (req, res) => {
  console.log('👤🗑️ Delete member endpoint called:', req.params.memberId);
  try {
    const { memberId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM members WHERE id = $1 RETURNING *',
      [memberId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }
    
    console.log(`✅ Member deleted: ${result.rows[0].name}`);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting member:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete member',
      details: error.message
    });
  }
});

app.get('/api/financial-summary', async (req, res) => {
  console.log('💰 Financial summary endpoint called');
  try {
    const { buildingId } = req.query;
    const currentYear = new Date().getFullYear();
    
    let incomeQuery = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions 
      WHERE amount > 0 
      AND transaction_date >= $1 
      AND transaction_date < $2
    `;
    
    let expenseQuery = `
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions 
      WHERE amount < 0 
      AND transaction_date >= $1 
      AND transaction_date < $2
    `;
    
    let params = [`${currentYear}-01-01`, `${currentYear + 1}-01-01`];
    
    if (buildingId) {
      incomeQuery += ' AND building_id = $3';
      expenseQuery += ' AND building_id = $3';
      params.push(buildingId);
    }
    
    const [incomeResult, expenseResult] = await Promise.all([
      pool.query(incomeQuery, params),
      pool.query(expenseQuery, params)
    ]);
    
    const income = parseFloat(incomeResult.rows[0]?.total || '0');
    const expenses = parseFloat(expenseResult.rows[0]?.total || '0');
    
    console.log(`✅ Financial summary: income=${income}, expenses=${expenses}`);
    res.json({
      success: true,
      data: {
        income,
        expenses,
        balance: income - expenses
      }
    });
  } catch (error) {
    console.error('❌ Error fetching financial summary:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial summary',
      details: error.message
    });
  }
});

app.get('/api/transactions', async (req, res) => {
  console.log('💳 Transactions endpoint called');
  try {
    const { buildingId } = req.query;
    
    let query = 'SELECT * FROM transactions';
    let params = [];
    
    if (buildingId) {
      query += ' WHERE building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY transaction_date DESC';
    
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} transactions`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      details: error.message
    });
  }
});

app.get('/api/actas', async (req, res) => {
  console.log('📝 Actas endpoint called');
  try {
    const { buildingId } = req.query;
    
    let query = `
      SELECT m.*, c.building_id, c.building_name 
      FROM minutes m 
      LEFT JOIN convocatorias c ON m.convocatoria_id = c.id
    `;
    let params = [];
    
    if (buildingId) {
      query += ' WHERE c.building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY m.created_at DESC';
    
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} actas`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching actas:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actas',
      details: error.message
    });
  }
});

app.get('/api/minutes', async (req, res) => {
  console.log('📝 Minutes endpoint called');
  try {
    const { buildingId } = req.query;
    
    let query = `
      SELECT m.*, c.building_id, c.building_name 
      FROM minutes m 
      LEFT JOIN convocatorias c ON m.convocatoria_id = c.id
    `;
    let params = [];
    
    if (buildingId) {
      query += ' WHERE c.building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY m.created_at DESC';
    
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} minutes`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching minutes:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch minutes',
      details: error.message
    });
  }
});

app.get('/api/letters', async (req, res) => {
  console.log('✉️ Letters endpoint called');
  try {
    const { buildingId } = req.query;
    
    let query = 'SELECT * FROM sent_letters';
    let params = [];
    
    if (buildingId) {
      query += ' WHERE building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY sent_at DESC';
    
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} letters`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error fetching letters:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch letters',
      details: error.message
    });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats/:buildingId', async (req, res) => {
  console.log('📊 Dashboard stats endpoint called');
  try {
    const { buildingId } = req.params;
    
    // Get various stats
    const [membersCount, transactionsCount, documentsCount, convocatoriasCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM members WHERE building_id = $1', [buildingId]),
      pool.query('SELECT COUNT(*) as count FROM transactions WHERE building_id = $1', [buildingId]),
      pool.query('SELECT COUNT(*) as count FROM documents WHERE building_id = $1', [buildingId]),
      pool.query('SELECT COUNT(*) as count FROM convocatorias WHERE building_id = $1', [buildingId])
    ]);
    
    const stats = {
      members: parseInt(membersCount.rows[0].count),
      transactions: parseInt(transactionsCount.rows[0].count),
      documents: parseInt(documentsCount.rows[0].count),
      convocatorias: parseInt(convocatoriasCount.rows[0].count)
    };
    
    console.log('✅ Dashboard stats:', stats);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      details: error.message
    });
  }
});

// Dashboard recent activities endpoint
app.get('/api/dashboard/recent-activities/:buildingId', async (req, res) => {
  console.log('📈 Dashboard recent activities endpoint called');
  try {
    const { buildingId } = req.params;
    const { limit = 10 } = req.query;
    
    // Get recent activities (simplified)
    const activities = [];
    
    // Recent transactions
    const recentTransactions = await pool.query(`
      SELECT 'transaction' as type, id, description as title, transaction_date as date, amount
      FROM transactions 
      WHERE building_id = $1 
      ORDER BY transaction_date DESC 
      LIMIT $2
    `, [buildingId, Math.ceil(limit / 2)]);
    
    activities.push(...recentTransactions.rows);
    
    // Recent documents
    const recentDocuments = await pool.query(`
      SELECT 'document' as type, id, name as title, created_at as date, file_size
      FROM documents 
      WHERE building_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [buildingId, Math.ceil(limit / 2)]);
    
    activities.push(...recentDocuments.rows);
    
    // Sort by date and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
    
    console.log(`✅ Found ${sortedActivities.length} recent activities`);
    res.json({ success: true, data: sortedActivities });
  } catch (error) {
    console.error('❌ Error fetching recent activities:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities',
      details: error.message
    });
  }
});

// ===== DOCUMENT MANAGEMENT ENDPOINTS =====

// Configuración de multer para upload de archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`));
    }
  }
});

// Utility function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get all documents
app.get('/api/documents', async (req, res) => {
  console.log('📁 Documents endpoint called');
  
  try {
    const {
      buildingId,
      category,
      search_query,
      page = 1,
      limit = 20
    } = req.query;

    let query = `
      SELECT *
      FROM documents d
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (buildingId) {
      paramCount++;
      query += ` AND d.building_id = $${paramCount}`;
      params.push(buildingId);
    }

    if (category) {
      paramCount++;
      query += ` AND d.category = $${paramCount}`;
      params.push(category);
    }

    if (search_query) {
      paramCount++;
      query += ` AND (d.name ILIKE $${paramCount} OR d.description ILIKE $${paramCount})`;
      params.push(`%${search_query}%`);
    }

    query += ` ORDER BY d.created_at DESC`;

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    console.log('Executing documents query:', query.replace(/\s+/g, ' ').trim());
    const result = await pool.query(query, params);
    
    // Formatear el tamaño de archivo
    const documentsWithFormatting = result.rows.map(doc => ({
      ...doc,
      file_size_formatted: formatFileSize(doc.file_size)
    }));

    console.log(`✅ Found ${result.rows.length} documents`);
    res.json({ success: true, data: documentsWithFormatting });
  } catch (error) {
    console.error('❌ Error fetching documents:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      details: error.message
    });
  }
});

// POST endpoint for documents (redirect to upload)
app.post('/api/documents', upload.single('file'), async (req, res) => {
  console.log('📤 Document POST endpoint called - redirecting to upload logic');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const {
      building_id,
      member_id,
      name,
      category = 'general',
      subcategory,
      tags,
      description,
      visibility = 'building',
      is_confidential = false,
      access_level = 'read',
      uploaded_by
    } = req.body;

    if (!building_id || !name) {
      // Delete file if required data is missing
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        error: 'Building ID and name are required'
      });
    }

    const query = `
      INSERT INTO documents (
        building_id, member_id, name, original_name, file_path, 
        file_size, mime_type, file_extension, category, subcategory,
        tags, description, visibility, is_confidential, access_level, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      building_id,
      member_id || null,
      name,
      req.file.originalname,
      '/uploads/' + req.file.filename, // Store relative path
      req.file.size,
      req.file.mimetype,
      path.extname(req.file.originalname).toLowerCase(),
      category,
      subcategory || null,
      tags || null,
      description || null,
      visibility,
      is_confidential === 'true' || is_confidential === true,
      access_level,
      uploaded_by || 'System'
    ];

    const result = await pool.query(query, values);
    
    console.log('✅ Document uploaded successfully:', result.rows[0].name);
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Document uploaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Error uploading document:', error.message);
    
    // Try to delete the uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message
    });
  }
});

// Upload new document
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  console.log('📤 Document upload endpoint called');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const {
      building_id,
      member_id,
      name,
      category = 'general',
      subcategory,
      tags,
      description,
      visibility = 'building',
      is_confidential = false,
      access_level = 'read',
      uploaded_by
    } = req.body;

    if (!building_id || !name) {
      // Eliminar archivo si faltan datos requeridos
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        error: 'Building ID and name are required'
      });
    }

    const query = `
      INSERT INTO documents (
        building_id, member_id, name, original_name, file_path, 
        file_size, mime_type, file_extension, category, subcategory,
        tags, description, visibility, is_confidential, access_level, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      building_id,
      member_id || null,
      name,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      path.extname(req.file.originalname).toLowerCase().slice(1),
      category,
      subcategory || null,
      tags ? JSON.parse(tags) : [],
      description || null,
      visibility,
      is_confidential === 'true',
      access_level,
      uploaded_by || null
    ];
    
    const result = await pool.query(query, values);
    const document = result.rows[0];
    document.file_size_formatted = formatFileSize(document.file_size);
    
    console.log('✅ Document uploaded successfully:', document.id);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('❌ Error uploading document:', error.message);
    
    // Eliminar archivo en caso de error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message
    });
  }
});

// Download document
app.get('/api/documents/:id/download', async (req, res) => {
  console.log('📥 Document download endpoint called:', req.params.id);
  
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = result.rows[0];
    
    // Actualizar contador de descargas
    await pool.query(
      'UPDATE documents SET download_count = download_count + 1, last_accessed_at = NOW() WHERE id = $1',
      [id]
    );

    // Verificar que el archivo existe
    try {
      await fs.access(document.file_path);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    console.log('✅ Document download started:', document.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
    res.setHeader('Content-Type', document.mime_type);
    res.sendFile(path.resolve(document.file_path));
    
  } catch (error) {
    console.error('❌ Error downloading document:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to download document',
      details: error.message
    });
  }
});

// Get document statistics
app.get('/api/documents/stats/:buildingId', async (req, res) => {
  console.log('📊 Document stats endpoint called');
  
  try {
    const { buildingId } = req.params;
    
    const queries = await Promise.all([
      // Total documents and size
      pool.query(`
        SELECT 
          COUNT(*) as total_documents,
          COALESCE(SUM(file_size), 0) as total_size
        FROM documents 
        WHERE building_id = $1 AND is_current_version = true
      `, [buildingId]),
      
      // By category
      pool.query(`
        SELECT 
          category,
          COUNT(*) as count,
          COALESCE(SUM(file_size), 0) as size
        FROM documents 
        WHERE building_id = $1 AND is_current_version = true
        GROUP BY category
        ORDER BY count DESC
      `, [buildingId]),
      
      // Recent uploads (last 30 days)
      pool.query(`
        SELECT COUNT(*) as recent_uploads
        FROM documents 
        WHERE building_id = $1 
        AND created_at >= NOW() - INTERVAL '30 days'
      `, [buildingId])
    ]);

    const stats = {
      total_documents: parseInt(queries[0].rows[0]?.total_documents || '0'),
      total_size: parseInt(queries[0].rows[0]?.total_size || '0'),
      by_category: queries[1].rows,
      recent_uploads: parseInt(queries[2].rows[0]?.recent_uploads || '0')
    };
    
    console.log('✅ Document stats generated');
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('❌ Error fetching document statistics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document statistics',
      details: error.message
    });
  }
});

// Catch all undefined routes
app.use((req, res) => {
  console.log(`❓ Unknown route called: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Debug server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log('==========================================');
  
  // Test database connection
  await testConnection();
  
  console.log('==========================================');
  console.log('✅ Server ready for requests');
});