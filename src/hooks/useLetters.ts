import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter,
  getLetterStats,
  getLetterTemplates,
  getLetterTemplateById,
  createLetterTemplate,
  updateLetterTemplate,
  deleteLetterTemplate,
  duplicateLetterTemplate,
  toggleLetterTemplateActive
} from '@/lib/api';
import { toast } from 'sonner';
import { useBuilding } from './useBuilding';

export interface LetterData {
  id: string;
  building_id: string;
  template_id?: string;
  member_id?: string;
  recipient_name: string;
  recipient_email?: string;
  subject: string;
  content: string;
  send_method: 'email' | 'whatsapp' | 'correio_certificado';
  sent_date?: string;
  delivery_confirmation?: boolean;
  tracking_number?: string;
  legal_validity?: boolean;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  building_name?: string;
  member_name?: string;
  member_email?: string;
  template_name?: string;
  template_type?: string;
}

export interface LetterTemplateData {
  id: string;
  building_id?: string;
  name: string;
  type: string;
  subject?: string;
  content: string;
  variables?: string[];
  is_active: boolean;
  legal_basis?: string;
  required_fields?: string[];
  validation_rules?: any;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface LettersResponse {
  data: LetterData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Hook para gestão de cartas
 */
export const useLetters = (buildingId?: string) => {
  const { currentBuilding } = useBuilding();
  const queryClient = useQueryClient();
  const targetBuildingId = buildingId || currentBuilding?.id;

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    member_id: undefined as string | undefined,
    send_method: undefined as string | undefined,
    from_date: undefined as string | undefined,
    to_date: undefined as string | undefined
  });

  // Fetch letters
  const { data: lettersData, isLoading, error } = useQuery({
    queryKey: ['letters', targetBuildingId, pagination.page, pagination.pageSize, filters],
    queryFn: async () => {
      const result = await getLetters({
        building_id: targetBuildingId,
        page: pagination.page,
        limit: pagination.pageSize,
        ...filters
      });

      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      }

      return result;
    },
    enabled: !!targetBuildingId
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['letter-stats', targetBuildingId],
    queryFn: () => getLetterStats(targetBuildingId!),
    enabled: !!targetBuildingId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['letter-stats'] });
      toast.success('Carta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar carta: ' + (error.response?.data?.message || error.message));
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLetter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      toast.success('Carta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar carta: ' + (error.response?.data?.message || error.message));
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLetter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['letter-stats'] });
      toast.success('Carta eliminada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao eliminar carta: ' + (error.response?.data?.message || error.message));
    }
  });

  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const changePageSize = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const setFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  return {
    letters: lettersData?.data || [],
    stats: statsData?.data || {},
    isLoading,
    error,
    pagination,
    filters,
    setFilter,
    createLetter: (data: any) => createMutation.mutateAsync(data),
    updateLetter: (id: string, data: any) => updateMutation.mutateAsync({ id, data }),
    deleteLetter: (id: string) => deleteMutation.mutateAsync(id),
    changePage,
    changePageSize,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};

/**
 * Hook para gestão de templates de cartas
 */
export const useLetterTemplates = (buildingId?: string) => {
  const { currentBuilding } = useBuilding();
  const queryClient = useQueryClient();
  const targetBuildingId = buildingId || currentBuilding?.id;

  // Fetch templates
  const { data: templatesData, isLoading, error } = useQuery({
    queryKey: ['letter-templates', targetBuildingId],
    queryFn: async () => {
      const result = await getLetterTemplates({
        building_id: targetBuildingId
      });
      return result;
    },
    enabled: !!targetBuildingId
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createLetterTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar template: ' + (error.response?.data?.message || error.message));
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLetterTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar template: ' + (error.response?.data?.message || error.message));
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLetterTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      toast.success('Template eliminado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao eliminar template: ' + (error.response?.data?.message || error.message));
    }
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) => duplicateLetterTemplate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      toast.success('Template duplicado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao duplicar template: ' + (error.response?.data?.message || error.message));
    }
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: toggleLetterTemplateActive,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
      toast.success(result.message);
    },
    onError: (error: any) => {
      toast.error('Erro ao alterar estado: ' + (error.response?.data?.message || error.message));
    }
  });

  return {
    templates: templatesData?.data || [],
    isLoading,
    error,
    createTemplate: (data: any) => createMutation.mutateAsync(data),
    updateTemplate: (id: string, data: any) => updateMutation.mutateAsync({ id, data }),
    deleteTemplate: (id: string) => deleteMutation.mutateAsync(id),
    duplicateTemplate: (id: string, name?: string) => duplicateMutation.mutateAsync({ id, name }),
    toggleActive: (id: string) => toggleActiveMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isTogglingActive: toggleActiveMutation.isPending
  };
};

export default {
  useLetters,
  useLetterTemplates
};
