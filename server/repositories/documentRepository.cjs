const db = require('../db.cjs');

class DocumentRepository {
  constructor() {
    this.knex = db.knex;
  }

  async transaction(callback) {
    return this.knex.transaction(callback);
  }

  // Documents CRUD
  async findAll(filters = {}) {
    const query = this.knex('documents as d')
      .select(
        'd.*',
        'b.name as building_name',
        'm.name as member_name',
        'dc.name as category_name',
        'dc.color as category_color',
        'dc.icon as category_icon'
      )
      .leftJoin('buildings as b', 'd.building_id', 'b.id')
      .leftJoin('members as m', 'd.member_id', 'm.id')
      .leftJoin('document_categories as dc', function() {
        this.on('d.building_id', '=', 'dc.building_id')
          .andOn('d.category', '=', 'dc.name');
      })
      .whereNull('d.deleted_at');

    // Apply filters
    if (filters.building_id) {
      query.where('d.building_id', filters.building_id);
    }

    if (filters.member_id) {
      query.where('d.member_id', filters.member_id);
    }

    if (filters.category) {
      query.where('d.category', filters.category);
    }

    if (filters.subcategory) {
      query.where('d.subcategory', filters.subcategory);
    }

    if (filters.visibility) {
      query.where('d.visibility', filters.visibility);
    }

    if (filters.is_confidential !== undefined) {
      query.where('d.is_confidential', filters.is_confidential);
    }

    if (filters.is_current_version !== undefined) {
      query.where('d.is_current_version', filters.is_current_version);
    }

    if (filters.file_type) {
      query.where('d.file_extension', filters.file_type);
    }

    if (filters.tags && filters.tags.length > 0) {
      query.whereRaw('d.tags && ?', [filters.tags]);
    }

    if (filters.search_query) {
      query.whereRaw(
        'd.search_vector @@ plainto_tsquery(\'spanish\', ?)',
        [filters.search_query]
      );
    }

    if (filters.date_from) {
      query.where('d.uploaded_at', '>=', filters.date_from);
    }

    if (filters.date_to) {
      query.where('d.uploaded_at', '<=', filters.date_to);
    }

    // Pagination
    if (filters.limit) {
      query.limit(filters.limit);
      if (filters.offset) {
        query.offset(filters.offset);
      }
    }

    // Sorting
    if (filters.order_by) {
      const direction = filters.order_dir || 'desc';
      query.orderBy(filters.order_by, direction);
    } else {
      query.orderBy('d.uploaded_at', 'desc');
    }

    return query;
  }

  async findById(id) {
    return this.knex('documents as d')
      .select(
        'd.*',
        'b.name as building_name',
        'm.name as member_name',
        'dc.name as category_name',
        'dc.color as category_color',
        'dc.icon as category_icon',
        'u.name as uploaded_by_name'
      )
      .leftJoin('buildings as b', 'd.building_id', 'b.id')
      .leftJoin('members as m', 'd.member_id', 'm.id')
      .leftJoin('document_categories as dc', function() {
        this.on('d.building_id', '=', 'dc.building_id')
          .andOn('d.category', '=', 'dc.name');
      })
      .leftJoin('users as u', 'd.uploaded_by', 'u.id')
      .where('d.id', id)
      .whereNull('d.deleted_at')
      .first();
  }

  async create(documentData) {
    // Update search vector
    const searchVector = this.knex.raw(
      'setweight(to_tsvector(\'spanish\', ?), \'A\') || ' +
      'setweight(to_tsvector(\'spanish\', COALESCE(?, \'\')), \'B\') || ' +
      'setweight(to_tsvector(\'spanish\', COALESCE(array_to_string(?, \' \'), \'\')), \'C\')',
      [documentData.name, documentData.description || '', documentData.tags || []]
    );

    const dataWithSearchVector = {
      ...documentData,
      search_vector: searchVector
    };

    return this.knex('documents')
      .insert(dataWithSearchVector)
      .returning('*')
      .then(rows => rows[0]);
  }

  async update(id, updateData) {
    // If updating searchable fields, update search vector
    if (updateData.name || updateData.description || updateData.tags) {
      const doc = await this.findById(id);
      if (doc) {
        const searchVector = this.knex.raw(
          'setweight(to_tsvector(\'spanish\', ?), \'A\') || ' +
          'setweight(to_tsvector(\'spanish\', COALESCE(?, \'\')), \'B\') || ' +
          'setweight(to_tsvector(\'spanish\', COALESCE(array_to_string(?, \' \'), \'\')), \'C\')',
          [
            updateData.name || doc.name,
            updateData.description || doc.description || '',
            updateData.tags || doc.tags || []
          ]
        );
        updateData.search_vector = searchVector;
      }
    }

    return this.knex('documents')
      .where('id', id)
      .whereNull('deleted_at')
      .update(updateData)
      .returning('*')
      .then(rows => rows[0]);
  }

  async delete(id) {
    return this.knex('documents')
      .where('id', id)
      .del() // Hard delete - documents table doesn't have deleted_at column
      .returning('*')
      .then(rows => rows[0]);
  }

  async hardDelete(id) {
    return this.knex('documents')
      .where('id', id)
      .del()
      .returning('*')
      .then(rows => rows[0]);
  }

  // Version Control
  async findVersions(parentDocumentId) {
    return this.knex('documents')
      .where('parent_document_id', parentDocumentId)
      .whereNull('deleted_at')
      .orderBy('version', 'desc');
  }

  async findLatestVersion(parentDocumentId) {
    return this.knex('documents')
      .where('parent_document_id', parentDocumentId)
      .whereNull('deleted_at')
      .orderBy('version', 'desc')
      .first();
  }

  async updateVersionStatus(parentDocumentId, newCurrentVersionId) {
    return this.transaction(async (trx) => {
      // Mark all versions as not current
      await trx('documents')
        .where('parent_document_id', parentDocumentId)
        .orWhere('id', parentDocumentId)
        .update({ is_current_version: false });

      // Mark the new version as current
      await trx('documents')
        .where('id', newCurrentVersionId)
        .update({ is_current_version: true });
    });
  }

  // Access Control
  async incrementDownloadCount(id) {
    return this.knex('documents')
      .where('id', id)
      .increment('download_count', 1)
      .update({ last_accessed_at: this.knex.fn.now() })
      .returning('*')
      .then(rows => rows[0]);
  }

  // Document Shares
  async createShare(shareData) {
    return this.knex('document_shares')
      .insert(shareData)
      .returning('*')
      .then(rows => rows[0]);
  }

  async findSharesByDocumentId(documentId) {
    return this.knex('document_shares as ds')
      .select('ds.*', 'm.name as member_name', 'u.name as shared_by_name')
      .leftJoin('members as m', 'ds.member_id', 'm.id')
      .leftJoin('users as u', 'ds.shared_by', 'u.id')
      .where('ds.document_id', documentId)
      ; // .where('ds.deleted_at', null); // document_shares table doesn't have deleted_at column
  }

  async findShareByDocumentAndMember(documentId, memberId) {
    return this.knex('document_shares')
      .where('document_id', documentId)
      .where('member_id', memberId)
      // .where('deleted_at', null) // documents table doesn't have deleted_at column
      .where(function() {
        this.where('expires_at', null)
          .orWhere('expires_at', '>', this.knex.fn.now());
      })
      .first();
  }

  async deleteShare(id) {
    return this.knex('document_shares')
      .where('id', id)
      .del() // Hard delete - documents table doesn't have deleted_at column
      .returning('*')
      .then(rows => rows[0]);
  }

  // Document Categories
  async findAllCategories(buildingId) {
    return this.knex('document_categories')
      .where('building_id', buildingId)
      // .where('deleted_at', null) // documents table doesn't have deleted_at column
      .orderBy('sort_order', 'asc');
  }

  async findCategoryById(id) {
    return this.knex('document_categories')
      .where('id', id)
      // .where('deleted_at', null) // documents table doesn't have deleted_at column
      .first();
  }

  async createCategory(categoryData) {
    // Get the next sort order
    const maxSortOrder = await this.knex('document_categories')
      .where('building_id', categoryData.building_id)
      // .where('deleted_at', null) // documents table doesn't have deleted_at column
      .max('sort_order as max')
      .first();

    const nextSortOrder = (maxSortOrder?.max || 0) + 1;

    return this.knex('document_categories')
      .insert({
        ...categoryData,
        sort_order: categoryData.sort_order || nextSortOrder
      })
      .returning('*')
      .then(rows => rows[0]);
  }

  async updateCategory(id, updateData) {
    return this.knex('document_categories')
      .where('id', id)
      // .where('deleted_at', null) // documents table doesn't have deleted_at column
      .update(updateData)
      .returning('*')
      .then(rows => rows[0]);
  }

  async deleteCategory(id) {
    return this.knex('document_categories')
      .where('id', id)
      .del() // Hard delete - documents table doesn't have deleted_at column
      .returning('*')
      .then(rows => rows[0]);
  }

  // Statistics
  async getStats(buildingId) {
    const stats = await this.knex('documents')
      .where('building_id', buildingId)
      .whereNull('deleted_at')
      .select(
        this.knex.raw('COUNT(*) as total_documents'),
        this.knex.raw('SUM(file_size) as total_size'),
        this.knex.raw('COUNT(DISTINCT category) as total_categories'),
        this.knex.raw('SUM(download_count) as total_downloads')
      )
      .first();

    const byCategory = await this.knex('documents')
      .where('building_id', buildingId)
      .whereNull('deleted_at')
      .groupBy('category')
      .select(
        'category',
        this.knex.raw('COUNT(*) as count'),
        this.knex.raw('SUM(file_size) as size')
      );

    const recentDocuments = await this.findAll({
      building_id: buildingId,
      limit: 5,
      order_by: 'uploaded_at',
      order_dir: 'desc'
    });

    return {
      total_documents: parseInt(stats.total_documents || 0),
      total_size: parseInt(stats.total_size || 0),
      total_categories: parseInt(stats.total_categories || 0),
      total_downloads: parseInt(stats.total_downloads || 0),
      by_category: byCategory,
      recent_documents: recentDocuments
    };
  }

  // Count for pagination
  async count(filters = {}) {
    const query = this.knex('documents as d')
      .whereNull('d.deleted_at')
      .count('* as count');

    // Apply same filters as findAll but without joins for performance
    if (filters.building_id) {
      query.where('d.building_id', filters.building_id);
    }

    if (filters.member_id) {
      query.where('d.member_id', filters.member_id);
    }

    if (filters.category) {
      query.where('d.category', filters.category);
    }

    if (filters.visibility) {
      query.where('d.visibility', filters.visibility);
    }

    if (filters.is_current_version !== undefined) {
      query.where('d.is_current_version', filters.is_current_version);
    }

    if (filters.search_query) {
      query.whereRaw(
        'd.search_vector @@ plainto_tsquery(\'spanish\', ?)',
        [filters.search_query]
      );
    }

    const result = await query.first();
    return parseInt(result?.count || 0);
  }
}

module.exports = new DocumentRepository();