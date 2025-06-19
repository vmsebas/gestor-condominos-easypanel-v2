import { useState, useEffect } from 'react';
import { useBuilding } from './useBuilding';
import { useNotifications, useCache } from '@/store/useStore';
import membersService from '@/utils/db/membersService';
import { Member } from '@/types/memberTypes';

/**
 * Hook para gestão de membros
 */
export const useMembers = (buildingId?: string) => {
  const { currentBuilding } = useBuilding();
  const { addNotification } = useNotifications();
  const { cache, updateMembersCache, isCacheValid } = useCache();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    isOwner: undefined as boolean | undefined,
    isResident: undefined as boolean | undefined,
    hasEmail: undefined as boolean | undefined
  });
  
  const targetBuildingId = buildingId || currentBuilding?.id;
  
  // Carregar membros na inicialização ou mudança de edificio
  useEffect(() => {
    if (targetBuildingId) {
      loadMembers();
    }
  }, [targetBuildingId]);
  
  const loadMembers = async (force = false) => {
    if (!targetBuildingId) return;
    
    try {
      // Verificar cache primeiro
      if (!force && isCacheValid('members') && cache.members.length > 0) {
        setMembers(cache.members);
        return;
      }
      
      setIsLoading(true);
      const membersList = await membersService.getAllMembers(targetBuildingId);
      
      setMembers(membersList);
      updateMembersCache(membersList);
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
      await loadMembers(true); // Force reload
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const createMember = async (memberData: Partial<Member>): Promise<Member | null> => {
    try {
      setIsLoading(true);
      
      // Validar fracção única
      if (memberData.fraction && targetBuildingId) {
        const exists = await membersService.fractionExists(
          memberData.fraction,
          targetBuildingId
        );
        
        if (exists) {
          addNotification({
            type: 'error',
            title: 'Fracção duplicada',
            message: `A fracção ${memberData.fraction} já existe neste edifício`,
            read: false
          });
          return null;
        }
      }
      
      // Validar email único
      if (memberData.email) {
        const emailExists = await membersService.emailExists(memberData.email);
        if (emailExists) {
          addNotification({
            type: 'error',
            title: 'Email duplicado',
            message: 'Este email já está em uso por outro membro',
            read: false
          });
          return null;
        }
      }
      
      const newMember = await membersService.createMember({
        ...memberData,
        buildingId: targetBuildingId
      });
      
      // Atualizar lista local
      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);
      updateMembersCache(updatedMembers);
      
      addNotification({
        type: 'success',
        title: 'Membro adicionado',
        message: `${newMember.name} foi adicionado com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return newMember;
    } catch (error) {
      console.error('Erro ao criar membro:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao adicionar membro',
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
      
      // Validar fracção única (excluindo o membro atual)
      if (memberData.fraction && targetBuildingId) {
        const exists = await membersService.fractionExists(
          memberData.fraction,
          targetBuildingId,
          id
        );
        
        if (exists) {
          addNotification({
            type: 'error',
            title: 'Fracção duplicada',
            message: `A fracção ${memberData.fraction} já existe neste edifício`,
            read: false
          });
          return null;
        }
      }
      
      // Validar email único (excluindo o membro atual)
      if (memberData.email) {
        const emailExists = await membersService.emailExists(memberData.email, id);
        if (emailExists) {
          addNotification({
            type: 'error',
            title: 'Email duplicado',
            message: 'Este email já está em uso por outro membro',
            read: false
          });
          return null;
        }
      }
      
      const updatedMember = await membersService.updateMember(id, memberData);
      
      // Atualizar lista local
      const updatedMembers = members.map(member =>
        member.id === id ? updatedMember : member
      );
      setMembers(updatedMembers);
      updateMembersCache(updatedMembers);
      
      addNotification({
        type: 'success',
        title: 'Membro atualizado',
        message: `${updatedMember.name} foi atualizado com sucesso`,
        read: false,
        autoClose: 3000
      });
      
      return updatedMember;
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao atualizar membro',
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
      const success = await membersService.deleteMember(id);
      
      if (success) {
        // Atualizar lista local
        const updatedMembers = members.filter(m => m.id !== id);
        setMembers(updatedMembers);
        updateMembersCache(updatedMembers);
        
        addNotification({
          type: 'success',
          title: 'Membro removido',
          message: `${member?.name || 'Membro'} foi removido com sucesso`,
          read: false,
          autoClose: 3000
        });
        
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Erro',
          message: 'Não foi possível remover o membro',
          read: false
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao eliminar membro:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao eliminar membro',
        read: false
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchMembers = async (term: string) => {
    try {
      setSearchTerm(term);
      
      if (term.trim() === '' || !targetBuildingId) {
        await loadMembers();
        return;
      }
      
      setIsLoading(true);
      const searchResults = await membersService.searchMembers(term, targetBuildingId);
      setMembers(searchResults);
    } catch (error) {
      console.error('Erro ao procurar membros:', error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao procurar membros',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filtros locais
  const filteredMembers = members.filter(member => {
    // Filtro de texto
    const matchesSearch = !searchTerm || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.fraction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtros booleanos
    const matchesOwner = filterOptions.isOwner === undefined || 
      member.isOwner === filterOptions.isOwner;
    
    const matchesResident = filterOptions.isResident === undefined || 
      member.isResident === filterOptions.isResident;
    
    const matchesEmail = filterOptions.hasEmail === undefined ||
      (filterOptions.hasEmail ? !!member.email : !member.email);
    
    return matchesSearch && matchesOwner && matchesResident && matchesEmail;
  });
  
  // Ordenação
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    // Primeiro por fracção, depois por nome
    const fractionCompare = a.fraction.localeCompare(b.fraction, 'pt', { numeric: true });
    if (fractionCompare !== 0) return fractionCompare;
    return a.name.localeCompare(b.name, 'pt');
  });
  
  return {
    members: sortedMembers,
    allMembers: members,
    isLoading,
    isRefreshing,
    searchTerm,
    filterOptions,
    loadMembers,
    refreshMembers,
    createMember,
    updateMember,
    deleteMember,
    searchMembers,
    setSearchTerm,
    setFilterOptions,
    isEmpty: members.length === 0,
    filteredCount: sortedMembers.length,
    totalCount: members.length
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
      const memberData = await membersService.getMemberById(memberId);
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
      const statsData = await membersService.getMembersStats(targetBuildingId);
      setStats(statsData);
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