const buildingService = require('../services/buildingService.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');

/**
 * Controlador para endpoints de edificios
 */
class BuildingController {
  /**
   * GET /api/buildings
   * Obtiene todos los edificios
   */
  getAllBuildings = asyncHandler(async (req, res) => {
    const { page, pageSize, search, orderBy, orderDesc } = req.query;
    
    const filters = {};
    if (search) {
      // El servicio manejará la búsqueda
      const buildings = await buildingService.searchBuildings(search);
      return successResponse(res, buildings);
    }

    const options = {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      orderBy: orderBy || 'name',
      orderDesc: orderDesc === 'true'
    };

    const result = await buildingService.getAllBuildings(filters, options);
    
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  /**
   * GET /api/buildings/:id
   * Obtiene un edificio por ID
   */
  getBuildingById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeStats } = req.query;
    
    const building = await buildingService.getBuildingById(
      id, 
      includeStats === 'true'
    );
    
    return successResponse(res, building);
  });

  /**
   * POST /api/buildings
   * Crea un nuevo edificio
   */
  createBuilding = asyncHandler(async (req, res) => {
    const buildingData = req.body;
    
    const newBuilding = await buildingService.createBuilding(buildingData);
    
    return successResponse(
      res, 
      newBuilding, 
      'Building created successfully', 
      201
    );
  });

  /**
   * PUT /api/buildings/:id
   * Actualiza un edificio
   */
  updateBuilding = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedBuilding = await buildingService.updateBuilding(id, updateData);
    
    return successResponse(
      res, 
      updatedBuilding, 
      'Building updated successfully'
    );
  });

  /**
   * DELETE /api/buildings/:id
   * Elimina un edificio
   */
  deleteBuilding = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { force } = req.query;
    
    await buildingService.deleteBuilding(id, force === 'true');
    
    return successResponse(
      res, 
      null, 
      'Building deleted successfully'
    );
  });

  /**
   * GET /api/buildings/:id/stats
   * Obtiene estadísticas de un edificio
   */
  getBuildingStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { year } = req.query;
    
    const stats = await buildingService.getBuildingStats(
      id, 
      parseInt(year) || new Date().getFullYear()
    );
    
    return successResponse(res, stats);
  });

  /**
   * GET /api/buildings/:id/members
   * Obtiene los miembros de un edificio
   */
  getBuildingMembers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Este endpoint podría moverse a memberController
    // Por ahora, obtenemos el edificio con sus miembros
    const buildingWithMembers = await buildingService.getBuildingById(id, true);
    
    return successResponse(res, buildingWithMembers.members || []);
  });

  /**
   * GET /api/buildings/stats/summary
   * Obtiene resumen de estadísticas de todos los edificios
   */
  getAllBuildingsStats = asyncHandler(async (req, res) => {
    // Obtener todos los edificios con estadísticas básicas
    const result = await buildingService.getAllBuildings({}, {
      includeStats: true
    });
    
    // Calcular totales
    const summary = {
      totalBuildings: result.pagination.totalItems,
      totalUnits: result.data.reduce((sum, b) => sum + (b.number_of_units || 0), 0),
      buildings: result.data
    };
    
    return successResponse(res, summary);
  });

  /**
   * GET /api/buildings/:id/fractions
   * Obtiene las fracciones de un edificio
   */
  getBuildingFractions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fractions = await buildingService.getBuildingFractions(id);
    
    return res.status(200).json({
      success: true,
      data: fractions
    });
  });
}

module.exports = new BuildingController();