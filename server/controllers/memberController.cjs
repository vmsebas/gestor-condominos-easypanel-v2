const memberService = require('../services/memberService.cjs');
const { successResponse } = require('../utils/response.cjs');
const { asyncHandler } = require('../middleware/errorHandler.cjs');
const { getFileUrl, deleteOldAvatar } = require('../middleware/upload.cjs');

/**
 * Controlador de miembros
 */
class MemberController {
  /**
   * GET /api/members
   * Obtiene todos los miembros (con filtro de edificio)
   */
  getAllMembers = asyncHandler(async (req, res) => {
    const { buildingId, isActive, search, page, pageSize, orderBy, orderDesc } = req.query;
    
    // Use buildingId from query, or hardcoded default for debugging
    const HARDCODED_BUILDING_ID = '9cf64a8a-8570-4f16-94a5-dd48c694324c';
    const effectiveBuildingId = buildingId || req.user?.buildingId || HARDCODED_BUILDING_ID;
    
    // ⚠️ DEBUGGING: Always allow access with hardcoded building ID
    // if (!effectiveBuildingId && req.user?.role !== 'super_admin') {
    //   const { AppError } = require('../utils/errors.cjs');
    //   throw new AppError('ID de edificio es requerido', 400, null);
    // }
    
    const options = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
      page,
      pageSize,
      orderBy,
      orderDesc
    };
    
    // If no buildingId (super_admin case), get all members
    const result = effectiveBuildingId 
      ? await memberService.getMembersByBuilding(effectiveBuildingId, options)
      : await memberService.getAllMembers(options);
    
    successResponse(res, result);
  });

  /**
   * GET /api/members/:id
   * Obtiene un miembro por ID
   */
  getMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const member = await memberService.getMemberById(id);
    
    successResponse(res, member);
  });

  /**
   * GET /api/members/:id/profile
   * Obtiene el perfil completo de un miembro
   */
  getMemberProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const profile = await memberService.getMemberProfile(id);
    
    successResponse(res, profile);
  });

  /**
   * POST /api/members
   * Crea un nuevo miembro
   */
  createMember = asyncHandler(async (req, res) => {
    const memberData = req.body;
    
    const member = await memberService.createMember(memberData);
    
    successResponse(res, member, 'Membro criado com sucesso', 201);
  });

  /**
   * PUT /api/members/:id
   * Actualiza un miembro
   */
  updateMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const member = await memberService.updateMember(id, updateData);
    
    successResponse(res, member, 'Membro atualizado com sucesso');
  });

  /**
   * DELETE /api/members/:id
   * Elimina un miembro
   */
  deleteMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await memberService.deleteMember(id);
    
    successResponse(res, null, 'Membro eliminado com sucesso');
  });

  /**
   * PUT /api/members/:id/fees
   * Actualiza las cuotas de un miembro
   */
  updateMemberFees = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fees = req.body;
    
    await memberService.updateMemberFees(id, fees);
    
    successResponse(res, null, 'Quotas atualizadas com sucesso');
  });

  /**
   * GET /api/members/debtors
   * Obtiene miembros deudores
   */
  getDebtors = asyncHandler(async (req, res) => {
    const { buildingId } = req.query;
    
    if (!buildingId) {
      throw new AppError('ID do edifício é obrigatório', 400, null);
    }
    
    const result = await memberService.getDebtors(buildingId);
    
    successResponse(res, result);
  });

  /**
   * POST /api/members/import
   * Importa miembros desde CSV
   */
  importMembers = asyncHandler(async (req, res) => {
    const { buildingId } = req.body;
    const csvData = req.file; // Asumiendo que se usa multer
    
    if (!buildingId) {
      throw new AppError('ID do edifício é obrigatório', 400, null);
    }
    
    if (!csvData) {
      throw new AppError('Ficheiro CSV é obrigatório', 400, null);
    }
    
    const result = await memberService.importMembersFromCSV(buildingId, csvData);
    
    successResponse(res, result, 'Membros importados com sucesso');
  });

  /**
   * GET /api/members/export
   * Exporta miembros a CSV
   */
  exportMembers = asyncHandler(async (req, res) => {
    const { buildingId } = req.query;
    
    if (!buildingId) {
      throw new AppError('ID do edifício é obrigatório', 400, null);
    }
    
    const csvData = await memberService.exportMembersToCSV(buildingId);
    
    // TODO: Configurar headers para descarga de CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
    
    res.send(csvData);
  });

  /**
   * POST /api/members/:id/avatar
   * Upload member avatar
   */
  uploadAvatar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    
    // Check permissions: admin, manager, or the member themselves
    const member = await memberService.getMemberById(id);
    const canUpload = user.role === 'super_admin' || 
                     user.role === 'admin' || 
                     user.role === 'manager' ||
                     (user.memberId && user.memberId === id);
    
    if (!canUpload) {
      throw new AppError('Não tem permissão para atualizar este avatar', 403, null);
    }
    
    if (!req.file) {
      throw new AppError('Nenhum ficheiro foi fornecido', 400, null);
    }
    
    // Delete old avatar if exists
    if (member.avatar_url) {
      await deleteOldAvatar(member.avatar_url);
    }
    
    // Get the new avatar URL
    const avatarUrl = getFileUrl(req, req.file.path);
    
    // Update member with new avatar URL
    const updatedMember = await memberService.updateMember(id, { avatar_url: avatarUrl });
    
    successResponse(res, {
      member: updatedMember,
      avatarUrl
    }, 'Avatar atualizado com sucesso');
  });

  /**
   * DELETE /api/members/:id/avatar
   * Delete member avatar
   */
  deleteAvatar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    
    // Check permissions: admin, manager, or the member themselves
    const member = await memberService.getMemberById(id);
    const canDelete = user.role === 'super_admin' || 
                     user.role === 'admin' || 
                     user.role === 'manager' ||
                     (user.memberId && user.memberId === id);
    
    if (!canDelete) {
      throw new AppError('Não tem permissão para eliminar este avatar', 403, null);
    }
    
    // Delete avatar file if exists
    if (member.avatar_url) {
      await deleteOldAvatar(member.avatar_url);
    }
    
    // Update member to remove avatar URL
    const updatedMember = await memberService.updateMember(id, { avatar_url: null });
    
    successResponse(res, {
      member: updatedMember
    }, 'Avatar eliminado com sucesso');
  });
}

// Importar después de definir la clase
const { AppError } = require('../utils/errors.cjs');

module.exports = new MemberController();