const BaseRepository = require('./baseRepository.cjs');

/**
 * Repository for AttendanceSheet entity
 * Manages attendance tracking for assembly meetings
 */
class AttendanceSheetRepository extends BaseRepository {
  constructor() {
    super('attendance_sheets');
  }

  /**
   * Find attendance sheet by building ID
   */
  async findByBuilding(buildingId) {
    const sheets = await this.db('attendance_sheets')
      .where('building_id', buildingId)
      .orderBy('meeting_date', 'desc');

    return sheets;
  }

  /**
   * Find attendance sheet by convocatoria ID
   */
  async findByConvocatoria(convocatoriaId) {
    const sheet = await this.db('attendance_sheets')
      .where('convocatoria_id', convocatoriaId)
      .first();

    if (!sheet) {
      return null;
    }

    // Load attendees
    sheet.attendees = await this.db('attendees')
      .where('attendance_sheet_id', sheet.id)
      .orderBy('member_name', 'asc');

    return sheet;
  }

  /**
   * Find attendance sheet by minute ID
   */
  async findByMinute(minuteId) {
    const sheet = await this.db('attendance_sheets')
      .where('minute_id', minuteId)
      .first();

    if (!sheet) {
      return null;
    }

    // Load attendees
    sheet.attendees = await this.db('attendees')
      .where('attendance_sheet_id', sheet.id)
      .orderBy('member_name', 'asc');

    return sheet;
  }

  /**
   * Find attendance sheet by ID with attendees
   */
  async findByIdWithAttendees(id) {
    const sheet = await this.findById(id);

    if (!sheet) {
      return null;
    }

    // Load attendees with member details
    sheet.attendees = await this.db('attendees')
      .leftJoin('members', 'attendees.member_id', 'members.id')
      .where('attendees.attendance_sheet_id', id)
      .select(
        'attendees.*',
        'members.fraction',
        'members.permilage'
      )
      .orderBy('members.fraction', 'asc');

    return sheet;
  }

  /**
   * Create attendance sheet with attendees in a transaction
   */
  async createWithAttendees(sheetData, attendeesData = []) {
    return this.transaction(async (trx) => {
      // Create attendance sheet
      const sheet = await trx('attendance_sheets')
        .insert({
          ...sheetData,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*')
        .then(rows => rows[0]);

      // Create attendees if provided
      if (attendeesData.length > 0) {
        const attendeesToInsert = attendeesData.map(attendee => ({
          attendance_sheet_id: sheet.id,
          member_id: attendee.member_id,
          member_name: attendee.member_name,
          attendance_type: attendee.attendance_type || 'absent',
          representative_name: attendee.representative_name || null,
          signature: attendee.signature || null,
          arrival_time: attendee.arrival_time || null,
          created_at: new Date(),
          updated_at: new Date()
        }));

        const attendees = await trx('attendees')
          .insert(attendeesToInsert)
          .returning('*');

        sheet.attendees = attendees;
      }

      return sheet;
    });
  }

  /**
   * Update attendance sheet with attendees in a transaction
   */
  async updateWithAttendees(id, sheetData, attendeesData = null) {
    return this.transaction(async (trx) => {
      // Update attendance sheet
      const sheet = await trx('attendance_sheets')
        .where('id', id)
        .update({
          ...sheetData,
          updated_at: new Date()
        })
        .returning('*')
        .then(rows => rows[0]);

      if (!sheet) {
        throw new Error('Folha de presenças não encontrada');
      }

      // If attendees are provided, update them
      if (attendeesData !== null) {
        // Delete existing attendees
        await trx('attendees')
          .where('attendance_sheet_id', id)
          .delete();

        // Insert new attendees
        if (attendeesData.length > 0) {
          const attendeesToInsert = attendeesData.map(attendee => ({
            attendance_sheet_id: id,
            member_id: attendee.member_id,
            member_name: attendee.member_name,
            attendance_type: attendee.attendance_type || 'absent',
            representative_name: attendee.representative_name || null,
            signature: attendee.signature || null,
            arrival_time: attendee.arrival_time || null,
            created_at: new Date(),
            updated_at: new Date()
          }));

          const attendees = await trx('attendees')
            .insert(attendeesToInsert)
            .returning('*');

          sheet.attendees = attendees;
        }
      }

      return sheet;
    });
  }

  /**
   * Update single attendee
   */
  async updateAttendee(attendeeId, attendeeData) {
    const attendee = await this.db('attendees')
      .where('id', attendeeId)
      .update({
        ...attendeeData,
        updated_at: new Date()
      })
      .returning('*')
      .then(rows => rows[0]);

    return attendee;
  }

  /**
   * Add attendee to existing attendance sheet
   */
  async addAttendee(sheetId, attendeeData) {
    const attendee = await this.db('attendees')
      .insert({
        attendance_sheet_id: sheetId,
        member_id: attendeeData.member_id,
        member_name: attendeeData.member_name,
        attendance_type: attendeeData.attendance_type || 'absent',
        representative_name: attendeeData.representative_name || null,
        signature: attendeeData.signature || null,
        arrival_time: attendeeData.arrival_time || null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*')
      .then(rows => rows[0]);

    return attendee;
  }

  /**
   * Remove attendee from attendance sheet
   */
  async removeAttendee(attendeeId) {
    const attendee = await this.db('attendees')
      .where('id', attendeeId)
      .delete()
      .returning('*')
      .then(rows => rows[0]);

    return attendee;
  }

  /**
   * Calculate quorum statistics for an attendance sheet
   */
  async calculateQuorum(sheetId) {
    const sheet = await this.findByIdWithAttendees(sheetId);

    if (!sheet) {
      return null;
    }

    const total = sheet.attendees.length;
    const present = sheet.attendees.filter(a => a.attendance_type === 'present').length;
    const represented = sheet.attendees.filter(a => a.attendance_type === 'represented').length;
    const absent = sheet.attendees.filter(a => a.attendance_type === 'absent').length;

    // Calculate permilage-based quorum
    const totalPermilage = sheet.attendees.reduce((sum, a) => sum + (a.permilage || 0), 0);
    const presentPermilage = sheet.attendees
      .filter(a => a.attendance_type === 'present' || a.attendance_type === 'represented')
      .reduce((sum, a) => sum + (a.permilage || 0), 0);

    const quorumPercentage = totalPermilage > 0 ? (presentPermilage / totalPermilage) * 100 : 0;

    // First call requires >50%, second call requires >25%
    const quorumMetFirstCall = quorumPercentage > 50;
    const quorumMetSecondCall = quorumPercentage > 25;

    return {
      total,
      present,
      represented,
      absent,
      totalPermilage,
      presentPermilage,
      quorumPercentage,
      quorumMetFirstCall,
      quorumMetSecondCall
    };
  }

  /**
   * Get attendance statistics for a building
   */
  async getAttendanceStats(buildingId, fromDate = null, toDate = null) {
    let query = this.db('attendance_sheets')
      .where('building_id', buildingId);

    if (fromDate) {
      query = query.where('meeting_date', '>=', fromDate);
    }

    if (toDate) {
      query = query.where('meeting_date', '<=', toDate);
    }

    const sheets = await query;

    if (sheets.length === 0) {
      return {
        totalMeetings: 0,
        averageAttendance: 0,
        averageRepresented: 0,
        averageAbsent: 0
      };
    }

    const totalMeetings = sheets.length;
    const totalPresent = sheets.reduce((sum, s) => sum + s.present_members, 0);
    const totalRepresented = sheets.reduce((sum, s) => sum + s.represented_members, 0);
    const totalAbsent = sheets.reduce((sum, s) => sum + (s.total_members - s.present_members - s.represented_members), 0);

    return {
      totalMeetings,
      averageAttendance: totalPresent / totalMeetings,
      averageRepresented: totalRepresented / totalMeetings,
      averageAbsent: totalAbsent / totalMeetings
    };
  }
}

module.exports = new AttendanceSheetRepository();
