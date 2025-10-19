const userRepository = require('../repositories/userRepository.cjs');
const refreshTokenRepository = require('../repositories/refreshTokenRepository.cjs');
const { 
  verifyPassword, 
  generateToken, 
  generateRefreshToken,
  generateSecureToken 
} = require('../utils/auth.cjs');
const { AppError } = require('../utils/errors.cjs');

/**
 * Servicio de autenticación
 */
class AuthService {
  /**
   * Login de usuario
   */
  async login(email, password, deviceInfo = {}) {
    // Buscar usuario
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Credenciais inválidas', 401, null);
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw new AppError(`Conta bloqueada. Tente novamente em ${remainingMinutes} minutos`, 403, null);
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      // Incrementar intentos fallidos
      await userRepository.incrementFailedAttempts(user.id);
      throw new AppError('Credenciais inválidas', 401, null);
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      throw new AppError('Utilizador inativo', 403, null);
    }

    // Resetear intentos fallidos y actualizar último login
    await Promise.all([
      userRepository.resetFailedAttempts(user.id),
      userRepository.updateLastLogin(user.id)
    ]);

    // Generar tokens
    const accessToken = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

    const refreshTokenData = await refreshTokenRepository.createToken(user.id, deviceInfo);

    // Retornar datos del usuario sin información sensible
    const { password_hash, reset_password_token, ...userData } = user;

    return {
      user: userData,
      accessToken,
      refreshToken: refreshTokenData.token,
      expiresAt: refreshTokenData.expiresAt
    };
  }

  /**
   * Registro de nuevo usuario
   */
  async register(userData) {
    // Verificar si el email ya existe
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('O email já está registado', 409, null);
    }

    // Crear usuario
    const user = await userRepository.createUser({
      ...userData,
      role: userData.role || 'member',
      is_active: true
    });

    // Generar tokens
    const accessToken = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

    const refreshTokenData = await refreshTokenRepository.createToken(user.id);

    // Retornar datos del usuario sin información sensible
    const { password_hash, ...safeUserData } = user;

    return {
      user: safeUserData,
      accessToken,
      refreshToken: refreshTokenData.token,
      expiresAt: refreshTokenData.expiresAt
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    // Verificar refresh token
    const tokenData = await refreshTokenRepository.findValidToken(refreshToken);
    if (!tokenData) {
      throw new AppError('Refresh token inválido ou expirado', 401, null);
    }

    // Buscar usuario
    const user = await userRepository.findById(tokenData.user_id);
    if (!user || !user.is_active) {
      throw new AppError('Utilizador não encontrado ou inativo', 401, null);
    }

    // Generar nuevo access token
    const accessToken = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  /**
   * Logout
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await refreshTokenRepository.revokeToken(refreshToken);
    }
    return true;
  }

  /**
   * Logout de todos los dispositivos
   */
  async logoutAllDevices(userId) {
    await refreshTokenRepository.revokeAllUserTokens(userId);
    return true;
  }

  /**
   * Solicitar reset de contraseña
   */
  async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // No revelar si el email existe o no
      return true;
    }

    // Generar token de reset
    const resetToken = generateSecureToken();
    await userRepository.setResetPasswordToken(user.id, resetToken);

    // TODO: Enviar email con el token
    // Por ahora retornamos el token (en producción esto no se debe hacer)
    return {
      resetToken,
      email: user.email,
      name: user.name
    };
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(resetToken, newPassword) {
    // Buscar usuario por token
    const user = await userRepository.findByResetToken(resetToken);
    if (!user) {
      throw new AppError('Token de redefinição inválido ou expirado', 400, null);
    }

    // Actualizar contraseña
    await userRepository.updatePassword(user.id, newPassword);

    // Revocar todos los refresh tokens
    await refreshTokenRepository.revokeAllUserTokens(user.id);

    return true;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Utilizador não encontrado', 404, null);
    }

    // Verificar contraseña actual
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Palavra-passe atual incorreta', 401, null);
    }

    // Actualizar contraseña
    await userRepository.updatePassword(userId, newPassword);

    // Revocar todos los refresh tokens excepto el actual
    // TODO: Implementar lógica para mantener el token actual

    return true;
  }

  /**
   * Verificar email
   */
  async verifyEmail(userId) {
    await userRepository.verifyEmail(userId);
    return true;
  }

  /**
   * Obtener sesiones activas
   */
  async getActiveSessions(userId) {
    const tokens = await refreshTokenRepository.getActiveUserTokens(userId);
    
    return tokens.map(token => ({
      id: token.id,
      deviceName: token.device_name || 'Dispositivo desconhecido',
      ipAddress: token.ip_address,
      lastUsed: token.updated_at,
      createdAt: token.created_at
    }));
  }

  /**
   * Revocar sesión específica
   */
  async revokeSession(userId, sessionId) {
    const token = await refreshTokenRepository.findById(sessionId);
    if (!token || token.user_id !== userId) {
      throw new AppError('Sessão não encontrada', 404, null);
    }

    await refreshTokenRepository.revokeToken(token.token);
    return true;
  }
}

module.exports = new AuthService();