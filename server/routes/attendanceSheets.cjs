const express = require('express');
const router = express.Router();
const attendanceSheetController = require('../controllers/attendanceSheetController.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');
const { authenticate, authorize, authorizeBuilding } = require('../middleware/auth.cjs');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/attendance-sheets
 * @desc    Get all attendance sheets (with optional filters)
 * @access  Private
 */
router.get(
  '/',
  attendanceSheetController.getAllAttendanceSheets
);

/**
 * @route   GET /api/attendance-sheets/convocatoria/:convocatoriaId
 * @desc    Get attendance sheet by convocatoria ID
 * @access  Private
 */
router.get(
  '/convocatoria/:convocatoriaId',
  validate(schemas.idParam, 'params'),
  attendanceSheetController.getAttendanceSheetByConvocatoria
);

/**
 * @route   GET /api/attendance-sheets/minute/:minuteId
 * @desc    Get attendance sheet by minute ID
 * @access  Private
 */
router.get(
  '/minute/:minuteId',
  validate(schemas.idParam, 'params'),
  attendanceSheetController.getAttendanceSheetByMinute
);

/**
 * @route   GET /api/attendance-sheets/building/:buildingId/stats
 * @desc    Get attendance statistics for a building
 * @access  Private
 */
router.get(
  '/building/:buildingId/stats',
  validate(schemas.buildingIdParam, 'params'),
  authorizeBuilding,
  attendanceSheetController.getAttendanceStats
);

/**
 * @route   GET /api/attendance-sheets/:id
 * @desc    Get attendance sheet by ID with attendees
 * @access  Private
 */
router.get(
  '/:id',
  validate(schemas.idParam, 'params'),
  attendanceSheetController.getAttendanceSheetById
);

/**
 * @route   GET /api/attendance-sheets/:id/quorum
 * @desc    Calculate quorum for attendance sheet
 * @access  Private
 */
router.get(
  '/:id/quorum',
  validate(schemas.idParam, 'params'),
  attendanceSheetController.calculateQuorum
);

/**
 * @route   POST /api/attendance-sheets
 * @desc    Create new attendance sheet with attendees
 * @access  Private (admin, manager)
 */
router.post(
  '/',
  authorize('super_admin', 'admin', 'manager'),
  attendanceSheetController.createAttendanceSheet
);

/**
 * @route   POST /api/attendance-sheets/:id/attendees
 * @desc    Add attendee to attendance sheet
 * @access  Private (admin, manager)
 */
router.post(
  '/:id/attendees',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  attendanceSheetController.addAttendee
);

/**
 * @route   PUT /api/attendance-sheets/:id
 * @desc    Update attendance sheet
 * @access  Private (admin, manager)
 */
router.put(
  '/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  attendanceSheetController.updateAttendanceSheet
);

/**
 * @route   PUT /api/attendance-sheets/:id/attendees/:attendeeId
 * @desc    Update attendee
 * @access  Private (admin, manager)
 */
router.put(
  '/:id/attendees/:attendeeId',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  attendanceSheetController.updateAttendee
);

/**
 * @route   DELETE /api/attendance-sheets/:id
 * @desc    Delete attendance sheet
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  authorize('super_admin', 'admin'),
  validate(schemas.idParam, 'params'),
  attendanceSheetController.deleteAttendanceSheet
);

/**
 * @route   DELETE /api/attendance-sheets/:id/attendees/:attendeeId
 * @desc    Remove attendee from attendance sheet
 * @access  Private (admin, manager)
 */
router.delete(
  '/:id/attendees/:attendeeId',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  attendanceSheetController.removeAttendee
);

module.exports = router;
