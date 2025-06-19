export type MaintenanceType = 
  | 'preventive'        // Manutenção preventiva
  | 'corrective'        // Manutenção corretiva
  | 'emergency'         // Emergência
  | 'inspection'        // Inspeção
  | 'cleaning'          // Limpeza
  | 'security';         // Segurança

export type MaintenanceStatus = 
  | 'scheduled'         // Agendada
  | 'in_progress'       // Em andamento
  | 'completed'         // Concluída
  | 'cancelled'         // Cancelada
  | 'overdue'           // Atrasada
  | 'pending_approval'; // Pendente aprovação

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export type MaintenanceArea = 
  | 'common_areas'      // Áreas comuns
  | 'elevators'         // Elevadores
  | 'electrical'        // Elétrico
  | 'plumbing'          // Canalização
  | 'hvac'             // AVAC
  | 'security'          // Segurança
  | 'landscaping'       // Jardinagem
  | 'parking'           // Estacionamento
  | 'roof'             // Telhado
  | 'facade'           // Fachada
  | 'other';           // Outros

export interface MaintenanceItem {
  id: string;
  buildingId: string;
  title: string;
  description: string;
  type: MaintenanceType;
  area: MaintenanceArea;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  
  // Scheduling
  scheduledDate: string;
  startDate?: string;
  completedDate?: string;
  estimatedDuration: number; // em horas
  actualDuration?: number;
  
  // Assignment
  assignedTo?: string;
  providerId?: string;
  
  // Cost
  estimatedCost?: number;
  actualCost?: number;
  budgetApproved?: boolean;
  
  // Details
  location: string;
  equipment?: string[];
  materials?: string[];
  instructions?: string;
  
  // Results
  workPerformed?: string;
  nextMaintenanceDate?: string;
  warrantyExpiry?: string;
  
  // Files
  attachments?: MaintenanceAttachment[];
  photos?: MaintenancePhoto[];
  
  // Relationships
  parentId?: string; // Para sub-tarefas
  relatedItems?: string[];
  
  // Metadata
  createdBy: string;
  updatedBy?: string;
  approvedBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MaintenancePhoto {
  id: string;
  url: string;
  caption?: string;
  isBefore: boolean;
  isAfter: boolean;
  takenAt: string;
  takenBy: string;
}

export interface MaintenanceProvider {
  id: string;
  buildingId: string;
  name: string;
  category: MaintenanceArea[];
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  
  // Qualifications
  license?: string;
  insurance?: string;
  certifications?: string[];
  
  // Performance
  rating: number;
  completedJobs: number;
  averageResponseTime: number; // em horas
  onTimeCompletion: number; // percentagem
  
  // Financial
  averageCost: number;
  paymentTerms?: string;
  
  // Availability
  isActive: boolean;
  workingHours?: {
    monday: { start: string; end: string };
    tuesday: { start: string; end: string };
    wednesday: { start: string; end: string };
    thursday: { start: string; end: string };
    friday: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  emergencyAvailable: boolean;
  
  // Contract
  contractStart?: string;
  contractEnd?: string;
  
  metadata: {
    notes?: string;
    tags?: string[];
    preferredProvider?: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceBudget {
  id: string;
  buildingId: string;
  year: number;
  category: MaintenanceArea;
  
  // Budget amounts
  budgeted: number;
  spent: number;
  committed: number; // aprovado mas não gasto
  available: number;
  
  // Breakdown
  preventive: number;
  corrective: number;
  emergency: number;
  
  // Tracking
  lastUpdated: string;
  approvedBy?: string;
  
  // Projections
  projectedSpend: number;
  projectedOverrun: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceContract {
  id: string;
  buildingId: string;
  providerId: string;
  title: string;
  description?: string;
  
  // Contract details
  contractNumber?: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  renewalPeriod?: number; // meses
  
  // Scope
  services: MaintenanceArea[];
  inclusions: string[];
  exclusions: string[];
  
  // Financial
  contractValue: number;
  paymentSchedule: 'monthly' | 'quarterly' | 'annually' | 'per_service';
  paymentTerms: string;
  
  // SLA
  responseTime: number; // horas
  resolutionTime: number; // horas
  availabilityRequirement: number; // percentagem
  
  // Performance
  penaltyClause?: string;
  bonusClause?: string;
  
  // Status
  isActive: boolean;
  
  // Documents
  contractDocument?: string;
  attachments?: MaintenanceAttachment[];
  
  metadata: {
    notes?: string;
    renewalNotice?: number; // dias antes do vencimento
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceScheduleRule {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  isActive: boolean;
  
  // Trigger conditions
  trigger: {
    type: 'time_based' | 'usage_based' | 'condition_based';
    interval?: number; // dias/meses
    intervalType?: 'days' | 'weeks' | 'months' | 'years';
    condition?: string;
  };
  
  // What to create
  template: {
    title: string;
    description: string;
    type: MaintenanceType;
    area: MaintenanceArea;
    priority: MaintenancePriority;
    estimatedDuration: number;
    estimatedCost?: number;
    location: string;
    instructions?: string;
    preferredProviderId?: string;
  };
  
  // Scheduling
  advanceNotice: number; // dias
  allowWeekends: boolean;
  preferredTimeSlot?: {
    start: string;
    end: string;
  };
  
  // Execution
  lastExecuted?: string;
  nextExecution?: string;
  executionCount: number;
  
  metadata: {
    createdBy: string;
    category?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceInspection {
  id: string;
  buildingId: string;
  maintenanceItemId?: string;
  title: string;
  area: MaintenanceArea;
  
  // Inspection details
  inspectionDate: string;
  inspectorName: string;
  inspectorCredentials?: string;
  
  // Checklist
  checklist: {
    id: string;
    item: string;
    status: 'pass' | 'fail' | 'warning' | 'n/a';
    notes?: string;
    photo?: string;
  }[];
  
  // Results
  overallStatus: 'pass' | 'fail' | 'conditional';
  findings: string[];
  recommendations: string[];
  
  // Follow-up
  nextInspectionDate?: string;
  urgentActions?: {
    description: string;
    deadline: string;
    priority: MaintenancePriority;
  }[];
  
  // Compliance
  regulation?: string;
  certificate?: string;
  validUntil?: string;
  
  // Documents
  report?: string;
  photos?: MaintenancePhoto[];
  
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceAlert {
  id: string;
  buildingId: string;
  type: 'overdue' | 'upcoming' | 'budget_exceeded' | 'equipment_failure' | 'inspection_due';
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  title: string;
  message: string;
  
  // Related entities
  maintenanceItemId?: string;
  providerId?: string;
  contractId?: string;
  
  // Actions
  actionRequired: boolean;
  suggestedAction?: string;
  
  // Status
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  
  // Scheduling
  triggeredAt: string;
  expiresAt?: string;
  
  // Notifications
  notificationsSent: {
    channel: 'email' | 'sms' | 'push';
    recipients: string[];
    sentAt: string;
  }[];
  
  metadata: {
    source: 'system' | 'manual' | 'integration';
    category?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Analytics and reporting
export interface MaintenanceAnalytics {
  period: {
    start: string;
    end: string;
  };
  
  overview: {
    totalItems: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    averageResponseTime: number;
    onTimeCompletion: number;
  };
  
  costs: {
    total: number;
    budgeted: number;
    variance: number;
    byCategory: Record<MaintenanceArea, number>;
    byType: Record<MaintenanceType, number>;
    averageCostPerItem: number;
  };
  
  performance: {
    providerRatings: {
      providerId: string;
      name: string;
      rating: number;
      completedJobs: number;
      averageCost: number;
      onTimeRate: number;
    }[];
    
    areaPerformance: {
      area: MaintenanceArea;
      items: number;
      avgCost: number;
      avgDuration: number;
      issues: number;
    }[];
  };
  
  trends: {
    monthlySpend: { month: string; amount: number }[];
    itemsByType: { type: MaintenanceType; count: number }[];
    responseTimesByPriority: { priority: MaintenancePriority; avgHours: number }[];
  };
  
  predictions: {
    upcomingMaintenance: {
      nextMonth: number;
      nextQuarter: number;
      estimatedCost: number;
    };
    
    budgetForecast: {
      projectedSpend: number;
      projectedOverrun: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    
    equipmentLifecycle: {
      equipment: string;
      currentAge: number;
      estimatedRemainingLife: number;
      replacementCost: number;
    }[];
  };
}

export interface MaintenanceSettings {
  buildingId: string;
  
  // Default values
  defaultPriority: MaintenancePriority;
  defaultResponseTime: number; // horas
  defaultNotificationAdvance: number; // dias
  
  // Approval workflows
  requireApprovalOver: number; // valor em euros
  approvers: string[];
  
  // Notifications
  notificationChannels: ('email' | 'sms' | 'push')[];
  notificationRecipients: string[];
  
  // Integration settings
  calendarIntegration: boolean;
  emailIntegration: boolean;
  
  // Business rules
  allowWeekendWork: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  
  // Emergency contacts
  emergencyContacts: {
    name: string;
    phone: string;
    email?: string;
    role: string;
  }[];
  
  updatedAt: string;
}