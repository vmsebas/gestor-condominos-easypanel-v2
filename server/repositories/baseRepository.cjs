const { db } = require('../config/knex.cjs');
const { DatabaseError } = require('../utils/errors.cjs');

/**
 * Repositorio base con operaciones CRUD comunes
 */
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = db;
    // Define which tables support soft deletes
    this.supportsSoftDelete = ['users'].includes(tableName);
  }

  /**
   * Encuentra todos los registros
   * @param {Object} filters - Filtros opcionales
   * @param {Object} options - Opciones de consulta (orden, límite, etc)
   */
  async findAll(filters = {}, options = {}) {
    try {
      let query = this.db(this.tableName);

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'includeDeleted') {
          query = query.where(key, value);
        }
      });

      // Soft delete por defecto (solo para tablas que lo soporten)
      if (!filters.includeDeleted && this.supportsSoftDelete) {
        query = query.whereNull('deleted_at').orWhere('deleted_at', '>', new Date());
      }

      // Ordenamiento
      if (options.orderBy) {
        const direction = options.orderDesc ? 'desc' : 'asc';
        query = query.orderBy(options.orderBy, direction);
      }

      // Paginación
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.offset(options.offset);
      }

      const result = await query;
      return result;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch ${this.tableName}`, error.message);
    }
  }

  /**
   * Encuentra un registro por ID
   * @param {string} id - ID del registro
   */
  async findById(id) {
    try {
      let query = this.db(this.tableName).where('id', id);
      
      if (this.supportsSoftDelete) {
        query = query.where(function() {
          this.whereNull('deleted_at').orWhere('deleted_at', '>', new Date());
        });
      }
      
      const result = await query.first();
      return result || null;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch ${this.tableName} by id`, error.message);
    }
  }

  /**
   * Cuenta el total de registros
   * @param {Object} filters - Filtros opcionales
   */
  async count(filters = {}) {
    try {
      let query = this.db(this.tableName);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'includeDeleted') {
          query = query.where(key, value);
        }
      });

      if (!filters.includeDeleted && this.supportsSoftDelete) {
        query = query.where(function() {
          this.whereNull('deleted_at').orWhere('deleted_at', '>', new Date());
        });
      }

      const result = await query.count('* as count');
      return parseInt(result[0].count);
    } catch (error) {
      throw new DatabaseError(`Failed to count ${this.tableName}`, error.message);
    }
  }

  /**
   * Crea un nuevo registro
   * @param {Object} data - Datos del registro
   */
  async create(data) {
    try {
      const result = await this.db(this.tableName)
        .insert(data)
        .returning('*');
      return result[0];
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.tableName}`, error.message);
    }
  }

  /**
   * Actualiza un registro
   * @param {string} id - ID del registro
   * @param {Object} data - Datos a actualizar
   */
  async update(id, data) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      let query = this.db(this.tableName).where('id', id);
      
      if (this.supportsSoftDelete) {
        query = query.where(function() {
          this.whereNull('deleted_at').orWhere('deleted_at', '>', new Date());
        });
      }
      
      const result = await query
        .update(updateData)
        .returning('*');
      return result[0] || null;
    } catch (error) {
      throw new DatabaseError(`Failed to update ${this.tableName}`, error.message);
    }
  }

  /**
   * Elimina un registro (soft delete if supported, hard delete otherwise)
   * @param {string} id - ID del registro
   */
  async delete(id) {
    try {
      if (this.supportsSoftDelete) {
        // Soft delete for tables with deleted_at column
        const result = await this.db(this.tableName)
          .where('id', id)
          .where(function() {
            this.whereNull('deleted_at').orWhere('deleted_at', '>', new Date());
          })
          .update({ deleted_at: new Date() })
          .returning('*');
        return result[0] || null;
      } else {
        // Hard delete for tables without deleted_at column
        const result = await this.db(this.tableName)
          .where('id', id)
          .delete()
          .returning('*');
        return result[0] || null;
      }
    } catch (error) {
      throw new DatabaseError(`Failed to delete ${this.tableName}`, error.message);
    }
  }

  /**
   * Elimina permanentemente un registro
   * @param {string} id - ID del registro
   */
  async hardDelete(id) {
    try {
      const result = await this.db(this.tableName)
        .where('id', id)
        .delete()
        .returning('*');
      return result[0] || null;
    } catch (error) {
      throw new DatabaseError(`Failed to permanently delete ${this.tableName}`, error.message);
    }
  }

  /**
   * Ejecuta una consulta personalizada
   * @param {string} query - Consulta SQL
   * @param {Array} params - Parámetros de la consulta
   */
  async executeQuery(query, params = []) {
    try {
      const result = await this.db.raw(query, params);
      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to execute query', error.message);
    }
  }

  /**
   * Ejecuta operaciones dentro de una transacción
   */
  async transaction(callback) {
    return this.db.transaction(callback);
  }
}

module.exports = BaseRepository;