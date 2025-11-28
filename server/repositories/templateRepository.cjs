const BaseRepository = require('./baseRepository.cjs');

/**
 * Repositório para templates de cartas
 */
class TemplateRepository extends BaseRepository {
  constructor() {
    super('letter_templates');
  }

  /**
   * Buscar templates por edifício (ou globais)
   */
  async findByBuilding(buildingId) {
    return await this.db('letter_templates')
      .where(function() {
        this.where('building_id', buildingId)
            .orWhereNull('building_id'); // Templates globais
      })
      .where('is_active', true)
      .orderBy('name', 'asc');
  }

  /**
   * Buscar templates por tipo
   */
  async findByType(type, buildingId = null) {
    let query = this.db('letter_templates')
      .where('type', type)
      .where('is_active', true);

    if (buildingId) {
      query = query.where(function() {
        this.where('building_id', buildingId)
            .orWhereNull('building_id');
      });
    }

    return await query.orderBy('name', 'asc');
  }

  /**
   * Buscar todos os templates (incluindo inativos)
   */
  async findAll(filters = {}) {
    let query = this.db('letter_templates');

    if (filters.buildingId) {
      query = query.where(function() {
        this.where('building_id', filters.buildingId)
            .orWhereNull('building_id');
      });
    }

    if (filters.type) {
      query = query.where('type', filters.type);
    }

    if (filters.isActive !== undefined) {
      query = query.where('is_active', filters.isActive);
    }

    return await query.orderBy('name', 'asc');
  }

  /**
   * Ativar/desativar template
   */
  async toggleActive(id) {
    const template = await this.findById(id);
    if (!template) throw new Error('Template não encontrado');

    return await this.update(id, { is_active: !template.is_active });
  }

  /**
   * Duplicar template
   */
  async duplicate(id, newName) {
    const template = await this.findById(id);
    if (!template) throw new Error('Template não encontrado');

    const newTemplate = {
      building_id: template.building_id,
      name: newName || `${template.name} (Cópia)`,
      type: template.type,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      legal_basis: template.legal_basis,
      required_fields: template.required_fields,
      validation_rules: template.validation_rules,
      title: template.title,
      is_active: true
    };

    return await this.create(newTemplate);
  }

  /**
   * Contar templates por tipo
   */
  async countByType(buildingId = null) {
    let query = this.db('letter_templates')
      .select('type')
      .count('* as count')
      .groupBy('type');

    if (buildingId) {
      query = query.where(function() {
        this.where('building_id', buildingId)
            .orWhereNull('building_id');
      });
    }

    return await query;
  }

  /**
   * Buscar template por nome exato (para evitar duplicados)
   */
  async findByName(name, buildingId = null) {
    let query = this.db('letter_templates')
      .where('name', name);

    if (buildingId) {
      query = query.where('building_id', buildingId);
    }

    return await query.first();
  }
}

module.exports = new TemplateRepository();
