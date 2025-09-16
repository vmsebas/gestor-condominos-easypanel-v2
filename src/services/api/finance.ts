import * as api from '@/lib/api-v2';

export interface Transaction {
  id: string;
  building_id: string;
  transaction_date: string;
  transaction_type: 'income' | 'expense';
  description: string;
  amount: number;
  category_id?: string;
  member_id?: string;
  [key: string]: any;
}

export const financeAPI = {
  // Transacciones
  transactions: {
    async getAll(filters?: {
      buildingId?: string;
      memberId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<Transaction[]> {
      const result = await api.getTransactions(filters);
      return result.data || [];
    },

    async create(data: Partial<Transaction>): Promise<Transaction> {
      const result = await api.createTransaction(data);
      return result.data;
    },

    async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
      const result = await api.updateTransaction(id, data);
      return result.data;
    },

    async delete(id: string): Promise<void> {
      await api.deleteTransaction(id);
    }
  },

  // Resumen financiero
  async getSummary(buildingId: string, year?: number): Promise<any> {
    const result = await api.getFinancialSummary(buildingId);
    return result.data;
  },

  // Balance
  async getBalance(buildingId: string): Promise<any> {
    const result = await api.getFinancialSummary(buildingId);
    return result.data;
  },

  // Categorías
  async getCategories(): Promise<any[]> {
    // TODO: Implementar endpoint de categorías cuando esté migrado
    return [];
  }
};