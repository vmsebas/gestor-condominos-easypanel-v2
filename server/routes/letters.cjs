const express = require('express');
const router = express.Router();
const letterRepository = require('../repositories/letterRepository.cjs');
const templateRepository = require('../repositories/templateRepository.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');
const { validate, schemas } = require('../middleware/validation.cjs');
const { authenticate, authorize } = require('../middleware/auth.cjs');

router.use(authenticate);

// ============== LETTER TEMPLATES ==============
// IMPORTANTE: Estas rutas deben estar ANTES de /:id para evitar conflictos

/**
 * GET /api/letters/templates
 * Listar templates
 */
router.get('/templates', asyncHandler(async (req, res) => {
  const { building_id, type } = req.query;

  let templates;
  if (type) {
    templates = await templateRepository.findByType(type, building_id);
  } else if (building_id) {
    templates = await templateRepository.findByBuilding(building_id);
  } else {
    templates = await templateRepository.findAll();
  }

  return res.json({ success: true, data: templates });
}));

/**
 * GET /api/letters/templates/:id
 * Ver template por ID
 */
router.get('/templates/:id',
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    return res.json({ success: true, data: template });
  })
);

/**
 * POST /api/letters/templates
 * Criar novo template
 */
router.post('/templates',
  authorize('super_admin', 'admin', 'manager'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.create(req.body);
    return res.status(201).json({
      success: true,
      data: template,
      message: 'Template criado com sucesso'
    });
  })
);

/**
 * PUT /api/letters/templates/:id
 * Atualizar template
 */
router.put('/templates/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.update(req.params.id, req.body);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    return res.json({
      success: true,
      data: template,
      message: 'Template atualizado com sucesso'
    });
  })
);

/**
 * DELETE /api/letters/templates/:id
 * Eliminar template
 */
router.delete('/templates/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const deleted = await templateRepository.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Template eliminado com sucesso'
    });
  })
);

/**
 * POST /api/letters/templates/:id/duplicate
 * Duplicar template
 */
router.post('/templates/:id/duplicate',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const template = await templateRepository.duplicate(req.params.id, name);
    return res.status(201).json({
      success: true,
      data: template,
      message: 'Template duplicado com sucesso'
    });
  })
);

/**
 * PATCH /api/letters/templates/:id/toggle-active
 * Ativar/desativar template
 */
router.patch('/templates/:id/toggle-active',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const template = await templateRepository.toggleActive(req.params.id);
    return res.json({
      success: true,
      data: template,
      message: `Template ${template.is_active ? 'ativado' : 'desativado'} com sucesso`
    });
  })
);

// ============== SENT LETTERS ==============

/**
 * GET /api/letters
 * Listar cartas com paginação
 */
router.get('/', asyncHandler(async (req, res) => {
  const { building_id, page = 1, limit = 20, ...filters } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const letters = await letterRepository.findAllWithFilters(
    { buildingId: building_id, ...filters },
    { limit: parseInt(limit), offset, orderDesc: true }
  );

  // Contar total
  const total = await letterRepository.count({ buildingId: building_id, ...filters });

  return res.json({
    success: true,
    data: letters,
    pagination: {
      total,
      page: parseInt(page),
      pageSize: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * GET /api/letters/stats/:buildingId
 * Estatísticas de cartas
 */
router.get('/stats/:buildingId', asyncHandler(async (req, res) => {
  const { buildingId } = req.params;
  const stats = await letterRepository.getStats(buildingId);

  return res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/letters/:id
 * Ver carta por ID
 */
router.get('/:id',
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const letter = await letterRepository.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'Carta não encontrada'
      });
    }

    return res.json({ success: true, data: letter });
  })
);

/**
 * POST /api/letters
 * Criar nova carta
 */
router.post('/',
  authorize('super_admin', 'admin', 'manager'),
  asyncHandler(async (req, res) => {
    const letter = await letterRepository.create(req.body);
    return res.status(201).json({
      success: true,
      data: letter,
      message: 'Carta criada com sucesso'
    });
  })
);

/**
 * PUT /api/letters/:id
 * Atualizar carta
 */
router.put('/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const letter = await letterRepository.update(req.params.id, req.body);

    if (!letter) {
      return res.status(404).json({
        success: false,
        error: 'Carta não encontrada'
      });
    }

    return res.json({
      success: true,
      data: letter,
      message: 'Carta atualizada com sucesso'
    });
  })
);

/**
 * DELETE /api/letters/:id
 * Eliminar carta
 */
router.delete('/:id',
  authorize('super_admin', 'admin', 'manager'),
  validate(schemas.idParam, 'params'),
  asyncHandler(async (req, res) => {
    const deleted = await letterRepository.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Carta não encontrada'
      });
    }

    return res.json({
      success: true,
      message: 'Carta eliminada com sucesso'
    });
  })
);

module.exports = router;
