const BaseRepository = require('./baseRepository.cjs');

/**
 * Repositorio para la entidad Member
 */
class MemberRepository extends BaseRepository {
  constructor() {
    super('members');
  }

  /**
   * Encuentra miembros por edificio
   */
  async findByBuilding(buildingId, options = {}) {
    let query = this.db('members')
      .where('building_id', buildingId);
      // .whereNull('deleted_at') - members table doesn't have deleted_at column
    
    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }
    
    if (options.search) {
      query = query.where(function() {
        this.whereRaw('LOWER(name) LIKE LOWER(?)', [`%${options.search}%`])
          .orWhereRaw('LOWER(apartment) LIKE LOWER(?)', [`%${options.search}%`])
          .orWhereRaw('LOWER(email) LIKE LOWER(?)', [`%${options.search}%`]);
      });
    }
    
    return query.orderBy('apartment');
  }

  /**
   * Encuentra miembros por edificio con paginación
   */
  async findByBuildingPaginated(buildingId, options = {}) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const orderBy = options.orderBy || 'apartment';
    const orderDesc = options.orderDesc || false;
    const offset = (page - 1) * pageSize;

    // Build base query
    let query = this.db('members')
      .where('building_id', buildingId);
    
    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }
    
    if (options.search) {
      query = query.where(function() {
        this.whereRaw('LOWER(name) LIKE LOWER(?)', [`%${options.search}%`])
          .orWhereRaw('LOWER(apartment) LIKE LOWER(?)', [`%${options.search}%`])
          .orWhereRaw('LOWER(email) LIKE LOWER(?)', [`%${options.search}%`]);
      });
    }

    // Get total count
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const totalCount = parseInt(count) || 0;

    // Apply ordering and pagination
    query = query.orderBy(orderBy, orderDesc ? 'desc' : 'asc');
    if (orderBy !== 'apartment') {
      query = query.orderBy('apartment', 'asc'); // Secondary sort by apartment
    }
    
    const members = await query.limit(pageSize).offset(offset);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      members,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  }

  /**
   * Encuentra todos los miembros con paginación (sin filtro de edificio)
   */
  async findAllPaginated(options = {}) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const orderBy = options.orderBy || 'apartment';
    const orderDesc = options.orderDesc || false;
    const offset = (page - 1) * pageSize;

    // Build base query
    let query = this.db('members');
    
    if (options.isActive !== undefined) {
      query = query.where('is_active', options.isActive);
    }
    
    if (options.search) {
      query = query.where(function() {
        this.whereRaw('LOWER(name) LIKE LOWER(?)', [`%${options.search}%`])
          .orWhereRaw('LOWER(apartment) LIKE LOWER(?)', [`%${options.search}%`])
          .orWhereRaw('LOWER(email) LIKE LOWER(?)', [`%${options.search}%`]);
      });
    }

    // Get total count
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const totalCount = parseInt(count) || 0;

    // Apply ordering and pagination
    query = query.orderBy(orderBy, orderDesc ? 'desc' : 'asc');
    if (orderBy !== 'apartment') {
      query = query.orderBy('apartment', 'asc'); // Secondary sort by apartment
    }
    
    const members = await query.limit(pageSize).offset(offset);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      members,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  }

  /**
   * Encuentra un miembro con información extendida
   */
  async findByIdWithDetails(id) {
    const member = await this.findById(id);
    if (!member) {
      return null;
    }

    // Obtener estadísticas financieras
    const financialStats = await this.db('transactions')
      .where('member_id', id)
      // .whereNull('deleted_at') - transactions table doesn't have deleted_at column
      .select(
        this.db.raw('COUNT(*) as total_transactions'),
        this.db.raw('SUM(CASE WHEN transaction_type = \'income\' THEN amount ELSE 0 END) as total_paid'),
        this.db.raw('SUM(CASE WHEN transaction_type = \'expense\' THEN amount ELSE 0 END) as total_expenses')
      )
      .first();

    // Obtener atrasos (en lugar de payment_month_assignments que no existe)
    const pendingPayments = await this.db('arrears')
      .where('member_id', id)
      .where('is_paid', false)
      .count('* as count')
      .first()
      .catch(() => ({ count: 0 })); // Si la consulta falla, retornar 0

    return {
      ...member,
      financial_stats: {
        total_transactions: parseInt(financialStats.total_transactions) || 0,
        total_paid: parseFloat(financialStats.total_paid) || 0,
        total_expenses: parseFloat(financialStats.total_expenses) || 0,
        pending_payments: parseInt(pendingPayments.count) || 0
      }
    };
  }

  /**
   * Obtiene el perfil completo de un miembro
   */
  async getMemberProfile(id) {
    const member = await this.findByIdWithDetails(id);
    if (!member) {
      return null;
    }

    // Obtener últimas transacciones
    const recentTransactions = await this.db('transactions')
      .where('member_id', id)
      // .whereNull('deleted_at') - transactions table doesn't have deleted_at column
      .orderBy('transaction_date', 'desc')
      .limit(10);

    // Obtener documentos compartidos
    const sharedDocuments = await this.db('document_shares as ds')
      .join('documents as d', 'd.id', 'ds.document_id')
      .where('ds.member_id', id)
      // .whereNull('d.deleted_at') - documents table doesn't have deleted_at column
      .select('d.*')
      .orderBy('d.created_at', 'desc')
      .limit(5);

    return {
      ...member,
      recent_transactions: recentTransactions,
      shared_documents: sharedDocuments
    };
  }

  /**
   * Actualiza las cuotas de un miembro
   */
  async updateFees(id, fees) {
    return this.update(id, {
      old_annual_fee: fees.oldAnnualFee,
      old_monthly_fee: fees.oldMonthlyFee,
      new_annual_fee: fees.newAnnualFee,
      new_monthly_fee: fees.newMonthlyFee
    });
  }

  /**
   * Obtiene estadísticas de miembros por edificio
   */
  async getBuildingMemberStats(buildingId) {
    const result = await this.db('members')
      .where('building_id', buildingId)
      // .whereNull('deleted_at') - members table doesn't have deleted_at column
      .select(
        this.db.raw('COUNT(*) as total'),
        this.db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active'),
        this.db.raw('COUNT(CASE WHEN is_active = false THEN 1 END) as inactive'),
        this.db.raw('SUM(votes) as total_votes'),
        this.db.raw('SUM(permilage) as total_permilage')
      )
      .first();
    
    return {
      total: parseInt(result.total) || 0,
      active: parseInt(result.active) || 0,
      inactive: parseInt(result.inactive) || 0,
      total_votes: parseInt(result.total_votes) || 0,
      total_permilage: parseFloat(result.total_permilage) || 0
    };
  }

  /**
   * Busca miembros deudores
   */
  async findDebtors(buildingId) {
    const result = await this.db('members as m')
      .leftJoin(
        this.db('payment_month_assignments as pma')
          .where('pma.is_paid', false)
          // .whereNull('pma.deleted_at') - payment_month_assignments table doesn't have deleted_at column
          .select('member_id', this.db.raw('COUNT(*) as unpaid_months'))
          .groupBy('member_id')
          .as('pma'),
        'pma.member_id',
        'm.id'
      )
      .where('m.building_id', buildingId)
      // .whereNull('m.deleted_at') - members table doesn't have deleted_at column
      .where('m.is_active', true)
      .whereNotNull('pma.unpaid_months')
      .select(
        'm.*',
        'pma.unpaid_months',
        this.db.raw('m.new_monthly_fee * pma.unpaid_months as total_debt')
      )
      .orderBy('pma.unpaid_months', 'desc');
    
    return result;
  }
}

module.exports = new MemberRepository();