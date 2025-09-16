const documentService = require('../services/documentService.cjs');
const fileStorageService = require('../services/fileStorageService.cjs');
const asyncHandler = require('../utils/asyncHandler.cjs');
const fs = require('fs');

const documentController = {
  // List documents
  list: asyncHandler(async (req, res) => {
    const filters = {
      building_id: req.query.building_id,
      member_id: req.query.member_id,
      category: req.query.category,
      subcategory: req.query.subcategory,
      visibility: req.query.visibility,
      is_confidential: req.query.is_confidential,
      is_current_version: req.query.is_current_version,
      file_type: req.query.file_type,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      search_query: req.query.search_query,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      page: req.query.page,
      limit: req.query.limit,
      order_by: req.query.order_by,
      order_dir: req.query.order_dir
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const result = await documentService.list(filters, req.user);
    
    res.json({
      success: true,
      data: result.documents,
      pagination: result.pagination
    });
  }),

  // Get document by ID
  getById: asyncHandler(async (req, res) => {
    const document = await documentService.getById(req.params.id, req.user);
    
    res.json({
      success: true,
      data: document
    });
  }),

  // Upload new document
  upload: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const documentData = {
      building_id: req.body.building_id,
      member_id: req.body.member_id,
      name: req.body.name,
      category: req.body.category,
      subcategory: req.body.subcategory,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      description: req.body.description,
      version: req.body.version,
      parent_document_id: req.body.parent_document_id,
      visibility: req.body.visibility,
      is_confidential: req.body.is_confidential === 'true',
      access_level: req.body.access_level
    };

    const document = await documentService.upload(req.file, documentData, req.user);
    
    res.status(201).json({
      success: true,
      data: document
    });
  }),

  // Update document metadata
  update: asyncHandler(async (req, res) => {
    const updateData = {
      name: req.body.name,
      category: req.body.category,
      subcategory: req.body.subcategory,
      tags: req.body.tags,
      description: req.body.description,
      visibility: req.body.visibility,
      is_confidential: req.body.is_confidential,
      access_level: req.body.access_level
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const document = await documentService.update(req.params.id, updateData, req.user);
    
    res.json({
      success: true,
      data: document
    });
  }),

  // Delete document
  delete: asyncHandler(async (req, res) => {
    await documentService.delete(req.params.id, req.user);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  }),

  // Download document
  download: asyncHandler(async (req, res) => {
    const { filepath, filename, mimetype } = await documentService.download(req.params.id, req.user);
    
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Use fileStorageService for secure file streaming
    const fileStorageInstance = new fileStorageService();
    const streamFactory = await fileStorageInstance.getFileStream(filepath);
    const stream = streamFactory();
    
    stream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error downloading file'
        });
      }
    });
    
    stream.pipe(res);
  }),

  // Upload new version
  uploadVersion: asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const versionData = {
      name: req.body.name,
      description: req.body.description,
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined
    };

    const document = await documentService.createNewVersion(
      req.params.id,
      req.file,
      versionData,
      req.user
    );
    
    res.status(201).json({
      success: true,
      data: document
    });
  }),

  // Get version history
  getVersions: asyncHandler(async (req, res) => {
    const versions = await documentService.getVersionHistory(req.params.id, req.user);
    
    res.json({
      success: true,
      data: versions
    });
  }),

  // Share document
  shareDocument: asyncHandler(async (req, res) => {
    const shareData = {
      member_id: req.body.member_id,
      permission: req.body.permission,
      expires_at: req.body.expires_at
    };

    const share = await documentService.shareDocument(req.params.id, shareData, req.user);
    
    res.status(201).json({
      success: true,
      data: share
    });
  }),

  // Get document shares
  getShares: asyncHandler(async (req, res) => {
    const shares = await documentService.getDocumentShares(req.params.id, req.user);
    
    res.json({
      success: true,
      data: shares
    });
  }),

  // Remove share
  removeShare: asyncHandler(async (req, res) => {
    await documentService.removeShare(req.params.shareId, req.user);
    
    res.json({
      success: true,
      message: 'Share removed successfully'
    });
  }),

  // Get categories
  getCategories: asyncHandler(async (req, res) => {
    const categories = await documentService.getCategories(req.params.buildingId);
    
    res.json({
      success: true,
      data: categories
    });
  }),

  // Create category
  createCategory: asyncHandler(async (req, res) => {
    const categoryData = {
      building_id: req.params.buildingId,
      name: req.body.name,
      description: req.body.description,
      color: req.body.color,
      icon: req.body.icon,
      parent_category_id: req.body.parent_category_id,
      sort_order: req.body.sort_order
    };

    const category = await documentService.createCategory(categoryData, req.user);
    
    res.status(201).json({
      success: true,
      data: category
    });
  }),

  // Update category
  updateCategory: asyncHandler(async (req, res) => {
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      color: req.body.color,
      icon: req.body.icon,
      parent_category_id: req.body.parent_category_id,
      sort_order: req.body.sort_order
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const category = await documentService.updateCategory(req.params.categoryId, updateData, req.user);
    
    res.json({
      success: true,
      data: category
    });
  }),

  // Delete category
  deleteCategory: asyncHandler(async (req, res) => {
    await documentService.deleteCategory(req.params.categoryId, req.user);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  }),

  // Get statistics
  getStats: asyncHandler(async (req, res) => {
    const stats = await documentService.getStats(req.params.buildingId, req.user);
    
    res.json({
      success: true,
      data: stats
    });
  })
};

module.exports = documentController;