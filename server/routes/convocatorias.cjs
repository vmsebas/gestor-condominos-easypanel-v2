const express = require('express');
const router = express.Router();
const convocatoriaController = require('../controllers/convocatoriaController.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');
const { authenticate, authorize, authorizeBuilding } = require('../middleware/auth.cjs');

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   GET /api/convocatorias
 * @desc    Obtener todas las convocatorias (con filtros opcionales)
 * @access  Private
 */
router.get(
  '/',
  validate(schemas.convocatoria.query, 'query'),
  convocatoriaController.getAllConvocatorias
);

/**
 * @route   POST /api/convocatorias/generate-number
 * @desc    Generar número de asamblea automático
 * @access  Private
 */
router.post(
  '/generate-number',
  validate(schemas.convocatoria.generateNumber),
  convocatoriaController.generateAssemblyNumber
);

/**
 * @route   GET /api/convocatorias/building/:buildingId
 * @desc    Obtener convocatorias de un edificio
 * @access  Private
 */
router.get(
  '/building/:buildingId',
  validate(schemas.buildingIdParam, 'params'),
  authorizeBuilding,
  convocatoriaController.getConvocatoriasByBuilding
);

/**
 * @route   GET /api/convocatorias/next/:buildingId
 * @desc    Obtener próxima convocatoria de un edificio
 * @access  Private
 */
router.get(
  '/next/:buildingId',
  validate(schemas.buildingIdParam, 'params'),
  authorizeBuilding,
  convocatoriaController.getNextConvocatoria
);

/**
 * @route   GET /api/convocatorias/stats/:buildingId
 * @desc    Obtener estadísticas de convocatorias
 * @access  Private
 */
router.get(
  '/stats/:buildingId',
  validate(schemas.buildingIdParam, 'params'),
  authorizeBuilding,
  convocatoriaController.getConvocatoriaStats
);

/**
 * @route   GET /api/convocatorias/:id
 * @desc    Obtener una convocatoria por ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(schemas.idParam, 'params'),
  convocatoriaController.getConvocatoriaById
);

/**
 * @route   POST /api/convocatorias
 * @desc    Crear nueva convocatoria
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.convocatoria.create),
  authorizeBuilding,
  convocatoriaController.createConvocatoria
);

/**
 * @route   POST /api/convocatorias/:id/duplicate
 * @desc    Duplicar convocatoria existente
 * @access  Private (admin, manager)
 */
router.post(
  '/:id/duplicate',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  convocatoriaController.duplicateConvocatoria
);

/**
 * @route   POST /api/convocatorias/:id/minutes
 * @desc    Marcar convocatoria con acta creada
 * @access  Private (admin, manager)
 */
router.post(
  '/:id/minutes',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  convocatoriaController.markMinutesCreated
);

/**
 * @route   PUT /api/convocatorias/:id
 * @desc    Actualizar convocatoria
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  validate(schemas.convocatoria.update),
  convocatoriaController.updateConvocatoria
);

/**
 * @route   DELETE /api/convocatorias/:id
 * @desc    Eliminar convocatoria
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authorize('super_admin', 'admin'),
  validate(schemas.idParam, 'params'),
  convocatoriaController.deleteConvocatoria
);

module.exports = router;