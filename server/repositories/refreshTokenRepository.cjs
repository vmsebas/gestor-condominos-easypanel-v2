const BaseRepository = require('./baseRepository.cjs');
const { generateSecureToken } = require('../utils/auth.cjs');

/**
 * Repositorio para la entidad RefreshToken
 */
class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super('refresh_tokens');
  }

  /**
   * Crea un nuevo refresh token
   */
  async createToken(userId, deviceInfo = {}) {
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    
    const tokenData = {
      token,
      user_id: userId,
      expires_at: expiresAt,
      device_id: deviceInfo.deviceId,
      device_name: deviceInfo.deviceName,
      ip_address: deviceInfo.ipAddress,
      user_agent: deviceInfo.userAgent
    };
    
    await this.create(tokenData);
    
    return {
      token,
      expiresAt
    };
  }

  /**
   * Encuentra un token válido
   */
  async findValidToken(token) {
    const result = await this.db('refresh_tokens')
      .where('token', token)
      .where('expires_at', '>', new Date())
      .where('is_revoked', false)
      .first();
    
    return result || null;
  }

  /**
   * Revoca un token
   */
  async revokeToken(token) {
    return this.db('refresh_tokens')
      .where('token', token)
      .update({
        is_revoked: true,
        revoked_at: new Date()
      });
  }

  /**
   * Revoca todos los tokens de un usuario
   */
  async revokeAllUserTokens(userId) {
    return this.db('refresh_tokens')
      .where('user_id', userId)
      .where('is_revoked', false)
      .update({
        is_revoked: true,
        revoked_at: new Date()
      });
  }

  /**
   * Revoca tokens de un dispositivo específico
   */
  async revokeDeviceTokens(userId, deviceId) {
    return this.db('refresh_tokens')
      .where('user_id', userId)
      .where('device_id', deviceId)
      .where('is_revoked', false)
      .update({
        is_revoked: true,
        revoked_at: new Date()
      });
  }

  /**
   * Limpia tokens expirados
   */
  async cleanupExpiredTokens() {
    return this.db('refresh_tokens')
      .where('expires_at', '<', new Date())
      .delete();
  }

  /**
   * Obtiene tokens activos de un usuario
   */
  async getActiveUserTokens(userId) {
    return this.db('refresh_tokens')
      .where('user_id', userId)
      .where('expires_at', '>', new Date())
      .where('is_revoked', false)
      .orderBy('created_at', 'desc');
  }

  /**
   * Cuenta tokens activos de un usuario
   */
  async countActiveTokens(userId) {
    const result = await this.db('refresh_tokens')
      .where('user_id', userId)
      .where('expires_at', '>', new Date())
      .where('is_revoked', false)
      .count('* as count');
    
    return parseInt(result[0].count);
  }

  /**
   * Verifica si un token pertenece a un usuario
   */
  async tokenBelongsToUser(token, userId) {
    const tokenData = await this.findValidToken(token);
    return tokenData && tokenData.user_id === userId;
  }
}

module.exports = new RefreshTokenRepository();