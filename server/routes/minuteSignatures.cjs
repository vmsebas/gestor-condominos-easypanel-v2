/**
 * Minute Signatures Routes
 *
 * Rotas para gestão de assinaturas digitais das actas
 *
 * Endpoints:
 * GET    /api/minutes/:minuteId/signatures - List all signatures for minute
 * POST   /api/minutes/:minuteId/signatures - Create new signature
 * PUT    /api/minutes/:minuteId/signatures/:signatureId - Update signature
 * DELETE /api/minutes/:minuteId/signatures/:signatureId - Delete signature
 * GET    /api/minutes/:minuteId/signatures/status - Check signature status
 * POST   /api/minutes/:minuteId/signatures/upsert - Upsert signature
 * GET    /api/buildings/:buildingId/signature-stats - Get statistics
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database.cjs');
const { authenticate } = require('../middleware/auth.cjs');
const MinuteSignatureController = require('../controllers/minuteSignatureController.cjs');

const controller = new MinuteSignatureController(pool);

// All routes require authentication
router.use(authenticate);

// ===== MINUTE SIGNATURE ROUTES =====

/**
 * GET /api/minutes/:minuteId/signatures
 * Get all signatures for a specific minute
 */
router.get('/minutes/:minuteId/signatures', controller.getSignaturesByMinute);

/**
 * GET /api/minutes/:minuteId/signatures/status
 * Check if minute has required signatures (President + Secretary)
 */
router.get('/minutes/:minuteId/signatures/status', controller.checkSignatureStatus);

/**
 * POST /api/minutes/:minuteId/signatures
 * Create a new signature for a minute
 *
 * Body:
 * {
 *   signer_type: 'president' | 'secretary' | 'member',
 *   signer_name: string,
 *   signature: string (Base64 PNG),
 *   rubric?: string (Base64 PNG),
 *   member_id?: string (UUID),
 *   cmd_signature?: string,
 *   cmd_timestamp?: string,
 *   cmd_certificate?: string
 * }
 */
router.post('/minutes/:minuteId/signatures', controller.createSignature);

/**
 * POST /api/minutes/:minuteId/signatures/upsert
 * Create or update signature (useful for re-opening workflow)
 *
 * Body: same as POST /signatures
 */
router.post('/minutes/:minuteId/signatures/upsert', controller.upsertSignature);

/**
 * PUT /api/minutes/:minuteId/signatures/:signatureId
 * Update an existing signature
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
router.put('/minutes/:minuteId/signatures/:signatureId', controller.updateSignature);

/**
 * DELETE /api/minutes/:minuteId/signatures/:signatureId
 * Delete a signature
 */
router.delete('/minutes/:minuteId/signatures/:signatureId', controller.deleteSignature);

// ===== BUILDING STATISTICS ROUTES =====

/**
 * GET /api/buildings/:buildingId/signature-stats
 * Get signature statistics for a building
 */
router.get('/buildings/:buildingId/signature-stats', controller.getSignatureStats);

module.exports = router;
