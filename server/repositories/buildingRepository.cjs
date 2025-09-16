const BaseRepository = require('./baseRepository.cjs');

/**
 * Repositorio para la entidad Building
 */
class BuildingRepository extends BaseRepository {
  constructor() {
    super('buildings');
  }

  /**
   * Encuentra edificios con estadísticas
   */
  async findAllWithStats() {
    const result = await this.db('buildings as b')
      .select(
        'b.*',
        this.db.raw('COUNT(DISTINCT m.id) as total_members'),
        this.db.raw('COUNT(DISTINCT CASE WHEN m.is_active = true THEN m.id END) as active_members'),
        this.db.raw('COUNT(DISTINCT t.id) as total_transactions'),
        this.db.raw('COALESCE(SUM(CASE WHEN t.transaction_type = \'income\' THEN t.amount ELSE 0 END), 0) as total_income'),
        this.db.raw('COALESCE(SUM(CASE WHEN t.transaction_type = \'expense\' THEN t.amount ELSE 0 END), 0) as total_expense')
      )
      .leftJoin('members as m', 'm.building_id', 'b.id')
      .leftJoin('transactions as t', 't.building_id', 'b.id')
      // .whereNull('b.deleted_at') - buildings table doesn't have deleted_at column
      .groupBy('b.id')
      .orderBy('b.name');
    
    return result;
  }

  /**
   * Encuentra un edificio con sus miembros
   */
  async findByIdWithMembers(id) {
    const [building, members] = await Promise.all([
      this.db('buildings')
        .where('id', id)
        // .whereNull('deleted_at') - buildings table doesn't have deleted_at column
        .first(),
      this.db('members')
        .where('building_id', id)
        // .whereNull('deleted_at') - members table doesn't have deleted_at column
        .orderBy('apartment')
    ]);
    
    if (!building) {
      return null;
    }
    
    return {
      ...building,
      members
    };
  }

  /**
   * Obtiene estadísticas financieras de un edificio
   */
  async getFinancialStats(buildingId, year = new Date().getFullYear()) {
    const result = await this.db('transactions')
      .select(
        this.db.raw("DATE_TRUNC('month', transaction_date) as month"),
        'transaction_type',
        this.db.raw('SUM(amount) as total'),
        this.db.raw('COUNT(*) as count')
      )
      .where('building_id', buildingId)
      .whereRaw('EXTRACT(YEAR FROM transaction_date) = ?', [year])
      // .whereNull('deleted_at') - transactions table doesn't have deleted_at column
      .groupBy('month', 'transaction_type')
      .orderBy('month');
    
    return result;
  }

  /**
   * Verifica si un edificio tiene registros relacionados
   */
  async hasRelatedRecords(buildingId) {
    const tables = ['members', 'transactions', 'convocatorias', 'documents'];
    const results = [];
    
    for (const table of tables) {
      const result = await this.db(table)
        .where('building_id', buildingId)
        // .whereNull('deleted_at') - these tables don't have deleted_at column
        .count('* as count');
      
      results.push({
        table,
        count: parseInt(result[0].count)
      });
    }
    
    return results;
  }

  /**
   * Busca edificios por nombre o dirección
   */
  async search(searchTerm) {
    const result = await this.db('buildings')
      .where(function() {
        this.whereRaw('LOWER(name) LIKE LOWER(?)', [`%${searchTerm}%`])
          .orWhereRaw('LOWER(address) LIKE LOWER(?)', [`%${searchTerm}%`])
          .orWhereRaw('LOWER(city) LIKE LOWER(?)', [`%${searchTerm}%`]);
      })
      // .whereNull('deleted_at') - buildings table doesn't have deleted_at column
      .orderBy('name');
    
    return result;
  }

  /**
   * Obtiene las fracciones de un edificio
   */
  async getFractions(buildingId) {
    const fractions = await this.db('fractions')
      .where('building_id', buildingId)
      .where('is_active', true)
      .orderBy('unit_number');
    
    return fractions;
  }
}

module.exports = new BuildingRepository();