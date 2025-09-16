// Removed dbService imports - should use API instead
// import { 
//   executeQuery, 
//   executeQuerySingle, 
//   executeMutation,
//   buildInsertQuery,
//   buildUpdateQuery
// } from './dbService';
import { Building } from '@/types/buildingTypes';

// Obtener todos los edificios
export const getAllBuildings = async (): Promise<Building[]> => {
  const query = `
    SELECT 
      id,
      name,
      address,
      city,
      postal_code,
      iban,
      administrator_name,
      administrator_phone,
      administrator_email,
      total_units,
      fiscal_number,
      created_at,
      updated_at
    FROM buildings
    ORDER BY name ASC
  `;
  
  const results = await executeQuery<any>(query);
  return results.map(mapDbBuildingToBuilding);
};

// Obtener un edificio por ID
export const getBuildingById = async (id: string): Promise<Building | null> => {
  const query = `
    SELECT 
      id,
      name,
      address,
      city,
      postal_code,
      iban,
      administrator_name,
      administrator_phone,
      administrator_email,
      total_units,
      fiscal_number,
      created_at,
      updated_at
    FROM buildings
    WHERE id = $1
  `;
  
  const result = await executeQuerySingle<any>(query, [id]);
  return result ? mapDbBuildingToBuilding(result) : null;
};

// Crear un nuevo edificio
export const createBuilding = async (buildingData: Partial<Building>): Promise<Building> => {
  const data = {
    name: buildingData.name,
    address: buildingData.address,
    city: buildingData.city || 'Lisboa',
    postal_code: buildingData.postalCode || null,
    iban: buildingData.iban || null,
    administrator_name: buildingData.administratorName || null,
    administrator_phone: buildingData.administratorPhone || null,
    administrator_email: buildingData.administratorEmail || null,
    total_units: buildingData.totalUnits || 0,
    fiscal_number: buildingData.fiscalNumber || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { query, params } = buildInsertQuery('buildings', data);
  
  const result = await executeMutation(query, params, true);
  return mapDbBuildingToBuilding(result);
};

// Actualizar un edificio
export const updateBuilding = async (
  id: string, 
  buildingData: Partial<Building>
): Promise<Building> => {
  const data: any = {
    updated_at: new Date().toISOString()
  };
  
  // Solo incluir campos que han sido proporcionados
  if (buildingData.name !== undefined) data.name = buildingData.name;
  if (buildingData.address !== undefined) data.address = buildingData.address;
  if (buildingData.city !== undefined) data.city = buildingData.city;
  if (buildingData.postalCode !== undefined) data.postal_code = buildingData.postalCode;
  if (buildingData.iban !== undefined) data.iban = buildingData.iban;
  if (buildingData.administratorName !== undefined) data.administrator_name = buildingData.administratorName;
  if (buildingData.administratorPhone !== undefined) data.administrator_phone = buildingData.administratorPhone;
  if (buildingData.administratorEmail !== undefined) data.administrator_email = buildingData.administratorEmail;
  if (buildingData.totalUnits !== undefined) data.total_units = buildingData.totalUnits;
  if (buildingData.fiscalNumber !== undefined) data.fiscal_number = buildingData.fiscalNumber;
  
  const { query, params } = buildUpdateQuery('buildings', data, { id });
  
  const result = await executeMutation(query, params, true);
  return mapDbBuildingToBuilding(result);
};

// Eliminar un edificio
export const deleteBuilding = async (id: string): Promise<boolean> => {
  // Primero verificar si hay miembros asociados
  const membersCount = await executeQuerySingle<{ count: string }>(
    'SELECT COUNT(*) as count FROM members WHERE building_id = $1',
    [id]
  );
  
  if (parseInt(membersCount?.count || '0') > 0) {
    throw new Error('No se puede eliminar el edificio porque tiene miembros asociados');
  }
  
  const query = 'DELETE FROM buildings WHERE id = $1';
  const result = await executeMutation(query, [id]);
  return result.rowCount > 0;
};

// Obtener estadísticas de un edificio
export const getBuildingStats = async (id: string): Promise<{
  totalMembers: number;
  totalOwners: number;
  totalResidents: number;
  totalMonthlyQuota: number;
  occupancyRate: number;
}> => {
  const query = `
    SELECT 
      COUNT(*) as total_members,
      COUNT(CASE WHEN is_owner = true THEN 1 END) as total_owners,
      COUNT(CASE WHEN is_resident = true THEN 1 END) as total_residents,
      SUM(monthly_quota) as total_monthly_quota
    FROM members
    WHERE building_id = $1
  `;
  
  const result = await executeQuerySingle<any>(query, [id]);
  const building = await getBuildingById(id);
  
  const totalMembers = parseInt(result?.total_members || '0');
  const totalUnits = building?.totalUnits || 0;
  const occupancyRate = totalUnits > 0 ? (totalMembers / totalUnits) * 100 : 0;
  
  return {
    totalMembers,
    totalOwners: parseInt(result?.total_owners || '0'),
    totalResidents: parseInt(result?.total_residents || '0'),
    totalMonthlyQuota: parseFloat(result?.total_monthly_quota || '0'),
    occupancyRate: Math.round(occupancyRate * 100) / 100
  };
};

// Buscar edificios por nombre o dirección
export const searchBuildings = async (searchTerm: string): Promise<Building[]> => {
  const query = `
    SELECT 
      id,
      name,
      address,
      city,
      postal_code,
      iban,
      administrator_name,
      administrator_phone,
      administrator_email,
      total_units,
      fiscal_number,
      created_at,
      updated_at
    FROM buildings
    WHERE 
      LOWER(name) LIKE LOWER($1) OR
      LOWER(address) LIKE LOWER($1) OR
      LOWER(city) LIKE LOWER($1)
    ORDER BY name ASC
  `;
  
  const results = await executeQuery<any>(query, [`%${searchTerm}%`]);
  return results.map(mapDbBuildingToBuilding);
};

// Obtener resumen financiero del edificio
export const getBuildingFinancialSummary = async (
  buildingId: string,
  year?: number
): Promise<{
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  pendingPayments: number;
}> => {
  const currentYear = year || new Date().getFullYear();
  
  const query = `
    SELECT 
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses
    FROM transactions
    WHERE 
      building_id = $1 AND
      EXTRACT(YEAR FROM transaction_date) = $2
  `;
  
  const result = await executeQuerySingle<any>(query, [buildingId, currentYear]);
  
  // Obtener pagos pendientes
  const pendingQuery = `
    SELECT SUM(amount) as pending
    FROM arrears
    WHERE building_id = $1 AND status = 'pending'
  `;
  
  const pendingResult = await executeQuerySingle<any>(pendingQuery, [buildingId]);
  
  const totalIncome = parseFloat(result?.total_income || '0');
  const totalExpenses = parseFloat(result?.total_expenses || '0');
  
  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    pendingPayments: parseFloat(pendingResult?.pending || '0')
  };
};

// Mapear datos de la base de datos al tipo Building
const mapDbBuildingToBuilding = (dbBuilding: any): Building => {
  return {
    id: dbBuilding.id,
    name: dbBuilding.name,
    address: dbBuilding.address,
    city: dbBuilding.city,
    postalCode: dbBuilding.postal_code,
    iban: dbBuilding.iban,
    administratorName: dbBuilding.administrator_name,
    administratorPhone: dbBuilding.administrator_phone,
    administratorEmail: dbBuilding.administrator_email,
    totalUnits: dbBuilding.total_units,
    fiscalNumber: dbBuilding.fiscal_number,
    createdAt: dbBuilding.created_at,
    updatedAt: dbBuilding.updated_at
  };
};

// Validar si un nombre de edificio ya existe
export const buildingNameExists = async (
  name: string, 
  excludeId?: string
): Promise<boolean> => {
  let query = 'SELECT COUNT(*) as count FROM buildings WHERE LOWER(name) = LOWER($1)';
  const params: any[] = [name];
  
  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }
  
  const result = await executeQuerySingle<{ count: string }>(query, params);
  return parseInt(result?.count || '0') > 0;
};

export default {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getBuildingStats,
  searchBuildings,
  getBuildingFinancialSummary,
  buildingNameExists
};