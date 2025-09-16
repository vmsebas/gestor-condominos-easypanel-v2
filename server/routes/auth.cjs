const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');

// Rutas públicas (sin autenticación)

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post(
  '/login',
  validate(schemas.auth.login),
  authController.login
);

/**
 * @route   POST /api/auth/register
 * @desc    Registro de nuevo usuario
 * @access  Public
 */
router.post(
  '/register',
  validate(schemas.auth.register),
  authController.register
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar access token
 * @access  Public
 */
router.post(
  '/refresh',
  authController.refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar reset de contraseña
 * @access  Public
 */
router.post(
  '/forgot-password',
  validate(schemas.auth.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetear contraseña con token
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(schemas.auth.resetPassword),
  authController.resetPassword
);

// Rutas protegidas (requieren autenticación)

/**
 * @route   GET /api/auth/me
 * @desc    Obtener usuario actual
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión actual
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Cerrar todas las sesiones
 * @access  Private
 */
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validate(schemas.auth.changePassword),
  authController.changePassword
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verificar email del usuario
 * @access  Private
 */
router.post(
  '/verify-email',
  authenticate,
  authController.verifyEmail
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Obtener sesiones activas
 * @access  Private
 */
router.get(
  '/sessions',
  authenticate,
  authController.getActiveSessions
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revocar sesión específica
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  validate(schemas.idParam, 'params'),
  authController.revokeSession
);

module.exports = router;