const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function createTestUser() {
  try {
    // Generar hash de la contraseña
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Verificar si el usuario ya existe
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['test@admin.com']
    );
    
    if (checkUser.rows.length > 0) {
      // Actualizar contraseña del usuario existente
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, 'test@admin.com']
      );
      console.log('✅ Usuario actualizado:');
    } else {
      // Crear nuevo usuario
      const buildingResult = await pool.query('SELECT id FROM buildings LIMIT 1');
      const buildingId = buildingResult.rows[0]?.id || null;
      
      await pool.query(
        `INSERT INTO users (email, password_hash, name, role, building_id, is_active, email_verified, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        ['test@admin.com', hashedPassword, 'Usuario Test', 'super_admin', buildingId, true, true]
      );
      console.log('✅ Usuario creado:');
    }
    
    console.log('📧 Email: test@admin.com');
    console.log('🔑 Contraseña: admin123');
    console.log('👤 Rol: super_admin');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

createTestUser();