import { useState, useEffect, useCallback } from 'react';
import { useBuilding } from './useBuilding';
import { useNotifications } from '@/store/useStore';
import { getConvocatorias, createConvocatoria, updateConvocatoria, deleteConvocatoria } from '@/lib/api-v2';
import { debounce } from 'lodash';

export interface ConvocatoriaData {
  id: string;
  building_id: string;
  assembly_type: 'ordinary' | 'extraordinary';
  assembly_number: string;
  date: string;
  time: string;
  location: string;
  second_call_enabled: boolean;
  second_call_date?: string;
  second_call_time?: string;
  administrator: string;
  secretary?: string;
  legal_reference?: string;
  status: string;
  building_name?: string;
  building_address?: string;
  postal_code?: string;
  city?: string;
  agenda_items?: any[];
  created_at: string;
  updated_at: string;
}

export interface ConvocatoriasResponse {
  data: ConvocatoriaData[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Hook para gestão de convocatórias com paginação
 */
export const useConvocatorias = (buildingId?: string) => {
  const { currentBuilding } = useBuilding();
  const { addNotification } = useNotifications();
  
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaData[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    assemblyType: undefined as 'ordinary' | 'extraordinary' | undefined,
    fromDate: undefined as string | undefined,
    toDate: undefined as string | undefined
  });
  const [sortBy, setSortBy] = useState<'date' | 'assembly_number' | 'created_at'>('date');
  const [sortDesc, setSortDesc] = useState(true);
  
  const targetBuildingId = buildingId || currentBuilding?.id;
  
  // Debounce search term
  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500),
    []
  );
  
  // Carregar convocatórias quando mudam os parâmetros
  useEffect(() => {
    loadConvocatorias();
  }, [targetBuildingId, pagination.page, pagination.pageSize, sortBy, sortDesc, debouncedSearchTerm, filterOptions]);
  
  // Update debounced search term when search term changes
  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
  }, [searchTerm, debouncedSetSearchTerm]);
  
  const loadConvocatorias = async () => {
    try {
      setIsLoading(true);
      
      const response = await getConvocatorias(targetBuildingId, {
        assemblyType: filterOptions.assemblyType,
        fromDate: filterOptions.fromDate,
        toDate: filterOptions.toDate,
        page: pagination.page,
        pageSize: pagination.pageSize,
        orderBy: sortBy,
        orderDesc: sortDesc
      });
      
      // Check if response has expected structure
      if (response.data) {
        setConvocatorias(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        // Legacy response format (array directly)
        setConvocatorias(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Erro ao carregar convocatórias:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar lista de convocatórias',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshConvocatorias = async () => {
    try {
      setIsRefreshing(true);
      await loadConvocatorias();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  const changePageSize = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, pageSize: newPageSize }));
  };
  
  const changeSortBy = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const toggleSortOrder = () => {
    setSortDesc(!sortDesc);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const createNewConvocatoria = async (convocatoriaData: any): Promise<ConvocatoriaData | null> => {
    try {
      setIsLoading(true);
      
      const result = await createConvocatoria({
        ...convocatoriaData,
        building_id: targetBuildingId
      });
      
      const newConvocatoria = result.data || result;
      
      // Recarregar lista
      await loadConvocatorias();
      
      addNotification({
        type: 'success',
        title: 'Convocatória criada',
        message: 'Convocatória criada com sucesso',
        read: false,
        autoClose: 3000
      });
      
      return newConvocatoria;
    } catch (error: any) {
      console.error('Erro ao criar convocatória:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao criar convocatória',
        read: false
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateExistingConvocatoria = async (id: string, convocatoriaData: any): Promise<ConvocatoriaData | null> => {
    try {
      setIsLoading(true);
      
      const result = await updateConvocatoria(id, convocatoriaData);
      const updatedConvocatoria = result.data || result;
      
      // Atualizar lista local
      const updatedConvocatorias = convocatorias.map(convocatoria =>
        convocatoria.id === id ? updatedConvocatoria : convocatoria
      );
      setConvocatorias(updatedConvocatorias);
      
      addNotification({
        type: 'success',
        title: 'Convocatória atualizada',
        message: 'Convocatória atualizada com sucesso',
        read: false,
        autoClose: 3000
      });
      
      return updatedConvocatoria;
    } catch (error: any) {
      console.error('Erro ao atualizar convocatória:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao atualizar convocatória',
        read: false
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteExistingConvocatoria = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      await deleteConvocatoria(id);
      
      // Recarregar lista
      await loadConvocatorias();
      
      addNotification({
        type: 'success',
        title: 'Convocatória eliminada',
        message: 'Convocatória eliminada com sucesso',
        read: false,
        autoClose: 3000
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao eliminar convocatória:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao eliminar convocatória',
        read: false
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchConvocatorias = (term: string) => {
    setSearchTerm(term);
    // O debounce e a mudança de página serão feitos automaticamente
  };
  
  return {
    convocatorias,
    isLoading,
    isRefreshing,
    searchTerm,
    filterOptions,
    sortBy,
    sortDesc,
    pagination,
    loadConvocatorias,
    refreshConvocatorias,
    createConvocatoria: createNewConvocatoria,
    updateConvocatoria: updateExistingConvocatoria,
    deleteConvocatoria: deleteExistingConvocatoria,
    searchConvocatorias,
    setSearchTerm,
    setFilterOptions,
    setSortBy: changeSortBy,
    toggleSortOrder,
    changePage,
    changePageSize,
    isEmpty: convocatorias.length === 0,
    totalCount: pagination.totalItems
  };
};

/**
 * Hook para obter uma convocatória específica
 */
export const useConvocatoria = (convocatoriaId: string) => {
  const [convocatoria, setConvocatoria] = useState<ConvocatoriaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    if (convocatoriaId) {
      loadConvocatoria();
    }
  }, [convocatoriaId]);
  
  const loadConvocatoria = async () => {
    try {
      setIsLoading(true);
      // For now, load all and find the specific one
      const response = await getConvocatorias();
      const allConvocatorias = response.data || response;
      const found = allConvocatorias.find((c: ConvocatoriaData) => c.id === convocatoriaId);
      setConvocatoria(found || null);
    } catch (error) {
      console.error('Erro ao carregar convocatória:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar dados da convocatória',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    convocatoria,
    isLoading,
    refreshConvocatoria: loadConvocatoria,
    exists: !!convocatoria
  };
};

export default {
  useConvocatorias,
  useConvocatoria
};