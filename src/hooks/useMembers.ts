import { useState, useEffect, useCallback } from 'react';
import { useBuilding } from './useBuilding';
import { useNotifications } from '@/store/useStore';
import { membersAPI, MembersResponse } from '@/services/api/members';
import type { Member } from '@/types/database';
import { debounce } from 'lodash';

/**
 * Hook para gestão de membros
 */
export const useMembers = (buildingId?: string) => {
  const { currentBuilding } = useBuilding();
  const { addNotification } = useNotifications();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    isActive: undefined as boolean | undefined,
    hasEmail: undefined as boolean | undefined,
    role: undefined as string | undefined
  });
  const [sortBy, setSortBy] = useState<'name' | 'apartment' | 'monthly_fee'>('apartment');
  const [sortDesc, setSortDesc] = useState(false);
  
  const targetBuildingId = buildingId || currentBuilding?.id;
  
  // Debounce search term
  const debouncedSetSearchTerm = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500),
    []
  );
  
  // Carregar membros quando mudam os parâmetros
  useEffect(() => {
    if (targetBuildingId) {
      loadMembers();
    }
  }, [targetBuildingId, pagination.page, sortBy, sortDesc, debouncedSearchTerm, filterOptions.isActive]);
  
  // Update debounced search term when search term changes
  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
  }, [searchTerm, debouncedSetSearchTerm]);
  
  const loadMembers = async () => {
    if (!targetBuildingId) return;
    
    try {
      setIsLoading(true);
      const response = await membersAPI.getAll(targetBuildingId, {
        search: debouncedSearchTerm,
        page: pagination.page,
        pageSize: pagination.pageSize,
        orderBy: sortBy,
        orderDesc: sortDesc,
        isActive: filterOptions.isActive
      });
      
      setMembers(response.members || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar lista de membros',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshMembers = async () => {
    try {
      setIsRefreshing(true);
      await loadMembers();
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
  
  const createMember = async (memberData: Partial<Member>): Promise<Member | null> => {
    try {
      setIsLoading(true);
      
      const newMember = await membersAPI.create({
        ...memberData,
        building_id: targetBuildingId
      });
      
      // Recarregar lista
      await loadMembers();
      
      addNotification({
        type: 'success',
        title: 'Membro adicionado',
        message: `${newMember.name} foi adicionado com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return newMember;
    } catch (error: any) {
      console.error('Erro ao criar membro:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao adicionar membro',
        read: false
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateMember = async (id: string, memberData: Partial<Member>): Promise<Member | null> => {
    try {
      setIsLoading(true);
      
      const updatedMember = await membersAPI.update(id, memberData);
      
      // Atualizar lista local
      const updatedMembers = members.map(member =>
        member.id === id ? updatedMember : member
      );
      setMembers(updatedMembers);
      
      addNotification({
        type: 'success',
        title: 'Membro atualizado',
        message: `${updatedMember.name} foi atualizado com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return updatedMember;
    } catch (error: any) {
      console.error('Erro ao atualizar membro:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao atualizar membro',
        read: false
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteMember = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const member = members.find(m => m.id === id);
      await membersAPI.delete(id);
      
      // Recarregar lista
      await loadMembers();
      
      addNotification({
        type: 'success',
        title: 'Membro removido',
        message: `${member?.name || 'Membro'} foi removido com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao eliminar membro:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.response?.data?.message || 'Erro ao eliminar membro',
        read: false
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchMembers = (term: string) => {
    setSearchTerm(term);
    // O debounce e a mudança de página serão feitos automaticamente
  };
  
  // Filtros locais (apenas para os filtros que não são suportados pelo backend)
  const filteredMembers = members.filter(member => {
    // isActive já é filtrado no backend, então só aplicamos filtros locais
    const matchesEmail = filterOptions.hasEmail === undefined ||
      (filterOptions.hasEmail ? !!member.email : !member.email);
      
    const matchesRole = filterOptions.role === undefined ||
      member.role === filterOptions.role;
    
    return matchesEmail && matchesRole;
  });
  
  return {
    members: filteredMembers,
    allMembers: members,
    isLoading,
    isRefreshing,
    searchTerm,
    filterOptions,
    sortBy,
    sortDesc,
    pagination,
    loadMembers,
    refreshMembers,
    createMember,
    updateMember,
    deleteMember,
    searchMembers,
    setSearchTerm,
    setFilterOptions,
    setSortBy: changeSortBy,
    toggleSortOrder,
    changePage,
    changePageSize,
    isEmpty: members.length === 0,
    filteredCount: filteredMembers.length,
    totalCount: pagination.totalCount
  };
};

/**
 * Hook para obter um membro específico
 */
export const useMember = (memberId: string) => {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    if (memberId) {
      loadMember();
    }
  }, [memberId]);
  
  const loadMember = async () => {
    try {
      setIsLoading(true);
      const memberData = await membersAPI.getById(memberId);
      setMember(memberData);
    } catch (error) {
      console.error('Erro ao carregar membro:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar dados do membro',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    member,
    isLoading,
    refreshMember: loadMember,
    exists: !!member
  };
};

/**
 * Hook para estatísticas de membros
 */
export const useMembersStats = (buildingId?: string) => {
  const { currentBuilding } = useBuilding();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      // Por enquanto, obter stats da resposta de getAll
      const response = await membersAPI.getAll(targetBuildingId, { pageSize: 1 });
      setStats(response.stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de membros:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao carregar estatísticas de membros',
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
  useMembers,
  useMember,
  useMembersStats
};