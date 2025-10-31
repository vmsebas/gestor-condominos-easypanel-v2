/**
 * Minute Signature Repository
 *
 * Gestão de assinaturas digitais das actas de assembleia
 * Suporta assinaturas simples (Base64 PNG) e Chave Móvel Digital (CMD)
 *
 * Legal compliance:
 * - Lei n.º 8/2022 (assinaturas eletrónicas válidas)
 * - Regulamento eIDAS 910/2014 (assinaturas qualificadas)
 * - LPH Art. 19º (Presidente + Secretário obrigatórios)
 */

const BaseRepository = require('./baseRepository.cjs');

class MinuteSignatureRepository extends BaseRepository {
  constructor(pool) {
    super(pool, 'minute_signatures');
  }

  /**
   * Find all signatures for a specific minute
   * @param {string} minuteId - UUID of the minute
   * @returns {Promise<Array>} Array of signatures
   */
  async findByMinuteId(minuteId) {
    const query = `
      SELECT
        ms.*,
        m.name as member_name,
        m.apartment,
        m.fraction
      FROM ${this.tableName} ms
      LEFT JOIN members m ON ms.member_id = m.id
      WHERE ms.minute_id = $1
      ORDER BY
        CASE ms.signer_type
          WHEN 'president' THEN 1
          WHEN 'secretary' THEN 2
          WHEN 'member' THEN 3
        END,
        ms.created_at ASC
    `;

    const result = await this.pool.query(query, [minuteId]);
    return result.rows;
  }

  /**
   * Find signature by minute and signer type
   * @param {string} minuteId - UUID of the minute
   * @param {string} signerType - 'president', 'secretary', or 'member'
   * @returns {Promise<Object|null>} Signature or null
   */
  async findByMinuteAndType(minuteId, signerType) {
    const query = `
      SELECT ms.*
      FROM ${this.tableName} ms
      WHERE ms.minute_id = $1 AND ms.signer_type = $2
      LIMIT 1
    `;

    const result = await this.pool.query(query, [minuteId, signerType]);
    return result.rows[0] || null;
  }

  /**
   * Create a new signature
   * @param {Object} data - Signature data
   * @returns {Promise<Object>} Created signature
   */
  async createSignature(data) {
    const {
      minute_id,
      member_id = null,
      signer_type,
      signer_name,
      signature,
      rubric = null,
      cmd_signature = null,
      cmd_timestamp = null,
      cmd_certificate = null,
      ip_address = null,
      user_agent = null
    } = data;

    const query = `
      INSERT INTO ${this.tableName} (
        minute_id,
        member_id,
        signer_type,
        signer_name,
        signature,
        rubric,
        cmd_signature,
        cmd_timestamp,
        cmd_certificate,
        signed_at,
        ip_address,
        user_agent,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      minute_id,
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
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update signature (e.g., add rubric later)
   * @param {string} id - Signature ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated signature
   */
  async updateSignature(id, data) {
    const {
      signature,
      rubric,
      cmd_signature,
      cmd_timestamp,
      cmd_certificate
    } = data;

    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (signature !== undefined) {
      updates.push(`signature = $${paramCounter++}`);
      values.push(signature);
    }
    if (rubric !== undefined) {
      updates.push(`rubric = $${paramCounter++}`);
      values.push(rubric);
    }
    if (cmd_signature !== undefined) {
      updates.push(`cmd_signature = $${paramCounter++}`);
      values.push(cmd_signature);
    }
    if (cmd_timestamp !== undefined) {
      updates.push(`cmd_timestamp = $${paramCounter++}`);
      values.push(cmd_timestamp);
    }
    if (cmd_certificate !== undefined) {
      updates.push(`cmd_certificate = $${paramCounter++}`);
      values.push(cmd_certificate);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE ${this.tableName}
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete signature
   * @param {string} id - Signature ID
   * @returns {Promise<boolean>} Success
   */
  async deleteSignature(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Check if minute has required signatures (President + Secretary)
   * @param {string} minuteId - UUID of the minute
   * @returns {Promise<Object>} { hasPresident: boolean, hasSecretary: boolean, isComplete: boolean }
   */
  async checkRequiredSignatures(minuteId) {
    const query = `
      SELECT
        COUNT(CASE WHEN signer_type = 'president' THEN 1 END) as president_count,
        COUNT(CASE WHEN signer_type = 'secretary' THEN 1 END) as secretary_count
      FROM ${this.tableName}
      WHERE minute_id = $1
    `;

    const result = await this.pool.query(query, [minuteId]);
    const { president_count, secretary_count } = result.rows[0];

    return {
      hasPresident: parseInt(president_count) > 0,
      hasSecretary: parseInt(secretary_count) > 0,
      isComplete: parseInt(president_count) > 0 && parseInt(secretary_count) > 0
    };
  }

  /**
   * Get signature statistics for a building
   * @param {string} buildingId - UUID of the building
   * @returns {Promise<Object>} Statistics
   */
  async getSignatureStats(buildingId) {
    const query = `
      SELECT
        COUNT(DISTINCT ms.minute_id) as total_signed_minutes,
        COUNT(CASE WHEN ms.signer_type = 'president' THEN 1 END) as president_signatures,
        COUNT(CASE WHEN ms.signer_type = 'secretary' THEN 1 END) as secretary_signatures,
        COUNT(CASE WHEN ms.signer_type = 'member' THEN 1 END) as member_signatures,
        COUNT(CASE WHEN ms.cmd_signature IS NOT NULL THEN 1 END) as cmd_signatures
      FROM ${this.tableName} ms
      INNER JOIN minutes m ON ms.minute_id = m.id
      WHERE m.building_id = $1
    `;

    const result = await this.pool.query(query, [buildingId]);
    return result.rows[0];
  }

  /**
   * Upsert signature (update if exists, create if not)
   * Used for updating signatures when re-opening workflow
   * @param {Object} data - Signature data
   * @returns {Promise<Object>} Created/updated signature
   */
  async upsertSignature(data) {
    const existing = await this.findByMinuteAndType(data.minute_id, data.signer_type);

    if (existing) {
      return this.updateSignature(existing.id, data);
    } else {
      return this.createSignature(data);
    }
  }
}

module.exports = MinuteSignatureRepository;
