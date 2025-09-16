const authService = require('../services/authService.cjs');
const { successResponse } = require('../utils/response.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

/**
 * Controlador de autenticación
 */
class AuthController {
  /**
   * POST /api/auth/login
   * Login de usuario
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Información del dispositivo
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceName: req.body.deviceName
    };
    
    const result = await authService.login(email, password, deviceInfo);
    
    // Establecer cookie httpOnly para refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
    
    successResponse(res, {
      user: result.user,
      accessToken: result.accessToken
    }, 'Login exitoso');
  });

  /**
   * POST /api/auth/register
   * Registro de nuevo usuario
   */
  register = asyncHandler(async (req, res) => {
    const userData = req.body;
    
    const result = await authService.register(userData);
    
    // Establecer cookie httpOnly para refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });
    
    successResponse(res, {
      user: result.user,
      accessToken: result.accessToken
    }, 'Usuario registrado exitosamente', 201);
  });

  /**
   * POST /api/auth/refresh
   * Refrescar access token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new AppError('Refresh token no proporcionado', 401, null);
    }
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    successResponse(res, result, 'Token actualizado');
  });

  /**
   * POST /api/auth/logout
   * Cerrar sesión
   */
  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    await authService.logout(refreshToken);
    
    // Limpiar cookie
    res.clearCookie('refreshToken');
    
    successResponse(res, null, 'Sesión cerrada exitosamente');
  });

  /**
   * POST /api/auth/logout-all
   * Cerrar todas las sesiones
   */
  logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAllDevices(req.user.id);
    
    // Limpiar cookie
    res.clearCookie('refreshToken');
    
    successResponse(res, null, 'Todas las sesiones cerradas');
  });

  /**
   * GET /api/auth/me
   * Obtener usuario actual
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await userRepository.findById(req.user.id);
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 404, null);
    }
    
    const { password_hash, reset_password_token, ...userData } = user;
    
    successResponse(res, userData);
  });

  /**
   * POST /api/auth/forgot-password
   * Solicitar reset de contraseña
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    await authService.requestPasswordReset(email);
    
    successResponse(res, null, 'Si el email existe, recibirás instrucciones para resetear tu contraseña');
  });

  /**
   * POST /api/auth/reset-password
   * Resetear contraseña
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    
    await authService.resetPassword(token, password);
    
    successResponse(res, null, 'Contraseña actualizada exitosamente');
  });

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    successResponse(res, null, 'Contraseña actualizada exitosamente');
  });

  /**
   * POST /api/auth/verify-email/:token
   * Verificar email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    // TODO: Implementar verificación por token
    // Por ahora verificamos directamente
    await authService.verifyEmail(req.user.id);
    
    successResponse(res, null, 'Email verificado exitosamente');
  });

  /**
   * GET /api/auth/sessions
   * Obtener sesiones activas
   */
  getActiveSessions = asyncHandler(async (req, res) => {
    const sessions = await authService.getActiveSessions(req.user.id);
    
    successResponse(res, sessions);
  });

  /**
   * DELETE /api/auth/sessions/:sessionId
   * Revocar sesión específica
   */
  revokeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    await authService.revokeSession(req.user.id, sessionId);
    
    successResponse(res, null, 'Sesión revocada exitosamente');
  });
}

// Importar después de definir la clase para evitar dependencias circulares
const userRepository = require('../repositories/userRepository.cjs');
const { AppError } = require('../utils/errors.cjs');

module.exports = new AuthController();