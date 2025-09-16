const express = require('express');
const documentController = require('../controllers/documentController.cjs');
const { authenticate, authorize } = require('../middleware/auth.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');
const { uploadMemory } = require('../middleware/upload.cjs');

const router = express.Router();

// ⚠️ AUTENTICACIÓN TEMPORALMENTE DESHABILITADA PARA DEBUGGING
// router.use(authenticate);

// Document CRUD
router.get('/', 
  validate(schemas.document.list, 'query'),
  documentController.list
);

router.get('/:id', 
  validate(schemas.common.idParam, 'params'),
  documentController.getById
);

router.post('/upload',
  authorize(['super_admin', 'admin', 'manager', 'member']),
  uploadMemory.single('file'),
  validate(schemas.document.upload, 'body'),
  documentController.upload
);

router.put('/:id',
  authorize(['super_admin', 'admin', 'manager']),
  validate(schemas.common.idParam, 'params'),
  validate(schemas.document.update, 'body'),
  documentController.update
);

router.delete('/:id',
  authorize(['super_admin', 'admin', 'manager']),
  validate(schemas.common.idParam, 'params'),
  documentController.delete
);

// Download
router.get('/:id/download',
  validate(schemas.common.idParam, 'params'),
  documentController.download
);

// Version control
router.post('/:id/versions',
  authorize(['super_admin', 'admin', 'manager']),
  uploadMemory.single('file'),
  validate(schemas.common.idParam, 'params'),
  validate(schemas.document.version, 'body'),
  documentController.uploadVersion
);

router.get('/:id/versions',
  validate(schemas.common.idParam, 'params'),
  documentController.getVersions
);

// Document sharing
router.post('/:id/share',
  authorize(['super_admin', 'admin', 'manager']),
  validate(schemas.common.idParam, 'params'),
  validate(schemas.document.share, 'body'),
  documentController.shareDocument
);

router.get('/:id/shares',
  authorize(['super_admin', 'admin', 'manager']),
  validate(schemas.common.idParam, 'params'),
  documentController.getShares
);

router.delete('/:id/shares/:shareId',
  authorize(['super_admin', 'admin', 'manager']),
  validate(schemas.common.idParam, 'params'),
  documentController.removeShare
);

// Categories
router.get('/categories/:buildingId',
  validate(schemas.common.uuidParam('buildingId'), 'params'),
  documentController.getCategories
);

router.post('/categories/:buildingId',
  authorize(['super_admin', 'admin', 'manager']),
  validate(schemas.common.uuidParam('buildingId'), 'params'),
  validate(schemas.document.category, 'body'),
  documentController.createCategory
);

router.put('/categories/:categoryId',
  authorize(['super_admin', 'admin', 'manager']),
  validate(schemas.common.idParam('categoryId'), 'params'),
  validate(schemas.document.category, 'body'),
  documentController.updateCategory
);

router.delete('/categories/:categoryId',
  authorize(['super_admin', 'admin']),
  validate(schemas.common.idParam('categoryId'), 'params'),
  documentController.deleteCategory
);

// Statistics
router.get('/stats/:buildingId',
  validate(schemas.common.uuidParam('buildingId'), 'params'),
  documentController.getStats
);

module.exports = router;