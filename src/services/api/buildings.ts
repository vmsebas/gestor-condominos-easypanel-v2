import * as api from '@/lib/api-v2';
import type { Building } from '@/types/database';

export interface BuildingsResponse {
  data: Building[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface BuildingsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDesc?: boolean;
}

export const buildingsAPI = {
  // Obtener todos los edificios
  async getAll(options?: BuildingsOptions): Promise<BuildingsResponse> {
    const result = await api.getBuildings(options);
    // Asegurar que siempre devuelve la estructura correcta
    if (Array.isArray(result)) {
      // Si la API devuelve solo un array, convertirlo a la estructura esperada
      return {
        data: result,
        pagination: {
          page: 1,
          pageSize: result.length,
          totalItems: result.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }
    return result;
  },

  // Obtener un edificio por ID
  async getById(id: string): Promise<Building> {
    const result = await api.getBuildingById(id);
    return result.data;
  },

  // Crear nuevo edificio
  async create(data: Partial<Building>): Promise<Building> {
    const result = await api.createBuilding(data);
    return result.data;
  },

  // Actualizar edificio
  async update(id: string, data: Partial<Building>): Promise<Building> {
    const result = await api.updateBuilding(id, data);
    return result.data;
  },

  // Eliminar edificio
  async delete(id: string): Promise<void> {
    await api.deleteBuilding(id);
  },

  // Obtener estadísticas del edificio
  async getStats(id: string): Promise<any> {
    const result = await api.getDashboardStats(id);
    return result.data;
  }
};