const buildingRepository = require('../repositories/buildingRepository.cjs');
const { ValidationError, NotFoundError } = require('../utils/errors.cjs');

/**
 * Servicio de lógica de negocio para edificios
 */
class BuildingService {
  /**
   * Obtiene todos los edificios
   */
  async getAllBuildings(filters = {}, options = {}) {
    // Validar opciones de paginación
    if (options.page && options.page < 1) {
      throw new ValidationError('O número da página deve ser maior que 0');
    }
    
    if (options.pageSize && (options.pageSize < 1 || options.pageSize > 100)) {
      throw new ValidationError('O tamanho da página deve estar entre 1 e 100');
    }

    // Calcular offset para paginación
    const limit = options.pageSize || 20;
    const offset = options.page ? (options.page - 1) * limit : 0;

    // Obtener edificios
    const [buildings, totalCount] = await Promise.all([
      buildingRepository.findAll(filters, { 
        ...options, 
        limit, 
        offset,
        orderBy: options.orderBy || 'name'
      }),
      buildingRepository.count(filters)
    ]);

    return {
      data: buildings,
      pagination: {
        page: options.page || 1,
        pageSize: limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Obtiene un edificio por ID
   */
  async getBuildingById(id, includeStats = false) {
    if (!id) {
      throw new ValidationError('ID do edifício é obrigatório');
    }

    let building;
    
    if (includeStats) {
      building = await buildingRepository.findByIdWithMembers(id);
    } else {
      building = await buildingRepository.findById(id);
    }

    if (!building) {
      throw new NotFoundError('Edifício não encontrado');
    }

    return building;
  }

  /**
   * Crea un nuevo edificio
   */
  async createBuilding(data) {
    // Validar datos requeridos
    this.validateBuildingData(data);

    // Verificar si ya existe un edificio con el mismo nombre
    const existingBuildings = await buildingRepository.findAll({ name: data.name });
    if (existingBuildings.length > 0) {
      throw new ValidationError('Já existe um edifício com este nome');
    }

    // Preparar datos para inserción
    const buildingData = {
      ...data,
      number_of_units: data.number_of_units || 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Crear edificio
    const newBuilding = await buildingRepository.create(buildingData);
    
    return newBuilding;
  }

  /**
   * Actualiza un edificio
   */
  async updateBuilding(id, data) {
    if (!id) {
      throw new ValidationError('ID do edifício é obrigatório');
    }

    // Verificar que el edificio existe
    const existingBuilding = await buildingRepository.findById(id);
    if (!existingBuilding) {
      throw new NotFoundError('Edifício não encontrado');
    }

    // Validar datos si se proporcionan campos requeridos
    if (data.name !== undefined || data.address !== undefined) {
      this.validateBuildingData({ 
        ...existingBuilding, 
        ...data 
      });
    }

    // Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (data.name && data.name !== existingBuilding.name) {
      const duplicates = await buildingRepository.findAll({ name: data.name });
      if (duplicates.length > 0) {
        throw new ValidationError('Já existe um edifício com este nome');
      }
    }

    // Actualizar edificio
    const updatedBuilding = await buildingRepository.update(id, data);
    
    return updatedBuilding;
  }

  /**
   * Elimina un edificio
   */
  async deleteBuilding(id, force = false, userId = null) {
    if (!id) {
      throw new ValidationError('ID do edifício é obrigatório');
    }

    // Verificar que el edificio existe (sin filtrar deleted_at)
    const building = await buildingRepository.db('buildings')
      .where('id', id)
      .first();

    if (!building) {
      throw new NotFoundError('Edifício não encontrado');
    }

    // Si ya está eliminado
    if (building.deleted_at) {
      throw new ValidationError('Edifício já foi eliminado');
    }

    // Verificar si tiene registros relacionados
    const relatedRecords = await buildingRepository.hasRelatedRecords(id);
    const hasRelated = relatedRecords.some(r => r.count > 0);

    if (hasRelated && !force) {
      throw new ValidationError(
        'Cannot delete building with related records',
        relatedRecords.filter(r => r.count > 0)
      );
    }

    // Eliminar (soft delete por defecto)
    const deletedBuilding = await buildingRepository.delete(id, userId);

    if (!deletedBuilding) {
      throw new ValidationError('Erro ao eliminar edifício');
    }

    return deletedBuilding;
  }

  /**
   * Obtiene estadísticas de un edificio
   */
  async getBuildingStats(id, year) {
    if (!id) {
      throw new ValidationError('ID do edifício é obrigatório');
    }

    // Verificar que el edificio existe
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new NotFoundError('Edifício não encontrado');
    }

    // Obtener estadísticas financieras
    const financialStats = await buildingRepository.getFinancialStats(id, year);

    // Procesar estadísticas por mes
    const monthlyStats = {};
    financialStats.forEach(stat => {
      const month = stat.month.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { income: 0, expense: 0 };
      }
      monthlyStats[month][stat.transaction_type] = parseFloat(stat.total);
    });

    return {
      building,
      year,
      monthlyStats,
      summary: {
        totalIncome: financialStats
          .filter(s => s.transaction_type === 'income')
          .reduce((sum, s) => sum + parseFloat(s.total), 0),
        totalExpense: financialStats
          .filter(s => s.transaction_type === 'expense')
          .reduce((sum, s) => sum + parseFloat(s.total), 0)
      }
    };
  }

  /**
   * Busca edificios
   */
  async searchBuildings(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      throw new ValidationError('Search term must be at least 2 characters');
    }

    return buildingRepository.search(searchTerm);
  }

  /**
   * Obtiene las fracciones de un edificio
   */
  async getBuildingFractions(buildingId) {
    // Verificar que el edificio existe
    const building = await buildingRepository.findById(buildingId);
    if (!building) {
      throw new NotFoundError('Edifício não encontrado');
    }

    // Obtener las fracciones
    const fractions = await buildingRepository.getFractions(buildingId);
    return fractions;
  }

  /**
   * Valida los datos del edificio
   */
  validateBuildingData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('O nome do edifício é obrigatório');
    }

    if (!data.address || data.address.trim().length === 0) {
      errors.push('A morada do edifício é obrigatória');
    }

    if (data.number_of_units !== undefined && data.number_of_units < 0) {
      errors.push('O número de unidades não pode ser negativo');
    }

    if (data.admin_email && !this.isValidEmail(data.admin_email)) {
      errors.push('Formato de email do administrador inválido');
    }

    if (data.iban && !this.isValidIBAN(data.iban)) {
      errors.push('Formato de IBAN inválido');
    }

    if (errors.length > 0) {
      throw new ValidationError('Dados do edifício inválidos', errors);
    }
  }

  /**
   * Valida formato de email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato básico de IBAN
   */
  isValidIBAN(iban) {
    // Validación básica de IBAN
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    return ibanRegex.test(iban.replace(/\s/g, ''));
  }
}

module.exports = new BuildingService();