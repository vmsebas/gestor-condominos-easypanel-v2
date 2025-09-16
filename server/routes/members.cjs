const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');
const { authenticate, authorize, authorizeBuilding } = require('../middleware/auth.cjs');
const { uploadAvatar } = require('../middleware/upload.cjs');

// ⚠️ AUTENTICACIÓN TEMPORALMENTE DESHABILITADA PARA DEBUGGING
// router.use(authenticate);

/**
 * @route   GET /api/members
 * @desc    Obtener todos los miembros de un edificio
 * @access  Private
 */
router.get(
  '/',
  validate(schemas.member.query, 'query'),
  memberController.getAllMembers
);

/**
 * @route   GET /api/members/debtors
 * @desc    Obtener miembros deudores
 * @access  Private (admin, manager)
 */
router.get(
  '/debtors',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.member.query, 'query'),
  authorizeBuilding,
  memberController.getDebtors
);

/**
 * @route   GET /api/members/export
 * @desc    Exportar miembros a CSV
 * @access  Private (admin, manager)
 */
router.get(
  '/export',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.member.query, 'query'),
  authorizeBuilding,
  memberController.exportMembers
);

/**
 * @route   GET /api/members/:id
 * @desc    Obtener un miembro por ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(schemas.idParam, 'params'),
  memberController.getMemberById
);

/**
 * @route   GET /api/members/:id/profile
 * @desc    Obtener perfil completo de un miembro
 * @access  Private
 */
router.get(
  '/:id/profile',
  validate(schemas.idParam, 'params'),
  memberController.getMemberProfile
);

/**
 * @route   POST /api/members
 * @desc    Crear nuevo miembro
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.member.create),
  authorizeBuilding,
  memberController.createMember
);

/**
 * @route   POST /api/members/import
 * @desc    Importar miembros desde CSV
 * @access  Private (admin, manager)
 */
router.post(
  '/import',
  authorize('super_admin', 'admin', 'manager'),
  // TODO: Agregar middleware multer para archivos
  memberController.importMembers
);

/**
 * @route   PUT /api/members/:id
 * @desc    Actualizar miembro
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  validate(schemas.member.update),
  memberController.updateMember
);

/**
 * @route   PUT /api/members/:id/fees
 * @desc    Actualizar cuotas de un miembro
 * @access  Private (admin, manager)
 */
router.put(
  '/:id/fees',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  validate(schemas.member.fees),
  memberController.updateMemberFees
);

/**
 * @route   DELETE /api/members/:id
 * @desc    Eliminar miembro
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authorize('super_admin', 'admin'),
  validate(schemas.idParam, 'params'),
  memberController.deleteMember
);

/**
 * @route   POST /api/members/:id/avatar
 * @desc    Upload member avatar
 * @access  Private (admin, manager, or member themselves)
 */
router.post(
  '/:id/avatar',
  validate(schemas.idParam, 'params'),
  uploadAvatar.single('avatar'),
  memberController.uploadAvatar
);

/**
 * @route   DELETE /api/members/:id/avatar
 * @desc    Delete member avatar
 * @access  Private (admin, manager, or member themselves)
 */
router.delete(
  '/:id/avatar',
  validate(schemas.idParam, 'params'),
  memberController.deleteAvatar
);

module.exports = router;