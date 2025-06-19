import { useState, useEffect } from 'react';
import { useBuildings, useNotifications, useLoading } from '@/store/useStore';
import buildingsService from '@/utils/db/buildingsService';
import { Building } from '@/types/buildingTypes';

/**
 * Hook para gestão do edificio atual
 */
export const useBuilding = () => {
  const { currentBuilding, setCurrentBuilding } = useBuildings();
  const { addNotification } = useNotifications();
  const { setLoading } = useLoading();
  
  const switchBuilding = async (buildingId: string) => {
    try {
      setLoading(true, 'A carregar edifício...');
      
      const building = await buildingsService.getBuildingById(buildingId);
      
      if (building) {
        setCurrentBuilding(building);
        addNotification({
          type: 'success',
          title: 'Edifício alterado',
          message: `Agora a gerir: ${building.name}`,
          read: false,
          autoClose: 3000
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: 'Edifício não encontrado',
          read: false
        });
      }
    } catch (error) {
      console.error('Erro ao mudar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar edifício',
        read: false
      });
    } finally {
      setLoading(false);
    }
  };
  
  const refreshBuilding = async () => {
    if (!currentBuilding) return;
    
    try {
      const building = await buildingsService.getBuildingById(currentBuilding.id);
      if (building) {
        setCurrentBuilding(building);
      }
    } catch (error) {
      console.error('Erro ao atualizar edifício:', error);
    }
  };
  
  return {
    currentBuilding,
    switchBuilding,
    refreshBuilding,
    hasBuildingSelected: !!currentBuilding
  };
};

/**
 * Hook para gestão de lista de edificios
 */
export const useBuildingsList = () => {
  const { buildings, setBuildings, addBuilding, updateBuilding, removeBuilding } = useBuildings();
  const { addNotification } = useNotifications();
  const { setLoading } = useLoading();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Carregar edificios na inicialização
  useEffect(() => {
    if (buildings.length === 0) {
      loadBuildings();
    }
  }, []);
  
  const loadBuildings = async () => {
    try {
      setLoading(true, 'A carregar edifícios...');
      const buildingsList = await buildingsService.getAllBuildings();
      setBuildings(buildingsList);
    } catch (error) {
      console.error('Erro ao carregar edifícios:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar lista de edifícios',
        read: false
      });
    } finally {
      setLoading(false);
    }
  };
  
  const refreshBuildings = async () => {
    try {
      setIsRefreshing(true);
      const buildingsList = await buildingsService.getAllBuildings();
      setBuildings(buildingsList);
    } catch (error) {
      console.error('Erro ao atualizar edifícios:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar lista de edifícios',
        read: false
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const createBuilding = async (buildingData: Partial<Building>): Promise<boolean> => {
    try {
      setLoading(true, 'A criar edifício...');
      
      const newBuilding = await buildingsService.createBuilding(buildingData);
      addBuilding(newBuilding);
      
      return true;
    } catch (error) {
      console.error('Erro ao criar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao criar edifício',
        read: false
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const editBuilding = async (id: string, buildingData: Partial<Building>): Promise<boolean> => {
    try {
      setLoading(true, 'A atualizar edifício...');
      
      const updatedBuilding = await buildingsService.updateBuilding(id, buildingData);
      updateBuilding(id, updatedBuilding);
      
      return true;
    } catch (error) {
      console.error('Erro ao atualizar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar edifício',
        read: false
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteBuilding = async (id: string): Promise<boolean> => {
    try {
      setLoading(true, 'A eliminar edifício...');
      
      const success = await buildingsService.deleteBuilding(id);
      
      if (success) {
        removeBuilding(id);
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: 'Não foi possível eliminar o edifício',
          read: false
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao eliminar edifício:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Erro ao eliminar edifício',
        read: false
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const searchBuildings = async (term: string) => {
    try {
      setSearchTerm(term);
      
      if (term.trim() === '') {
        await loadBuildings();
        return;
      }
      
      setLoading(true, 'A procurar edifícios...');
      const searchResults = await buildingsService.searchBuildings(term);
      setBuildings(searchResults);
    } catch (error) {
      console.error('Erro ao procurar edifícios:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao procurar edifícios',
        read: false
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filtros locais
  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return {
    buildings: filteredBuildings,
    allBuildings: buildings,
    searchTerm,
    isRefreshing,
    loadBuildings,
    refreshBuildings,
    createBuilding,
    editBuilding,
    deleteBuilding,
    searchBuildings,
    setSearchTerm,
    isEmpty: buildings.length === 0
  };
};

/**
 * Hook para estatísticas de edificio
 */
export const useBuildingStats = (buildingId?: string) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentBuilding } = useBuilding();
  const { addNotification } = useNotifications();
  
  const targetBuildingId = buildingId || currentBuilding?.id;
  
  useEffect(() => {
    if (targetBuildingId) {
      loadStats();
    }
  }, [targetBuildingId]);
  
  const loadStats = async () => {
    if (!targetBuildingId) return;
    
    try {
      setIsLoading(true);
      
      const [buildingStats, financialSummary] = await Promise.all([
        buildingsService.getBuildingStats(targetBuildingId),
        buildingsService.getBuildingFinancialSummary(targetBuildingId)
      ]);
      
      setStats({
        ...buildingStats,
        ...financialSummary
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
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
  useBuilding,
  useBuildingsList,
  useBuildingStats
};