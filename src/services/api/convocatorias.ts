import * as api from '@/lib/api-v2';
import apiClient from '@/lib/api-v2';

export interface Convocatoria {
  id: string;
  building_id: string;
  assembly_number: string;
  assembly_type: 'ordinary' | 'extraordinary';
  date: string;
  time: string;
  location: string;
  agenda_items?: AgendaItem[];
  [key: string]: any;
}

export interface AgendaItem {
  id?: string;
  title: string;
  description?: string;
  order_number: number;
}

export const convocatoriasAPI = {
  // Obtener todas las convocatorias
  async getAll(filters?: {
    buildingId?: string;
    year?: number;
    status?: string;
  }): Promise<Convocatoria[]> {
    const result = await api.getConvocatorias(filters?.buildingId, filters);
    return result.data || [];
  },

  // Obtener convocatoria por ID
  async getById(id: string): Promise<Convocatoria> {
    const result = await api.getConvocatoriaById(id);
    return result.data;
  },

  // Crear nueva convocatoria
  async create(data: Partial<Convocatoria>): Promise<Convocatoria> {
    const result = await api.createConvocatoria(data);
    return result.data;
  },

  // Actualizar convocatoria
  async update(id: string, data: Partial<Convocatoria>): Promise<Convocatoria> {
    const result = await api.updateConvocatoria(id, data);
    return result.data;
  },

  // Eliminar convocatoria
  async delete(id: string): Promise<void> {
    await api.deleteConvocatoria(id);
  },

  // Generar PDF de convocatoria
  async generatePDF(id: string): Promise<Blob> {
    const response = await apiClient.get(`/convocatorias/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Enviar convocatoria por email
  async sendEmails(id: string, memberIds: string[]): Promise<any> {
    const response = await apiClient.post(`/convocatorias/${id}/send`, { memberIds });
    return response.data;
  }
};