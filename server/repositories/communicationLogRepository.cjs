const BaseRepository = require('./baseRepository.cjs');

/**
 * Repository para gestão de logs de comunicações
 * Tracking completo de todas as comunicações enviadas
 */
class CommunicationLogRepository extends BaseRepository {
  constructor() {
    super('communication_logs');
  }

  /**
   * Criar log de comunicação
   * @param {Object} data - Dados do log
   * @returns {Promise<Object>} Log criado
   */
  async createLog(data) {
    const logData = {
      ...data,
      status: data.status || 'draft_created',
      draft_created_at: new Date(),
      metadata: data.metadata || {}
    };

    return await this.create(logData);
  }

  /**
   * Buscar logs por edifício com filtros
   * @param {string} buildingId - ID do edifício
   * @param {Object} filters - Filtros opcionais
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Array>} Lista de logs
   */
  async findByBuilding(buildingId, filters = {}, options = {}) {
    let query = this.db('communication_logs')
      .whereNull('communication_logs.deleted_at')
      .where('communication_logs.building_id', buildingId)
      .leftJoin('members', 'communication_logs.member_id', 'members.id')
      .leftJoin('buildings', 'communication_logs.building_id', 'buildings.id')
      .select(
        'communication_logs.*',
        'members.name as member_name',
        'members.email as member_email',
        'buildings.name as building_name'
      );

    // Aplicar filtros
    if (filters.member_id) {
      query = query.where('communication_logs.member_id', filters.member_id);
    }
    if (filters.communication_type) {
      query = query.where('communication_logs.communication_type', filters.communication_type);
    }
    if (filters.channel) {
      query = query.where('communication_logs.channel', filters.channel);
    }
    if (filters.status) {
      query = query.where('communication_logs.status', filters.status);
    }
    if (filters.from_date) {
      query = query.where('communication_logs.created_at', '>=', filters.from_date);
    }
    if (filters.to_date) {
      query = query.where('communication_logs.created_at', '<=', filters.to_date);
    }

    // Ordenação
    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDesc ? 'desc' : 'asc';
    query = query.orderBy(`communication_logs.${orderBy}`, orderDirection);

    // Paginação
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.offset(options.offset);

    return await query;
  }

  /**
   * Buscar logs por membro
   * @param {string} memberId - ID do membro
   * @param {Object} options - Opções
   * @returns {Promise<Array>} Lista de logs
   */
  async findByMember(memberId, options = {}) {
    let query = this.db('communication_logs')
      .whereNull('deleted_at')
      .where('member_id', memberId)
      .orderBy('created_at', 'desc');

    if (options.limit) query = query.limit(options.limit);

    return await query;
  }

  /**
   * Buscar logs por carta
   * @param {string} letterId - ID da carta
   * @returns {Promise<Array>} Lista de logs
   */
  async findByLetter(letterId) {
    return await this.db('communication_logs')
      .whereNull('deleted_at')
      .where('related_letter_id', letterId)
      .orderBy('created_at', 'desc');
  }

  /**
   * Buscar logs por convocatória
   * @param {string} convocatoriaId - ID da convocatória
   * @returns {Promise<Array>} Lista de logs
   */
  async findByConvocatoria(convocatoriaId) {
    return await this.db('communication_logs')
      .whereNull('deleted_at')
      .where('related_convocatoria_id', convocatoriaId)
      .orderBy('created_at', 'desc');
  }

  /**
   * Buscar logs por acta
   * @param {string} minuteId - ID da acta
   * @returns {Promise<Array>} Lista de logs
   */
  async findByMinute(minuteId) {
    return await this.db('communication_logs')
      .whereNull('deleted_at')
      .where('related_minute_id', minuteId)
      .orderBy('created_at', 'desc');
  }

  /**
   * Atualizar status de log
   * @param {string} id - ID do log
   * @param {string} status - Novo status
   * @param {Object} additionalData - Dados adicionais (erro, metadata, etc)
   * @returns {Promise<Object>} Log atualizado
   */
  async updateStatus(id, status, additionalData = {}) {
    const updateData = {
      status,
      ...additionalData
    };

    // Atualizar timestamp correspondente ao status
    const now = new Date();
    switch (status) {
      case 'sent':
        updateData.sent_at = now;
        break;
      case 'delivered':
        updateData.delivered_at = now;
        break;
      case 'opened':
        updateData.opened_at = now;
        break;
      case 'confirmed':
        updateData.confirmed_at = now;
        break;
      case 'failed':
        updateData.failed_at = now;
        break;
    }

    return await this.update(id, updateData);
  }

  /**
   * Contar logs com filtros
   * @param {Object} filters - Filtros
   * @returns {Promise<number>} Total de logs
   */
  async count(filters = {}) {
    let query = this.db('communication_logs')
      .whereNull('deleted_at');

    if (filters.buildingId) {
      query = query.where('building_id', filters.buildingId);
    }
    if (filters.communication_type) {
      query = query.where('communication_type', filters.communication_type);
    }
    if (filters.channel) {
      query = query.where('channel', filters.channel);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }

    const result = await query.count('* as count').first();
    return parseInt(result.count);
  }

  /**
   * Obter estatísticas de comunicações
   * @param {string} buildingId - ID do edifício
   * @param {Object} options - Opções (from_date, to_date)
   * @returns {Promise<Object>} Estatísticas
   */
  async getStats(buildingId, options = {}) {
    let query = this.db('communication_logs')
      .whereNull('deleted_at')
      .where('building_id', buildingId);

    if (options.from_date) {
      query = query.where('created_at', '>=', options.from_date);
    }
    if (options.to_date) {
      query = query.where('created_at', '<=', options.to_date);
    }

    const result = await query
      .select(
        this.db.raw('COUNT(*) as total'),
        this.db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as sent', ['sent']),
        this.db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as delivered', ['delivered']),
        this.db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as opened', ['opened']),
        this.db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as confirmed', ['confirmed']),
        this.db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed', ['failed']),
        this.db.raw('COUNT(CASE WHEN channel = ? THEN 1 END) as by_email', ['email']),
        this.db.raw('COUNT(CASE WHEN channel = ? THEN 1 END) as by_whatsapp', ['whatsapp']),
        this.db.raw('COUNT(CASE WHEN channel = ? THEN 1 END) as by_correio', ['correio_certificado'])
      )
      .first();

    const total = parseInt(result.total);
    const sent = parseInt(result.sent);
    const delivered = parseInt(result.delivered);
    const opened = parseInt(result.opened);

    return {
      total,
      sent: parseInt(result.sent),
      delivered: parseInt(result.delivered),
      opened: parseInt(result.opened),
      confirmed: parseInt(result.confirmed),
      failed: parseInt(result.failed),
      by_email: parseInt(result.by_email),
      by_whatsapp: parseInt(result.by_whatsapp),
      by_correio: parseInt(result.by_correio),
      // Taxas calculadas
      delivery_rate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : 0,
      open_rate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0
    };
  }

  /**
   * Obter estatísticas por tipo de comunicação
   * @param {string} buildingId - ID do edifício
   * @returns {Promise<Array>} Estatísticas por tipo
   */
  async getStatsByType(buildingId) {
    return await this.db('communication_logs')
      .whereNull('deleted_at')
      .where('building_id', buildingId)
      .groupBy('communication_type')
      .select(
        'communication_type',
        this.db.raw('COUNT(*) as total'),
        this.db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as delivered', ['delivered']),
        this.db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed', ['failed'])
      );
  }

  /**
   * Obter timeline de comunicações de um membro
   * @param {string} memberId - ID do membro
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>} Timeline ordenado
   */
  async getTimeline(memberId, limit = 50) {
    return await this.db('communication_logs')
      .whereNull('deleted_at')
      .where('member_id', memberId)
      .select(
        'id',
        'communication_type',
        'channel',
        'subject',
        'status',
        'created_at',
        'sent_at',
        'delivered_at',
        'opened_at',
        'confirmed_at',
        'failed_at',
        'error_message'
      )
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = new CommunicationLogRepository();
