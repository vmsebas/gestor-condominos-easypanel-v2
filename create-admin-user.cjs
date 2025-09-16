const { pool } = require('./server/config/database.cjs');
const bcryptjs = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔄 Creando usuario admin temporal...');
    
    // Obtener el primer building
    const buildingResult = await pool.query('SELECT id FROM buildings LIMIT 1');
    const buildingId = buildingResult.rows[0]?.id;
    
    if (!buildingId) {
      console.error('❌ No se encontró ningún building');
      return;
    }
    
    console.log('🏢 Building ID encontrado:', buildingId);
    
    // Crear hash de password
    const passwordHash = await bcryptjs.hash('admin123', 10);
    
    // Verificar si ya existe el usuario
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@condomino.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('🔄 Actualizando usuario existente...');
      await pool.query(`
        UPDATE users SET 
          password_hash = $1,
          building_id = $2,
          role = 'admin',
          is_active = true,
          email_verified = true,
          updated_at = CURRENT_TIMESTAMP
        WHERE email = 'admin@condomino.com'
      `, [passwordHash, buildingId]);
    } else {
      console.log('➕ Creando nuevo usuario admin...');
      await pool.query(`
        INSERT INTO users (
          email, password_hash, name, role, building_id,
          is_active, email_verified, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        'admin@condomino.com',
        passwordHash,
        'Admin Usuario',
        'admin',
        buildingId,
        true,
        true
      ]);
    }
    
    console.log('✅ Usuario admin creado/actualizado exitosamente!');
    console.log('📧 Email: admin@condomino.com');
    console.log('🔑 Password: admin123');
    console.log('🏢 Building ID:', buildingId);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
