const BaseRepository = require('./baseRepository.cjs');
const { hashPassword } = require('../utils/auth.cjs');

/**
 * Repositorio para la entidad User
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Encuentra un usuario por email
   */
  async findByEmail(email) {
    const result = await this.db('users')
      .where('email', email.toLowerCase())
      .whereNull('deleted_at')
      .first();
    
    return result || null;
  }

  /**
   * Crea un nuevo usuario con contraseña hasheada
   */
  async createUser(userData) {
    const { password, ...data } = userData;
    
    // Hashear contraseña
    const password_hash = await hashPassword(password);
    
    // Crear usuario
    return this.create({
      ...data,
      email: data.email.toLowerCase(),
      password_hash
    });
  }

  /**
   * Actualiza la última fecha de login
   */
  async updateLastLogin(userId) {
    return this.db('users')
      .where('id', userId)
      .update({ last_login_at: new Date() });
  }

  /**
   * Incrementa los intentos fallidos de login
   */
  async incrementFailedAttempts(userId) {
    const user = await this.findById(userId);
    const attempts = (user.failed_login_attempts || 0) + 1;
    
    // Bloquear después de 5 intentos fallidos
    const updates = {
      failed_login_attempts: attempts
    };
    
    if (attempts >= 5) {
      // Bloquear por 30 minutos
      updates.locked_until = new Date(Date.now() + 30 * 60 * 1000);
    }
    
    return this.update(userId, updates);
  }

  /**
   * Resetea los intentos fallidos de login
   */
  async resetFailedAttempts(userId) {
    return this.update(userId, {
      failed_login_attempts: 0,
      locked_until: null
    });
  }

  /**
   * Busca usuarios por edificio
   */
  async findByBuilding(buildingId, options = {}) {
    let query = this.db('users')
      .where('building_id', buildingId)
      .whereNull('deleted_at');
    
    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }
    
    if (options.role) {
      query = query.where('role', options.role);
    }
    
    return query.orderBy('name');
  }

  /**
   * Verifica el email del usuario
   */
  async verifyEmail(userId) {
    return this.update(userId, {
      email_verified: true,
      email_verified_at: new Date()
    });
  }

  /**
   * Establece token de reset de contraseña
   */
  async setResetPasswordToken(userId, token) {
    return this.update(userId, {
      reset_password_token: token,
      reset_password_expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    });
  }

  /**
   * Encuentra usuario por token de reset
   */
  async findByResetToken(token) {
    const result = await this.db('users')
      .where('reset_password_token', token)
      .where('reset_password_expires', '>', new Date())
      .whereNull('deleted_at')
      .first();
    
    return result || null;
  }

  /**
   * Actualiza la contraseña del usuario
   */
  async updatePassword(userId, newPassword) {
    const password_hash = await hashPassword(newPassword);
    
    return this.update(userId, {
      password_hash,
      reset_password_token: null,
      reset_password_expires: null
    });
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  async getStats() {
    const result = await this.db('users')
      .select(
        this.db.raw('COUNT(*) as total'),
        this.db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active'),
        this.db.raw('COUNT(CASE WHEN email_verified = true THEN 1 END) as verified'),
        this.db.raw('COUNT(CASE WHEN role = \'super_admin\' THEN 1 END) as super_admins'),
        this.db.raw('COUNT(CASE WHEN role = \'admin\' THEN 1 END) as admins'),
        this.db.raw('COUNT(CASE WHEN role = \'manager\' THEN 1 END) as managers'),
        this.db.raw('COUNT(CASE WHEN role = \'member\' THEN 1 END) as members')
      )
      .whereNull('deleted_at')
      .first();
    
    return result;
  }
}

module.exports = new UserRepository();