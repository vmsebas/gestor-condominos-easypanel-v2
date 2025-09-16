const knex = require('knex');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['public'],
  pool: {
    min: 2,
    max: 10
  }
});

async function checkUsersSchema() {
  try {
    console.log('=== VERIFICANDO ESQUEMA DE TABLA USERS ===\n');
    
    // Obtener información de columnas
    const columns = await db('information_schema.columns')
      .where('table_name', 'users')
      .select('column_name', 'data_type', 'is_nullable', 'column_default');
    
    console.log('Columnas en tabla users:');
    console.table(columns);
    
    // Verificar usuarios existentes
    console.log('\n=== USUARIOS EXISTENTES ===');
    const users = await db('users').select('*');
    console.table(users);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await db.destroy();
  }
}

checkUsersSchema();