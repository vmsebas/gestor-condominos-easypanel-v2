const { db } = require('./server/config/knex.cjs');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    // Hashear la nueva contraseña
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar el usuario admin@example.com
    const result = await db('users')
      .where('email', 'admin@example.com')
      .update({
        password_hash: hashedPassword,
        failed_login_attempts: 0,
        locked_until: null
      });
    
    if (result) {
      console.log('✅ Palavra-passe atualizada com sucesso para admin@example.com');
      console.log('Nova palavra-passe: admin123');
    } else {
      console.log('❌ Utilizador não encontrado');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();