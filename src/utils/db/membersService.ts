// Removed dbService imports - should use API instead
// import { 
//   executeQuery, 
//   executeQuerySingle, 
//   executeMutation,
//   buildInsertQuery,
//   buildUpdateQuery
// } from './dbService';
import { Member } from '@/types/memberTypes';

// Obtener todos los miembros
export const getAllMembers = async (buildingId?: string): Promise<Member[]> => {
  let query = `
    SELECT 
      id,
      name,
      email,
      phone,
      fraction,
      permillage,
      monthly_quota,
      is_owner,
      is_resident,
      building_id,
      created_at,
      updated_at
    FROM members
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (buildingId) {
    query += ' AND building_id = $1';
    params.push(buildingId);
  }
  
  query += ' ORDER BY fraction ASC, name ASC';
  
  return executeQuery<Member>(query, params);
};

// Obtener un miembro por ID
export const getMemberById = async (id: string): Promise<Member | null> => {
  const query = `
    SELECT 
      id,
      name,
      email,
      phone,
      fraction,
      permillage,
      monthly_quota,
      is_owner,
      is_resident,
      building_id,
      created_at,
      updated_at
    FROM members
    WHERE id = $1
  `;
  
  return executeQuerySingle<Member>(query, [id]);
};

// Crear un nuevo miembro
export const createMember = async (memberData: Partial<Member>): Promise<Member> => {
  const data = {
    name: memberData.name,
    email: memberData.email || null,
    phone: memberData.phone || null,
    fraction: memberData.fraction,
    permillage: memberData.permillage || 0,
    monthly_quota: memberData.monthlyQuota || 0,
    is_owner: memberData.isOwner ?? true,
    is_resident: memberData.isResident ?? true,
    building_id: memberData.buildingId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { query, params } = buildInsertQuery('members', data);
  
  const result = await executeMutation(query, params, true);
  return mapDbMemberToMember(result);
};

// Actualizar un miembro
export const updateMember = async (
  id: string, 
  memberData: Partial<Member>
): Promise<Member> => {
  const data: any = {
    updated_at: new Date().toISOString()
  };
  
  // Solo incluir campos que han sido proporcionados
  if (memberData.name !== undefined) data.name = memberData.name;
  if (memberData.email !== undefined) data.email = memberData.email || null;
  if (memberData.phone !== undefined) data.phone = memberData.phone || null;
  if (memberData.fraction !== undefined) data.fraction = memberData.fraction;
  if (memberData.permillage !== undefined) data.permillage = memberData.permillage;
  if (memberData.monthlyQuota !== undefined) data.monthly_quota = memberData.monthlyQuota;
  if (memberData.isOwner !== undefined) data.is_owner = memberData.isOwner;
  if (memberData.isResident !== undefined) data.is_resident = memberData.isResident;
  if (memberData.buildingId !== undefined) data.building_id = memberData.buildingId;
  
  const { query, params } = buildUpdateQuery('members', data, { id });
  
  const result = await executeMutation(query, params, true);
  return mapDbMemberToMember(result);
};

// Eliminar un miembro
export const deleteMember = async (id: string): Promise<boolean> => {
  const query = 'DELETE FROM members WHERE id = $1';
  
  const result = await executeMutation(query, [id]);
  return result.rowCount > 0;
};

// Obtener miembros por edificio
export const getMembersByBuilding = async (buildingId: string): Promise<Member[]> => {
  return getAllMembers(buildingId);
};

// Buscar miembros por nombre o fracción
export const searchMembers = async (
  searchTerm: string, 
  buildingId?: string
): Promise<Member[]> => {
  let query = `
    SELECT 
      id,
      name,
      email,
      phone,
      fraction,
      permillage,
      monthly_quota,
      is_owner,
      is_resident,
      building_id,
      created_at,
      updated_at
    FROM members
    WHERE (
      LOWER(name) LIKE LOWER($1) OR
      LOWER(fraction) LIKE LOWER($1)
    )
  `;
  
  const params: any[] = [`%${searchTerm}%`];
  
  if (buildingId) {
    query += ' AND building_id = $2';
    params.push(buildingId);
  }
  
  query += ' ORDER BY fraction ASC, name ASC';
  
  return executeQuery<Member>(query, params);
};

// Obtener estadísticas de miembros
export const getMembersStats = async (buildingId?: string): Promise<{
  total: number;
  owners: number;
  residents: number;
  totalQuota: number;
}> => {
  let query = `
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN is_owner = true THEN 1 END) as owners,
      COUNT(CASE WHEN is_resident = true THEN 1 END) as residents,
      SUM(monthly_quota) as total_quota
    FROM members
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (buildingId) {
    query += ' AND building_id = $1';
    params.push(buildingId);
  }
  
  const result = await executeQuerySingle<any>(query, params);
  
  return {
    total: parseInt(result?.total || '0'),
    owners: parseInt(result?.owners || '0'),
    residents: parseInt(result?.residents || '0'),
    totalQuota: parseFloat(result?.total_quota || '0')
  };
};

// Mapear datos de la base de datos al tipo Member
const mapDbMemberToMember = (dbMember: any): Member => {
  return {
    id: dbMember.id,
    name: dbMember.name,
    email: dbMember.email,
    phone: dbMember.phone,
    fraction: dbMember.fraction,
    permillage: dbMember.permillage,
    monthlyQuota: dbMember.monthly_quota,
    isOwner: dbMember.is_owner,
    isResident: dbMember.is_resident,
    buildingId: dbMember.building_id,
    createdAt: dbMember.created_at,
    updatedAt: dbMember.updated_at
  };
};

// Validar si un email ya existe
export const emailExists = async (
  email: string, 
  excludeId?: string
): Promise<boolean> => {
  let query = 'SELECT COUNT(*) as count FROM members WHERE email = $1';
  const params: any[] = [email];
  
  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }
  
  const result = await executeQuerySingle<{ count: string }>(query, params);
  return parseInt(result?.count || '0') > 0;
};

// Validar si una fracción ya existe en un edificio
export const fractionExists = async (
  fraction: string,
  buildingId: string,
  excludeId?: string
): Promise<boolean> => {
  let query = 'SELECT COUNT(*) as count FROM members WHERE fraction = $1 AND building_id = $2';
  const params: any[] = [fraction, buildingId];
  
  if (excludeId) {
    query += ' AND id != $3';
    params.push(excludeId);
  }
  
  const result = await executeQuerySingle<{ count: string }>(query, params);
  return parseInt(result?.count || '0') > 0;
};

export default {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getMembersByBuilding,
  searchMembers,
  getMembersStats,
  emailExists,
  fractionExists
};