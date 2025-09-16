import apiClient, { authApi } from './auth-api';

// Re-export auth functions
export { authApi } from './auth-api';

// Buildings
export const getBuildings = async (options?: {
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDesc?: boolean;
}) => {
  const response = await apiClient.get('/buildings', { params: options });
  return response.data;
};

export const getBuildingById = async (id: string) => {
  const response = await apiClient.get(`/buildings/${id}`);
  return response.data;
};

export const createBuilding = async (data: any) => {
  const response = await apiClient.post('/buildings', data);
  return response.data;
};

export const updateBuilding = async (id: string, data: any) => {
  const response = await apiClient.put(`/buildings/${id}`, data);
  return response.data;
};

export const deleteBuilding = async (id: string) => {
  const response = await apiClient.delete(`/buildings/${id}`);
  return response.data;
};

// Members
export const getMembers = async (buildingId?: string, options?: {
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDesc?: boolean;
}) => {
  const params = {
    ...(buildingId && { buildingId }),
    ...options
  };
  const response = await apiClient.get('/members', { params });
  return response.data;
};

export const getMemberById = async (id: string) => {
  const response = await apiClient.get(`/members/${id}`);
  return response.data;
};

export const getMemberProfile = async (id: string) => {
  const response = await apiClient.get(`/members/${id}/profile`);
  return response.data;
};

export const createMember = async (data: any) => {
  const response = await apiClient.post('/members', data);
  return response.data;
};

export const updateMember = async (id: string, data: any) => {
  const response = await apiClient.put(`/members/${id}`, data);
  return response.data;
};

export const updateMemberFees = async (id: string, fees: {
  oldAnnualFee: number;
  oldMonthlyFee: number;
  newAnnualFee: number;
  newMonthlyFee: number;
}) => {
  const response = await apiClient.put(`/members/${id}/fees`, fees);
  return response.data;
};

export const deleteMember = async (id: string) => {
  const response = await apiClient.delete(`/members/${id}`);
  return response.data;
};

export const getDebtors = async (buildingId: string) => {
  const response = await apiClient.get('/members/debtors', { params: { buildingId } });
  return response.data;
};

export const exportMembers = async (buildingId: string) => {
  const response = await apiClient.get('/members/export', { 
    params: { buildingId },
    responseType: 'blob'
  });
  return response.data;
};

// Convocatorias (Updated endpoints)
export const getConvocatorias = async (buildingId?: string, filters?: {
  assemblyType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDesc?: boolean;
}) => {
  const params = { buildingId, ...filters };
  const response = await apiClient.get('/convocatorias', { params });
  return response.data;
};

export const getConvocatoriasByBuilding = async (buildingId: string) => {
  const response = await apiClient.get(`/convocatorias/building/${buildingId}`);
  return response.data;
};

export const getConvocatoriaById = async (id: string) => {
  const response = await apiClient.get(`/convocatorias/${id}`);
  return response.data;
};

export const getNextConvocatoria = async (buildingId: string) => {
  const response = await apiClient.get(`/convocatorias/next/${buildingId}`);
  return response.data;
};

export const getConvocatoriaStats = async (buildingId: string) => {
  const response = await apiClient.get(`/convocatorias/stats/${buildingId}`);
  return response.data;
};

export const createConvocatoria = async (data: any) => {
  const response = await apiClient.post('/convocatorias', data);
  return response.data;
};

export const updateConvocatoria = async (id: string, data: any) => {
  const response = await apiClient.put(`/convocatorias/${id}`, data);
  return response.data;
};

export const deleteConvocatoria = async (id: string) => {
  const response = await apiClient.delete(`/convocatorias/${id}`);
  return response.data;
};

export const duplicateConvocatoria = async (id: string) => {
  const response = await apiClient.post(`/convocatorias/${id}/duplicate`);
  return response.data;
};

export const markConvocatoriaMinutesCreated = async (id: string) => {
  const response = await apiClient.post(`/convocatorias/${id}/minutes`);
  return response.data;
};

export const generateAssemblyNumber = async (buildingId: string, assemblyType: 'ordinary' | 'extraordinary') => {
  const response = await apiClient.post('/convocatorias/generate-number', { buildingId, assemblyType });
  return response.data;
};

// Transactions
export const getTransactions = async (params?: {
  buildingId?: string;
  memberId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const response = await apiClient.get('/transactions', { params });
  return response.data;
};

export const createTransaction = async (data: any) => {
  const response = await apiClient.post('/transactions', data);
  return response.data;
};

export const updateTransaction = async (id: string, data: any) => {
  const response = await apiClient.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: string) => {
  const response = await apiClient.delete(`/transactions/${id}`);
  return response.data;
};

// Financial Summary
export const getFinancialSummary = async (buildingId: string) => {
  const response = await apiClient.get('/financial-summary', { params: { buildingId } });
  return response.data;
};

// Minutes
export const getMinutes = async (buildingId?: string) => {
  const params = buildingId ? { buildingId } : {};
  const response = await apiClient.get('/minutes', { params });
  return response.data;
};

export const getMinuteById = async (id: string) => {
  const response = await apiClient.get(`/minutes/${id}`);
  return response.data;
};

export const createMinute = async (data: any) => {
  const response = await apiClient.post('/minutes', data);
  return response.data;
};

export const updateMinute = async (id: string, data: any) => {
  const response = await apiClient.put(`/minutes/${id}`, data);
  return response.data;
};

export const deleteMinute = async (id: string) => {
  const response = await apiClient.delete(`/minutes/${id}`);
  return response.data;
};

// Actas (alias for Minutes)
export const getActas = async (buildingId?: string) => {
  const params = buildingId ? { buildingId } : {};
  const response = await apiClient.get('/actas', { params });
  return response.data;
};

// Documents
export const getDocuments = async (params?: {
  buildingId?: string;
  categoryId?: string;
}) => {
  const response = await apiClient.get('/documents', { params });
  return response.data;
};

export const uploadDocument = async (formData: FormData) => {
  const response = await apiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const downloadDocument = async (id: string) => {
  const response = await apiClient.get(`/documents/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

export const deleteDocument = async (id: string) => {
  const response = await apiClient.delete(`/documents/${id}`);
  return response.data;
};

export const getDocumentStats = async (buildingId: string) => {
  const response = await apiClient.get(`/documents/stats/${buildingId}`);
  return response.data;
};

// Letters
export const getLetters = async (params?: {
  buildingId?: string;
  memberId?: string;
  letterType?: string;
}) => {
  const response = await apiClient.get('/letters', { params });
  return response.data;
};

// Dashboard
export const getDashboardStats = async (buildingId: string) => {
  const response = await apiClient.get(`/dashboard/stats/${buildingId}`);
  return response.data;
};

export const getRecentActivities = async (buildingId: string) => {
  const response = await apiClient.get(`/dashboard/recent-activities/${buildingId}`);
  return response.data;
};

// Tasks
export const getTasks = async (params?: {
  buildingId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  minuteId?: string;
}) => {
  const response = await apiClient.get('/tasks', { params });
  return response.data;
};

export const getTaskById = async (id: string) => {
  const response = await apiClient.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: any) => {
  const response = await apiClient.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id: string, data: any) => {
  const response = await apiClient.put(`/tasks/${id}`, data);
  return response.data;
};

export const completeTask = async (id: string, completedBy?: string) => {
  const response = await apiClient.put(`/tasks/${id}/complete`, { completed_by: completedBy });
  return response.data;
};

export const deleteTask = async (id: string) => {
  const response = await apiClient.delete(`/tasks/${id}`);
  return response.data;
};

export default apiClient;