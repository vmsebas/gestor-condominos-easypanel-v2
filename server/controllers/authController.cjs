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
    }, 'Início de sessão bem-sucedido');
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
    }, 'Utilizador registado com sucesso', 201);
  });

  /**
   * POST /api/auth/refresh
   * Refrescar access token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new AppError('Refresh token não fornecido', 401, null);
    }
    
    const result = await authService.refreshAccessToken(refreshToken);
    
    successResponse(res, result, 'Token renovado');
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
    
    successResponse(res, null, 'Sessão terminada com sucesso');
  });

  /**
   * POST /api/auth/logout-all
   * Cerrar todas las sesiones
   */
  logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAllDevices(req.user.id);
    
    // Limpiar cookie
    res.clearCookie('refreshToken');
    
    successResponse(res, null, 'Todas as sessões foram terminadas');
  });

  /**
   * GET /api/auth/me
   * Obtener usuario actual
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await userRepository.findById(req.user.id);
    
    if (!user) {
      throw new AppError('Utilizador não encontrado', 404, null);
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
    
    successResponse(res, null, 'Se o email existir, receberá instruções para redefinir a sua palavra-passe');
  });

  /**
   * POST /api/auth/reset-password
   * Resetear contraseña
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    
    await authService.resetPassword(token, password);
    
    successResponse(res, null, 'Palavra-passe atualizada com sucesso');
  });

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    successResponse(res, null, 'Palavra-passe atualizada com sucesso');
  });

  /**
   * POST /api/auth/verify-email/:token
   * Verificar email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    // TODO: Implementar verificación por token
    // Por ahora verificamos directamente
    await authService.verifyEmail(req.user.id);
    
    successResponse(res, null, 'Email verificado com sucesso');
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
    
    successResponse(res, null, 'Sessão revogada com sucesso');
  });
}

// Importar después de definir la clase para evitar dependencias circulares
const userRepository = require('../repositories/userRepository.cjs');
const { AppError } = require('../utils/errors.cjs');

module.exports = new AuthController();