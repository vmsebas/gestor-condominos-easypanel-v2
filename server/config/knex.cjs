const knex = require('knex');
const knexConfig = require('../../knexfile.cjs');

// Determinar el entorno
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Crear instancia de Knex
const db = knex(config);

// Verificar conexión
const testConnection = async () => {
  try {
    const result = await db.raw('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Knex connected successfully');
    console.log('Current time:', result.rows[0].current_time);
    console.log('Database version:', result.rows[0].db_version.substring(0, 50) + '...');
    
    // Verificar tablas disponibles
    const tablesResult = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Available tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    
    return true;
  } catch (error) {
    console.error('❌ Knex connection failed:', error.message);
    return false;
  }
};

// Funciones helper para transacciones
const transaction = async (callback) => {
  return db.transaction(callback);
};

module.exports = {
  db,
  testConnection,
  transaction
};