export type DocumentType = 
  | 'arrears_letter'      // Carta de morosidade
  | 'quota_certificate'   // Certificado de quotas
  | 'receipt'            // Recibo
  | 'minutes_pdf'        // Ata em PDF
  | 'assembly_notice'    // Convocatória
  | 'financial_report';  // Relatório financeiro

export type DocumentStatus = 'generated' | 'processing' | 'failed';

export interface DocumentTemplate {
  id: string;
  buildingId: string;
  name: string;
  type: DocumentType;
  content: string;           // HTML template with variables
  variables: TemplateVariable[];
  isActive: boolean;
  metadata: {
    description?: string;
    author?: string;
    version?: string;
    legalCompliance?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;              // Variable name in template (e.g., {{memberName}})
  label: string;             // Display label for users
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'list';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface GeneratedDocument {
  id: string;
  buildingId: string;
  templateId: string;
  type: DocumentType;
  title: string;
  content: string;           // Generated HTML content
  pdfUrl?: string;          // URL to generated PDF
  status: DocumentStatus;
  metadata: {
    recipient?: string;
    recipientEmail?: string;
    variables?: Record<string, any>;
    generatedBy?: string;
    sendMethod?: 'email' | 'print' | 'download';
  };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentGenerationRequest {
  templateId: string;
  variables: Record<string, any>;
  recipients?: string[];     // Member IDs or email addresses
  metadata?: {
    title?: string;
    sendMethod?: 'email' | 'print' | 'download';
    scheduledFor?: string;   // For scheduled generation
  };
}

export interface BulkDocumentRequest {
  templateId: string;
  filter: {
    memberType?: 'owner' | 'resident' | 'all';
    hasArrears?: boolean;
    apartmentNumbers?: string[];
    customFilter?: string;
  };
  variables?: Record<string, any>; // Global variables for all documents
  metadata?: {
    batchTitle?: string;
    sendMethod?: 'email' | 'print' | 'download';
    scheduledFor?: string;
  };
}

export interface DocumentPreviewData {
  html: string;
  variables: Record<string, any>;
  estimatedPages: number;
  warnings?: string[];       // Validation warnings
}

// Pre-defined template types with their required variables
export const TEMPLATE_DEFINITIONS: Record<DocumentType, {
  name: string;
  description: string;
  requiredVariables: string[];
  optionalVariables: string[];
  category: string;
}> = {
  arrears_letter: {
    name: 'Carta de Morosidade',
    description: 'Carta automática para membros com quotas em atraso',
    requiredVariables: ['memberName', 'apartmentNumber', 'arrearAmount', 'dueDate'],
    optionalVariables: ['paymentInstructions', 'legalConsequences', 'contactInfo'],
    category: 'Financeiro'
  },
  quota_certificate: {
    name: 'Certificado de Quotas',
    description: 'Certificado comprovativo de quotas em dia',
    requiredVariables: ['memberName', 'apartmentNumber', 'currentYear', 'quotaStatus'],
    optionalVariables: ['issueDate', 'validUntil', 'observations'],
    category: 'Administrativo'
  },
  receipt: {
    name: 'Recibo',
    description: 'Recibo de pagamento de quotas ou outros valores',
    requiredVariables: ['memberName', 'amount', 'paymentDate', 'description'],
    optionalVariables: ['paymentMethod', 'referenceNumber', 'observations'],
    category: 'Financeiro'
  },
  minutes_pdf: {
    name: 'Ata em PDF',
    description: 'Exportação de ata de reunião em formato PDF',
    requiredVariables: ['meetingDate', 'meetingType', 'attendees', 'agendaItems'],
    optionalVariables: ['decisions', 'nextActions', 'attachments'],
    category: 'Assembleia'
  },
  assembly_notice: {
    name: 'Convocatória',
    description: 'Aviso de convocação para assembleia geral',
    requiredVariables: ['meetingDate', 'meetingTime', 'location', 'agenda'],
    optionalVariables: ['meetingType', 'quorumInfo', 'legalNotes'],
    category: 'Assembleia'
  },
  financial_report: {
    name: 'Relatório Financeiro',
    description: 'Relatório periódico da situação financeira',
    requiredVariables: ['period', 'totalIncome', 'totalExpenses', 'balance'],
    optionalVariables: ['categoryBreakdown', 'trends', 'recommendations'],
    category: 'Financeiro'
  }
};

// Common variables available across all templates
export const COMMON_VARIABLES: TemplateVariable[] = [
  {
    name: 'buildingName',
    label: 'Nome do Edifício',
    type: 'text',
    required: false,
    description: 'Nome completo do condomínio'
  },
  {
    name: 'buildingAddress',
    label: 'Morada do Edifício',
    type: 'text',
    required: false,
    description: 'Morada completa do edifício'
  },
  {
    name: 'currentDate',
    label: 'Data Atual',
    type: 'date',
    required: false,
    description: 'Data de geração do documento'
  },
  {
    name: 'administratorName',
    label: 'Nome do Administrador',
    type: 'text',
    required: false,
    description: 'Nome do administrador do condomínio'
  },
  {
    name: 'administratorContact',
    label: 'Contacto do Administrador',
    type: 'text',
    required: false,
    description: 'Email ou telefone do administrador'
  }
];

export interface DocumentStats {
  totalGenerated: number;
  byType: Record<DocumentType, number>;
  thisMonth: number;
  thisYear: number;
  avgGenerationTime: number;
}

// ===== NUEVOS TIPOS PARA GESTIÓN DE DOCUMENTOS DIGITALES =====

export interface StoredDocument {
  id: number;
  building_id: number;
  member_id?: number;
  
  // Información del archivo
  name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  
  // Metadatos
  category: StoredDocumentCategory;
  subcategory?: string;
  tags: string[];
  description?: string;
  
  // Control de versiones
  version: number;
  parent_document_id?: number;
  is_current_version: boolean;
  
  // Permisos y acceso
  visibility: DocumentVisibility;
  is_confidential: boolean;
  access_level: DocumentAccessLevel;
  
  // Auditoría
  uploaded_by?: string;
  uploaded_at: string;
  last_accessed_at?: string;
  download_count: number;
  
  created_at: string;
  updated_at: string;
  
  // Campos calculados
  file_size_formatted?: string;
  building_name?: string;
  member_name?: string;
  category_info?: DocumentCategoryInfo;
}

export type StoredDocumentCategory = 
  | 'financial'
  | 'legal' 
  | 'maintenance'
  | 'meeting'
  | 'insurance'
  | 'correspondence'
  | 'blueprints'
  | 'general';

export type DocumentVisibility = 
  | 'public'
  | 'building'
  | 'members_only'
  | 'admin_only';

export type DocumentAccessLevel = 
  | 'read'
  | 'edit'
  | 'admin';

export interface DocumentCategoryInfo {
  id: number;
  building_id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parent_category_id?: number;
  sort_order: number;
  created_at: string;
}

export interface DocumentShare {
  id: number;
  document_id: number;
  member_id: number;
  permission: 'read' | 'edit';
  shared_by?: string;
  shared_at: string;
  expires_at?: string;
  
  // Campos relacionados
  document?: StoredDocument;
  member_name?: string;
}

export interface DocumentUploadData {
  building_id: number;
  member_id?: number;
  name: string;
  category: StoredDocumentCategory;
  subcategory?: string;
  tags: string[];
  description?: string;
  visibility: DocumentVisibility;
  is_confidential: boolean;
  access_level: DocumentAccessLevel;
  uploaded_by?: string;
}

export interface DocumentSearchFilters {
  building_id?: number;
  category?: StoredDocumentCategory;
  tags?: string[];
  search_query?: string;
  visibility?: DocumentVisibility;
  date_from?: string;
  date_to?: string;
  file_type?: string;
  member_id?: number;
  is_current_version?: boolean;
}

export interface StoredDocumentStats {
  total_documents: number;
  total_size: number;
  by_category: Array<{
    category: StoredDocumentCategory;
    count: number;
    size: number;
  }>;
  recent_uploads: number;
  popular_documents: Array<{
    document: StoredDocument;
    download_count: number;
  }>;
}

export interface DocumentVersion {
  id: number;
  version: number;
  file_path: string;
  file_size: number;
  uploaded_by?: string;
  uploaded_at: string;
  changes_summary?: string;
}

// Tipos para el componente de upload
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  document_id?: number;
}

export interface DocumentPreviewResponse {
  document: StoredDocument;
  preview_url?: string;
  thumbnail_url?: string;
  can_preview: boolean;
  preview_type: 'pdf' | 'image' | 'text' | 'office' | 'none';
}

// Configuración de tipos de archivo soportados
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { extension: 'pdf', category: 'document', max_size: 50 * 1024 * 1024 }, // 50MB
  'image/jpeg': { extension: 'jpg', category: 'image', max_size: 10 * 1024 * 1024 }, // 10MB
  'image/png': { extension: 'png', category: 'image', max_size: 10 * 1024 * 1024 },
  'image/gif': { extension: 'gif', category: 'image', max_size: 5 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', category: 'office', max_size: 25 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', category: 'office', max_size: 25 * 1024 * 1024 },
  'text/plain': { extension: 'txt', category: 'text', max_size: 1 * 1024 * 1024 },
  'text/csv': { extension: 'csv', category: 'data', max_size: 5 * 1024 * 1024 }
} as const;

export const STORED_DOCUMENT_CATEGORY_CONFIG = {
  financial: { 
    label: 'Financeiro', 
    icon: 'calculator', 
    color: '#10b981',
    description: 'Documentos financeiros e contábeis'
  },
  legal: { 
    label: 'Legal', 
    icon: 'scale', 
    color: '#f59e0b',
    description: 'Contratos, normativas e documentos legais'
  },
  maintenance: { 
    label: 'Manutenção', 
    icon: 'wrench', 
    color: '#8b5cf6',
    description: 'Relatórios e documentos de manutenção'
  },
  meeting: { 
    label: 'Assembleias', 
    icon: 'users', 
    color: '#3b82f6',
    description: 'Actas, convocatórias e documentos de assembleias'
  },
  insurance: { 
    label: 'Seguros', 
    icon: 'shield', 
    color: '#ef4444',
    description: 'Apólices e documentos de seguros'
  },
  correspondence: { 
    label: 'Correspondência', 
    icon: 'mail', 
    color: '#06b6d4',
    description: 'Cartas e comunicações oficiais'
  },
  blueprints: { 
    label: 'Plantas', 
    icon: 'blueprint', 
    color: '#84cc16',
    description: 'Plantas técnicas e arquitectónicas'
  },
  general: { 
    label: 'Geral', 
    icon: 'folder', 
    color: '#6b7280',
    description: 'Documentos gerais do condomínio'
  }
} as const;