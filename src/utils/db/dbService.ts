import { Pool } from 'pg';

// Configuración de la base de datos
const databaseUrl = process.env.DATABASE_URL || '';

// Pool de conexiones para mejor rendimiento
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 20, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // tiempo máximo para establecer conexión
});

// Verificar conexión al iniciar
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de base de datos:', err);
});

// Función helper para ejecutar queries con reintentos
export const executeQuery = async <T = any>(
  query: string,
  params: any[] = [],
  retries = 3
): Promise<T[]> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error en query (intento ${i + 1}/${retries}):`, error);
      
      // Si es un error de conexión, esperar antes de reintentar
      if (i < retries - 1 && isConnectionError(error)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      // Si no es error de conexión o es el último intento, lanzar el error
      throw error;
    }
  }
  
  throw lastError || new Error('Error desconocido al ejecutar query');
};

// Función para ejecutar una única query que devuelve un resultado
export const executeQuerySingle = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> => {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
};

// Función para ejecutar queries de modificación (INSERT, UPDATE, DELETE)
export const executeMutation = async (
  query: string,
  params: any[] = [],
  returning = false
): Promise<any> => {
  try {
    const result = await pool.query(query, params);
    
    if (returning && result.rows.length > 0) {
      return result.rows[0];
    }
    
    return {
      rowCount: result.rowCount,
      success: true
    };
  } catch (error) {
    console.error('Error en mutación:', error);
    throw error;
  }
};

// Función para transacciones
export const executeTransaction = async <T = any>(
  queries: Array<{ query: string; params: any[] }>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const results: any[] = [];
    
    for (const { query, params } of queries) {
      const result = await client.query(query, params);
      results.push(result.rows);
    }
    
    await client.query('COMMIT');
    
    return results as T;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en transacción:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Helper para verificar si es un error de conexión
const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  const connectionErrors = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNRESET',
    'connection terminated',
    'Connection terminated unexpectedly'
  ];
  
  const errorMessage = error.message || error.toString();
  
  return connectionErrors.some(connError => 
    errorMessage.includes(connError)
  );
};

// Función para verificar la conexión
export const checkConnection = async (): Promise<boolean> => {
  try {
    await executeQuery('SELECT 1');
    return true;
  } catch (error) {
    console.error('Error al verificar conexión:', error);
    return false;
  }
};

// Función para cerrar el pool (útil para tests)
export const closePool = async (): Promise<void> => {
  await pool.end();
};

// Exportar tipos útiles
export type QueryResult<T> = T[];
export type SingleQueryResult<T> = T | null;
export type MutationResult = {
  rowCount: number | null;
  success: boolean;
};

// Funciones de utilidad para construcción de queries
export const buildInsertQuery = (
  tableName: string,
  data: Record<string, any>,
  returning = '*'
): { query: string; params: any[] } => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  
  const query = `
    INSERT INTO ${tableName} (${keys.join(', ')})
    VALUES (${placeholders})
    ${returning ? `RETURNING ${returning}` : ''}
  `.trim();
  
  return { query, params: values };
};

export const buildUpdateQuery = (
  tableName: string,
  data: Record<string, any>,
  where: Record<string, any>,
  returning = '*'
): { query: string; params: any[] } => {
  const dataKeys = Object.keys(data);
  const dataValues = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  
  const setClause = dataKeys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ');
  
  const whereClause = whereKeys
    .map((key, index) => `${key} = $${dataValues.length + index + 1}`)
    .join(' AND ');
  
  const query = `
    UPDATE ${tableName}
    SET ${setClause}
    WHERE ${whereClause}
    ${returning ? `RETURNING ${returning}` : ''}
  `.trim();
  
  return { query, params: [...dataValues, ...whereValues] };
};

export default {
  pool,
  executeQuery,
  executeQuerySingle,
  executeMutation,
  executeTransaction,
  checkConnection,
  closePool,
  buildInsertQuery,
  buildUpdateQuery
};