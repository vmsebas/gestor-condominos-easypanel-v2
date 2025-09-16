const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');

/**
 * @route   GET /api/buildings
 * @desc    Obtener todos los edificios
 * @access  Public
 */
router.get(
  '/',
  validate(schemas.pagination, 'query'),
  buildingController.getAllBuildings
);

/**
 * @route   GET /api/buildings/stats/summary
 * @desc    Obtener resumen estadístico de todos los edificios
 * @access  Public
 */
router.get(
  '/stats/summary',
  buildingController.getAllBuildingsStats
);

/**
 * @route   GET /api/buildings/:id
 * @desc    Obtener un edificio por ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(schemas.idParam, 'params'),
  buildingController.getBuildingById
);

/**
 * @route   GET /api/buildings/:id/stats
 * @desc    Obtener estadísticas de un edificio
 * @access  Public
 */
router.get(
  '/:id/stats',
  validate(schemas.idParam, 'params'),
  buildingController.getBuildingStats
);

/**
 * @route   GET /api/buildings/:id/members
 * @desc    Obtener miembros de un edificio
 * @access  Public
 */
router.get(
  '/:id/members',
  validate(schemas.idParam, 'params'),
  buildingController.getBuildingMembers
);

/**
 * @route   GET /api/buildings/:id/fractions
 * @desc    Obtener fracciones de un edificio
 * @access  Public
 */
router.get(
  '/:id/fractions',
  validate(schemas.idParam, 'params'),
  buildingController.getBuildingFractions
);

/**
 * @route   POST /api/buildings
 * @desc    Crear nuevo edificio
 * @access  Public (debería ser protegido)
 */
router.post(
  '/',
  validate(schemas.building.create),
  buildingController.createBuilding
);

/**
 * @route   PUT /api/buildings/:id
 * @desc    Actualizar edificio
 * @access  Public (debería ser protegido)
 */
router.put(
  '/:id',
  validate(schemas.idParam, 'params'),
  validate(schemas.building.update),
  buildingController.updateBuilding
);

/**
 * @route   DELETE /api/buildings/:id
 * @desc    Eliminar edificio
 * @access  Public (debería ser protegido)
 */
router.delete(
  '/:id',
  validate(schemas.idParam, 'params'),
  buildingController.deleteBuilding
);

module.exports = router;