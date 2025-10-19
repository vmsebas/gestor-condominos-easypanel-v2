const { errorResponse } = require('../utils/response.cjs');
const { AppError } = require('../utils/errors.cjs');

/**
 * Middleware para manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
  // Log del error para debugging
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Si es un error operacional conocido
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.details, err.statusCode);
  }

  // Errores de base de datos PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return errorResponse(res, 'O registo já existe', err.detail, 409);
      case '23503': // foreign_key_violation
        return errorResponse(res, 'Referência a registo inexistente', err.detail, 400);
      case '23502': // not_null_violation
        return errorResponse(res, 'Campo obrigatório em falta', err.detail, 400);
      case '22P02': // invalid_text_representation
        return errorResponse(res, 'Formato de dados inválido', err.detail, 400);
      case '42P01': // undefined_table
        return errorResponse(res, 'Tabela não encontrada', err.detail, 500);
      case '42703': // undefined_column
        return errorResponse(res, 'Coluna não encontrada', err.detail, 500);
      default:
        return errorResponse(res, 'Erro de base de dados', err.detail, 500);
    }
  }

  // Error de validación de Express
  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Dados inválidos', err.errors, 400);
  }

  // Error de JSON mal formado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'JSON inválido no corpo do pedido', null, 400);
  }

  // Error genérico
  const message = process.env.NODE_ENV === 'production'
    ? 'Erro interno do servidor'
    : err.message;
    
  return errorResponse(res, message, null, 500);
};

/**
 * Middleware para capturar errores asíncronos
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};