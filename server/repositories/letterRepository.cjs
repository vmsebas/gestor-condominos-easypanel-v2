const BaseRepository = require('./baseRepository.cjs');

/**
 * Repositório para cartas enviadas
 * Segue o padrão de convocatoriaRepository.cjs
 */
class LetterRepository extends BaseRepository {
  constructor() {
    super('sent_letters');
  }

  /**
   * Buscar cartas por edifício com dados de templates
   */
  async findByBuildingWithTemplate(buildingId, options = {}) {
    let query = this.db('sent_letters')
      .whereNull('sent_letters.deleted_at')
      .where('sent_letters.building_id', buildingId)
      .join('buildings', 'sent_letters.building_id', 'buildings.id')
      .leftJoin('members', 'sent_letters.member_id', 'members.id')
      .leftJoin('letter_templates', 'sent_letters.template_id', 'letter_templates.id')
      .select(
        'sent_letters.*',
        'buildings.name as building_name',
        'members.name as member_name',
        'members.email as member_email',
        'letter_templates.name as template_name',
        'letter_templates.type as template_type'
      )
      .orderBy('sent_letters.created_at', 'desc');

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return await query;
  }

  /**
   * Buscar todas as cartas com filtros
   */
  async findAllWithFilters(filters = {}, options = {}) {
    let query = this.db('sent_letters')
      .whereNull('sent_letters.deleted_at')
      .join('buildings', 'sent_letters.building_id', 'buildings.id')
      .leftJoin('members', 'sent_letters.member_id', 'members.id')
      .leftJoin('letter_templates', 'sent_letters.template_id', 'letter_templates.id')
      .select(
        'sent_letters.*',
        'buildings.name as building_name',
        'members.name as member_name',
        'letter_templates.name as template_name'
      );

    if (filters.buildingId) query = query.where('sent_letters.building_id', filters.buildingId);
    if (filters.memberId) query = query.where('sent_letters.member_id', filters.memberId);
    if (filters.sendMethod) query = query.where('sent_letters.send_method', filters.sendMethod);
    if (filters.fromDate) query = query.where('sent_letters.sent_date', '>=', filters.fromDate);
    if (filters.toDate) query = query.where('sent_letters.sent_date', '<=', filters.toDate);

    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDesc ? 'desc' : 'asc';
    query = query.orderBy(`sent_letters.${orderBy}`, orderDirection);

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return await query;
  }

  /**
   * Conta total de cartas com filtros
   */
  async count(filters = {}) {
    let query = this.db('sent_letters')
      .whereNull('deleted_at')
      .count('* as count');

    if (filters.buildingId) query = query.where('building_id', filters.buildingId);
    if (filters.memberId) query = query.where('member_id', filters.memberId);
    if (filters.sendMethod) query = query.where('send_method', filters.sendMethod);
    if (filters.fromDate) query = query.where('sent_date', '>=', filters.fromDate);
    if (filters.toDate) query = query.where('sent_date', '<=', filters.toDate);

    const result = await query.first();
    return parseInt(result.count || 0);
  }

  /**
   * Contar cartas por status e obter estatísticas
   */
  async getStats(buildingId) {
    const result = await this.db('sent_letters')
      .whereNull('deleted_at')
      .where('building_id', buildingId)
      .select(
        this.db.raw('COUNT(*) as total'),
        this.db.raw('COUNT(CASE WHEN send_method = ? THEN 1 END) as by_email', ['email']),
        this.db.raw('COUNT(CASE WHEN send_method = ? THEN 1 END) as by_whatsapp', ['whatsapp']),
        this.db.raw('COUNT(CASE WHEN send_method = ? THEN 1 END) as by_mail', ['correio_certificado']),
        this.db.raw('COUNT(CASE WHEN delivery_confirmation IS NOT NULL THEN 1 END) as delivered')
      )
      .first();

    return {
      total: parseInt(result.total),
      by_email: parseInt(result.by_email),
      by_whatsapp: parseInt(result.by_whatsapp),
      by_mail: parseInt(result.by_mail),
      delivered: parseInt(result.delivered),
      pending: parseInt(result.total) - parseInt(result.delivered)
    };
  }

  /**
   * Buscar cartas recentes
   */
  async findRecent(buildingId, limit = 10) {
    return await this.db('sent_letters')
      .whereNull('deleted_at')
      .where('building_id', buildingId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  /**
   * Buscar cartas por membro
   */
  async findByMember(memberId, options = {}) {
    let query = this.db('sent_letters')
      .whereNull('deleted_at')
      .where('member_id', memberId)
      .leftJoin('letter_templates', 'sent_letters.template_id', 'letter_templates.id')
      .select(
        'sent_letters.*',
        'letter_templates.name as template_name',
        'letter_templates.type as template_type'
      )
      .orderBy('sent_letters.created_at', 'desc');

    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return await query;
  }
}

module.exports = new LetterRepository();
