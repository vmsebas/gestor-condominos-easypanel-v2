const memberRepository = require('../repositories/memberRepository.cjs');
const buildingRepository = require('../repositories/buildingRepository.cjs');
const { AppError } = require('../utils/errors.cjs');

/**
 * Servicio de miembros
 */
class MemberService {
  /**
   * Obtiene todos los miembros de un edificio
   */
  async getMembersByBuilding(buildingId, options = {}) {
    // Verificar que el edificio existe
    const building = await buildingRepository.findById(buildingId);
    if (!building) {
      throw new AppError('Edifício não encontrado', 404, null);
    }

    const result = await memberRepository.findByBuildingPaginated(buildingId, options);
    
    // Calcular estadísticas
    const stats = await memberRepository.getBuildingMemberStats(buildingId);
    
    return {
      ...result,
      stats
    };
  }

  /**
   * Obtiene un miembro por ID
   */
  async getMemberById(id) {
    const member = await memberRepository.findByIdWithDetails(id);
    
    if (!member) {
      throw new AppError('Membro não encontrado', 404, null);
    }
    
    return member;
  }

  /**
   * Obtiene el perfil completo de un miembro
   */
  async getMemberProfile(id) {
    const profile = await memberRepository.getMemberProfile(id);
    
    if (!profile) {
      throw new AppError('Membro não encontrado', 404, null);
    }
    
    return profile;
  }

  /**
   * Crea un nuevo miembro
   */
  async createMember(data) {
    // Verificar que el edificio existe
    const building = await buildingRepository.findById(data.building_id);
    if (!building) {
      throw new AppError('Edifício não encontrado', 404, null);
    }

    // Verificar si ya existe un miembro con el mismo apartamento
    const existingMembers = await memberRepository.findByBuilding(data.building_id);
    const duplicateApartment = existingMembers.find(
      m => m.apartment.toLowerCase() === data.apartment.toLowerCase()
    );
    
    if (duplicateApartment) {
      throw new AppError('Já existe um membro neste apartamento', 409, null);
    }

    // Crear el miembro
    const member = await memberRepository.create(data);
    
    return member;
  }

  /**
   * Actualiza un miembro
   */
  async updateMember(id, data) {
    const member = await memberRepository.findById(id);
    
    if (!member) {
      throw new AppError('Membro não encontrado', 404, null);
    }

    // Si se está cambiando el apartamento, verificar que no esté duplicado
    if (data.apartment && data.apartment !== member.apartment) {
      const existingMembers = await memberRepository.findByBuilding(member.building_id);
      const duplicateApartment = existingMembers.find(
        m => m.id !== id && m.apartment.toLowerCase() === data.apartment.toLowerCase()
      );
      
      if (duplicateApartment) {
        throw new AppError('Já existe um membro neste apartamento', 409, null);
      }
    }

    // Actualizar el miembro
    const updatedMember = await memberRepository.update(id, data);
    
    return updatedMember;
  }

  /**
   * Elimina un miembro
   */
  async deleteMember(id) {
    const member = await memberRepository.findById(id);
    
    if (!member) {
      throw new AppError('Membro não encontrado', 404, null);
    }

    // Verificar si tiene transacciones asociadas
    const hasTransactions = await this.checkMemberTransactions(id);
    if (hasTransactions) {
      throw new AppError(
        'Não é possível eliminar o membro porque tem transações associadas',
        null,
        409
      );
    }

    // Eliminar el miembro (soft delete)
    await memberRepository.delete(id);
    
    return true;
  }

  /**
   * Actualiza las cuotas de un miembro
   */
  async updateMemberFees(id, fees) {
    const member = await memberRepository.findById(id);
    
    if (!member) {
      throw new AppError('Membro não encontrado', 404, null);
    }

    await memberRepository.updateFees(id, fees);
    
    return true;
  }

  /**
   * Obtiene miembros deudores de un edificio
   */
  async getDebtors(buildingId) {
    // Verificar que el edificio existe
    const building = await buildingRepository.findById(buildingId);
    if (!building) {
      throw new AppError('Edifício não encontrado', 404, null);
    }

    const debtors = await memberRepository.findDebtors(buildingId);
    
    // Calcular totales
    const summary = {
      total_debtors: debtors.length,
      total_debt: debtors.reduce((sum, d) => sum + parseFloat(d.total_debt || 0), 0),
      total_unpaid_months: debtors.reduce((sum, d) => sum + parseInt(d.unpaid_months || 0), 0)
    };
    
    return {
      debtors,
      summary
    };
  }

  /**
   * Verifica si un miembro tiene transacciones
   */
  async checkMemberTransactions(memberId) {
    const result = await memberRepository.db('transactions')
      .where('member_id', memberId)
      .whereNull('deleted_at')
      .count('* as count')
      .first();
    
    return parseInt(result.count) > 0;
  }

  /**
   * Importa miembros desde un archivo CSV
   */
  async importMembersFromCSV(buildingId, csvContent) {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      throw new AppError('CSV vazio ou inválido', 400, null);
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());

    // Validate required columns
    const requiredColumns = ['name'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    if (missingColumns.length > 0) {
      throw new AppError(`Colunas obrigatórias em falta: ${missingColumns.join(', ')}`, 400, null);
    }

    const created = [];
    const updated = [];
    const errors = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser (handles quoted values)
        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let char of line) {
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());

        // Map values to object
        const memberData = {};
        header.forEach((key, index) => {
          const value = values[index] || '';
          memberData[key] = value === '' ? null : value;
        });

        // Convert boolean and numeric fields
        if (memberData.is_owner !== null) {
          memberData.is_owner = memberData.is_owner === 'true' || memberData.is_owner === '1';
        }
        if (memberData.ownership_percentage !== null) {
          memberData.ownership_percentage = parseFloat(memberData.ownership_percentage) || 0;
        }
        if (memberData.permilage !== null) {
          memberData.permilage = parseFloat(memberData.permilage) || 0;
        }
        if (memberData.votes !== null) {
          memberData.votes = parseInt(memberData.votes) || 0;
        }

        // Add building_id
        memberData.building_id = buildingId;

        // For now, always create new members
        // TODO: Implement duplicate detection by email/apartment
        const newMember = await memberRepository.create(memberData);
        created.push(newMember);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    return {
      success: true,
      created: created.length,
      updated: updated.length,
      errors: errors.length,
      details: {
        created,
        updated,
        errors
      }
    };
  }

  /**
   * Obtiene todos los miembros (sin filtro de edificio)
   */
  async getAllMembers(options = {}) {
    const result = await memberRepository.findAllPaginated(options);
    
    return result;
  }

  /**
   * Exporta miembros a CSV
   */
  async exportMembersToCSV(buildingId) {
    const { members } = await this.getMembersByBuilding(buildingId);

    // CSV Header
    const headers = [
      'name',
      'email',
      'phone',
      'whatsapp_number',
      'apartment',
      'fraction',
      'ownership_percentage',
      'permilage',
      'votes',
      'is_owner',
      'notes'
    ];

    // Convert members to CSV rows
    const rows = members.map(member => [
      member.name || '',
      member.email || '',
      member.phone || '',
      member.whatsapp_number || '',
      member.apartment || '',
      member.fraction || '',
      member.ownership_percentage || '',
      member.permilage || '',
      member.votes || '',
      member.is_owner ? 'true' : 'false',
      member.notes || ''
    ]);

    // Combine header and rows
    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ];

    return csvLines.join('\n');
  }
}

module.exports = new MemberService();