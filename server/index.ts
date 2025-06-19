import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
// import { getPool } from '../src/lib/database.ts';
import pkg from 'pg';
const { Pool } = pkg;
// import { createTasksRouter } from './routes/tasks.ts';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Debug log environment variables (don't log sensitive data in production)
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '*** (set)' : 'Not set');

const app = express();
const PORT = process.env.PORT || 3002;

// Create database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|rtf|odt|ods|ppt|pptx)$/i;
    const allowedMimetypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];
    
    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimetypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype} (${path.extname(file.originalname)})`));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Function to compress images
async function compressImage(inputPath: string, outputPath: string): Promise<{ size: number; path: string }> {
  const stats = fs.statSync(inputPath);
  const originalSize = stats.size;
  
  // If file is already small (< 1MB), don't compress
  if (originalSize < 1024 * 1024) {
    return { size: originalSize, path: inputPath };
  }
  
  try {
    await sharp(inputPath)
      .resize(1920, 1920, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    const compressedStats = fs.statSync(outputPath);
    
    // If compression didn't help much, use original
    if (compressedStats.size >= originalSize * 0.9) {
      fs.unlinkSync(outputPath);
      return { size: originalSize, path: inputPath };
    }
    
    // Remove original and use compressed
    fs.unlinkSync(inputPath);
    return { size: compressedStats.size, path: outputPath };
  } catch (error) {
    console.error('Error compressing image:', error);
    return { size: originalSize, path: inputPath };
  }
}

// Function to compress PDFs
async function compressPDF(inputPath: string, outputPath: string): Promise<{ size: number; path: string }> {
  const stats = fs.statSync(inputPath);
  const originalSize = stats.size;
  
  // If file is already small (< 2MB), don't compress
  if (originalSize < 2 * 1024 * 1024) {
    return { size: originalSize, path: inputPath };
  }
  
  try {
    // Import PDFLib dynamically
    const { PDFDocument } = await import('pdf-lib');
    
    // Read the PDF
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get all pages and create a new document with lower quality images
    const compressedDoc = await PDFDocument.create();
    const pages = pdfDoc.getPages();
    
    // Copy pages to new document (this process can reduce file size)
    for (let i = 0; i < pages.length; i++) {
      const [copiedPage] = await compressedDoc.copyPages(pdfDoc, [i]);
      compressedDoc.addPage(copiedPage);
    }
    
    // Serialize the PDF with compression
    const compressedBytes = await compressedDoc.save({
      objectsPerTick: 50,
      useObjectStreams: false,
    });
    
    // Write compressed PDF
    fs.writeFileSync(outputPath, compressedBytes);
    
    const compressedStats = fs.statSync(outputPath);
    
    // If compression didn't help much (less than 10% reduction), use original
    if (compressedStats.size >= originalSize * 0.9) {
      fs.unlinkSync(outputPath);
      return { size: originalSize, path: inputPath };
    }
    
    // Remove original and use compressed
    fs.unlinkSync(inputPath);
    return { size: compressedStats.size, path: outputPath };
  } catch (error) {
    console.error('Error compressing PDF:', error);
    return { size: originalSize, path: inputPath };
  }
}

// API Routes - temporarily commented out
// app.use('/api/tasks', createTasksRouter(getPool));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  console.log('Received request to /api/db-test'); // Debug log
  try {
    const client = await pool.connect();
    
    try {
      // Test connection
      const result = await client.query('SELECT NOW() as current_time');
      
      // Get tables
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      res.status(200).json({
        success: true,
        currentTime: result.rows[0].current_time,
        tables: tables.rows.map((row: { table_name: string }) => row.table_name)
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to the database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Run database migrations
app.post('/api/migrations/run', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Migration 1: Add secondary address to members
      await client.query(`
        -- Agregar segunda dirección opcional para miembros
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'members' AND column_name = 'secondary_address') THEN
                ALTER TABLE members 
                ADD COLUMN secondary_address TEXT,
                ADD COLUMN secondary_postal_code VARCHAR(10),
                ADD COLUMN secondary_city VARCHAR(100),
                ADD COLUMN secondary_country VARCHAR(100) DEFAULT 'Portugal';
            END IF;
        END $$;
      `);
      
      // Migration 2: Update documents member relation
      await client.query(`
        -- Mejorar la relación entre documentos y miembros
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'documents' AND column_name = 'member_id') THEN
                ALTER TABLE documents 
                ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;
                
                CREATE INDEX idx_documents_member_id ON documents(member_id);
            END IF;
        END $$;
      `);
      
      // Migration 3: Improve transactions management
      await client.query(`
        -- Mejorar la gestión de transacciones
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'member_id') THEN
                ALTER TABLE transactions ADD COLUMN member_id UUID REFERENCES members(id) ON DELETE SET NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'is_confirmed') THEN
                ALTER TABLE transactions ADD COLUMN is_confirmed BOOLEAN DEFAULT true;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'last_modified_by') THEN
                ALTER TABLE transactions ADD COLUMN last_modified_by VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'transactions' AND column_name = 'admin_notes') THEN
                ALTER TABLE transactions ADD COLUMN admin_notes TEXT;
            END IF;
        END $$;
        
        CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
      `);
      
      res.json({
        success: true,
        message: 'Migrations executed successfully',
        migrations: [
          'Added secondary address fields to members',
          'Added member_id to documents',
          'Enhanced transactions with member_id and admin fields'
        ]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run migrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all buildings
app.get('/api/buildings', async (req, res) => {
  try {
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

// Get members
app.get('/api/members', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    let query = 'SELECT * FROM members';
    let params: any[] = [];
    
    if (buildingId) {
      query += ' WHERE building_id = $1';
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

// Get convocatorias
app.get('/api/convocatorias', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    // Usamos los nombres de columna exactos de la base de datos
    // Mapeamos date a meeting_date para compatibilidad con el frontend
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
    
    // Ordenar por fecha de reunión (usando la columna 'date' que hemos renombrado a 'meeting_date')
    query += ' ORDER BY c.date DESC';
    
    console.log('Ejecutando consulta:', query, 'con parámetros:', params);
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

// Get individual convocatoria
app.get('/api/convocatorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT c.*, b.name as building_name, b.address as building_address, 
             b.postal_code, b.city
      FROM convocatorias c
      JOIN buildings b ON c.building_id = b.id
      WHERE c.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Convocatoria not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching convocatoria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch convocatoria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get financial summary
app.get('/api/financial-summary', async (req, res) => {
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
      params.push(buildingId as string);
    }
    
    const [incomeResult, expenseResult] = await Promise.all([
      pool.query(incomeQuery, params),
      pool.query(expenseQuery, params)
    ]);
    
    const income = parseFloat(incomeResult.rows[0]?.total || '0');
    const expenses = parseFloat(expenseResult.rows[0]?.total || '0');
    
    res.json({
      success: true,
      data: {
        income,
        expenses,
        balance: income - expenses
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get table structure (temporal para depuración)
app.get('/api/table-structure/:table', async (req, res) => {
  try {
    const { table } = req.params;
    
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

// Get actas
app.get('/api/actas', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    let query = `
      SELECT m.*, c.building_id 
      FROM minutes m
      JOIN convocatorias c ON m.convocatoria_id = c.id
    `;
    let params: any[] = [];
    
    if (buildingId) {
      query += ' WHERE c.building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY m.meeting_date DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching actas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch actas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    let query = 'SELECT * FROM transactions';
    let params: any[] = [];
    
    if (buildingId) {
      query += ' WHERE building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY transaction_date DESC LIMIT 50';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get letters
app.get('/api/letters', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    let query = 'SELECT * FROM sent_letters';
    let params: any[] = [];
    
    if (buildingId) {
      query += ' WHERE building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY sent_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
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
    
    // Get building data
    const buildingResult = await pool.query(
      'SELECT name, address, postal_code, city FROM buildings WHERE id = $1',
      [building_id]
    );
    
    if (buildingResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Building not found' });
    }
    
    const building = buildingResult.rows[0];
    
    const result = await pool.query(
      `INSERT INTO convocatorias (
        building_id, building_name, building_address, postal_code, city,
        assembly_type, date, time, location,
        second_call_enabled, second_call_date, second_call_time,
        administrator, secretary, legal_reference,
        agenda_items, assembly_number, minutes_created, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()) RETURNING *`,
      [
        building_id, building.name, building.address, building.postal_code, building.city,
        assembly_type, meeting_date, time, location,
        second_call_enabled, second_call_date, second_call_time,
        administrator, secretary, legal_reference,
        agenda_items, assembly_number, false
      ]
    );
    
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

// Update convocatoria
app.put('/api/convocatorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      sent_at, 
      recipients_data,
      meeting_date,
      time,
      location,
      agenda_items,
      delivery_methods,
      second_call_enabled,
      second_call_date,
      second_call_time
    } = req.body;
    
    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    if (status !== undefined) {
      updateFields.push(`status = $${valueIndex++}`);
      values.push(status);
    }
    if (sent_at !== undefined) {
      updateFields.push(`sent_at = $${valueIndex++}`);
      values.push(sent_at);
    }
    if (recipients_data !== undefined) {
      updateFields.push(`recipients_data = $${valueIndex++}`);
      values.push(recipients_data);
    }
    if (meeting_date !== undefined) {
      updateFields.push(`date = $${valueIndex++}`);
      values.push(meeting_date);
    }
    if (time !== undefined) {
      updateFields.push(`time = $${valueIndex++}`);
      values.push(time);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${valueIndex++}`);
      values.push(location);
    }
    if (agenda_items !== undefined) {
      updateFields.push(`agenda_items = $${valueIndex++}`);
      values.push(agenda_items);
    }
    if (delivery_methods !== undefined) {
      updateFields.push(`delivery_methods = $${valueIndex++}`);
      values.push(delivery_methods);
    }
    if (second_call_enabled !== undefined) {
      updateFields.push(`second_call_enabled = $${valueIndex++}`);
      values.push(second_call_enabled);
    }
    if (second_call_date !== undefined) {
      updateFields.push(`second_call_date = $${valueIndex++}`);
      values.push(second_call_date);
    }
    if (second_call_time !== undefined) {
      updateFields.push(`second_call_time = $${valueIndex++}`);
      values.push(second_call_time);
    }
    
    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    values.push(id);
    
    if (updateFields.length === 1) { // Only updated_at was added
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    const query = `UPDATE convocatorias SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Convocatoria not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating convocatoria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update convocatoria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete convocatoria
app.delete('/api/convocatorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM convocatorias WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Convocatoria not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting convocatoria:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete convocatoria',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create acta
app.post('/api/actas', async (req, res) => {
  try {
    const { 
      convocatoria_id, 
      minute_number,
      meeting_date, 
      meeting_time,
      end_time,
      location,
      assembly_type,
      president_name,
      secretary_name,
      conclusions = '',
      status = 'draft'
    } = req.body;
    
    // Get convocatoria and building data
    const convocatoriaResult = await pool.query(
      'SELECT c.*, b.name as building_name, b.address as building_address, b.postal_code FROM convocatorias c JOIN buildings b ON c.building_id = b.id WHERE c.id = $1',
      [convocatoria_id]
    );
    
    if (convocatoriaResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Convocatoria not found' });
    }
    
    const convocatoria = convocatoriaResult.rows[0];
    
    const result = await pool.query(
      `INSERT INTO minutes (
        convocatoria_id, minute_number, meeting_date, meeting_time, end_time,
        location, assembly_type, building_address, building_name, postal_code,
        president_name, secretary_name, conclusions, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()) RETURNING *`,
      [
        convocatoria_id, minute_number, meeting_date, meeting_time, end_time,
        location, assembly_type, convocatoria.building_address, convocatoria.building_name, convocatoria.postal_code,
        president_name, secretary_name, conclusions, status
      ]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating acta:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create acta',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get individual acta
app.get('/api/actas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT m.*, c.building_id 
      FROM minutes m
      JOIN convocatorias c ON m.convocatoria_id = c.id
      WHERE m.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Acta not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching acta:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch acta',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update acta
app.put('/api/actas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      meeting_date, 
      meeting_time,
      end_time,
      location,
      president_name,
      secretary_name,
      conclusions,
      status 
    } = req.body;
    
    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    if (meeting_date !== undefined) {
      updateFields.push(`meeting_date = $${valueIndex++}`);
      values.push(meeting_date);
    }
    if (meeting_time !== undefined) {
      updateFields.push(`meeting_time = $${valueIndex++}`);
      values.push(meeting_time);
    }
    if (end_time !== undefined) {
      updateFields.push(`end_time = $${valueIndex++}`);
      values.push(end_time);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${valueIndex++}`);
      values.push(location);
    }
    if (president_name !== undefined) {
      updateFields.push(`president_name = $${valueIndex++}`);
      values.push(president_name);
    }
    if (secretary_name !== undefined) {
      updateFields.push(`secretary_name = $${valueIndex++}`);
      values.push(secretary_name);
    }
    if (conclusions !== undefined) {
      updateFields.push(`conclusions = $${valueIndex++}`);
      values.push(conclusions);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${valueIndex++}`);
      values.push(status);
    }
    
    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    values.push(id);
    
    if (updateFields.length === 1) { // Only updated_at was added
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    const query = `UPDATE minutes SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Acta not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating acta:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update acta',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete acta
app.delete('/api/actas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM minutes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Acta not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting acta:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete acta',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get individual member
app.get('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create member
app.post('/api/members', async (req, res) => {
  try {
    const { building_id, name, email, phone, apartment, fraction, votes, new_monthly_fee, new_annual_fee } = req.body;
    
    const result = await pool.query(
      'INSERT INTO members (building_id, name, email, phone, apartment, fraction, votes, new_monthly_fee, new_annual_fee, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *',
      [building_id, name, email, phone, apartment, fraction, votes, new_monthly_fee, new_annual_fee]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update member
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { building_id, name, email, phone, apartment, fraction, votes, new_monthly_fee, new_annual_fee } = req.body;
    
    const result = await pool.query(
      'UPDATE members SET building_id = $1, name = $2, email = $3, phone = $4, apartment = $5, fraction = $6, votes = $7, new_monthly_fee = $8, new_annual_fee = $9, updated_at = NOW() WHERE id = $10 RETURNING *',
      [building_id, name, email, phone, apartment, fraction, votes, new_monthly_fee, new_annual_fee, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete member
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete member',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get individual building
app.get('/api/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM buildings WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Building not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch building',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create building
app.post('/api/buildings', async (req, res) => {
  try {
    const { name, address, postal_code, city, number_of_units, administrator, iban } = req.body;
    
    const result = await pool.query(
      'INSERT INTO buildings (name, address, postal_code, city, number_of_units, administrator, iban, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *',
      [name, address, postal_code, city, number_of_units, administrator, iban]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating building:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create building',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update building
app.put('/api/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, postal_code, city, number_of_units, administrator, iban } = req.body;
    
    const result = await pool.query(
      'UPDATE buildings SET name = $1, address = $2, postal_code = $3, city = $4, number_of_units = $5, administrator = $6, iban = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [name, address, postal_code, city, number_of_units, administrator, iban, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Building not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating building:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update building',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete building
app.delete('/api/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM buildings WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Building not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete building',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { 
      building_id, 
      amount, 
      description, 
      transaction_type = 'expense',
      transaction_date,
      payment_method = null,
      reference_number = null,
      notes = null,
      year = new Date().getFullYear()
    } = req.body;
    
    const result = await pool.query(
      'INSERT INTO transactions (building_id, amount, description, transaction_type, transaction_date, payment_method, reference_number, notes, year, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *',
      [building_id, amount, description, transaction_type, transaction_date, payment_method, reference_number, notes, year]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get individual transaction
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      description, 
      transaction_type,
      transaction_date,
      payment_method,
      reference_number,
      notes
    } = req.body;
    
    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    if (amount !== undefined) {
      updateFields.push(`amount = $${valueIndex++}`);
      values.push(amount);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex++}`);
      values.push(description);
    }
    if (transaction_type !== undefined) {
      updateFields.push(`transaction_type = $${valueIndex++}`);
      values.push(transaction_type);
    }
    if (transaction_date !== undefined) {
      updateFields.push(`transaction_date = $${valueIndex++}`);
      values.push(transaction_date);
    }
    if (payment_method !== undefined) {
      updateFields.push(`payment_method = $${valueIndex++}`);
      values.push(payment_method);
    }
    if (reference_number !== undefined) {
      updateFields.push(`reference_number = $${valueIndex++}`);
      values.push(reference_number);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${valueIndex++}`);
      values.push(notes);
    }
    
    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    values.push(id);
    
    if (updateFields.length === 1) { // Only updated_at was added
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    const query = `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reports endpoints
app.get('/api/reports/financial', async (req, res) => {
  try {
    const { buildingId, period = 'year' } = req.query;
    const currentYear = new Date().getFullYear();
    
    // Generate monthly data for the current year
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const startDate = `${currentYear}-${month.toString().padStart(2, '0')}-01`;
      const endDate = month === 12 ? 
        `${currentYear + 1}-01-01` : 
        `${currentYear}-${(month + 1).toString().padStart(2, '0')}-01`;
      
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
      
      let params = [startDate, endDate];
      
      if (buildingId) {
        incomeQuery += ' AND building_id = $3';
        expenseQuery += ' AND building_id = $3';
        params.push(buildingId as string);
      }
      
      const [incomeResult, expenseResult] = await Promise.all([
        pool.query(incomeQuery, params),
        pool.query(expenseQuery, params)
      ]);
      
      const income = parseFloat(incomeResult.rows[0]?.total || '0');
      const expenses = parseFloat(expenseResult.rows[0]?.total || '0');
      
      monthlyData.push({
        mes: new Date(currentYear, month - 1).toLocaleDateString('pt-PT', { month: 'short' }),
        ingresos: income,
        gastos: expenses,
        balance: income - expenses
      });
    }
    
    res.json({ success: true, data: { monthlyData } });
  } catch (error) {
    console.error('Error fetching financial report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/reports/occupancy', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    let query = `
      SELECT 
        b.name as edificio,
        COUNT(m.id) as ocupados,
        b.number_of_units as total
      FROM buildings b
      LEFT JOIN members m ON b.id = m.building_id
    `;
    
    let params: any[] = [];
    
    if (buildingId) {
      query += ' WHERE b.id = $1';
      params.push(buildingId);
    }
    
    query += ' GROUP BY b.id, b.name, b.number_of_units ORDER BY b.name';
    
    const result = await pool.query(query, params);
    
    const occupancyData = result.rows.map(row => ({
      edificio: row.edificio,
      ocupados: Math.round((row.ocupados / (row.total || 100)) * 100),
      total: 100
    }));
    
    res.json({ success: true, data: { occupancyData } });
  } catch (error) {
    console.error('Error fetching occupancy report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch occupancy report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Maintenance endpoints
app.get('/api/maintenance/tasks', async (req, res) => {
  try {
    const { buildingId, status, priority } = req.query;
    
    // For now, return mock data since we don't have maintenance tables yet
    const mockTasks = [
      {
        id: 1,
        title: 'Revisão anual do elevador',
        description: 'Inspeção técnica obrigatória do elevador principal',
        building: 'Edificio A',
        category: 'elevador',
        priority: 'high',
        status: 'pending',
        assignedTo: 'TecnoElevadores Lda.',
        dueDate: '2024-12-20',
        estimatedCost: 450,
        progress: 0
      },
      {
        id: 2,
        title: 'Limpeza dos esgotos',
        description: 'Desentupimento e limpeza da rede de esgotos',
        building: 'Edificio B',
        category: 'fontaneria',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'Fontaneiros Porto',
        dueDate: '2024-12-15',
        estimatedCost: 280,
        progress: 65
      }
    ];
    
    let filteredTasks = mockTasks;
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    res.json({ success: true, data: filteredTasks });
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/maintenance/providers', async (req, res) => {
  try {
    // Return mock providers data
    const mockProviders = [
      {
        id: 1,
        name: 'TecnoElevadores Lda.',
        category: 'Elevadores',
        phone: '+351 220 123 456',
        email: 'info@tecnoelevadores.pt',
        rating: 4.8,
        activeContracts: 2
      },
      {
        id: 2,
        name: 'Fontaneiros Porto',
        category: 'Fontanería',
        phone: '+351 220 654 321',
        email: 'contacto@fontaneiros.pt',
        rating: 4.5,
        activeContracts: 1
      },
      {
        id: 3,
        name: 'Climaconfort',
        category: 'Climatização',
        phone: '+351 220 987 654',
        email: 'servicos@climaconfort.pt',
        rating: 4.7,
        activeContracts: 1
      }
    ];
    
    res.json({ success: true, data: mockProviders });
  } catch (error) {
    console.error('Error fetching maintenance providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance providers',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/maintenance/alerts', async (req, res) => {
  try {
    // Return mock predictive alerts
    const mockAlerts = [
      {
        id: 1,
        type: 'preventivo',
        title: 'Revisão de elevador aproxima-se',
        description: 'O elevador do Edificio A necessita de revisão em 15 dias',
        urgency: 'medium',
        estimatedDate: '2024-12-30',
        category: 'elevador'
      },
      {
        id: 2,
        type: 'alerta',
        title: 'Consumo elétrico elevado',
        description: 'Aumento de 15% no consumo do Edificio B',
        urgency: 'high',
        estimatedDate: '2024-12-16',
        category: 'eletricidad'
      }
    ];
    
    res.json({ success: true, data: mockAlerts });
  } catch (error) {
    console.error('Error fetching maintenance alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/maintenance/tasks', async (req, res) => {
  try {
    const { title, description, building_id, category, priority, due_date, estimated_cost } = req.body;
    
    // For now, return a mock response since we don't have the maintenance table
    const mockTask = {
      id: Date.now(),
      title,
      description,
      building_id,
      category,
      priority,
      status: 'pending',
      due_date,
      estimated_cost,
      progress: 0,
      created_at: new Date().toISOString()
    };
    
    res.json({ success: true, data: mockTask });
  } catch (error) {
    console.error('Error creating maintenance task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create maintenance task',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard stats endpoints
app.get('/api/dashboard/stats/:buildingId', async (req, res) => {
  try {
    const { buildingId } = req.params;
    const currentYear = new Date().getFullYear();
    
    // Get total members
    const membersResult = await pool.query(
      'SELECT COUNT(*) as total FROM members WHERE building_id = $1 AND is_active = true',
      [buildingId]
    );
    
    // Get next meeting date from convocatorias
    const nextMeetingResult = await pool.query(
      'SELECT date as meeting_date, time, assembly_type FROM convocatorias WHERE building_id = $1 AND date >= CURRENT_DATE ORDER BY date ASC LIMIT 1',
      [buildingId]
    );
    
    // Calculate budget from annual transactions
    const budgetResult = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expenses
      FROM transactions 
      WHERE building_id = $1 AND EXTRACT(YEAR FROM transaction_date) = $2`,
      [buildingId, currentYear]
    );
    
    // Get pending payments (members with arrears - simplified calculation)
    const pendingPaymentsResult = await pool.query(
      `SELECT COUNT(*) as pending
      FROM members m
      WHERE m.building_id = $1 
      AND m.is_active = true
      AND (
        SELECT COUNT(*) 
        FROM transactions t 
        WHERE t.member_id = m.id 
        AND t.transaction_type = 'income'
        AND EXTRACT(YEAR FROM t.transaction_date) = $2
      ) = 0`,
      [buildingId, currentYear]
    );
    
    // Get completed tasks from minutes (join with convocatorias to get building_id)
    const completedTasksResult = await pool.query(
      `SELECT COUNT(*) as completed 
       FROM minutes m 
       JOIN convocatorias c ON m.convocatoria_id = c.id 
       WHERE c.building_id = $1 AND m.status = $2 AND EXTRACT(YEAR FROM m.meeting_date) = $3`,
      [buildingId, 'approved', currentYear]
    );
    
    // Calculate occupancy rate
    const buildingResult = await pool.query(
      'SELECT number_of_units FROM buildings WHERE id = $1',
      [buildingId]
    );
    
    const totalMembers = parseInt(membersResult.rows[0]?.total || '0');
    const totalUnits = parseInt(buildingResult.rows[0]?.number_of_units || '0');
    const occupancyRate = totalUnits > 0 ? Math.round((totalMembers / totalUnits) * 100) : 0;
    
    // Calculate maintenance score (based on completed vs total minutes)
    const totalMinutesResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM minutes m 
       JOIN convocatorias c ON m.convocatoria_id = c.id 
       WHERE c.building_id = $1 AND EXTRACT(YEAR FROM m.meeting_date) = $2`,
      [buildingId, currentYear]
    );
    
    const totalMinutes = parseInt(totalMinutesResult.rows[0]?.total || '0');
    const completedTasks = parseInt(completedTasksResult.rows[0]?.completed || '0');
    const maintenanceScore = totalMinutes > 0 ? Math.round((completedTasks / totalMinutes) * 100) : 95;
    
    const income = parseFloat(budgetResult.rows[0]?.income || '0');
    const expenses = parseFloat(budgetResult.rows[0]?.expenses || '0');
    const balance = income - expenses;
    
    const stats = {
      totalOwners: totalMembers,
      nextMeeting: nextMeetingResult.rows[0] ? {
        date: nextMeetingResult.rows[0].meeting_date,
        time: nextMeetingResult.rows[0].time,
        type: nextMeetingResult.rows[0].assembly_type
      } : null,
      budget: income || 50000, // Default budget if no income recorded
      expenses,
      income,
      balance,
      pendingPayments: parseInt(pendingPaymentsResult.rows[0]?.pending || '0'),
      completedTasks,
      occupancyRate,
      maintenanceScore
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard recent activities
app.get('/api/dashboard/recent-activities/:buildingId', async (req, res) => {
  try {
    const { buildingId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent activities from different tables
    const recentActivities = [];
    
    // Recent convocatorias
    const convocatoriasResult = await pool.query(
      `SELECT 'convocatoria' as type, 'Nova convocatória criada' as title, 
      CONCAT(assembly_type, ' - ', TO_CHAR(date, 'DD/MM/YYYY')) as description,
      created_at, 'info' as status
      FROM convocatorias 
      WHERE building_id = $1 
      ORDER BY created_at DESC LIMIT 3`,
      [buildingId]
    );
    
    // Recent minutes (join with convocatorias to get building_id)
    const minutesResult = await pool.query(
      `SELECT 'minute' as type, 'Nova acta registada' as title,
      CONCAT('Assembleia ', TO_CHAR(m.meeting_date, 'DD/MM/YYYY')) as description,
      m.created_at, 
      CASE WHEN m.status = 'approved' THEN 'success' ELSE 'warning' END as status
      FROM minutes m
      JOIN convocatorias c ON m.convocatoria_id = c.id
      WHERE c.building_id = $1 
      ORDER BY m.created_at DESC LIMIT 3`,
      [buildingId]
    );
    
    // Recent transactions
    const transactionsResult = await pool.query(
      `SELECT 'payment' as type, 
      CASE WHEN amount > 0 THEN 'Pagamento recebido' ELSE 'Despesa registada' END as title,
      CONCAT(description, ' - €', ABS(amount)) as description,
      created_at,
      CASE WHEN amount > 0 THEN 'success' ELSE 'warning' END as status
      FROM transactions 
      WHERE building_id = $1 
      ORDER BY created_at DESC LIMIT 3`,
      [buildingId]
    );
    
    // Combine and sort all activities
    const allActivities = [
      ...convocatoriasResult.rows,
      ...minutesResult.rows,
      ...transactionsResult.rows
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, limit)
     .map((activity, index) => ({
       id: index + 1,
       type: activity.type,
       title: activity.title,
       description: activity.description,
       time: new Date(activity.created_at).toLocaleDateString('pt-PT', {
         day: '2-digit',
         month: 'short',
         hour: '2-digit',
         minute: '2-digit'
       }),
       status: activity.status
     }));
    
    res.json({ success: true, data: allActivities });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard next meeting
app.get('/api/dashboard/next-meeting/:buildingId', async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id,
        assembly_type,
        date as meeting_date,
        time,
        location,
        second_call_enabled,
        second_call_date,
        second_call_time
      FROM convocatorias 
      WHERE building_id = $1 
      AND date >= CURRENT_DATE 
      ORDER BY date ASC 
      LIMIT 1`,
      [buildingId]
    );
    
    const nextMeeting = result.rows[0] || null;
    
    res.json({ success: true, data: nextMeeting });
  } catch (error) {
    console.error('Error fetching next meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch next meeting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Documents stats
app.get('/api/documents/stats/:buildingId', async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    // Since documents table might be empty, return structure for future implementation
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_documents,
        COALESCE(SUM(file_size), 0) as total_size
      FROM documents 
      WHERE building_id = $1`,
      [buildingId]
    );
    
    // Get categories count
    const categoriesResult = await pool.query(
      `SELECT 
        category,
        COUNT(*) as count
      FROM documents 
      WHERE building_id = $1 
      GROUP BY category 
      ORDER BY count DESC`,
      [buildingId]
    );
    
    const totalSize = parseInt(result.rows[0]?.total_size || '0');
    const sizeFormatted = totalSize > 1024 * 1024 ? 
      `${(totalSize / (1024 * 1024)).toFixed(1)} MB` :
      totalSize > 1024 ? 
      `${(totalSize / 1024).toFixed(1)} KB` :
      `${totalSize} B`;
    
    const stats = {
      total: parseInt(result.rows[0]?.total_documents || '0'),
      recent: parseInt(result.rows[0]?.recent_documents || '0'),
      size: sizeFormatted,
      categories: categoriesResult.rows.map(row => ({
        name: row.category,
        count: parseInt(row.count),
        color: getCategoryColor(row.category)
      }))
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function for category colors
function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'financeiro': '#10b981',
    'legal': '#3b82f6',
    'manutencao': '#f59e0b',
    'reunioes': '#8b5cf6',
    'seguros': '#ef4444',
    'correspondencia': '#06b6d4',
    'planos': '#84cc16',
    'geral': '#6b7280'
  };
  return colors[category.toLowerCase()] || '#6b7280';
}

// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    let query = 'SELECT * FROM documents';
    let params: any[] = [];
    
    if (buildingId) {
      query += ' WHERE building_id = $1';
      params.push(buildingId);
    }
    
    query += ' ORDER BY uploaded_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get individual document
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create document with real file upload
app.post('/api/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { 
      building_id,
      name,
      category = 'geral',
      subcategory = null,
      description = null,
      visibility = 'private',
      is_confidential = false,
      access_level = 'member',
      uploaded_by = 'Utilizador Atual'
    } = req.body;

    let finalFilePath = req.file.path;
    let finalFileSize = req.file.size;

    // Compress images if they are large
    if (req.file.mimetype.startsWith('image/')) {
      const compressedPath = req.file.path.replace(/\.[^/.]+$/, '_compressed.jpg');
      const compressed = await compressImage(req.file.path, compressedPath);
      finalFilePath = compressed.path;
      finalFileSize = compressed.size;
    }
    // Compress PDFs if they are large
    else if (req.file.mimetype === 'application/pdf') {
      const compressedPath = req.file.path.replace(/\.pdf$/, '_compressed.pdf');
      const compressed = await compressPDF(req.file.path, compressedPath);
      finalFilePath = compressed.path;
      finalFileSize = compressed.size;
    }

    // Convert absolute path to relative path for URL serving
    const relativePath = finalFilePath.replace(process.cwd(), '').replace(/\\/g, '/');

    const result = await pool.query(
      `INSERT INTO documents (
        building_id, name, original_name, file_path, file_size, mime_type, 
        file_extension, category, subcategory, description, version, 
        is_current_version, visibility, is_confidential, access_level, 
        uploaded_by, uploaded_at, download_count, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, true, $11, $12, $13, $14, NOW(), 0, NOW(), NOW()) RETURNING *`,
      [
        building_id, 
        name, 
        req.file.originalname, 
        relativePath, 
        finalFileSize, 
        req.file.mimetype,
        path.extname(req.file.originalname).substring(1), 
        category, 
        subcategory, 
        description,
        visibility, 
        is_confidential === 'true', 
        access_level, 
        uploaded_by
      ]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating document:', error);
    
    // Clean up uploaded file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update document
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name,
      category,
      subcategory,
      description,
      visibility,
      is_confidential,
      access_level
    } = req.body;
    
    // Build dynamic query based on provided fields
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${valueIndex++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${valueIndex++}`);
      values.push(category);
    }
    if (subcategory !== undefined) {
      updateFields.push(`subcategory = $${valueIndex++}`);
      values.push(subcategory);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${valueIndex++}`);
      values.push(description);
    }
    if (visibility !== undefined) {
      updateFields.push(`visibility = $${valueIndex++}`);
      values.push(visibility);
    }
    if (is_confidential !== undefined) {
      updateFields.push(`is_confidential = $${valueIndex++}`);
      values.push(is_confidential);
    }
    if (access_level !== undefined) {
      updateFields.push(`access_level = $${valueIndex++}`);
      values.push(access_level);
    }
    
    // Always update updated_at
    updateFields.push(`updated_at = NOW()`);
    values.push(id);
    
    if (updateFields.length === 1) { // Only updated_at was added
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    const query = `UPDATE documents SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get member statistics and related data
app.get('/api/members/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get member basic info
    const memberResult = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    const member = memberResult.rows[0];
    
    // Get related transactions
    const transactionsResult = await pool.query(`
      SELECT * FROM transactions 
      WHERE building_id = $1 
      AND (description ILIKE $2 OR description ILIKE $3)
      ORDER BY transaction_date DESC
    `, [member.building_id, `%${member.name}%`, `%${member.apartment}%`]);
    
    // Get related documents
    const documentsResult = await pool.query(`
      SELECT * FROM documents 
      WHERE building_id = $1 
      AND (name ILIKE $2 OR description ILIKE $2)
      ORDER BY uploaded_at DESC
    `, [member.building_id, `%${member.name}%`]);
    
    // Calculate financial summary
    const transactions = transactionsResult.rows;
    const totalPaid = transactions
      .filter(tx => tx.transaction_type === 'income')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalDue = transactions
      .filter(tx => tx.transaction_type === 'expense')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const currentBalance = totalPaid - totalDue;
    
    res.json({
      success: true,
      data: {
        member,
        transactions: transactionsResult.rows,
        documents: documentsResult.rows,
        financialSummary: {
          totalPaid,
          totalDue,
          currentBalance,
          monthlyFee: parseFloat(member.new_monthly_fee || '0'),
          annualFee: parseFloat(member.new_annual_fee || '0')
        },
        statistics: {
          totalTransactions: transactions.length,
          totalDocuments: documentsResult.rows.length,
          lastActivity: transactions.length > 0 ? transactions[0].transaction_date : member.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404 handler - must be last
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ 
      success: false, 
      error: 'API endpoint not found',
      path: req.path 
    });
  } else {
    res.status(404).json({ 
      success: false, 
      error: 'Route not found', 
      message: 'This is the API server. Frontend should be served separately.' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
