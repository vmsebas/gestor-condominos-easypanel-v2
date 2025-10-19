const convocatoriaRepository = require('../repositories/convocatoriaRepository.cjs');
const buildingRepository = require('../repositories/buildingRepository.cjs');
const { AppError } = require('../utils/errors.cjs');

/**
 * Servicio de convocatorias
 */
class ConvocatoriaService {
  /**
   * Obtiene todas las convocatorias con filtros opcionales y paginación
   */
  async getAllConvocatorias(filters = {}, options = {}) {
    // Calcular offset para paginación
    const limit = options.pageSize || 20;
    const offset = options.page ? (options.page - 1) * limit : 0;
    
    // Obtener convocatorias y count total
    const [convocatorias, totalCount] = await Promise.all([
      convocatoriaRepository.findAllWithAgenda(filters, { 
        ...options, 
        limit, 
        offset,
        orderBy: options.orderBy || 'date',
        orderDesc: options.orderDesc
      }),
      convocatoriaRepository.count(filters)
    ]);
    
    return {
      data: convocatorias,
      pagination: {
        page: options.page || 1,
        pageSize: limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: (options.page || 1) < Math.ceil(totalCount / limit),
        hasPreviousPage: (options.page || 1) > 1
      }
    };
  }

  /**
   * Obtiene convocatorias de un edificio específico
   */
  async getConvocatoriasByBuilding(buildingId) {
    // Verificar que el edificio existe
    const building = await buildingRepository.findById(buildingId);
    if (!building) {
      throw new AppError('Edifício não encontrado', 404, null);
    }

    const convocatorias = await convocatoriaRepository.findByBuildingWithAgenda(buildingId);
    
    return {
      building,
      convocatorias,
      stats: {
        total: convocatorias.length,
        upcoming: convocatorias.filter(c => new Date(c.date) >= new Date()).length,
        past: convocatorias.filter(c => new Date(c.date) < new Date()).length
      }
    };
  }

  /**
   * Obtiene una convocatoria por ID
   */
  async getConvocatoriaById(id) {
    const convocatoria = await convocatoriaRepository.findByIdWithAgenda(id);
    
    if (!convocatoria) {
      throw new AppError('Convocatória não encontrada', 404, null);
    }
    
    return convocatoria;
  }

  /**
   * Crea una nueva convocatoria
   */
  async createConvocatoria(data) {
    const {
      building_id,
      assembly_type,
      date,
      time,
      location,
      second_call_enabled,
      second_call_date,
      second_call_time,
      administrator,
      secretary,
      legal_reference,
      assembly_number,
      agenda_items = []
    } = data;

    // Verificar que el edificio existe
    const building = await buildingRepository.findById(building_id);
    if (!building) {
      throw new AppError('Edifício não encontrado', 404, null);
    }

    // Verificar que no existe otra convocatoria con el mismo número de asamblea
    if (assembly_number) {
      const exists = await convocatoriaRepository.existsAssemblyNumber(building_id, assembly_number);
      if (exists) {
        throw new AppError('Já existe uma convocatória com esse número de assembleia', 409, null);
      }
    }

    // Validar fechas
    const meetingDate = new Date(date);
    if (meetingDate < new Date()) {
      throw new AppError('A data da convocatória não pode ser no passado', 400, null);
    }

    if (second_call_enabled && second_call_date) {
      const secondCallDate = new Date(second_call_date);
      if (secondCallDate < meetingDate) {
        throw new AppError('A segunda convocatória não pode ser antes da primeira', 400, null);
      }
    }

    // Preparar datos de la convocatoria
    const convocatoriaData = {
      building_id,
      building_name: building.name,
      building_address: building.address,
      postal_code: building.postal_code,
      city: building.city,
      assembly_number: assembly_number || await this.generateAssemblyNumber(building_id, assembly_type),
      assembly_type,
      date: meetingDate,
      time,
      location: location || building.address,
      second_call_enabled: second_call_enabled || false,
      second_call_date,
      second_call_time,
      administrator: administrator || building.administrator,
      secretary,
      legal_reference: legal_reference || this.getDefaultLegalReference(assembly_type),
      minutes_created: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Crear convocatoria con agenda items
    const convocatoria = await convocatoriaRepository.createWithAgenda(convocatoriaData, agenda_items);
    
    return convocatoria;
  }

  /**
   * Actualiza una convocatoria
   */
  async updateConvocatoria(id, data) {
    const convocatoria = await convocatoriaRepository.findById(id);
    
    if (!convocatoria) {
      throw new AppError('Convocatória não encontrada', 404, null);
    }

    // No permitir actualizar si ya tiene acta creada
    if (convocatoria.minutes_created && !data.force_update) {
      throw new AppError('No se puede actualizar una convocatoria que ya tiene acta creada', 400, null);
    }

    // Validar número de asamblea si se está cambiando
    if (data.assembly_number && data.assembly_number !== convocatoria.assembly_number) {
      const exists = await convocatoriaRepository.existsAssemblyNumber(
        convocatoria.building_id, 
        data.assembly_number, 
        id
      );
      if (exists) {
        throw new AppError('Já existe uma convocatória com esse número de assembleia', 409, null);
      }
    }

    // Separar agenda items del resto de datos
    const { agenda_items, force_update, ...convocatoriaData } = data;

    // Actualizar
    const updated = await convocatoriaRepository.updateWithAgenda(id, convocatoriaData, agenda_items);
    
    return updated;
  }

  /**
   * Elimina una convocatoria
   */
  async deleteConvocatoria(id) {
    const convocatoria = await convocatoriaRepository.findById(id);
    
    if (!convocatoria) {
      throw new AppError('Convocatória não encontrada', 404, null);
    }

    // No permitir eliminar si tiene acta creada
    if (convocatoria.minutes_created) {
      throw new AppError('No se puede eliminar una convocatoria que tiene acta creada', 400, null);
    }

    // Eliminar (soft delete)
    await convocatoriaRepository.delete(id);
    
    return true;
  }

  /**
   * Obtiene la próxima convocatoria de un edificio
   */
  async getNextConvocatoria(buildingId) {
    const convocatoria = await convocatoriaRepository.getNextConvocatoria(buildingId);
    
    if (!convocatoria) {
      return null;
    }

    // Calcular tiempo restante
    const now = new Date();
    const meetingDate = new Date(convocatoria.date);
    const daysUntil = Math.ceil((meetingDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      ...convocatoria,
      days_until: daysUntil,
      is_soon: daysUntil <= 7
    };
  }

  /**
   * Obtiene estadísticas de convocatorias
   */
  async getConvocatoriaStats(buildingId) {
    const [total, byType, upcoming, past] = await Promise.all([
      convocatoriaRepository.count({ building_id: buildingId }),
      convocatoriaRepository.countByType(buildingId),
      convocatoriaRepository.count({ 
        building_id: buildingId,
        date: { $gte: new Date() }
      }),
      convocatoriaRepository.getPastConvocatorias(buildingId, 5)
    ]);

    return {
      total,
      upcoming,
      by_type: byType,
      recent_past: past
    };
  }

  /**
   * Genera un número de asamblea automático
   */
  async generateAssemblyNumber(buildingId, assemblyType) {
    const year = new Date().getFullYear();
    const count = await convocatoriaRepository.count({
      building_id: buildingId,
      assembly_type: assemblyType,
      created_at: {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      }
    });

    const typeAbbr = assemblyType === 'ordinary' ? 'ORD' : 'EXT';
    return `${typeAbbr}-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  /**
   * Obtiene la referencia legal por defecto según el tipo
   */
  getDefaultLegalReference(assemblyType) {
    if (assemblyType === 'ordinary') {
      return 'Artículo 16 de la Ley 49/1960, de 21 de julio, sobre Propiedad Horizontal';
    } else {
      return 'Artículo 16.2 de la Ley 49/1960, de 21 de julio, sobre Propiedad Horizontal';
    }
  }

  /**
   * Duplica una convocatoria existente
   */
  async duplicateConvocatoria(id) {
    const original = await convocatoriaRepository.findByIdWithAgenda(id);
    
    if (!original) {
      throw new AppError('Convocatória não encontrada', 404, null);
    }

    // Preparar datos para la nueva convocatoria
    const newData = {
      ...original,
      assembly_number: null, // Se generará uno nuevo
      date: null, // Debe establecerse nueva fecha
      minutes_created: false,
      created_at: new Date(),
      updated_at: new Date(),
      agenda_items: original.agenda_items.map(item => ({
        title: item.title,
        description: item.description,
        order_number: item.order_number
      }))
    };

    // Eliminar campos no necesarios
    delete newData.id;
    delete newData.deleted_at;

    return newData; // Retornar como plantilla, no crear directamente
  }
}

module.exports = new ConvocatoriaService();