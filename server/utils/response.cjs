// Utilidades para respuestas estandarizadas

/**
 * Envía una respuesta exitosa
 * @param {Object} res - Objeto response de Express
 * @param {any} data - Datos a enviar
 * @param {string} message - Mensaje opcional
 * @param {number} statusCode - Código de estado HTTP (default: 200)
 */
const successResponse = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Envía una respuesta de error
 * @param {Object} res - Objeto response de Express
 * @param {string} error - Mensaje de error
 * @param {any} details - Detalles adicionales del error
 * @param {number} statusCode - Código de estado HTTP (default: 400)
 */
const errorResponse = (res, error, details = null, statusCode = 400) => {
  const response = {
    success: false,
    error
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Envía una respuesta paginada
 * @param {Object} res - Objeto response de Express
 * @param {Array} data - Array de datos
 * @param {Object} pagination - Información de paginación
 */
const paginatedResponse = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: Math.ceil(pagination.totalItems / pagination.pageSize),
      hasNextPage: pagination.page < Math.ceil(pagination.totalItems / pagination.pageSize),
      hasPreviousPage: pagination.page > 1
    }
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};