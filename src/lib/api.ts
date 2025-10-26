import apiClient from './auth-api';

// Use the authenticated axios client from auth-api.ts
const api = apiClient;

// Export api for other modules
export { api };

// Buildings
export const getBuildings = async () => {
  const response = await api.get('/buildings');
  return response.data;
};

export const getBuildingById = async (id: string) => {
  const response = await api.get(`/buildings/${id}`);
  return response.data;
};

export const createBuilding = async (data: any) => {
  const response = await api.post('/buildings', data);
  return response.data;
};

export const updateBuilding = async (id: string, data: any) => {
  const response = await api.put(`/buildings/${id}`, data);
  return response.data;
};

export const deleteBuilding = async (id: string) => {
  const response = await api.delete(`/buildings/${id}`);
  return response.data;
};

// Members
export const getMembers = async (buildingId?: string) => {
  const params = buildingId ? { buildingId } : {};
  const response = await api.get('/members', { params });
  return response.data;
};

export const getMemberById = async (id: string) => {
  const response = await api.get(`/members/${id}`);
  return response.data;
};

export const createMember = async (data: any) => {
  const response = await api.post('/members', data);
  return response.data;
};

export const updateMember = async (id: string, data: any) => {
  const response = await api.put(`/members/${id}`, data);
  return response.data;
};

export const deleteMember = async (id: string) => {
  const response = await api.delete(`/members/${id}`);
  return response.data;
};

export const exportMembersCSV = async (buildingId: string) => {
  const response = await api.get('/members/export', {
    params: { buildingId },
    responseType: 'blob' // Important for file download
  });
  return response.data;
};

export const importMembersCSV = async (buildingId: string, file: File) => {
  const formData = new FormData();
  formData.append('buildingId', buildingId);
  formData.append('file', file);

  const response = await api.post('/members/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
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
  const response = await api.get('/transactions', { params });
  return response.data;
};

export const createTransaction = async (data: any) => {
  const response = await api.post('/transactions', data);
  return response.data;
};

export const updateTransaction = async (id: string, data: any) => {
  const response = await api.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: string) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};

// Transaction Categories
export const getTransactionCategories = async (buildingId: string) => {
  const response = await api.get('/transaction-categories', { params: { buildingId } });
  return response.data;
};

export const createTransactionCategory = async (data: any) => {
  const response = await api.post('/transaction-categories', data);
  return response.data;
};

// Financial Summary
export const getFinancialSummary = async (buildingId: string) => {
  const response = await api.get(`/financial-summary/${buildingId}`);
  return response.data;
};

// Member Annual Fees
export const getMemberAnnualFees = async (params?: {
  buildingId?: string;
  memberId?: string;
  year?: number;
}) => {
  const response = await api.get('/member-annual-fees', { params });
  return response.data;
};

export const updateMemberAnnualFee = async (id: string, data: any) => {
  const response = await api.put(`/member-annual-fees/${id}`, data);
  return response.data;
};

export const bulkCreateMemberAnnualFees = async (data: any) => {
  const response = await api.post('/member-annual-fees/bulk', data);
  return response.data;
};

// Arrears
export const getMemberArrears = async (params?: {
  buildingId?: string;
  memberId?: string;
}) => {
  const response = await api.get('/arrears', { params });
  return response.data;
};

export const createArrear = async (data: any) => {
  const response = await api.post('/arrears', data);
  return response.data;
};

export const updateArrear = async (id: string, data: any) => {
  const response = await api.put(`/arrears/${id}`, data);
  return response.data;
};

// Minutes
export const getMinutes = async (buildingId?: string) => {
  const params = buildingId ? { buildingId } : {};
  const response = await api.get('/minutes', { params });
  return response.data;
};

export const getMinuteById = async (id: string) => {
  const response = await api.get(`/minutes/${id}`);
  return response.data;
};

export const createMinute = async (data: any) => {
  const response = await api.post('/minutes', data);
  return response.data;
};

export const updateMinute = async (id: string, data: any) => {
  const response = await api.put(`/minutes/${id}`, data);
  return response.data;
};

export const deleteMinute = async (id: string) => {
  const response = await api.delete(`/minutes/${id}`);
  return response.data;
};

// Actas (alias for Minutes)
export const getActas = async (buildingId?: string) => {
  return getMinutes(buildingId);
};

export const getActaById = async (id: string) => {
  return getMinuteById(id);
};

export const createActa = async (data: any) => {
  return createMinute(data);
};

export const updateActa = async (id: string, data: any) => {
  return updateMinute(id, data);
};

export const deleteActa = async (id: string) => {
  return deleteMinute(id);
};

// Update agenda items with voting data
export const updateMinuteAgendaItems = async (minuteId: string, agendaItems: any[]) => {
  const response = await api.put(`/minutes/${minuteId}/agenda-items`, { agenda_items: agendaItems });
  return response.data;
};

// Create minute from convocatoria
export const createMinuteFromConvocatoria = async (convocatoriaId: string) => {
  const response = await api.post(`/minutes/from-convocatoria/${convocatoriaId}`);
  return response.data;
};

// Save complete voting result for an agenda item
export const saveMinuteItemVotes = async (
  minuteId: string,
  agendaItemId: string,
  votingResult: any
) => {
  const response = await api.post(
    `/minutes/${minuteId}/agenda-items/${agendaItemId}/votes`,
    { voting_result: votingResult }
  );
  return response.data;
};

// Attendance Sheets
export const getAttendanceSheets = async (params?: {
  buildingId?: string;
  convocatoriaId?: string;
  minuteId?: string;
}) => {
  const response = await api.get('/attendance-sheets', { params });
  return response.data;
};

export const getAttendanceSheetById = async (id: string) => {
  const response = await api.get(`/attendance-sheets/${id}`);
  return response.data;
};

export const getAttendanceSheetByConvocatoria = async (convocatoriaId: string) => {
  const response = await api.get(`/attendance-sheets/convocatoria/${convocatoriaId}`);
  return response.data;
};

export const getAttendanceSheetByMinute = async (minuteId: string) => {
  const response = await api.get(`/attendance-sheets/minute/${minuteId}`);
  return response.data;
};

export const createAttendanceSheet = async (data: {
  building_id: string;
  convocatoria_id?: string;
  minute_id?: string;
  meeting_date: string;
  total_members: number;
  attendees?: any[];
}) => {
  const response = await api.post('/attendance-sheets', data);
  return response.data;
};

export const updateAttendanceSheet = async (id: string, data: {
  meeting_date?: string;
  total_members?: number;
  attendees?: any[];
}) => {
  const response = await api.put(`/attendance-sheets/${id}`, data);
  return response.data;
};

export const deleteAttendanceSheet = async (id: string) => {
  const response = await api.delete(`/attendance-sheets/${id}`);
  return response.data;
};

export const addAttendee = async (sheetId: string, data: {
  member_id: string;
  member_name: string;
  attendance_type?: 'present' | 'represented' | 'absent';
  representative_name?: string;
  signature?: string;
  arrival_time?: string;
}) => {
  const response = await api.post(`/attendance-sheets/${sheetId}/attendees`, data);
  return response.data;
};

export const updateAttendee = async (sheetId: string, attendeeId: string, data: {
  attendance_type?: 'present' | 'represented' | 'absent';
  representative_name?: string;
  signature?: string;
  arrival_time?: string;
}) => {
  const response = await api.put(`/attendance-sheets/${sheetId}/attendees/${attendeeId}`, data);
  return response.data;
};

export const removeAttendee = async (sheetId: string, attendeeId: string) => {
  const response = await api.delete(`/attendance-sheets/${sheetId}/attendees/${attendeeId}`);
  return response.data;
};

export const calculateQuorum = async (sheetId: string) => {
  const response = await api.get(`/attendance-sheets/${sheetId}/quorum`);
  return response.data;
};

export const getAttendanceStats = async (buildingId: string, fromDate?: string, toDate?: string) => {
  const params = { fromDate, toDate };
  const response = await api.get(`/attendance-sheets/building/${buildingId}/stats`, { params });
  return response.data;
};

// Convocatorias
export const getConvocatorias = async (buildingId: string) => {
  const response = await api.get('/convocatorias', { params: { buildingId } });
  return response.data;
};

export const getConvocatoriaById = async (id: string) => {
  const response = await api.get(`/convocatorias/${id}`);
  return response.data;
};

export const createConvocatoria = async (data: any) => {
  const response = await api.post('/convocatorias', data);
  return response.data;
};

export const updateConvocatoria = async (id: string, data: any) => {
  const response = await api.put(`/convocatorias/${id}`, data);
  return response.data;
};

export const deleteConvocatoria = async (id: string) => {
  const response = await api.delete(`/convocatorias/${id}`);
  return response.data;
};

// Letters
export const getSentLetters = async (params?: {
  buildingId?: string;
  memberId?: string;
  letterType?: string;
}) => {
  const response = await api.get('/letters/sent', { params });
  return response.data;
};

export const getLetterTemplates = async () => {
  const response = await api.get('/letters/templates');
  return response.data;
};

export const sendLetter = async (data: any) => {
  const response = await api.post('/letters/send', data);
  return response.data;
};

export const generateLetterPreview = async (data: any) => {
  const response = await api.post('/letters/preview', data);
  return response.data;
};

// Dashboard Stats
export const getDashboardStats = async (buildingId: string) => {
  const response = await api.get(`/stats/dashboard/${buildingId}`);
  return response.data;
};

// Maintenance
export const getMaintenanceTasks = async (params?: {
  buildingId?: string;
  status?: string;
  priority?: string;
}) => {
  const response = await api.get('/maintenance/tasks', { params });
  return response.data;
};

export const createMaintenanceTask = async (data: any) => {
  const response = await api.post('/maintenance/tasks', data);
  return response.data;
};

export const getMaintenanceProviders = async () => {
  const response = await api.get('/maintenance/providers');
  return response.data;
};

export const getMaintenanceAlerts = async (buildingId: string) => {
  const response = await api.get('/maintenance/alerts', { params: { buildingId } });
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
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const getTaskById = async (id: string) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: any) => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id: string, data: any) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const completeTask = async (id: string, completedBy?: string) => {
  const response = await api.put(`/tasks/${id}/complete`, { completed_by: completedBy });
  return response.data;
};

export const deleteTask = async (id: string) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const getTasksByMinute = async (minuteId: string) => {
  const response = await api.get(`/tasks/minute/${minuteId}`);
  return response.data;
};

export const getTaskStats = async (buildingId: string) => {
  const response = await api.get(`/tasks/stats/${buildingId}`);
  return response.data;
};

export default api;