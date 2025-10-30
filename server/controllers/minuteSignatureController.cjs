/**
 * Minute Signature Controller
 *
 * Endpoints para gestão de assinaturas digitais das actas
 *
 * Legal compliance:
 * - Lei n.º 8/2022: Assinaturas eletrónicas válidas para actas
 * - LPH Art. 19º: Presidente + Secretário obrigatórios
 * - eIDAS 910/2014: Assinaturas qualificadas = manuscritas
 */

const MinuteSignatureRepository = require('../repositories/minuteSignatureRepository.cjs');
const { successResponse, errorResponse } = require('../utils/response.cjs');

class MinuteSignatureController {
  constructor(pool) {
    this.repository = new MinuteSignatureRepository(pool);
  }

  /**
   * Get all signatures for a minute
   * GET /api/minutes/:minuteId/signatures
   */
  getSignaturesByMinute = async (req, res, next) => {
    try {
      const { minuteId } = req.params;

      const signatures = await this.repository.findByMinuteId(minuteId);

      return successResponse(res, {
        signatures,
        count: signatures.length
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new signature for a minute
   * POST /api/minutes/:minuteId/signatures
   *
   * Body:
   * {
   *   signer_type: 'president' | 'secretary' | 'member',
   *   signer_name: string,
   *   signature: string (Base64 PNG),
   *   rubric?: string (Base64 PNG),
   *   member_id?: string (UUID, for members),
   *   cmd_signature?: string,
   *   cmd_timestamp?: string,
   *   cmd_certificate?: string
   * }
   */
  createSignature = async (req, res, next) => {
    try {
      const { minuteId } = req.params;
      const {
        signer_type,
        signer_name,
        signature,
        rubric,
        member_id,
        cmd_signature,
        cmd_timestamp,
        cmd_certificate
      } = req.body;

      // Validation
      if (!signer_type || !['president', 'secretary', 'member'].includes(signer_type)) {
        return errorResponse(res, 'signer_type deve ser "president", "secretary" ou "member"', 400);
      }

      if (!signer_name || !signer_name.trim()) {
        return errorResponse(res, 'signer_name é obrigatório', 400);
      }

      if (!signature || !signature.trim()) {
        return errorResponse(res, 'signature é obrigatória', 400);
      }

      // Get client IP and User-Agent for audit trail
      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.get('user-agent');

      // Check if signature already exists for this minute + signer_type
      const existing = await this.repository.findByMinuteAndType(minuteId, signer_type);
      if (existing) {
        return errorResponse(
          res,
          `Já existe uma assinatura de ${signer_type} para esta acta. Use PUT para atualizar.`,
          409
        );
      }

      const signatureData = await this.repository.createSignature({
        minute_id: minuteId,
        member_id,
        signer_type,
        signer_name,
        signature,
        rubric,
        cmd_signature,
        cmd_timestamp,
        cmd_certificate,
        ip_address,
        user_agent
      });

      // Check if all required signatures are present
      const signatureStatus = await this.repository.checkRequiredSignatures(minuteId);

      return successResponse(res, {
        signature: signatureData,
        status: signatureStatus,
        message: signatureStatus.isComplete
          ? 'Assinatura guardada. Acta completa (Presidente + Secretário assinaram).'
          : 'Assinatura guardada. Falta assinatura obrigatória.'
      }, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing signature
   * PUT /api/minutes/:minuteId/signatures/:signatureId
   *
   * Body:
   * {
   *   signature?: string,
   *   rubric?: string,
   *   cmd_signature?: string,
   *   cmd_timestamp?: string,
   *   cmd_certificate?: string
   * }
   */
  updateSignature = async (req, res, next) => {
    try {
      const { signatureId } = req.params;
      const updateData = req.body;

      if (Object.keys(updateData).length === 0) {
        return errorResponse(res, 'Nenhum campo para atualizar', 400);
      }

      const updatedSignature = await this.repository.updateSignature(signatureId, updateData);

      if (!updatedSignature) {
        return errorResponse(res, 'Assinatura não encontrada', 404);
      }

      return successResponse(res, {
        signature: updatedSignature,
        message: 'Assinatura atualizada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a signature
   * DELETE /api/minutes/:minuteId/signatures/:signatureId
   */
  deleteSignature = async (req, res, next) => {
    try {
      const { signatureId } = req.params;

      const deleted = await this.repository.deleteSignature(signatureId);

      if (!deleted) {
        return errorResponse(res, 'Assinatura não encontrada', 404);
      }

      return successResponse(res, {
        message: 'Assinatura removida com sucesso'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if minute has required signatures
   * GET /api/minutes/:minuteId/signatures/status
   */
  checkSignatureStatus = async (req, res, next) => {
    try {
      const { minuteId } = req.params;

      const status = await this.repository.checkRequiredSignatures(minuteId);

      return successResponse(res, {
        ...status,
        message: status.isComplete
          ? 'Acta completa (Presidente + Secretário assinaram)'
          : 'Faltam assinaturas obrigatórias',
        legal_requirement: 'Art. 19º LPH - Presidente e Secretário devem assinar a acta'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upsert signature (create if not exists, update if exists)
   * POST /api/minutes/:minuteId/signatures/upsert
   *
   * Útil para quando se reabre o workflow e quer atualizar assinatura
   */
  upsertSignature = async (req, res, next) => {
    try {
      const { minuteId } = req.params;
      const {
        signer_type,
        signer_name,
        signature,
        rubric,
        member_id,
        cmd_signature,
        cmd_timestamp,
        cmd_certificate
      } = req.body;

      // Validation
      if (!signer_type || !['president', 'secretary', 'member'].includes(signer_type)) {
        return errorResponse(res, 'signer_type deve ser "president", "secretary" ou "member"', 400);
      }

      if (!signer_name || !signer_name.trim()) {
        return errorResponse(res, 'signer_name é obrigatório', 400);
      }

      if (!signature || !signature.trim()) {
        return errorResponse(res, 'signature é obrigatória', 400);
      }

      // Get client IP and User-Agent for audit trail
      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.get('user-agent');

      const signatureData = await this.repository.upsertSignature({
        minute_id: minuteId,
        member_id,
        signer_type,
        signer_name,
        signature,
        rubric,
        cmd_signature,
        cmd_timestamp,
        cmd_certificate,
        ip_address,
        user_agent
      });

      const signatureStatus = await this.repository.checkRequiredSignatures(minuteId);

      return successResponse(res, {
        signature: signatureData,
        status: signatureStatus,
        message: 'Assinatura guardada com sucesso'
      }, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get signature statistics for a building
   * GET /api/buildings/:buildingId/signature-stats
   */
  getSignatureStats = async (req, res, next) => {
    try {
      const { buildingId } = req.params;

      const stats = await this.repository.getSignatureStats(buildingId);

      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = MinuteSignatureController;
