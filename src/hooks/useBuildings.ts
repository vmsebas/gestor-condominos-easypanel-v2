import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/store/useStore';
import { buildingsAPI, BuildingsResponse, BuildingsOptions } from '@/services/api/buildings';
import type { Building } from '@/types/database';
import { debounce } from 'lodash';

/**
 * Hook para gestão de edifícios com paginação
 */
export const useBuildings = () => {
  const { addNotification } = useNotifications();
  
  const [buildings, setBuildings] = useState<Building[]>([]);
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
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'number_of_units'>('name');
  const [sortDesc, setSortDesc] = useState(false);
  
  // Debounce search term
  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500),
    []
  );
  
  // Carregar edifícios quando mudam os parâmetros
  useEffect(() => {
    loadBuildings();
  }, [pagination.page, pagination.pageSize, sortBy, sortDesc, debouncedSearchTerm]);
  
  // Update debounced search term when search term changes
  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
  }, [searchTerm, debouncedSetSearchTerm]);
  
  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      
      const options: BuildingsOptions = {
        search: debouncedSearchTerm,
        page: pagination.page,
        pageSize: pagination.pageSize,
        orderBy: sortBy,
        orderDesc: sortDesc
      };
      
      const response = await buildingsAPI.getAll(options);
      
      setBuildings(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar edifícios:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar lista de edifícios',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshBuildings = async () => {
    try {
      setIsRefreshing(true);
      await loadBuildings();
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
  
  const createBuilding = async (buildingData: Partial<Building>): Promise<Building | null> => {
    try {
      setIsLoading(true);
      
      const newBuilding = await buildingsAPI.create(buildingData);
      
      // Recarregar lista
      await loadBuildings();
      
      addNotification({
        type: 'success',
        title: 'Edifício criado',
        message: `${newBuilding.name} foi criado com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return newBuilding;
    } catch (error: any) {
      console.error('Erro ao criar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao criar edifício',
        read: false
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateBuilding = async (id: string, buildingData: Partial<Building>): Promise<Building | null> => {
    try {
      setIsLoading(true);
      
      const updatedBuilding = await buildingsAPI.update(id, buildingData);
      
      // Atualizar lista local
      const updatedBuildings = buildings.map(building =>
        building.id === id ? updatedBuilding : building
      );
      setBuildings(updatedBuildings);
      
      addNotification({
        type: 'success',
        title: 'Edifício atualizado',
        message: `${updatedBuilding.name} foi atualizado com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return updatedBuilding;
    } catch (error: any) {
      console.error('Erro ao atualizar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao atualizar edifício',
        read: false
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteBuilding = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const building = buildings.find(b => b.id === id);
      await buildingsAPI.delete(id);
      
      // Recarregar lista
      await loadBuildings();
      
      addNotification({
        type: 'success',
        title: 'Edifício eliminado',
        message: `${building?.name || 'Edifício'} foi eliminado com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao eliminar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao eliminar edifício',
        read: false
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchBuildings = (term: string) => {
    setSearchTerm(term);
    // O debounce e a mudança de página serão feitos automaticamente
  };
  
  // Filtros locais para favoritos e outros campos
  const favoriteBuildings = buildings.filter(b => b.isFavorite);
  
  // Estatísticas
  const totalUnits = buildings.reduce((sum, b) => sum + (b.number_of_units || 0), 0);
  const averageQuota = buildings.length > 0 ? 
    buildings.reduce((sum, b) => sum + (parseFloat(b.default_monthly_fee || '0')), 0) / buildings.length : 0;
  
  return {
    buildings,
    favoriteBuildings,
    isLoading,
    isRefreshing,
    searchTerm,
    sortBy,
    sortDesc,
    pagination,
    loadBuildings,
    refreshBuildings,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    searchBuildings,
    setSearchTerm,
    setSortBy: changeSortBy,
    toggleSortOrder,
    changePage,
    changePageSize,
    isEmpty: buildings.length === 0,
    totalCount: pagination.totalItems,
    totalUnits,
    averageQuota
  };
};

/**
 * Hook para obter um edifício específico
 */
export const useBuilding = (buildingId?: string) => {
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    if (buildingId) {
      loadBuilding();
    }
  }, [buildingId]);
  
  const loadBuilding = async () => {
    if (!buildingId) return;
    
    try {
      setIsLoading(true);
      const buildingData = await buildingsAPI.getById(buildingId);
      setBuilding(buildingData);
    } catch (error) {
      console.error('Erro ao carregar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar dados do edifício',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    building,
    isLoading,
    refreshBuilding: loadBuilding,
    exists: !!building
  };
};

/**
 * Hook para estatísticas de edifícios
 */
export const useBuildingStats = (buildingId: string) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    if (buildingId) {
      loadStats();
    }
  }, [buildingId]);
  
  const loadStats = async () => {
    if (!buildingId) return;
    
    try {
      setIsLoading(true);
      const statsData = await buildingsAPI.getStats(buildingId);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar estatísticas do edifício',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    stats,
    isLoading,
    refreshStats: loadStats,
    hasData: !!stats
  };
};

export default {
  useBuildings,
  useBuilding,
  useBuildingStats
};