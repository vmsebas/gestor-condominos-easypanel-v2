/**
 * Communications API Service
 * Handles all communication-related API calls (emails, WhatsApp, letters)
 */

import apiClient from '@/lib/api-v2';

export interface CommunicationLog {
  id: string;
  member_id: string;
  building_id: string;
  communication_type: 'convocatoria' | 'acta' | 'quota' | 'note';
  communication_subtype?: string;
  channel: 'email' | 'whatsapp' | 'correio_certificado';
  status: 'draft_created' | 'sent' | 'opened' | 'confirmed' | 'failed';
  subject?: string;
  body_preview?: string;
  full_content?: string;
  pdf_url?: string;
  pdf_filename?: string;
  related_convocatoria_id?: string;
  related_minute_id?: string;
  related_transaction_id?: string;
  draft_created_at?: string;
  sent_at?: string;
  opened_at?: string;
  confirmed_at?: string;
  failed_at?: string;
  error_message?: string;
  retry_count?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CommunicationStats {
  total: number;
  by_type: Record<string, number>;
  by_channel: Record<string, number>;
  by_status: Record<string, number>;
  recent_count: number;
}

export interface CommunicationMessage {
  id: string;
  member_id: string;
  member_name: string;
  communication_type: string;
  channel: string;
  status: string;
  subject?: string;
  sent_at?: string;
  created_at: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface CommunicationCampaign {
  id: string;
  name: string;
  status: string;
  scheduled_at?: string;
  sent_count: number;
  total_count: number;
}

/**
 * Log a communication sent to a member
 */
async function logCommunication(data: Partial<CommunicationLog>): Promise<CommunicationLog> {
  const response = await apiClient.post('/communications/log', data);
  return response.data;
}

/**
 * Get all communication logs with optional filters
 */
async function getLogs(params?: {
  building_id?: string;
  member_id?: string;
  communication_type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ logs: CommunicationLog[]; total: number }> {
  const response = await apiClient.get('/communications/logs', { params });
  return response.data;
}

/**
 * Update communication status
 */
async function updateStatus(
  logId: string,
  status: CommunicationLog['status'],
  error_message?: string
): Promise<CommunicationLog> {
  const response = await apiClient.patch(`/communications/logs/${logId}/status`, {
    status,
    error_message
  });
  return response.data;
}

/**
 * Get communication statistics for a building
 */
async function getStats(buildingId: string): Promise<CommunicationStats> {
  const response = await apiClient.get(`/communications/stats/${buildingId}`);
  return response.data;
}

/**
 * Delete a communication log
 */
async function deleteLog(logId: string): Promise<void> {
  await apiClient.delete(`/communications/logs/${logId}`);
}

/**
 * Get recent messages for a building
 */
async function getRecentMessages(buildingId: string, limit: number = 10): Promise<CommunicationMessage[]> {
  const response = await getLogs({
    building_id: buildingId,
    limit,
    page: 1
  });

  // Transform logs to messages
  return response.logs.map(log => ({
    id: log.id,
    member_id: log.member_id,
    member_name: '', // Will be populated by joining with members
    communication_type: log.communication_type,
    channel: log.channel,
    status: log.status,
    subject: log.subject,
    sent_at: log.sent_at,
    created_at: log.created_at
  }));
}

/**
 * Get all messages (paginated)
 */
async function getMessages(
  buildingId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ messages: CommunicationMessage[]; total: number; totalPages: number }> {
  const response = await getLogs({
    building_id: buildingId,
    page,
    limit
  });

  const messages = response.logs.map(log => ({
    id: log.id,
    member_id: log.member_id,
    member_name: '', // Will be populated by joining with members
    communication_type: log.communication_type,
    channel: log.channel,
    status: log.status,
    subject: log.subject,
    sent_at: log.sent_at,
    created_at: log.created_at
  }));

  return {
    messages,
    total: response.total,
    totalPages: Math.ceil(response.total / limit)
  };
}

/**
 * Send a message (log it as sent)
 */
async function sendMessage(data: {
  member_id: string;
  building_id: string;
  communication_type: CommunicationLog['communication_type'];
  channel: CommunicationLog['channel'];
  subject?: string;
  body_preview?: string;
  full_content?: string;
  related_convocatoria_id?: string;
  related_minute_id?: string;
  metadata?: Record<string, any>;
}): Promise<CommunicationLog> {
  return logCommunication({
    ...data,
    status: 'sent',
    sent_at: new Date().toISOString()
  });
}

/**
 * Delete a message
 */
async function deleteMessage(messageId: string): Promise<void> {
  return deleteLog(messageId);
}

/**
 * Get templates (placeholder - implement when backend is ready)
 */
async function getTemplates(buildingId: string): Promise<CommunicationTemplate[]> {
  // TODO: Implement when backend endpoint is available
  return [];
}

/**
 * Save template (placeholder - implement when backend is ready)
 */
async function saveTemplate(template: Partial<CommunicationTemplate>): Promise<CommunicationTemplate> {
  // TODO: Implement when backend endpoint is available
  throw new Error('Not implemented');
}

/**
 * Delete template (placeholder - implement when backend is ready)
 */
async function deleteTemplate(templateId: string): Promise<void> {
  // TODO: Implement when backend endpoint is available
  throw new Error('Not implemented');
}

// Export both as named exports and default export
export const communicationsAPI = {
  logCommunication,
  getLogs,
  updateStatus,
  getStats,
  deleteLog,
  getRecentMessages,
  getMessages,
  sendMessage,
  deleteMessage,
  getTemplates,
  saveTemplate,
  deleteTemplate
};

export default communicationsAPI;
