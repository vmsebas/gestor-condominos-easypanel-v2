import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getActas, getMembers, getBuildings, getTransactions, getFinancialSummary, getLetters, getConvocatorias, createConvocatoria, createMinute, createMember, updateMember, deleteMember, createBuilding, updateBuilding, deleteBuilding, createTransaction, updateTransaction, deleteTransaction, updateConvocatoria, deleteConvocatoria, updateMinute, deleteMinute, getDashboardStats, getMaintenanceTasks, getMaintenanceProviders, getMaintenanceAlerts, createMaintenanceTask } from '@/lib/api';
import { apiCache, cacheUtils } from '@/lib/cache';

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Hook para obter dados da base de dados local
export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const result = await getBuildings();
      if (!result.success) throw new Error(result.error || 'Failed to fetch buildings');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useMembers(buildingId?: string) {
  return useQuery({
    queryKey: ['members', buildingId],
    queryFn: async () => {
      const result = await getMembers(buildingId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch members');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!buildingId, // Only run if buildingId exists
    onError: (error: any) => {
      // Don't throw on 401s, let the app handle authentication
      if (error?.response?.status === 401) {
        return [];
      }
    }
  });
}

export function useConvocatorias(buildingId?: string) {
  return useQuery({
    queryKey: ['convocatorias', buildingId],
    queryFn: async () => {
      const result = await getConvocatorias(buildingId || '');
      if (!result.success) throw new Error(result.error || 'Failed to fetch convocatorias');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1, // Reintentar una vez en caso de error
  });
}

export function useActas(buildingId?: string) {
  return useQuery({
    queryKey: ['actas', buildingId],
    queryFn: async () => {
      const result = await getActas(buildingId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch actas');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTransactions(buildingId?: string) {
  return useQuery({
    queryKey: ['transactions', buildingId],
    queryFn: async () => {
      const result = await getTransactions(buildingId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch transactions');
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useFinancialSummary(buildingId?: string) {
  return useQuery({
    queryKey: ['financial-summary', buildingId],
    queryFn: async () => {
      const result = await getFinancialSummary(buildingId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch financial summary');
      return result.data || { income: 0, expenses: 0, balance: 0 };
    },
    enabled: !!buildingId, // Only run if buildingId exists
    staleTime: 5 * 60 * 1000,
  });
}

export function useLetters(buildingId?: string) {
  return useQuery({
    queryKey: ['letters', buildingId],
    queryFn: async () => {
      const result = await getLetters({ building_id: buildingId });
      if (!result.success) throw new Error(result.error || 'Failed to fetch letters');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Mutations para criar/atualizar dados
export function useCreateConvocatoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createConvocatoria(data);
      if (!result.success) throw new Error(result.error || 'Failed to create convocatoria');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
    },
  });
}

export function useCreateActa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createMinute(data);
      if (!result.success) throw new Error(result.error || 'Failed to create acta');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actas'] });
    },
  });
}

// Members mutations
export function useCreateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createMember(data);
      if (!result.success) throw new Error(result.error || 'Failed to create member');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateMember(id, data);
      if (!result.success) throw new Error(result.error || 'Failed to update member');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMember(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete member');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

// Buildings mutations
export function useCreateBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createBuilding(data);
      if (!result.success) throw new Error(result.error || 'Failed to create building');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateBuilding(id, data);
      if (!result.success) throw new Error(result.error || 'Failed to update building');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBuilding(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete building');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] });
    },
  });
}

// Transactions mutations
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createTransaction(data);
      if (!result.success) throw new Error(result.error || 'Failed to create transaction');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateTransaction(id, data);
      if (!result.success) throw new Error(result.error || 'Failed to update transaction');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTransaction(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete transaction');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });
}

// Convocatorias mutations
export function useUpdateConvocatoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateConvocatoria(id, data);
      if (!result.success) throw new Error(result.error || 'Failed to update convocatoria');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
    },
  });
}

export function useDeleteConvocatoria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteConvocatoria(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete convocatoria');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
    },
  });
}

// Actas mutations
export function useUpdateActa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const result = await updateMinute(id, data);
      if (!result.success) throw new Error(result.error || 'Failed to update acta');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actas'] });
    },
  });
}

export function useDeleteActa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteMinute(id);
      if (!result.success) throw new Error(result.error || 'Failed to delete acta');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actas'] });
    },
  });
}

// Hook para verificar conexão com base de dados local
export function useDatabaseConnection() {
  return useQuery({
    queryKey: ['database-connection'],
    queryFn: async () => {
      const result = await api.get('/db-test');
      if (!result.success) throw new Error(result.error || 'Database connection failed');
      return result.data || null;
    },
    staleTime: 30 * 1000, // 30 segundos
    retry: 3,
  });
}

// Reports hooks
export function useFinancialReport(buildingId?: string, period = 'year') {
  return useQuery({
    queryKey: ['financial-report', buildingId, period],
    queryFn: async () => {
      const result = await api.get(`/reports/financial/${buildingId}?period=${period}`);
      if (!result.success) throw new Error(result.error || 'Failed to fetch financial report');
      return result.data || null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useOccupancyReport(buildingId?: string) {
  return useQuery({
    queryKey: ['occupancy-report', buildingId],
    queryFn: async () => {
      const result = await api.get(`/reports/occupancy/${buildingId}`);
      if (!result.success) throw new Error(result.error || 'Failed to fetch occupancy report');
      return result.data || null;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
}

// Maintenance hooks
export function useMaintenanceTasks(buildingId?: string, status?: string, priority?: string) {
  return useQuery({
    queryKey: ['maintenance-tasks', buildingId, status, priority],
    queryFn: async () => {
      const result = await getMaintenanceTasks({ buildingId, status, priority });
      if (!result.success) throw new Error(result.error || 'Failed to fetch maintenance tasks');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useMaintenanceProviders() {
  return useQuery({
    queryKey: ['maintenance-providers'],
    queryFn: async () => {
      const result = await getMaintenanceProviders();
      if (!result.success) throw new Error(result.error || 'Failed to fetch maintenance providers');
      return result.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

export function useMaintenanceAlerts(buildingId?: string) {
  return useQuery({
    queryKey: ['maintenance-alerts', buildingId],
    queryFn: async () => {
      const result = await getMaintenanceAlerts(buildingId);
      if (!result.success) throw new Error(result.error || 'Failed to fetch maintenance alerts');
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!buildingId, // Only run query if buildingId is provided
  });
}

export function useCreateMaintenanceTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const result = await createMaintenanceTask(data);
      if (!result.success) throw new Error(result.error || 'Failed to create maintenance task');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
    },
  });
}

// Document management hooks
export function useDocuments(filters?: {
  buildingId?: string;
  category?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.buildingId) params.append('buildingId', filters.buildingId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch documents');
      
      // Transform data to add missing fields expected by frontend
      const transformedData = (result.data || []).map((doc: any) => ({
        ...doc,
        file_size_formatted: formatFileSize(doc.file_size),
        tags: doc.tags ? (Array.isArray(doc.tags) ? doc.tags : []) : []
      }));
      
      return transformedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!filters?.buildingId, // Only run if buildingId is provided
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: data, // Send FormData directly (no headers needed for multipart)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to upload document');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to update document');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to delete document');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDocumentCategories(buildingId?: string) {
  return useQuery({
    queryKey: ['document-categories', buildingId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (buildingId) params.append('buildingId', buildingId);
      
      const response = await fetch(`/api/documents/categories?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch document categories');
      return result.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos - categories don't change often
    enabled: !!buildingId,
  });
}

// Dashboard hooks for real-time statistics
export function useDashboardStats(buildingId: string) {
  return useQuery({
    queryKey: ['dashboard-stats', buildingId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats/${buildingId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch dashboard stats');
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!buildingId,
  });
}

export function useDashboardActivities(buildingId: string, limit = 10) {
  return useQuery({
    queryKey: ['dashboard-activities', buildingId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/recent-activities/${buildingId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch dashboard activities');
      return result.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minuto - activities should be fresh
    enabled: !!buildingId,
  });
}

export function useNextMeeting(buildingId: string) {
  return useQuery({
    queryKey: ['next-meeting', buildingId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/next-meeting/${buildingId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch next meeting');
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!buildingId,
  });
}

export function useDocumentStats(buildingId: string) {
  return useQuery({
    queryKey: ['document-stats', buildingId],
    queryFn: async () => {
      const response = await fetch(`/api/documents/stats/${buildingId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch document stats');
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!buildingId,
  });
}

// Hook para obtener dados de um membro específico
export function useMember(memberId: string) {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/members/${memberId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch member');
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!memberId,
  });
}

// Hook para obtener perfil completo de um membro com dados relacionados
export function useMemberProfile(memberId: string) {
  return useQuery({
    queryKey: ['member-profile', memberId],
    queryFn: async () => {
      const response = await fetch(`/api/members/${memberId}/profile`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch member profile');
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!memberId,
  });
}