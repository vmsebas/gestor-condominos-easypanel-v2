export type CommunicationType = 'email' | 'sms' | 'whatsapp' | 'push' | 'letter';
export type CommunicationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced';
export type CommunicationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type CommunicationCategory = 
  | 'payment_reminder'     // Lembrete de pagamento
  | 'meeting_notice'       // Aviso de reunião
  | 'maintenance_alert'    // Alerta de manutenção
  | 'general_announcement' // Anúncio geral
  | 'emergency'           // Emergência
  | 'arrears_notice'      // Aviso de morosidade
  | 'document_ready'      // Documento pronto
  | 'system_notification'; // Notificação do sistema

export interface CommunicationTemplate {
  id: string;
  buildingId: string;
  name: string;
  category: CommunicationCategory;
  type: CommunicationType[];
  subject: string;
  content: string;           // Template with variables
  variables: TemplateVariable[];
  isActive: boolean;
  metadata: {
    description?: string;
    author?: string;
    version?: string;
    lastUsed?: string;
    useCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface CommunicationMessage {
  id: string;
  buildingId: string;
  templateId?: string;
  type: CommunicationType;
  category: CommunicationCategory;
  priority: CommunicationPriority;
  
  // Content
  subject: string;
  content: string;
  attachments?: CommunicationAttachment[];
  
  // Recipients
  recipients: CommunicationRecipient[];
  
  // Scheduling
  scheduledFor?: string;
  sendAt?: string;
  
  // Status tracking
  status: CommunicationStatus;
  statusDetails?: {
    sent?: number;
    delivered?: number;
    read?: number;
    failed?: number;
    bounced?: number;
  };
  
  // Metadata
  metadata: {
    campaignName?: string;
    sender?: string;
    totalRecipients?: number;
    estimatedCost?: number;
    deliveryReport?: any;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationRecipient {
  id: string;
  memberId?: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  apartmentNumber?: string;
  
  // Status per recipient
  status: CommunicationStatus;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  
  // Personalization
  variables?: Record<string, any>;
}

export interface CommunicationAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface CommunicationCampaign {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  type: CommunicationType[];
  category: CommunicationCategory;
  
  // Targeting
  targetAudience: {
    memberType?: 'owner' | 'resident' | 'all';
    apartments?: string[];
    hasArrears?: boolean;
    customFilter?: string;
  };
  
  // Content
  templateId?: string;
  subject: string;
  content: string;
  attachments?: CommunicationAttachment[];
  
  // Scheduling
  scheduledFor?: string;
  repeatSettings?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  
  // Results
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'failed';
  results?: {
    totalSent: number;
    delivered: number;
    read: number;
    failed: number;
    cost: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  isActive: boolean;
  
  // Trigger conditions
  trigger: {
    type: 'schedule' | 'event' | 'condition';
    conditions: AutomationCondition[];
  };
  
  // Actions
  actions: AutomationAction[];
  
  // Execution
  lastRun?: string;
  nextRun?: string;
  executionCount: number;
  
  metadata: {
    createdBy?: string;
    category?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty' | 'is_not_empty';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface AutomationAction {
  type: 'send_communication' | 'create_document' | 'update_member' | 'create_arrear';
  parameters: Record<string, any>;
}

export interface CommunicationStats {
  totalSent: number;
  deliveryRate: number;
  readRate: number;
  bounceRate: number;
  byType: Record<CommunicationType, number>;
  byCategory: Record<CommunicationCategory, number>;
  thisMonth: number;
  thisYear: number;
  avgResponseTime: number;
  topTemplates: Array<{
    templateId: string;
    name: string;
    useCount: number;
  }>;
}

export interface CommunicationSettings {
  buildingId: string;
  
  // Email settings
  emailProvider: 'smtp' | 'sendgrid' | 'aws_ses' | 'mailgun';
  emailConfig: {
    senderName: string;
    senderEmail: string;
    replyTo?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    apiKey?: string;
  };
  
  // SMS settings
  smsProvider: 'twilio' | 'nexmo' | 'aws_sns' | 'custom';
  smsConfig: {
    senderName: string;
    apiKey?: string;
    apiSecret?: string;
    phoneNumber?: string;
  };
  
  // WhatsApp settings
  whatsappConfig: {
    businessAccountId?: string;
    accessToken?: string;
    phoneNumberId?: string;
    webhookToken?: string;
  };
  
  // General settings
  defaultPriority: CommunicationPriority;
  enableAutoRetry: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  enableDeliveryReports: boolean;
  enableReadReceipts: boolean;
  
  // Compliance
  privacySettings: {
    requireOptIn: boolean;
    allowOptOut: boolean;
    gdprCompliant: boolean;
    dataRetentionDays: number;
  };
  
  updatedAt: string;
}

// Pre-defined templates for common communications
export const DEFAULT_TEMPLATES: Record<CommunicationCategory, {
  name: string;
  subject: string;
  content: string;
  variables: string[];
  priority: CommunicationPriority;
}> = {
  payment_reminder: {
    name: 'Lembrete de Pagamento',
    subject: 'Lembrete: Quota do mês {{month}} - {{buildingName}}',
    content: `Caro(a) {{memberName}},

Este é um lembrete amigável de que a quota de condomínio do mês {{month}} no valor de {{quotaAmount}} tem vencimento em {{dueDate}}.

Para evitar juros de mora, solicitamos que efetue o pagamento até à data indicada.

Dados para pagamento:
{{paymentInstructions}}

Em caso de dúvidas, contacte a administração.

Atenciosamente,
{{administratorName}}
{{buildingName}}`,
    variables: ['memberName', 'month', 'quotaAmount', 'dueDate', 'paymentInstructions', 'administratorName', 'buildingName'],
    priority: 'normal'
  },
  
  meeting_notice: {
    name: 'Aviso de Reunião',
    subject: 'Convocatória: {{meetingType}} - {{meetingDate}}',
    content: `Caro(a) {{memberName}},

Tem a honra de ser convocado(a) para a {{meetingType}} que se realizará:

📅 Data: {{meetingDate}}
🕒 Hora: {{meetingTime}}
📍 Local: {{meetingLocation}}

Ordem do Dia:
{{agenda}}

A sua presença é importante para as decisões do condomínio.

{{administratorName}}
{{buildingName}}`,
    variables: ['memberName', 'meetingType', 'meetingDate', 'meetingTime', 'meetingLocation', 'agenda', 'administratorName', 'buildingName'],
    priority: 'high'
  },
  
  maintenance_alert: {
    name: 'Alerta de Manutenção',
    subject: 'Manutenção Programada - {{maintenanceType}}',
    content: `Caro(a) {{memberName}},

Informamos que está programada manutenção no edifício:

🔧 Tipo: {{maintenanceType}}
📅 Data: {{maintenanceDate}}
🕒 Horário: {{maintenanceTime}}
⏱️ Duração estimada: {{estimatedDuration}}

Durante este período poderá haver:
{{affectedServices}}

Pedimos a sua compreensão pelos inconvenientes.

{{administratorName}}
{{buildingName}}`,
    variables: ['memberName', 'maintenanceType', 'maintenanceDate', 'maintenanceTime', 'estimatedDuration', 'affectedServices', 'administratorName', 'buildingName'],
    priority: 'normal'
  },
  
  general_announcement: {
    name: 'Anúncio Geral',
    subject: '{{announcementTitle}} - {{buildingName}}',
    content: `Caro(a) {{memberName}},

{{announcementContent}}

{{additionalInfo}}

{{administratorName}}
{{buildingName}}`,
    variables: ['memberName', 'announcementTitle', 'announcementContent', 'additionalInfo', 'administratorName', 'buildingName'],
    priority: 'normal'
  },
  
  emergency: {
    name: 'Comunicação de Emergência',
    subject: '🚨 URGENTE: {{emergencyType}} - {{buildingName}}',
    content: `🚨 COMUNICAÇÃO URGENTE 🚨

{{emergencyMessage}}

Instruções:
{{instructions}}

Contactos de emergência:
{{emergencyContacts}}

Esta mensagem foi enviada automaticamente.`,
    variables: ['emergencyType', 'emergencyMessage', 'instructions', 'emergencyContacts', 'buildingName'],
    priority: 'urgent'
  },
  
  arrears_notice: {
    name: 'Aviso de Morosidade',
    subject: 'Aviso: Quotas em atraso - Apartamento {{apartmentNumber}}',
    content: `Caro(a) {{memberName}},

De acordo com os nossos registos, existem quotas em atraso:

💰 Valor total em dívida: {{arrearAmount}}
📅 Vencimento mais antigo: {{oldestDueDate}}
📄 Número de quotas em atraso: {{arrearCount}}

Solicitamos a regularização no prazo de {{paymentDeadline}} dias para evitar ações legais.

Dados para pagamento:
{{paymentInstructions}}

{{administratorName}}
{{buildingName}}`,
    variables: ['memberName', 'apartmentNumber', 'arrearAmount', 'oldestDueDate', 'arrearCount', 'paymentDeadline', 'paymentInstructions', 'administratorName', 'buildingName'],
    priority: 'high'
  },
  
  document_ready: {
    name: 'Documento Disponível',
    subject: 'Documento pronto: {{documentType}}',
    content: `Caro(a) {{memberName}},

O documento solicitado está disponível:

📄 Tipo: {{documentType}}
📅 Data de emissão: {{issueDate}}
🔗 {{downloadLink}}

Este documento ficará disponível por {{validityPeriod}} dias.

{{administratorName}}
{{buildingName}}`,
    variables: ['memberName', 'documentType', 'issueDate', 'downloadLink', 'validityPeriod', 'administratorName', 'buildingName'],
    priority: 'normal'
  },
  
  system_notification: {
    name: 'Notificação do Sistema',
    subject: 'Notificação: {{notificationType}}',
    content: `{{notificationMessage}}

{{additionalDetails}}

Esta é uma mensagem automática do sistema.`,
    variables: ['notificationType', 'notificationMessage', 'additionalDetails'],
    priority: 'low'
  }
};