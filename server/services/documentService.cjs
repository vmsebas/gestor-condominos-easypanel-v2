const documentRepository = require('../repositories/documentRepository.cjs');
const fileStorageService = require('./fileStorageService.cjs');
const path = require('path');

// Supported file types configuration
const SUPPORTED_FILE_TYPES = {
  '.pdf': { maxSize: 50 * 1024 * 1024, category: 'document' },
  '.jpg': { maxSize: 10 * 1024 * 1024, category: 'image' },
  '.jpeg': { maxSize: 10 * 1024 * 1024, category: 'image' },
  '.png': { maxSize: 10 * 1024 * 1024, category: 'image' },
  '.gif': { maxSize: 5 * 1024 * 1024, category: 'image' },
  '.doc': { maxSize: 25 * 1024 * 1024, category: 'document' },
  '.docx': { maxSize: 25 * 1024 * 1024, category: 'document' },
  '.xls': { maxSize: 25 * 1024 * 1024, category: 'spreadsheet' },
  '.xlsx': { maxSize: 25 * 1024 * 1024, category: 'spreadsheet' },
  '.txt': { maxSize: 1 * 1024 * 1024, category: 'text' },
  '.csv': { maxSize: 5 * 1024 * 1024, category: 'spreadsheet' }
};

// Default document categories
const DEFAULT_CATEGORIES = [
  { name: 'financial', description: 'Documentos financeiros', color: '#10B981', icon: 'DollarSign' },
  { name: 'legal', description: 'Documentos legais e contratos', color: '#6366F1', icon: 'Scale' },
  { name: 'maintenance', description: 'Relatórios de manutenção', color: '#F59E0B', icon: 'Wrench' },
  { name: 'meeting', description: 'Atas e convocatórias', color: '#8B5CF6', icon: 'Users' },
  { name: 'insurance', description: 'Apólices de seguro', color: '#EF4444', icon: 'Shield' },
  { name: 'correspondence', description: 'Correspondência oficial', color: '#3B82F6', icon: 'Mail' },
  { name: 'blueprints', description: 'Plantas e projetos técnicos', color: '#14B8A6', icon: 'FileText' },
  { name: 'general', description: 'Documentos gerais', color: '#6B7280', icon: 'File' }
];

class DocumentService {
  async list(filters = {}, user) {
    // Apply access control based on user role
    const accessFilters = this.applyAccessFilters(filters, user);
    
    // Get total count for pagination
    const total = await documentRepository.count(accessFilters);
    
    // Calculate pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;
    
    const documents = await documentRepository.findAll({
      ...accessFilters,
      limit,
      offset
    });
    
    return {
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id, user) {
    const document = await documentRepository.findById(id);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check access permissions
    if (!this.canAccessDocument(document, user)) {
      throw new Error('Access denied');
    }
    
    return document;
  }

  async upload(file, documentData, user) {
    // Validate file
    const ext = path.extname(file.originalname).toLowerCase();
    const fileConfig = SUPPORTED_FILE_TYPES[ext];
    
    if (!fileConfig) {
      throw new Error(`File type ${ext} not supported`);
    }
    
    fileStorageService.validateFile(file, Object.keys(SUPPORTED_FILE_TYPES), fileConfig.maxSize);
    
    // Save file to storage
    const { filename, filepath, size } = await fileStorageService.saveFile(file);
    
    // Prepare document data - Store only filename, not full path for security
    const document = {
      building_id: documentData.building_id,
      member_id: documentData.member_id || null,
      name: documentData.name || file.originalname,
      original_name: file.originalname,
      file_path: filename, // Store only filename, not full path
      file_size: size,
      mime_type: file.mimetype || fileStorageService.getMimeType(file.originalname),
      file_extension: ext,
      category: documentData.category || 'general',
      subcategory: documentData.subcategory || null,
      tags: documentData.tags || [],
      description: documentData.description || null,
      version: documentData.version || 1,
      parent_document_id: documentData.parent_document_id || null,
      is_current_version: true,
      visibility: documentData.visibility || 'building',
      is_confidential: documentData.is_confidential || false,
      access_level: documentData.access_level || 'read',
      uploaded_by: user.id,
      uploaded_at: new Date()
    };
    
    // Handle version control
    if (document.parent_document_id) {
      // Get the latest version
      const latestVersion = await documentRepository.findLatestVersion(document.parent_document_id);
      document.version = latestVersion ? latestVersion.version + 1 : 1;
      
      // Update version status in transaction
      return documentRepository.transaction(async (trx) => {
        const newDocument = await documentRepository.create(document);
        await documentRepository.updateVersionStatus(document.parent_document_id, newDocument.id);
        return newDocument;
      });
    }
    
    return documentRepository.create(document);
  }

  async update(id, updateData, user) {
    const document = await documentRepository.findById(id);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check permissions
    if (!this.canEditDocument(document, user)) {
      throw new Error('Access denied');
    }
    
    // Don't allow updating file-related fields
    delete updateData.file_path;
    delete updateData.file_size;
    delete updateData.mime_type;
    delete updateData.file_extension;
    delete updateData.original_name;
    delete updateData.uploaded_by;
    delete updateData.uploaded_at;
    
    return documentRepository.update(id, updateData);
  }

  async delete(id, user) {
    const document = await documentRepository.findById(id);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check permissions
    if (!this.canDeleteDocument(document, user)) {
      throw new Error('Access denied');
    }
    
    // Delete file from storage - reconstruct full path
    const fullFilePath = path.join(process.cwd(), 'uploads', 'documents', document.file_path);
    await fileStorageService.deleteFile(fullFilePath);
    
    // Soft delete from database
    return documentRepository.delete(id);
  }

  async download(id, user) {
    const document = await documentRepository.findById(id);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check access permissions
    if (!this.canAccessDocument(document, user)) {
      throw new Error('Access denied');
    }
    
    // Reconstruct full file path from filename stored in database
    const path = require('path');
    const fullFilePath = path.join(process.cwd(), 'uploads', 'documents', document.file_path);
    
    // Check if file exists
    const exists = await fileStorageService.fileExists(fullFilePath);
    if (!exists) {
      throw new Error('File not found in storage');
    }
    
    // Increment download count
    await documentRepository.incrementDownloadCount(id);
    
    return {
      filepath: fullFilePath,
      filename: document.original_name,
      mimetype: document.mime_type
    };
  }

  async createNewVersion(parentDocumentId, file, versionData, user) {
    const parentDocument = await documentRepository.findById(parentDocumentId);
    
    if (!parentDocument) {
      throw new Error('Parent document not found');
    }
    
    // Check permissions
    if (!this.canEditDocument(parentDocument, user)) {
      throw new Error('Access denied');
    }
    
    // Upload as new version
    return this.upload(file, {
      ...versionData,
      building_id: parentDocument.building_id,
      member_id: parentDocument.member_id,
      category: parentDocument.category,
      subcategory: parentDocument.subcategory,
      parent_document_id: parentDocumentId,
      visibility: parentDocument.visibility,
      is_confidential: parentDocument.is_confidential,
      access_level: parentDocument.access_level
    }, user);
  }

  async getVersionHistory(documentId, user) {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check access permissions
    if (!this.canAccessDocument(document, user)) {
      throw new Error('Access denied');
    }
    
    // Get all versions
    const parentId = document.parent_document_id || document.id;
    const versions = await documentRepository.findVersions(parentId);
    
    // Include the parent document if needed
    if (!document.parent_document_id) {
      versions.unshift(document);
    }
    
    return versions;
  }

  // Document Sharing
  async shareDocument(documentId, shareData, user) {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check permissions
    if (!this.canShareDocument(document, user)) {
      throw new Error('Access denied');
    }
    
    // Check if share already exists
    const existingShare = await documentRepository.findShareByDocumentAndMember(
      documentId,
      shareData.member_id
    );
    
    if (existingShare) {
      throw new Error('Document already shared with this member');
    }
    
    return documentRepository.createShare({
      document_id: documentId,
      member_id: shareData.member_id,
      permission: shareData.permission || 'read',
      shared_by: user.id,
      shared_at: new Date(),
      expires_at: shareData.expires_at || null
    });
  }

  async getDocumentShares(documentId, user) {
    const document = await documentRepository.findById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check permissions
    if (!this.canEditDocument(document, user)) {
      throw new Error('Access denied');
    }
    
    return documentRepository.findSharesByDocumentId(documentId);
  }

  async removeShare(shareId, user) {
    return documentRepository.deleteShare(shareId);
  }

  // Categories
  async getCategories(buildingId) {
    const categories = await documentRepository.findAllCategories(buildingId);
    
    // If no custom categories, return defaults
    if (categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    
    return categories;
  }

  async createCategory(categoryData, user) {
    // Check if user can manage building
    if (!this.canManageBuilding(categoryData.building_id, user)) {
      throw new Error('Access denied');
    }
    
    return documentRepository.createCategory(categoryData);
  }

  async updateCategory(id, updateData, user) {
    const category = await documentRepository.findCategoryById(id);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Check if user can manage building
    if (!this.canManageBuilding(category.building_id, user)) {
      throw new Error('Access denied');
    }
    
    return documentRepository.updateCategory(id, updateData);
  }

  async deleteCategory(id, user) {
    const category = await documentRepository.findCategoryById(id);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Check if user can manage building
    if (!this.canManageBuilding(category.building_id, user)) {
      throw new Error('Access denied');
    }
    
    return documentRepository.deleteCategory(id);
  }

  // Statistics
  async getStats(buildingId, user) {
    // Check if user can access building
    if (!this.canAccessBuilding(buildingId, user)) {
      throw new Error('Access denied');
    }
    
    return documentRepository.getStats(buildingId);
  }

  // Access Control Helpers
  applyAccessFilters(filters, user) {
    const accessFilters = { ...filters };

    if (!user) {
      accessFilters.is_confidential = false;
      if (!accessFilters.building_id && DEFAULT_BUILDING_ID) {
        accessFilters.building_id = DEFAULT_BUILDING_ID;
      }
      return accessFilters;
    }

    // Super admins can see everything
    if (user.role === 'super_admin') {
      return accessFilters;
    }
    
    // Admin/managers can see all documents in their building
    if (['admin', 'manager'].includes(user.role)) {
      if (user.buildingId) {
        accessFilters.building_id = user.buildingId;
      }
      return accessFilters;
    }
    
    // Members can only see non-confidential documents
    if (user.role === 'member') {
      accessFilters.is_confidential = false;
      if (user.buildingId) {
        accessFilters.building_id = user.buildingId;
      }
      // TODO: Add logic for shared documents
    }
    
    return accessFilters;
  }

  canAccessDocument(document, user) {
    if (!user) return false;
    // Super admins can access everything
    if (user.role === 'super_admin') return true;

    // Check building access
    if (document.building_id !== user.buildingId) return false;
    
    // Admins and managers can access all documents in their building
    if (['admin', 'manager'].includes(user.role)) return true;
    
    // Members check
    if (user.role === 'member') {
      // Can't access confidential documents
      if (document.is_confidential) return false;
      
      // Check visibility
      if (document.visibility === 'admin_only') return false;
      if (document.visibility === 'members_only' || document.visibility === 'building') return true;
      
      // Check if document is shared with member
      // TODO: Implement share check
    }
    
    return false;
  }

  canEditDocument(document, user) {
    if (!user) return false;
    // Super admins can edit everything
    if (user.role === 'super_admin') return true;

    // Must be in same building
    if (document.building_id !== user.buildingId) return false;
    
    // Admins and managers can edit
    if (['admin', 'manager'].includes(user.role)) return true;
    
    // Members can only edit if they uploaded it
    if (user.role === 'member' && document.uploaded_by === user.id) return true;
    
    return false;
  }

  canDeleteDocument(document, user) {
    // Same as edit permissions for now
    return this.canEditDocument(document, user);
  }

  canShareDocument(document, user) {
    if (!user) return false;
    // Super admins and admins can share
    if (['super_admin', 'admin'].includes(user.role)) return true;
    
    // Managers can share non-confidential documents
    if (user.role === 'manager' && !document.is_confidential) return true;
    
    // Document owner can share their own documents
    if (document.uploaded_by === user.id) return true;
    
    return false;
  }

  canManageBuilding(buildingId, user) {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (['admin', 'manager'].includes(user.role) && user.buildingId === buildingId) return true;
    return false;
  }

  canAccessBuilding(buildingId, user) {
    if (!user) {
      return !buildingId || buildingId === DEFAULT_BUILDING_ID;
    }
    if (user.role === 'super_admin') return true;
    return user.buildingId === buildingId;
  }
}

module.exports = new DocumentService();
