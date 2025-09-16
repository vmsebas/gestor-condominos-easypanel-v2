// Removed dbService imports - should use API instead
// import { 
//   executeQuery, 
//   executeQuerySingle, 
//   executeMutation,
//   executeTransaction,
//   buildInsertQuery,
//   buildUpdateQuery
// } from './dbService';
import { 
  Transaction, 
  TransactionCategory, 
  FinancialPeriod,
  FinancialSummary,
  Arrear 
} from '@/types/finance/financeTypes';

// === TRANSACCIONES ===

// Obtener todas las transacciones
export const getTransactions = async (
  buildingId: string,
  filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
  }
): Promise<Transaction[]> => {
  let query = `
    SELECT 
      t.id,
      t.description,
      t.amount,
      t.transaction_date,
      t.category_id,
      t.building_id,
      t.member_id,
      t.payment_method,
      t.reference,
      t.created_at,
      t.updated_at,
      c.name as category_name,
      c.type as category_type,
      m.name as member_name
    FROM transactions t
    LEFT JOIN transaction_categories c ON t.category_id = c.id
    LEFT JOIN members m ON t.member_id = m.id
    WHERE t.building_id = $1
  `;
  
  const params: any[] = [buildingId];
  let paramCount = 1;
  
  if (filters?.categoryId) {
    paramCount++;
    query += ` AND t.category_id = $${paramCount}`;
    params.push(filters.categoryId);
  }
  
  if (filters?.startDate) {
    paramCount++;
    query += ` AND t.transaction_date >= $${paramCount}`;
    params.push(filters.startDate);
  }
  
  if (filters?.endDate) {
    paramCount++;
    query += ` AND t.transaction_date <= $${paramCount}`;
    params.push(filters.endDate);
  }
  
  if (filters?.type) {
    paramCount++;
    query += ` AND c.type = $${paramCount}`;
    params.push(filters.type);
  }
  
  query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
  
  const results = await executeQuery<any>(query, params);
  return results.map(mapDbTransactionToTransaction);
};

// Crear una transacción
export const createTransaction = async (
  transactionData: Partial<Transaction>
): Promise<Transaction> => {
  const data = {
    description: transactionData.description,
    amount: transactionData.amount,
    transaction_date: transactionData.transactionDate,
    category_id: transactionData.categoryId,
    building_id: transactionData.buildingId,
    member_id: transactionData.memberId || null,
    payment_method: transactionData.paymentMethod || 'transfer',
    reference: transactionData.reference || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { query, params } = buildInsertQuery('transactions', data);
  const result = await executeMutation(query, params, true);
  
  // Obtener la transacción completa con joins
  return getTransactionById(result.id);
};

// Obtener una transacción por ID
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  const query = `
    SELECT 
      t.id,
      t.description,
      t.amount,
      t.transaction_date,
      t.category_id,
      t.building_id,
      t.member_id,
      t.payment_method,
      t.reference,
      t.created_at,
      t.updated_at,
      c.name as category_name,
      c.type as category_type,
      m.name as member_name
    FROM transactions t
    LEFT JOIN transaction_categories c ON t.category_id = c.id
    LEFT JOIN members m ON t.member_id = m.id
    WHERE t.id = $1
  `;
  
  const result = await executeQuerySingle<any>(query, [id]);
  return result ? mapDbTransactionToTransaction(result) : null;
};

// === CATEGORÍAS ===

// Obtener todas las categorías
export const getCategories = async (
  buildingId?: string,
  type?: 'income' | 'expense'
): Promise<TransactionCategory[]> => {
  let query = `
    SELECT 
      id,
      name,
      type,
      description,
      is_active,
      building_id,
      created_at,
      updated_at
    FROM transaction_categories
    WHERE is_active = true
  `;
  
  const params: any[] = [];
  let paramCount = 0;
  
  if (buildingId) {
    paramCount++;
    query += ` AND (building_id = $${paramCount} OR building_id IS NULL)`;
    params.push(buildingId);
  }
  
  if (type) {
    paramCount++;
    query += ` AND type = $${paramCount}`;
    params.push(type);
  }
  
  query += ' ORDER BY type, name';
  
  const results = await executeQuery<any>(query, params);
  return results.map(mapDbCategoryToCategory);
};

// Crear una categoría
export const createCategory = async (
  categoryData: Partial<TransactionCategory>
): Promise<TransactionCategory> => {
  const data = {
    name: categoryData.name,
    type: categoryData.type,
    description: categoryData.description || null,
    is_active: true,
    building_id: categoryData.buildingId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { query, params } = buildInsertQuery('transaction_categories', data);
  const result = await executeMutation(query, params, true);
  return mapDbCategoryToCategory(result);
};

// === PERÍODOS FINANCIEROS ===

// Obtener períodos financieros
export const getFinancialPeriods = async (
  buildingId: string
): Promise<FinancialPeriod[]> => {
  const query = `
    SELECT 
      id,
      building_id,
      year,
      start_date,
      end_date,
      is_active,
      budget_amount,
      created_at,
      updated_at
    FROM financial_periods
    WHERE building_id = $1
    ORDER BY year DESC
  `;
  
  const results = await executeQuery<any>(query, [buildingId]);
  return results.map(mapDbPeriodToPeriod);
};

// Obtener período activo
export const getActivePeriod = async (
  buildingId: string
): Promise<FinancialPeriod | null> => {
  const query = `
    SELECT 
      id,
      building_id,
      year,
      start_date,
      end_date,
      is_active,
      budget_amount,
      created_at,
      updated_at
    FROM financial_periods
    WHERE building_id = $1 AND is_active = true
    LIMIT 1
  `;
  
  const result = await executeQuerySingle<any>(query, [buildingId]);
  return result ? mapDbPeriodToPeriod(result) : null;
};

// === RESUMEN FINANCIERO ===

// Obtener resumen financiero
export const getFinancialSummary = async (
  buildingId: string,
  periodId?: string
): Promise<FinancialSummary> => {
  let period: FinancialPeriod | null = null;
  
  if (periodId) {
    const periodQuery = `
      SELECT * FROM financial_periods WHERE id = $1 AND building_id = $2
    `;
    const periodResult = await executeQuerySingle<any>(periodQuery, [periodId, buildingId]);
    period = periodResult ? mapDbPeriodToPeriod(periodResult) : null;
  } else {
    period = await getActivePeriod(buildingId);
  }
  
  if (!period) {
    throw new Error('Período financiero no encontrado');
  }
  
  // Obtener resumen de transacciones
  const summaryQuery = `
    SELECT 
      SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as total_income,
      SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as total_expenses,
      COUNT(DISTINCT CASE WHEN t.amount > 0 THEN t.id END) as income_count,
      COUNT(DISTINCT CASE WHEN t.amount < 0 THEN t.id END) as expense_count
    FROM transactions t
    WHERE 
      t.building_id = $1 AND
      t.transaction_date >= $2 AND
      t.transaction_date <= $3
  `;
  
  const summaryResult = await executeQuerySingle<any>(
    summaryQuery, 
    [buildingId, period.startDate, period.endDate]
  );
  
  // Obtener resumen por categorías
  const categoryQuery = `
    SELECT 
      c.id,
      c.name,
      c.type,
      SUM(ABS(t.amount)) as total,
      COUNT(t.id) as count
    FROM transactions t
    JOIN transaction_categories c ON t.category_id = c.id
    WHERE 
      t.building_id = $1 AND
      t.transaction_date >= $2 AND
      t.transaction_date <= $3
    GROUP BY c.id, c.name, c.type
    ORDER BY c.type, total DESC
  `;
  
  const categoryResults = await executeQuery<any>(
    categoryQuery, 
    [buildingId, period.startDate, period.endDate]
  );
  
  const totalIncome = parseFloat(summaryResult?.total_income || '0');
  const totalExpenses = parseFloat(summaryResult?.total_expenses || '0');
  const balance = totalIncome - totalExpenses;
  
  return {
    periodId: period.id,
    periodYear: period.year,
    totalIncome,
    totalExpenses,
    balance,
    budgetAmount: period.budgetAmount,
    budgetUtilization: period.budgetAmount > 0 
      ? (totalExpenses / period.budgetAmount) * 100 
      : 0,
    incomeByCategory: categoryResults
      .filter(c => c.type === 'income')
      .map(c => ({
        categoryId: c.id,
        categoryName: c.name,
        amount: parseFloat(c.total),
        count: parseInt(c.count)
      })),
    expensesByCategory: categoryResults
      .filter(c => c.type === 'expense')
      .map(c => ({
        categoryId: c.id,
        categoryName: c.name,
        amount: parseFloat(c.total),
        count: parseInt(c.count)
      }))
  };
};

// === MOROSIDAD ===

// Obtener morosidad
export const getArrears = async (
  buildingId: string,
  status?: 'pending' | 'paid' | 'partial'
): Promise<Arrear[]> => {
  let query = `
    SELECT 
      a.id,
      a.member_id,
      a.building_id,
      a.amount,
      a.due_date,
      a.status,
      a.description,
      a.created_at,
      a.updated_at,
      m.name as member_name,
      m.fraction as member_fraction
    FROM arrears a
    JOIN members m ON a.member_id = m.id
    WHERE a.building_id = $1
  `;
  
  const params: any[] = [buildingId];
  
  if (status) {
    query += ' AND a.status = $2';
    params.push(status);
  }
  
  query += ' ORDER BY a.due_date DESC, m.fraction';
  
  const results = await executeQuery<any>(query, params);
  return results.map(mapDbArrearToArrear);
};

// Crear morosidad
export const createArrear = async (
  arrearData: Partial<Arrear>
): Promise<Arrear> => {
  const data = {
    member_id: arrearData.memberId,
    building_id: arrearData.buildingId,
    amount: arrearData.amount,
    due_date: arrearData.dueDate,
    status: arrearData.status || 'pending',
    description: arrearData.description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { query, params } = buildInsertQuery('arrears', data);
  const result = await executeMutation(query, params, true);
  
  // Obtener el registro completo con joins
  return getArrearById(result.id);
};

// Obtener morosidad por ID
const getArrearById = async (id: string): Promise<Arrear> => {
  const query = `
    SELECT 
      a.id,
      a.member_id,
      a.building_id,
      a.amount,
      a.due_date,
      a.status,
      a.description,
      a.created_at,
      a.updated_at,
      m.name as member_name,
      m.fraction as member_fraction
    FROM arrears a
    JOIN members m ON a.member_id = m.id
    WHERE a.id = $1
  `;
  
  const result = await executeQuerySingle<any>(query, [id]);
  return mapDbArrearToArrear(result);
};

// === MAPPERS ===

const mapDbTransactionToTransaction = (db: any): Transaction => ({
  id: db.id,
  description: db.description,
  amount: parseFloat(db.amount),
  transactionDate: db.transaction_date,
  categoryId: db.category_id,
  categoryName: db.category_name,
  categoryType: db.category_type,
  buildingId: db.building_id,
  memberId: db.member_id,
  memberName: db.member_name,
  paymentMethod: db.payment_method,
  reference: db.reference,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapDbCategoryToCategory = (db: any): TransactionCategory => ({
  id: db.id,
  name: db.name,
  type: db.type,
  description: db.description,
  isActive: db.is_active,
  buildingId: db.building_id,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapDbPeriodToPeriod = (db: any): FinancialPeriod => ({
  id: db.id,
  buildingId: db.building_id,
  year: db.year,
  startDate: db.start_date,
  endDate: db.end_date,
  isActive: db.is_active,
  budgetAmount: parseFloat(db.budget_amount || '0'),
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

const mapDbArrearToArrear = (db: any): Arrear => ({
  id: db.id,
  memberId: db.member_id,
  memberName: db.member_name,
  memberFraction: db.member_fraction,
  buildingId: db.building_id,
  amount: parseFloat(db.amount),
  dueDate: db.due_date,
  status: db.status,
  description: db.description,
  createdAt: db.created_at,
  updatedAt: db.updated_at
});

export default {
  // Transacciones
  getTransactions,
  createTransaction,
  getTransactionById,
  
  // Categorías
  getCategories,
  createCategory,
  
  // Períodos
  getFinancialPeriods,
  getActivePeriod,
  
  // Resumen
  getFinancialSummary,
  
  // Morosidad
  getArrears,
  createArrear
};