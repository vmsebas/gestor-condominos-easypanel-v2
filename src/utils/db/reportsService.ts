import { 
  ReportConfig, 
  GeneratedReport, 
  ReportType, 
  ReportFilter, 
  ReportData,
  FinancialAnalytics,
  MemberAnalytics,
  CommunicationAnalytics,
  DashboardLayout,
  AlertRule,
  ExportOptions,
  ExportResult,
  KPIData,
  ChartData,
  TableData
} from '@/types/reportTypes';

// Mock service - Replace with actual API calls
class ReportsService {
  private configs: ReportConfig[] = [];
  private reports: GeneratedReport[] = [];
  private dashboards: DashboardLayout[] = [];
  private alerts: AlertRule[] = [];

  // Report Configurations
  async getReportConfigs(buildingId: string): Promise<ReportConfig[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.configs.filter(c => c.filters.buildingId === buildingId);
  }

  async createReportConfig(config: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportConfig> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newConfig: ReportConfig = {
      ...config,
      id: `config-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.configs.push(newConfig);
    return newConfig;
  }

  async updateReportConfig(configId: string, updates: Partial<ReportConfig>): Promise<ReportConfig> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = this.configs.findIndex(c => c.id === configId);
    if (index === -1) {
      throw new Error('Configuração não encontrada');
    }
    
    this.configs[index] = {
      ...this.configs[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.configs[index];
  }

  async deleteReportConfig(configId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.configs.findIndex(c => c.id === configId);
    if (index === -1) {
      throw new Error('Configuração não encontrada');
    }
    
    this.configs.splice(index, 1);
  }

  // Report Generation
  async generateReport(type: ReportType, filters: ReportFilter): Promise<GeneratedReport> {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate generation time
    
    const reportData = await this.generateReportData(type, filters);
    
    const newReport: GeneratedReport = {
      id: `report-${Date.now()}`,
      buildingId: filters.buildingId || '',
      type,
      name: this.getReportName(type),
      period: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        label: this.formatPeriodLabel(filters.startDate, filters.endDate)
      },
      status: 'ready',
      format: 'json',
      data: reportData,
      metadata: {
        generatedBy: 'Sistema',
        generatedAt: new Date().toISOString(),
        parameters: filters,
        executionTime: 2.5,
        recordCount: this.getEstimatedRecordCount(type)
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    
    this.reports.push(newReport);
    return newReport;
  }

  async getReports(buildingId: string): Promise<GeneratedReport[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return this.reports
      .filter(r => r.buildingId === buildingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReport(reportId: string): Promise<GeneratedReport | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.reports.find(r => r.id === reportId) || null;
  }

  async deleteReport(reportId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.reports.findIndex(r => r.id === reportId);
    if (index === -1) {
      throw new Error('Relatório não encontrado');
    }
    
    this.reports.splice(index, 1);
  }

  // Analytics
  async getFinancialAnalytics(buildingId: string, startDate: string, endDate: string): Promise<FinancialAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock financial analytics data
    return {
      revenue: {
        total: 125000,
        byCategory: {
          'Quotas': 100000,
          'Multas': 15000,
          'Juros': 8000,
          'Outros': 2000
        },
        monthlyTrend: [
          { month: 'Jan', amount: 10000 },
          { month: 'Fev', amount: 10500 },
          { month: 'Mar', amount: 11000 },
          { month: 'Abr', amount: 10800 },
          { month: 'Mai', amount: 11200 },
          { month: 'Jun', amount: 10900 }
        ],
        growth: 8.5
      },
      expenses: {
        total: 85000,
        byCategory: {
          'Manutenção': 35000,
          'Limpeza': 20000,
          'Segurança': 15000,
          'Utilities': 10000,
          'Outros': 5000
        },
        monthlyTrend: [
          { month: 'Jan', amount: 14000 },
          { month: 'Fev', amount: 13500 },
          { month: 'Mar', amount: 15000 },
          { month: 'Abr', amount: 14200 },
          { month: 'Mai', amount: 14800 },
          { month: 'Jun', amount: 13500 }
        ],
        variance: -5.2
      },
      cashFlow: {
        opening: 45000,
        closing: 85000,
        netFlow: 40000,
        projectedFlow: [
          { month: 'Jul', amount: 88000 },
          { month: 'Ago', amount: 91000 },
          { month: 'Set', amount: 89000 },
          { month: 'Out', amount: 93000 }
        ]
      },
      arrears: {
        total: 25000,
        count: 8,
        aging: {
          '0-30 dias': 8000,
          '31-60 dias': 7000,
          '61-90 dias': 5000,
          '90+ dias': 5000
        },
        trend: [
          { month: 'Jan', amount: 30000 },
          { month: 'Fev', amount: 28000 },
          { month: 'Mar', amount: 26000 },
          { month: 'Abr', amount: 27000 },
          { month: 'Mai', amount: 25000 },
          { month: 'Jun', amount: 25000 }
        ]
      },
      efficiency: {
        collectionRate: 92.5,
        paymentCycle: 15.2,
        operationalCosts: 68.0
      }
    };
  }

  async getMemberAnalytics(buildingId: string): Promise<MemberAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      demographics: {
        total: 120,
        byType: {
          'Proprietários': 85,
          'Inquilinos': 35
        },
        byApartmentSize: {
          'T1': 25,
          'T2': 45,
          'T3': 35,
          'T4+': 15
        },
        averageOccupancy: 88.5
      },
      financial: {
        averageQuota: 125.50,
        paymentBehavior: {
          onTime: 85,
          late: 25,
          defaulted: 10
        },
        arrearsDistribution: {
          '0€': 95,
          '1-500€': 15,
          '501-1000€': 8,
          '1000€+': 2
        }
      },
      engagement: {
        meetingAttendance: 65.2,
        communicationResponse: 78.5,
        complaintFrequency: 12.3
      },
      satisfaction: {
        overall: 7.8,
        byCategory: {
          'Manutenção': 7.5,
          'Limpeza': 8.2,
          'Segurança': 7.9,
          'Comunicação': 8.0,
          'Administração': 7.6
        },
        trends: [
          { period: 'Q1', score: 7.2 },
          { period: 'Q2', score: 7.8 },
          { period: 'Q3', score: 8.1 },
          { period: 'Q4', score: 7.8 }
        ]
      }
    };
  }

  async getCommunicationAnalytics(buildingId: string): Promise<CommunicationAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      volume: {
        total: 450,
        byType: {
          'Email': 280,
          'SMS': 120,
          'WhatsApp': 50
        },
        byCategory: {
          'Lembretes': 180,
          'Avisos': 120,
          'Emergências': 15,
          'Manutenção': 85,
          'Outros': 50
        },
        monthlyTrend: [
          { month: 'Jan', count: 65 },
          { month: 'Fev', count: 72 },
          { month: 'Mar', count: 68 },
          { month: 'Abr', count: 75 },
          { month: 'Mai', count: 82 },
          { month: 'Jun', count: 88 }
        ]
      },
      performance: {
        deliveryRate: 96.8,
        openRate: 78.5,
        responseRate: 45.2,
        byChannel: {
          'email': { sent: 280, delivered: 275, opened: 220, responded: 125 },
          'sms': { sent: 120, delivered: 118, opened: 115, responded: 60 },
          'whatsapp': { sent: 50, delivered: 49, opened: 47, responded: 25 }
        }
      },
      engagement: {
        averageResponseTime: 4.5,
        preferredChannels: {
          'Email': 65,
          'SMS': 25,
          'WhatsApp': 10
        },
        topTemplates: [
          { name: 'Lembrete de Quota', usage: 85 },
          { name: 'Aviso de Reunião', usage: 45 },
          { name: 'Alerta de Manutenção', usage: 32 }
        ]
      },
      costs: {
        total: 285.50,
        byChannel: {
          'Email': 45.00,
          'SMS': 180.00,
          'WhatsApp': 60.50
        },
        costPerMessage: 0.63,
        efficiency: 92.3
      }
    };
  }

  // Dashboard Management
  async getDashboards(buildingId: string, userId?: string): Promise<DashboardLayout[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.dashboards.filter(d => 
      d.buildingId === buildingId && (d.isPublic || d.userId === userId)
    );
  }

  async createDashboard(dashboard: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardLayout> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newDashboard: DashboardLayout = {
      ...dashboard,
      id: `dashboard-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.dashboards.push(newDashboard);
    return newDashboard;
  }

  async updateDashboard(dashboardId: string, updates: Partial<DashboardLayout>): Promise<DashboardLayout> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.dashboards.findIndex(d => d.id === dashboardId);
    if (index === -1) {
      throw new Error('Dashboard não encontrado');
    }
    
    this.dashboards[index] = {
      ...this.dashboards[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.dashboards[index];
  }

  // Export Functions
  async exportReport(reportId: string, options: ExportOptions): Promise<ExportResult> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export time
    
    const report = this.reports.find(r => r.id === reportId);
    if (!report) {
      return {
        success: false,
        error: 'Relatório não encontrado'
      };
    }

    // Mock export result
    const fileName = `${report.name}_${report.period.label}.${options.format}`;
    const fileSize = Math.floor(Math.random() * 1000000) + 50000; // 50KB - 1MB
    
    return {
      success: true,
      fileUrl: `/api/reports/download/${reportId}?format=${options.format}`,
      fileName,
      fileSize,
      metadata: {
        generatedAt: new Date().toISOString(),
        format: options.format,
        recordCount: report.metadata.recordCount
      }
    };
  }

  // Alert Management
  async getAlerts(buildingId: string): Promise<AlertRule[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.alerts.filter(a => a.buildingId === buildingId);
  }

  async createAlert(alert: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAlert: AlertRule = {
      ...alert,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.alerts.push(newAlert);
    return newAlert;
  }

  // Private helper methods
  private async generateReportData(type: ReportType, filters: ReportFilter): Promise<ReportData> {
    // Mock report data generation based on type
    switch (type) {
      case 'financial_summary':
        return this.generateFinancialSummaryData(filters);
      case 'payment_analysis':
        return this.generatePaymentAnalysisData(filters);
      case 'arrears_report':
        return this.generateArrearsReportData(filters);
      default:
        return this.generateGenericReportData(type, filters);
    }
  }

  private generateFinancialSummaryData(filters: ReportFilter): ReportData {
    const kpis: KPIData[] = [
      {
        id: 'total_revenue',
        label: 'Receitas Totais',
        value: 125000,
        format: 'currency',
        previous: 115000,
        change: 8.7,
        changeLabel: '+8.7% vs período anterior',
        trend: 'up',
        color: 'green',
        description: 'Soma de todas as receitas do período'
      },
      {
        id: 'total_expenses',
        label: 'Despesas Totais',
        value: 85000,
        format: 'currency',
        previous: 88000,
        change: -3.4,
        changeLabel: '-3.4% vs período anterior',
        trend: 'down',
        color: 'green',
        description: 'Soma de todas as despesas do período'
      },
      {
        id: 'net_result',
        label: 'Resultado Líquido',
        value: 40000,
        format: 'currency',
        previous: 27000,
        change: 48.1,
        changeLabel: '+48.1% vs período anterior',
        trend: 'up',
        color: 'blue',
        description: 'Receitas menos despesas'
      },
      {
        id: 'collection_rate',
        label: 'Taxa de Cobrança',
        value: 92.5,
        format: 'percentage',
        target: 95,
        previous: 89.2,
        change: 3.3,
        changeLabel: '+3.3 pontos percentuais',
        trend: 'up',
        color: 'orange',
        description: 'Percentual de quotas cobradas'
      }
    ];

    const charts: ChartData[] = [
      {
        id: 'revenue_trend',
        title: 'Evolução das Receitas',
        type: 'line',
        data: {
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
          datasets: [{
            label: 'Receitas',
            data: [20000, 21000, 22500, 20800, 21200, 20900],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true
          }]
        }
      },
      {
        id: 'expense_breakdown',
        title: 'Breakdown de Despesas',
        type: 'doughnut',
        data: {
          labels: ['Manutenção', 'Limpeza', 'Segurança', 'Utilities', 'Outros'],
          datasets: [{
            label: 'Despesas',
            data: [35000, 20000, 15000, 10000, 5000],
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
          }]
        }
      }
    ];

    const tables: TableData[] = [
      {
        id: 'monthly_summary',
        title: 'Resumo Mensal',
        columns: [
          { key: 'month', label: 'Mês', type: 'text' },
          { key: 'revenue', label: 'Receitas', type: 'currency', align: 'right' },
          { key: 'expenses', label: 'Despesas', type: 'currency', align: 'right' },
          { key: 'result', label: 'Resultado', type: 'currency', align: 'right' }
        ],
        rows: [
          { month: 'Janeiro', revenue: 20000, expenses: 14000, result: 6000 },
          { month: 'Fevereiro', revenue: 21000, expenses: 13500, result: 7500 },
          { month: 'Março', revenue: 22500, expenses: 15000, result: 7500 },
          { month: 'Abril', revenue: 20800, expenses: 14200, result: 6600 },
          { month: 'Maio', revenue: 21200, expenses: 14800, result: 6400 },
          { month: 'Junho', revenue: 20900, expenses: 13500, result: 7400 }
        ],
        footer: {
          totals: { revenue: 126400, expenses: 85000, result: 41400 }
        }
      }
    ];

    return {
      summary: {
        title: 'Resumo Financeiro',
        subtitle: 'Análise detalhada da performance financiera',
        period: this.formatPeriodLabel(filters.startDate, filters.endDate),
        keyMetrics: kpis.map(kpi => ({
          label: kpi.label,
          value: kpi.format === 'currency' ? `€${kpi.value.toLocaleString()}` : 
                 kpi.format === 'percentage' ? `${kpi.value}%` : kpi.value.toString(),
          change: kpi.change,
          changeLabel: kpi.changeLabel,
          trend: kpi.trend
        })),
        highlights: [
          'Crescimento de 8.7% nas receitas em relação ao período anterior',
          'Redução de 3.4% nas despesas operacionais',
          'Taxa de cobrança melhorou para 92.5%',
          'Resultado líquido positivo de €40.000'
        ]
      },
      charts,
      tables,
      kpis
    };
  }

  private generatePaymentAnalysisData(filters: ReportFilter): ReportData {
    // Similar structure for payment analysis
    return {
      summary: {
        title: 'Análise de Pagamentos',
        period: this.formatPeriodLabel(filters.startDate, filters.endDate),
        keyMetrics: [],
        highlights: []
      },
      charts: [],
      tables: [],
      kpis: []
    };
  }

  private generateArrearsReportData(filters: ReportFilter): ReportData {
    // Similar structure for arrears report
    return {
      summary: {
        title: 'Relatório de Morosidade',
        period: this.formatPeriodLabel(filters.startDate, filters.endDate),
        keyMetrics: [],
        highlights: []
      },
      charts: [],
      tables: [],
      kpis: []
    };
  }

  private generateGenericReportData(type: ReportType, filters: ReportFilter): ReportData {
    return {
      summary: {
        title: this.getReportName(type),
        period: this.formatPeriodLabel(filters.startDate, filters.endDate),
        keyMetrics: [],
        highlights: []
      },
      charts: [],
      tables: [],
      kpis: []
    };
  }

  private getReportName(type: ReportType): string {
    const names = {
      financial_summary: 'Resumo Financeiro',
      payment_analysis: 'Análise de Pagamentos',
      arrears_report: 'Relatório de Morosidade',
      expense_breakdown: 'Breakdown de Despesas',
      cash_flow: 'Fluxo de Caixa',
      member_analysis: 'Análise de Membros',
      communication_stats: 'Estatísticas de Comunicação',
      maintenance_report: 'Relatório de Manutenção',
      occupancy_analysis: 'Análise de Ocupação',
      budget_variance: 'Variação Orçamental'
    };
    return names[type] || type;
  }

  private formatPeriodLabel(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.getFullYear()} - ${end.getFullYear()}`;
    } else if (start.getMonth() !== end.getMonth()) {
      return `${start.toLocaleDateString('pt-PT', { month: 'short' })} - ${end.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}`;
    } else {
      return start.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    }
  }

  private getEstimatedRecordCount(type: ReportType): number {
    const counts = {
      financial_summary: 120,
      payment_analysis: 450,
      arrears_report: 25,
      expense_breakdown: 85,
      cash_flow: 12,
      member_analysis: 120,
      communication_stats: 300,
      maintenance_report: 65,
      occupancy_analysis: 120,
      budget_variance: 24
    };
    return counts[type] || 100;
  }

  // Initialize sample data
  async initializeSampleData(buildingId: string): Promise<void> {
    const hasData = this.dashboards.some(d => d.buildingId === buildingId);
    if (hasData) return;

    // Create sample dashboard
    const sampleDashboard: DashboardLayout = {
      id: `dashboard-executive-${buildingId}`,
      name: 'Dashboard Executivo',
      description: 'Visão geral das métricas principais do condomínio',
      buildingId,
      isDefault: true,
      isPublic: true,
      widgets: [],
      filters: {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          preset: 'month'
        }
      },
      metadata: {
        createdBy: 'Sistema',
        category: 'executive'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.dashboards.push(sampleDashboard);
  }
}

export default new ReportsService();