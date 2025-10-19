const BaseRepository = require('./baseRepository.cjs');

/**
 * Repositorio para la entidad Convocatoria
 */
class ConvocatoriaRepository extends BaseRepository {
  constructor() {
    super('convocatorias');
  }

  /**
   * Encuentra convocatorias por edificio con agenda items
   */
  async findByBuildingWithAgenda(buildingId) {
    const convocatorias = await this.db('convocatorias')
      .where('building_id', buildingId)
      // .whereNull('deleted_at') - convocatorias table doesn't have deleted_at column
      .orderBy('date', 'desc');
    
    // For now, set empty agenda items since the table structure doesn't support it
    for (const convocatoria of convocatorias) {
      convocatoria.agenda_items = [];
    }
    
    return convocatorias;
  }

  /**
   * Encuentra todas las convocatorias con agenda items
   */
  async findAllWithAgenda(filters = {}, options = {}) {
    let query = this.db('convocatorias')
      // .whereNull('deleted_at') - convocatorias table doesn't have deleted_at column
      .join('buildings', 'convocatorias.building_id', 'buildings.id')
      .select(
        'convocatorias.*',
        'buildings.name as building_name',
        'buildings.address as building_address',
        'buildings.postal_code',
        'buildings.city'
      );
    
    if (filters.buildingId) {
      query = query.where('convocatorias.building_id', filters.buildingId);
    }
    
    if (filters.assemblyType) {
      query = query.where('assembly_type', filters.assemblyType);
    }
    
    if (filters.fromDate) {
      query = query.where('date', '>=', filters.fromDate);
    }
    
    if (filters.toDate) {
      query = query.where('date', '<=', filters.toDate);
    }
    
    // Aplicar ordenamiento
    const orderBy = options.orderBy || 'date';
    const orderDirection = options.orderDesc ? 'desc' : 'asc';
    query = query.orderBy(`convocatorias.${orderBy}`, orderDirection);
    
    // Aplicar paginación si se especifica
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    const convocatorias = await query;
    
    // For now, set empty agenda items since the table structure doesn't support it
    for (const convocatoria of convocatorias) {
      convocatoria.agenda_items = [];
    }
    
    return convocatorias;
  }

  /**
   * Encuentra una convocatoria por ID con agenda items
   */
  async findByIdWithAgenda(id) {
    const convocatoria = await this.findById(id);
    
    if (!convocatoria) {
      return null;
    }
    
    // For now, set empty agenda items since the table structure doesn't support it
    convocatoria.agenda_items = [];
    
    return convocatoria;
  }

  /**
   * Cuenta convocatorias con los mismos filtros
   */
  async count(filters = {}) {
    let query = this.db('convocatorias')
      .count('* as count');
    
    if (filters.buildingId) {
      query = query.where('building_id', filters.buildingId);
    }
    
    if (filters.assemblyType) {
      query = query.where('assembly_type', filters.assemblyType);
    }
    
    if (filters.fromDate) {
      query = query.where('date', '>=', filters.fromDate);
    }
    
    if (filters.toDate) {
      query = query.where('date', '<=', filters.toDate);
    }
    
    const result = await query.first();
    return parseInt(result.count || 0);
  }

  /**
   * Crea una convocatoria con agenda items
   */
  async createWithAgenda(convocatoriaData, agendaItems = []) {
    return this.transaction(async (trx) => {
      // Crear convocatoria
      const convocatoria = await trx('convocatorias')
        .insert(convocatoriaData)
        .returning('*')
        .then(rows => rows[0]);
      
      // Crear agenda items si existen
      if (agendaItems.length > 0) {
        const itemsToInsert = agendaItems.map((item, index) => ({
          convocatoria_id: convocatoria.id,
          title: item.title,
          description: item.description || null,
          order_number: item.order_number || index + 1,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        await trx('minute_agenda_items').insert(itemsToInsert);
      }
      
      // Retornar con agenda items
      convocatoria.agenda_items = agendaItems;
      return convocatoria;
    });
  }

  /**
   * Actualiza una convocatoria con agenda items
   */
  async updateWithAgenda(id, convocatoriaData, agendaItems = null) {
    return this.transaction(async (trx) => {
      // Actualizar convocatoria
      const convocatoria = await trx('convocatorias')
        .where('id', id)
        // .whereNull('deleted_at') - convocatorias table doesn't have deleted_at column
        .update({
          ...convocatoriaData,
          updated_at: new Date()
        })
        .returning('*')
        .then(rows => rows[0]);
      
      if (!convocatoria) {
        throw new Error('Convocatória não encontrada');
      }
      
      // Si se proporcionan agenda items, actualizarlos
      if (agendaItems !== null) {
        // Eliminar items existentes (hard delete - table doesn't have deleted_at)
        await trx('minute_agenda_items')
          .where('convocatoria_id', id)
          .delete();
        
        // Insertar nuevos items
        if (agendaItems.length > 0) {
          const itemsToInsert = agendaItems.map((item, index) => ({
            convocatoria_id: id,
            title: item.title,
            description: item.description || null,
            order_number: item.order_number || index + 1,
            created_at: new Date(),
            updated_at: new Date()
          }));
          
          await trx('minute_agenda_items').insert(itemsToInsert);
        }
      }
      
      return convocatoria;
    });
  }

  /**
   * Obtiene la próxima convocatoria de un edificio
   */
  async getNextConvocatoria(buildingId) {
    const result = await this.db('convocatorias')
      .where('building_id', buildingId)
      .where('date', '>=', new Date())
      // .whereNull('deleted_at') - table doesn't have deleted_at column
      .orderBy('date', 'asc')
      .first();
    
    if (result) {
      result.agenda_items = await this.db('minute_agenda_items')
        .where('convocatoria_id', result.id)
        // .whereNull('deleted_at') - table doesn't have deleted_at column
        .orderBy('order_number', 'asc');
    }
    
    return result;
  }

  /**
   * Obtiene convocatorias pasadas de un edificio
   */
  async getPastConvocatorias(buildingId, limit = 10) {
    const convocatorias = await this.db('convocatorias')
      .where('building_id', buildingId)
      .where('date', '<', new Date())
      // .whereNull('deleted_at') - table doesn't have deleted_at column
      .orderBy('date', 'desc')
      .limit(limit);
    
    return convocatorias;
  }

  /**
   * Cuenta convocatorias por tipo
   */
  async countByType(buildingId) {
    const result = await this.db('convocatorias')
      .where('building_id', buildingId)
      // .whereNull('deleted_at') - table doesn't have deleted_at column
      .select('assembly_type')
      .count('* as count')
      .groupBy('assembly_type');
    
    return result;
  }

  /**
   * Verifica si existe una convocatoria con el mismo número de asamblea
   */
  async existsAssemblyNumber(buildingId, assemblyNumber, excludeId = null) {
    let query = this.db('convocatorias')
      .where('building_id', buildingId)
      .where('assembly_number', assemblyNumber)
      // .whereNull('deleted_at') - table doesn't have deleted_at column;
    
    if (excludeId) {
      query = query.whereNot('id', excludeId);
    }
    
    const result = await query.count('* as count');
    return parseInt(result[0].count) > 0;
  }

  /**
   * Marca una convocatoria como que ya tiene acta creada
   */
  async markMinutesCreated(id) {
    return this.update(id, { minutes_created: true });
  }
}

module.exports = new ConvocatoriaRepository();