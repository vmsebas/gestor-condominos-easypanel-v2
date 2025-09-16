import * as api from '@/lib/api-v2';
import type { Member } from '@/types/database';

export interface MembersResponse {
  members: Member[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats?: any;
}

export const membersAPI = {
  // Obtener todos los miembros
  async getAll(buildingId?: string, options?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDesc?: boolean;
  }): Promise<MembersResponse> {
    const result = await api.getMembers(buildingId, options);
    return result.data;
  },

  // Obtener un miembro por ID
  async getById(id: string): Promise<Member> {
    const result = await api.getMemberById(id);
    return result.data;
  },

  // Obtener perfil completo del miembro
  async getProfile(id: string): Promise<any> {
    const result = await api.getMemberProfile(id);
    return result.data;
  },

  // Crear nuevo miembro
  async create(data: Partial<Member>): Promise<Member> {
    const result = await api.createMember(data);
    return result.data;
  },

  // Actualizar miembro
  async update(id: string, data: Partial<Member>): Promise<Member> {
    const result = await api.updateMember(id, data);
    return result.data;
  },

  // Eliminar miembro
  async delete(id: string): Promise<void> {
    await api.deleteMember(id);
  },

  // Obtener pagos del miembro
  async getPayments(id: string, year?: number): Promise<any[]> {
    // TODO: Implementar en api-v2.ts cuando el endpoint esté migrado
    const result = await api.getTransactions({ memberId: id });
    return result.data || [];
  },

  // Obtener documentos del miembro
  async getDocuments(id: string): Promise<any[]> {
    // TODO: Implementar en api-v2.ts cuando el endpoint esté migrado
    const result = await api.getDocuments({ memberId: id });
    return result.data || [];
  }
};