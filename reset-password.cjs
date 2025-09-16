const knex = require('knex');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['public'],
  pool: {
    min: 2,
    max: 10
  }
});

async function resetPassword(email, newPassword) {
  try {
    // Verificar que el usuario existe
    const user = await db('users').where('email', email).first();
    
    if (!user) {
      console.error(`❌ Usuario con email ${email} no encontrado`);
      return;
    }
    
    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await db('users')
      .where('id', user.id)
      .update({
        password_hash: hashedPassword,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date()
      });
    
    console.log(`✅ Contraseña actualizada exitosamente para ${email}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Nueva contraseña: ${newPassword}`);
    console.log(`🏢 Edificio: ${user.building_id}`);
    console.log(`👤 Rol: ${user.role}`);
    
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
  } finally {
    await db.destroy();
  }
}

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('Uso: node reset-password.cjs <email> <nueva-contraseña>');
  console.log('Ejemplo: node reset-password.cjs admin@example.com Password123');
  process.exit(1);
}

const [email, password] = args;
resetPassword(email, password);