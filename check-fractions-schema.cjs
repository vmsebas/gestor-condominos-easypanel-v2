const { db: knex } = require('./server/config/knex.cjs');

async function checkFractionsSchema() {
  try {
    console.log('🔍 Verificando esquema de la tabla fractions...\n');
    
    // Obtener información de las columnas de la tabla fractions
    const result = await knex.raw(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'fractions'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ La tabla fractions no existe o no tiene columnas');
    } else {
      console.log('📋 Columnas de la tabla fractions:');
      console.log('--------------------------------');
      result.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkFractionsSchema();