const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a la base de datos
// IMPORTANTE: Solo usar base de datos local
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ No database connection string found in environment variables!');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

// Detectar si se requiere SSL basándose en la URL de conexión
const requiresSSL = connectionString.includes('sslmode=require');

// Pool de conexiones reutilizable
const pool = new Pool({
  connectionString: connectionString,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false, // SSL automático para Neon, sin SSL para local
  max: 20, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 5000, // tiempo máximo para establecer conexión
});

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle database client:', err);
});

// Función para verificar la conexión
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connected successfully');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].db_version.substring(0, 50) + '...');
    
    // Verificar tablas disponibles
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Available tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};