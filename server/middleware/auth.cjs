const { verifyToken, extractTokenFromHeader } = require('../utils/auth.cjs');
const { errorResponse } = require('../utils/response.cjs');
const { db } = require('../config/knex.cjs');

/**
 * Middleware de autenticación
 * Verifica que el usuario tenga un token JWT válido
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraer token del header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return errorResponse(res, 'No se proporcionó token de autenticación', null, 401);
    }
    
    // Verificar token
    const decoded = verifyToken(token);
    
    // Buscar usuario en la base de datos
    const user = await db('users')
      .where('id', decoded.userId)
      .whereNull('deleted_at')
      .where('is_active', true)
      .first();
    
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado o inactivo', null, 401);
    }
    
    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return errorResponse(res, 'Cuenta bloqueada temporalmente', null, 403);
    }
    
    // Agregar usuario a la request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      buildingId: user.building_id,
      memberId: user.member_id,
      permissions: user.permissions || {}
    };
    
    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      return errorResponse(res, 'Token expirado', null, 401);
    }
    if (error.message === 'Invalid token') {
      return errorResponse(res, 'Token inválido', null, 401);
    }
    return errorResponse(res, 'Error de autenticación', error.message, 401);
  }
};

/**
 * Middleware de autorización por roles
 * Verifica que el usuario tenga uno de los roles especificados
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'No autenticado', null, 401);
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'No tienes permisos para acceder a este recurso', null, 403);
    }
    
    next();
  };
};

/**
 * Middleware de autorización por permisos
 * Verifica que el usuario tenga el permiso especificado
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'No autenticado', null, 401);
    }
    
    // Super admins tienen todos los permisos
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Verificar permiso específico
    const permissions = req.user.permissions || {};
    if (!permissions[permission]) {
      return errorResponse(res, `No tienes el permiso: ${permission}`, null, 403);
    }
    
    next();
  };
};

/**
 * Middleware para verificar acceso a un edificio específico
 */
const authorizeBuilding = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'No autenticado', null, 401);
  }
  
  // Super admins tienen acceso a todos los edificios
  if (req.user.role === 'super_admin') {
    return next();
  }
  
  // Obtener building_id de diferentes fuentes
  const buildingId = req.params.buildingId || req.params.id || req.body.building_id;
  
  if (!buildingId) {
    return errorResponse(res, 'ID de edificio no especificado', null, 400);
  }
  
  // Verificar que el usuario pertenezca al edificio
  if (req.user.buildingId !== buildingId) {
    return errorResponse(res, 'No tienes acceso a este edificio', null, 403);
  }
  
  next();
};

/**
 * Middleware opcional de autenticación
 * Si hay token, lo verifica. Si no hay token, continúa sin autenticar
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await db('users')
        .where('id', decoded.userId)
        .whereNull('deleted_at')
        .where('is_active', true)
        .first();
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          buildingId: user.building_id,
          memberId: user.member_id,
          permissions: user.permissions || {}
        };
      }
    }
    
    next();
  } catch (error) {
    // Si hay error con el token, continuar sin autenticar
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  authorizeBuilding,
  optionalAuth
};