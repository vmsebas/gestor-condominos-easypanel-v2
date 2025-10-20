const attendanceSheetRepository = require('../repositories/attendanceSheetRepository.cjs');
const { successResponse } = require('../utils/response.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');
const { NotFoundError, ValidationError } = require('../utils/errors.cjs');

/**
 * Controller for attendance sheets
 * Manages attendance tracking for assembly meetings
 */
class AttendanceSheetController {
  /**
   * GET /api/attendance-sheets
   * Get all attendance sheets with optional filters
   */
  getAllAttendanceSheets = asyncHandler(async (req, res) => {
    const { buildingId, convocatoriaId, minuteId } = req.query;

    let sheets;

    if (buildingId) {
      sheets = await attendanceSheetRepository.findByBuilding(buildingId);
    } else if (convocatoriaId) {
      sheets = [await attendanceSheetRepository.findByConvocatoria(convocatoriaId)].filter(Boolean);
    } else if (minuteId) {
      sheets = [await attendanceSheetRepository.findByMinute(minuteId)].filter(Boolean);
    } else {
      sheets = await attendanceSheetRepository.findAll();
    }

    successResponse(res, sheets);
  });

  /**
   * GET /api/attendance-sheets/:id
   * Get attendance sheet by ID with attendees
   */
  getAttendanceSheetById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const sheet = await attendanceSheetRepository.findByIdWithAttendees(id);

    if (!sheet) {
      throw new NotFoundError('Folha de presenças não encontrada');
    }

    successResponse(res, sheet);
  });

  /**
   * GET /api/attendance-sheets/convocatoria/:convocatoriaId
   * Get attendance sheet by convocatoria ID
   */
  getAttendanceSheetByConvocatoria = asyncHandler(async (req, res) => {
    const { convocatoriaId } = req.params;

    const sheet = await attendanceSheetRepository.findByConvocatoria(convocatoriaId);

    if (!sheet) {
      throw new NotFoundError('Folha de presenças não encontrada para esta convocatória');
    }

    successResponse(res, sheet);
  });

  /**
   * GET /api/attendance-sheets/minute/:minuteId
   * Get attendance sheet by minute ID
   */
  getAttendanceSheetByMinute = asyncHandler(async (req, res) => {
    const { minuteId } = req.params;

    const sheet = await attendanceSheetRepository.findByMinute(minuteId);

    if (!sheet) {
      throw new NotFoundError('Folha de presenças não encontrada para esta acta');
    }

    successResponse(res, sheet);
  });

  /**
   * POST /api/attendance-sheets
   * Create new attendance sheet with attendees
   */
  createAttendanceSheet = asyncHandler(async (req, res) => {
    const {
      building_id,
      convocatoria_id,
      minute_id,
      meeting_date,
      total_members,
      attendees = []
    } = req.body;

    // Validate required fields
    if (!building_id || !meeting_date || !total_members) {
      throw new ValidationError('building_id, meeting_date e total_members são obrigatórios');
    }

    // Count present, represented, and absent
    const present_members = attendees.filter(a => a.attendance_type === 'present').length;
    const represented_members = attendees.filter(a => a.attendance_type === 'represented').length;

    const sheetData = {
      building_id,
      convocatoria_id: convocatoria_id || null,
      minute_id: minute_id || null,
      meeting_date,
      total_members,
      present_members,
      represented_members
    };

    const sheet = await attendanceSheetRepository.createWithAttendees(sheetData, attendees);

    successResponse(res, sheet, 'Folha de presenças criada com sucesso', 201);
  });

  /**
   * PUT /api/attendance-sheets/:id
   * Update attendance sheet with attendees
   */
  updateAttendanceSheet = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      meeting_date,
      total_members,
      attendees = null
    } = req.body;

    // Build update data
    const updateData = {};
    if (meeting_date) updateData.meeting_date = meeting_date;
    if (total_members) updateData.total_members = total_members;

    // If attendees are provided, recalculate counts
    if (attendees && Array.isArray(attendees)) {
      updateData.present_members = attendees.filter(a => a.attendance_type === 'present').length;
      updateData.represented_members = attendees.filter(a => a.attendance_type === 'represented').length;
    }

    const sheet = await attendanceSheetRepository.updateWithAttendees(id, updateData, attendees);

    if (!sheet) {
      throw new NotFoundError('Folha de presenças não encontrada');
    }

    successResponse(res, sheet, 'Folha de presenças atualizada com sucesso');
  });

  /**
   * DELETE /api/attendance-sheets/:id
   * Delete attendance sheet
   */
  deleteAttendanceSheet = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const sheet = await attendanceSheetRepository.delete(id);

    if (!sheet) {
      throw new NotFoundError('Folha de presenças não encontrada');
    }

    successResponse(res, null, 'Folha de presenças eliminada com sucesso');
  });

  /**
   * POST /api/attendance-sheets/:id/attendees
   * Add attendee to attendance sheet
   */
  addAttendee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const attendeeData = req.body;

    // Validate required fields
    if (!attendeeData.member_id || !attendeeData.member_name) {
      throw new ValidationError('member_id e member_name são obrigatórios');
    }

    // Verify attendance sheet exists
    const sheet = await attendanceSheetRepository.findById(id);
    if (!sheet) {
      throw new NotFoundError('Folha de presenças não encontrada');
    }

    const attendee = await attendanceSheetRepository.addAttendee(id, attendeeData);

    // Update counts in attendance sheet
    const updatedSheet = await attendanceSheetRepository.findByIdWithAttendees(id);
    const present_members = updatedSheet.attendees.filter(a => a.attendance_type === 'present').length;
    const represented_members = updatedSheet.attendees.filter(a => a.attendance_type === 'represented').length;

    await attendanceSheetRepository.update(id, {
      present_members,
      represented_members
    });

    successResponse(res, attendee, 'Condómino adicionado com sucesso', 201);
  });

  /**
   * PUT /api/attendance-sheets/:id/attendees/:attendeeId
   * Update attendee
   */
  updateAttendee = asyncHandler(async (req, res) => {
    const { id, attendeeId } = req.params;
    const attendeeData = req.body;

    const attendee = await attendanceSheetRepository.updateAttendee(attendeeId, attendeeData);

    if (!attendee) {
      throw new NotFoundError('Condómino não encontrado');
    }

    // Update counts in attendance sheet
    const updatedSheet = await attendanceSheetRepository.findByIdWithAttendees(id);
    const present_members = updatedSheet.attendees.filter(a => a.attendance_type === 'present').length;
    const represented_members = updatedSheet.attendees.filter(a => a.attendance_type === 'represented').length;

    await attendanceSheetRepository.update(id, {
      present_members,
      represented_members
    });

    successResponse(res, attendee, 'Presença atualizada com sucesso');
  });

  /**
   * DELETE /api/attendance-sheets/:id/attendees/:attendeeId
   * Remove attendee from attendance sheet
   */
  removeAttendee = asyncHandler(async (req, res) => {
    const { id, attendeeId } = req.params;

    const attendee = await attendanceSheetRepository.removeAttendee(attendeeId);

    if (!attendee) {
      throw new NotFoundError('Condómino não encontrado');
    }

    // Update counts in attendance sheet
    const updatedSheet = await attendanceSheetRepository.findByIdWithAttendees(id);
    const present_members = updatedSheet.attendees.filter(a => a.attendance_type === 'present').length;
    const represented_members = updatedSheet.attendees.filter(a => a.attendance_type === 'represented').length;

    await attendanceSheetRepository.update(id, {
      present_members,
      represented_members,
      total_members: updatedSheet.attendees.length
    });

    successResponse(res, null, 'Condómino removido com sucesso');
  });

  /**
   * GET /api/attendance-sheets/:id/quorum
   * Calculate quorum for attendance sheet
   */
  calculateQuorum = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quorum = await attendanceSheetRepository.calculateQuorum(id);

    if (!quorum) {
      throw new NotFoundError('Folha de presenças não encontrada');
    }

    successResponse(res, quorum);
  });

  /**
   * GET /api/attendance-sheets/building/:buildingId/stats
   * Get attendance statistics for a building
   */
  getAttendanceStats = asyncHandler(async (req, res) => {
    const { buildingId } = req.params;
    const { fromDate, toDate } = req.query;

    const stats = await attendanceSheetRepository.getAttendanceStats(
      buildingId,
      fromDate || null,
      toDate || null
    );

    successResponse(res, stats);
  });
}

module.exports = new AttendanceSheetController();
