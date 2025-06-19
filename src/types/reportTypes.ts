export type ReportType = 
  | 'financial_summary'     // Resumo financeiro
  | 'payment_analysis'      // Análise de pagamentos
  | 'arrears_report'        // Relatório de morosidade
  | 'expense_breakdown'     // Breakdown de despesas
  | 'cash_flow'            // Fluxo de caixa
  | 'member_analysis'       // Análise de membros
  | 'communication_stats'   // Estatísticas de comunicação
  | 'maintenance_report'    // Relatório de manutenção
  | 'occupancy_analysis'    // Análise de ocupação
  | 'budget_variance';      // Variação orçamental

export type ReportPeriod = 'month' | 'quarter' | 'year' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportStatus = 'generating' | 'ready' | 'failed' | 'expired';

export interface ReportFilter {
  buildingId?: string;
  startDate: string;
  endDate: string;
  memberType?: 'owner' | 'resident' | 'all';
  includeInactive?: boolean;
  categories?: string[];
  customFilters?: Record<string, any>;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  isScheduled: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
  };
  filters: ReportFilter;
  format: ReportFormat[];
  recipients: string[];
  isActive: boolean;
  metadata: {
    createdBy: string;
    department?: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedReport {
  id: string;
  configId?: string;
  buildingId: string;
  type: ReportType;
  name: string;
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  status: ReportStatus;
  format: ReportFormat;
  fileSize?: number;
  downloadUrl?: string;
  data: ReportData;
  metadata: {
    generatedBy: string;
    generatedAt: string;
    parameters: ReportFilter;
    executionTime: number;
    recordCount: number;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface ReportData {
  summary: ReportSummary;
  charts: ChartData[];
  tables: TableData[];
  kpis: KPIData[];
  insights?: InsightData[];
}

export interface ReportSummary {
  title: string;
  subtitle?: string;
  period: string;
  keyMetrics: {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
  highlights: string[];
  alerts?: {
    type: 'warning' | 'error' | 'info';
    message: string;
  }[];
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      borderWidth?: number;
      fill?: boolean;
    }[];
  };
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        display?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
      };
      tooltip?: {
        enabled?: boolean;
        callbacks?: any;
      };
    };
    scales?: any;
  };
}

export interface TableData {
  id: string;
  title: string;
  columns: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'date' | 'percentage';
    align?: 'left' | 'center' | 'right';
    width?: string;
  }[];
  rows: Record<string, any>[];
  footer?: {
    totals?: Record<string, number>;
    summary?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface KPIData {
  id: string;
  label: string;
  value: number;
  format: 'currency' | 'percentage' | 'number' | 'decimal';
  target?: number;
  previous?: number;
  change?: number;
  changeLabel?: string;
  trend: 'up' | 'down' | 'stable';
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple';
  icon?: string;
  description?: string;
}

export interface InsightData {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  data?: any;
  actionable?: boolean;
  suggestedActions?: string[];
}

// Analytics específicos
export interface FinancialAnalytics {
  revenue: {
    total: number;
    byCategory: Record<string, number>;
    monthlyTrend: { month: string; amount: number }[];
    growth: number;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    monthlyTrend: { month: string; amount: number }[];
    variance: number;
  };
  cashFlow: {
    opening: number;
    closing: number;
    netFlow: number;
    projectedFlow: { month: string; amount: number }[];
  };
  arrears: {
    total: number;
    count: number;
    aging: Record<string, number>;
    trend: { month: string; amount: number }[];
  };
  efficiency: {
    collectionRate: number;
    paymentCycle: number;
    operationalCosts: number;
  };
}

export interface MemberAnalytics {
  demographics: {
    total: number;
    byType: Record<string, number>;
    byApartmentSize: Record<string, number>;
    averageOccupancy: number;
  };
  financial: {
    averageQuota: number;
    paymentBehavior: {
      onTime: number;
      late: number;
      defaulted: number;
    };
    arrearsDistribution: Record<string, number>;
  };
  engagement: {
    meetingAttendance: number;
    communicationResponse: number;
    complaintFrequency: number;
  };
  satisfaction: {
    overall: number;
    byCategory: Record<string, number>;
    trends: { period: string; score: number }[];
  };
}

export interface CommunicationAnalytics {
  volume: {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    monthlyTrend: { month: string; count: number }[];
  };
  performance: {
    deliveryRate: number;
    openRate: number;
    responseRate: number;
    byChannel: Record<string, {
      sent: number;
      delivered: number;
      opened: number;
      responded: number;
    }>;
  };
  engagement: {
    averageResponseTime: number;
    preferredChannels: Record<string, number>;
    topTemplates: { name: string; usage: number }[];
  };
  costs: {
    total: number;
    byChannel: Record<string, number>;
    costPerMessage: number;
    efficiency: number;
  };
}

// Dashboard types
export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'alert';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number; w: number; h: number };
  data: any;
  refreshInterval?: number;
  isVisible: boolean;
  permissions?: string[];
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  buildingId: string;
  userId?: string;
  isDefault: boolean;
  isPublic: boolean;
  widgets: DashboardWidget[];
  filters: {
    dateRange: {
      start: string;
      end: string;
      preset?: 'today' | 'week' | 'month' | 'quarter' | 'year';
    };
    buildingFilters?: Record<string, any>;
  };
  metadata: {
    createdBy: string;
    category: 'executive' | 'financial' | 'operational' | 'member';
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  id: string;
  buildingId: string;
  name: string;
  description?: string;
  type: 'threshold' | 'anomaly' | 'trend';
  metric: string;
  condition: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    value: number | number[];
    tolerance?: number;
  };
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  isActive: boolean;
  notifications: {
    channels: ('email' | 'sms' | 'push' | 'dashboard')[];
    recipients: string[];
    template?: string;
  };
  metadata: {
    lastTriggered?: string;
    triggerCount: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  createdAt: string;
  updatedAt: string;
}

// Export utilities
export interface ExportOptions {
  format: ReportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  template?: string;
  branding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
    companyName?: string;
  };
  compression?: boolean;
  password?: string;
}

export interface ExportResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  metadata?: {
    generatedAt: string;
    format: ReportFormat;
    recordCount: number;
  };
}