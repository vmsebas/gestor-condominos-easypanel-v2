const convocatoriaService = require('../services/convocatoriaService.cjs');
const { successResponse } = require('../utils/response.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

/**
 * Controlador de convocatorias
 */
class ConvocatoriaController {
  /**
   * GET /api/convocatorias
   * Obtiene todas las convocatorias con filtros opcionales
   */
  getAllConvocatorias = asyncHandler(async (req, res) => {
    const { 
      buildingId, 
      assemblyType, 
      fromDate, 
      toDate,
      page,
      pageSize,
      orderBy,
      orderDesc
    } = req.query;
    
    // Use buildingId from query, or from authenticated user
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    const filters = {
      buildingId: effectiveBuildingId,
      assemblyType,
      fromDate,
      toDate
    };
    
    const options = {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      orderBy: orderBy || 'date',
      orderDesc: orderDesc === 'true'
    };
    
    const result = await convocatoriaService.getAllConvocatorias(filters, options);
    
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  /**
   * GET /api/convocatorias/building/:buildingId
   * Obtiene convocatorias de un edificio específico
   */
  getConvocatoriasByBuilding = asyncHandler(async (req, res) => {
    const { buildingId } = req.params;
    
    const result = await convocatoriaService.getConvocatoriasByBuilding(buildingId);
    
    successResponse(res, result);
  });

  /**
   * GET /api/convocatorias/:id
   * Obtiene una convocatoria por ID
   */
  getConvocatoriaById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const convocatoria = await convocatoriaService.getConvocatoriaById(id);
    
    successResponse(res, convocatoria);
  });

  /**
   * POST /api/convocatorias
   * Crea una nueva convocatoria
   */
  createConvocatoria = asyncHandler(async (req, res) => {
    const convocatoriaData = req.body;
    
    const convocatoria = await convocatoriaService.createConvocatoria(convocatoriaData);
    
    successResponse(res, convocatoria, 'Convocatória criada com sucesso', 201);
  });

  /**
   * PUT /api/convocatorias/:id
   * Actualiza una convocatoria
   */
  updateConvocatoria = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const convocatoria = await convocatoriaService.updateConvocatoria(id, updateData);
    
    successResponse(res, convocatoria, 'Convocatória atualizada com sucesso');
  });

  /**
   * DELETE /api/convocatorias/:id
   * Elimina una convocatoria
   */
  deleteConvocatoria = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await convocatoriaService.deleteConvocatoria(id);
    
    successResponse(res, null, 'Convocatória eliminada com sucesso');
  });

  /**
   * GET /api/convocatorias/next/:buildingId
   * Obtiene la próxima convocatoria de un edificio
   */
  getNextConvocatoria = asyncHandler(async (req, res) => {
    const { buildingId } = req.params;
    
    const convocatoria = await convocatoriaService.getNextConvocatoria(buildingId);
    
    if (!convocatoria) {
      return successResponse(res, null, 'Não há convocatórias próximas');
    }
    
    successResponse(res, convocatoria);
  });

  /**
   * GET /api/convocatorias/stats/:buildingId
   * Obtiene estadísticas de convocatorias
   */
  getConvocatoriaStats = asyncHandler(async (req, res) => {
    const { buildingId } = req.params;
    
    const stats = await convocatoriaService.getConvocatoriaStats(buildingId);
    
    successResponse(res, stats);
  });

  /**
   * POST /api/convocatorias/:id/duplicate
   * Duplica una convocatoria existente
   */
  duplicateConvocatoria = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const template = await convocatoriaService.duplicateConvocatoria(id);
    
    successResponse(res, template, 'Modelo de convocatória criado');
  });

  /**
   * POST /api/convocatorias/:id/minutes
   * Marca una convocatoria como que tiene acta creada
   */
  markMinutesCreated = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await convocatoriaRepository.markMinutesCreated(id);
    
    successResponse(res, null, 'Convocatória marcada com ata criada');
  });

  /**
   * POST /api/convocatorias/generate-number
   * Genera un número de asamblea automático
   */
  generateAssemblyNumber = asyncHandler(async (req, res) => {
    const { buildingId, assemblyType } = req.body;
    
    if (!buildingId || !assemblyType) {
      throw new AppError('ID do edifício e tipo de assembleia são obrigatórios', 400, null);
    }
    
    const assemblyNumber = await convocatoriaService.generateAssemblyNumber(buildingId, assemblyType);
    
    successResponse(res, { assembly_number: assemblyNumber });
  });
}

// Importar después de definir la clase
const { AppError } = require('../utils/errors.cjs');
const convocatoriaRepository = require('../repositories/convocatoriaRepository.cjs');

module.exports = new ConvocatoriaController();