/**
 * Letters API Service
 * Handles all letter-related API calls (sent letters, templates)
 */

import apiClient from '@/lib/api-v2';

export interface SentLetter {
  id: string;
  building_id: string;
  template_id?: string;
  member_id?: string;
  recipient_name: string;
  recipient_email?: string;
  subject: string;
  content: string;
  send_method: 'email' | 'correio_certificado' | 'whatsapp' | 'printed';
  sent_date?: string;
  delivery_confirmation?: boolean;
  tracking_number?: string;
  legal_validity?: boolean;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from query
  building_name?: string;
  member_name?: string;
  member_email?: string;
  template_name?: string;
}

export interface LetterTemplate {
  id: string;
  building_id?: string;
  name: string;
  type: string;
  subject?: string;
  content: string;
  variables?: string[];
  is_active?: boolean;
  legal_basis?: string;
  required_fields?: string[];
  validation_rules?: Record<string, any>;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface LetterStats {
  total: number;
  delivered: number;
  pending: number;
  by_email: number;
  by_mail: number;
  by_whatsapp: number;
}

/**
 * Get all sent letters with optional filters
 */
async function getLetters(params?: {
  building_id?: string;
  member_id?: string;
  send_method?: string;
  page?: number;
  limit?: number;
}): Promise<{ letters: SentLetter[]; total: number; totalPages: number }> {
  const response = await apiClient.get('/letters', { params });
  return {
    letters: response.data.data || [],
    total: response.data.pagination?.total || 0,
    totalPages: response.data.pagination?.totalPages || 0
  };
}

/**
 * Get a single letter by ID
 */
async function getLetterById(id: string): Promise<SentLetter> {
  const response = await apiClient.get(`/letters/${id}`);
  return response.data.data;
}

/**
 * Create a new letter
 */
async function createLetter(data: {
  building_id: string;
  template_id?: string;
  member_id?: string;
  recipient_name: string;
  recipient_email?: string;
  subject: string;
  content: string;
  send_method: string;
  sent_date?: string;
  delivery_confirmation?: boolean;
  tracking_number?: string;
  legal_validity?: boolean;
}): Promise<SentLetter> {
  const response = await apiClient.post('/letters', data);
  return response.data.data;
}

/**
 * Update an existing letter
 */
async function updateLetter(
  id: string,
  data: Partial<SentLetter>
): Promise<SentLetter> {
  const response = await apiClient.put(`/letters/${id}`, data);
  return response.data.data;
}

/**
 * Delete a letter
 */
async function deleteLetter(id: string): Promise<void> {
  await apiClient.delete(`/letters/${id}`);
}

/**
 * Get all letter templates
 */
async function getTemplates(params?: {
  building_id?: string;
  type?: string;
  is_active?: boolean;
}): Promise<LetterTemplate[]> {
  const response = await apiClient.get('/letters/templates/all', { params });
  return response.data.data || [];
}

/**
 * Get a single template by ID
 */
async function getTemplateById(id: string): Promise<LetterTemplate> {
  const response = await apiClient.get(`/letters/templates/${id}`);
  return response.data.data;
}

/**
 * Create a new template
 */
async function createTemplate(data: {
  building_id?: string;
  name: string;
  type: string;
  subject?: string;
  content: string;
  variables?: string[];
  legal_basis?: string;
  required_fields?: string[];
  validation_rules?: Record<string, any>;
  title?: string;
}): Promise<LetterTemplate> {
  const response = await apiClient.post('/letters/templates', data);
  return response.data.data;
}

/**
 * Update an existing template
 */
async function updateTemplate(
  id: string,
  data: Partial<LetterTemplate>
): Promise<LetterTemplate> {
  const response = await apiClient.put(`/letters/templates/${id}`, data);
  return response.data.data;
}

/**
 * Delete a template
 */
async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/letters/templates/${id}`);
}

/**
 * Get letter statistics for a building
 */
async function getStats(buildingId: string): Promise<LetterStats> {
  const response = await apiClient.get(`/letters/building/${buildingId}/stats`);
  return response.data.data;
}

// Export both as named exports and default export
export const lettersAPI = {
  // Letters
  getLetters,
  getLetterById,
  createLetter,
  updateLetter,
  deleteLetter,

  // Templates
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,

  // Stats
  getStats
};

export default lettersAPI;
