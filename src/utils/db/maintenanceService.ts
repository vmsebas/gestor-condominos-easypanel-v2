import { 
  MaintenanceItem, 
  MaintenanceProvider, 
  MaintenanceBudget,
  MaintenanceContract,
  MaintenanceScheduleRule,
  MaintenanceInspection,
  MaintenanceAlert,
  MaintenanceAnalytics,
  MaintenanceSettings,
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceArea
} from '@/types/maintenanceTypes';

// Mock service - Replace with actual API calls
class MaintenanceService {
  private items: MaintenanceItem[] = [];
  private providers: MaintenanceProvider[] = [];
  private budgets: MaintenanceBudget[] = [];
  private contracts: MaintenanceContract[] = [];
  private scheduleRules: MaintenanceScheduleRule[] = [];
  private inspections: MaintenanceInspection[] = [];
  private alerts: MaintenanceAlert[] = [];
  private settings: Record<string, MaintenanceSettings> = {};

  // Maintenance Items
  async getMaintenanceItems(buildingId: string, filters?: {
    status?: MaintenanceStatus;
    type?: MaintenanceType;
    priority?: MaintenancePriority;
    area?: MaintenanceArea;
    startDate?: string;
    endDate?: string;
  }): Promise<MaintenanceItem[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let filtered = this.items.filter(item => item.buildingId === buildingId);
    
    if (filters) {
      if (filters.status) filtered = filtered.filter(item => item.status === filters.status);
      if (filters.type) filtered = filtered.filter(item => item.type === filters.type);
      if (filters.priority) filtered = filtered.filter(item => item.priority === filters.priority);
      if (filters.area) filtered = filtered.filter(item => item.area === filters.area);
      if (filters.startDate) filtered = filtered.filter(item => item.scheduledDate >= filters.startDate!);
      if (filters.endDate) filtered = filtered.filter(item => item.scheduledDate <= filters.endDate!);
    }
    
    return filtered.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }

  async getMaintenanceItem(itemId: string): Promise<MaintenanceItem | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.items.find(item => item.id === itemId) || null;
  }

  async createMaintenanceItem(item: Omit<MaintenanceItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceItem> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newItem: MaintenanceItem = {
      ...item,
      id: `maintenance-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.items.push(newItem);
    return newItem;
  }

  async updateMaintenanceItem(itemId: string, updates: Partial<MaintenanceItem>): Promise<MaintenanceItem> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) {
      throw new Error('Item de manutenção não encontrado');
    }
    
    this.items[index] = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.items[index];
  }

  async deleteMaintenanceItem(itemId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) {
      throw new Error('Item de manutenção não encontrado');
    }
    
    this.items.splice(index, 1);
  }

  // Providers
  async getProviders(buildingId: string): Promise<MaintenanceProvider[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.providers.filter(provider => provider.buildingId === buildingId);
  }

  async createProvider(provider: Omit<MaintenanceProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceProvider> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const newProvider: MaintenanceProvider = {
      ...provider,
      id: `provider-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.providers.push(newProvider);
    return newProvider;
  }

  async updateProvider(providerId: string, updates: Partial<MaintenanceProvider>): Promise<MaintenanceProvider> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = this.providers.findIndex(provider => provider.id === providerId);
    if (index === -1) {
      throw new Error('Fornecedor não encontrado');
    }
    
    this.providers[index] = {
      ...this.providers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.providers[index];
  }

  async deleteProvider(providerId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.providers.findIndex(provider => provider.id === providerId);
    if (index === -1) {
      throw new Error('Fornecedor não encontrado');
    }
    
    this.providers.splice(index, 1);
  }

  // Budgets
  async getBudgets(buildingId: string, year?: number): Promise<MaintenanceBudget[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let filtered = this.budgets.filter(budget => budget.buildingId === buildingId);
    if (year) {
      filtered = filtered.filter(budget => budget.year === year);
    }
    
    return filtered;
  }

  async createBudget(budget: Omit<MaintenanceBudget, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceBudget> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newBudget: MaintenanceBudget = {
      ...budget,
      id: `budget-${Date.now()}`,
      available: budget.budgeted - budget.spent - budget.committed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.budgets.push(newBudget);
    return newBudget;
  }

  // Contracts
  async getContracts(buildingId: string): Promise<MaintenanceContract[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.contracts.filter(contract => contract.buildingId === buildingId);
  }

  async createContract(contract: Omit<MaintenanceContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceContract> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newContract: MaintenanceContract = {
      ...contract,
      id: `contract-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.contracts.push(newContract);
    return newContract;
  }

  // Schedule Rules
  async getScheduleRules(buildingId: string): Promise<MaintenanceScheduleRule[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.scheduleRules.filter(rule => rule.buildingId === buildingId);
  }

  async createScheduleRule(rule: Omit<MaintenanceScheduleRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceScheduleRule> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newRule: MaintenanceScheduleRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.scheduleRules.push(newRule);
    return newRule;
  }

  // Inspections
  async getInspections(buildingId: string): Promise<MaintenanceInspection[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.inspections.filter(inspection => inspection.buildingId === buildingId);
  }

  async createInspection(inspection: Omit<MaintenanceInspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaintenanceInspection> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const newInspection: MaintenanceInspection = {
      ...inspection,
      id: `inspection-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.inspections.push(newInspection);
    return newInspection;
  }

  // Alerts
  async getAlerts(buildingId: string, unreadOnly = false): Promise<MaintenanceAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = this.alerts.filter(alert => alert.buildingId === buildingId);
    if (unreadOnly) {
      filtered = filtered.filter(alert => !alert.isRead);
    }
    
    return filtered.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isResolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = resolvedBy;
    }
  }

  // Analytics
  async getAnalytics(buildingId: string, startDate: string, endDate: string): Promise<MaintenanceAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const buildingItems = this.items.filter(item => 
      item.buildingId === buildingId &&
      item.scheduledDate >= startDate &&
      item.scheduledDate <= endDate
    );

    const completed = buildingItems.filter(item => item.status === 'completed');
    const pending = buildingItems.filter(item => ['scheduled', 'in_progress'].includes(item.status));
    const overdue = buildingItems.filter(item => item.status === 'overdue');

    // Mock analytics data
    return {
      period: { start: startDate, end: endDate },
      
      overview: {
        totalItems: buildingItems.length,
        completed: completed.length,
        pending: pending.length,
        overdue: overdue.length,
        completionRate: buildingItems.length > 0 ? (completed.length / buildingItems.length) * 100 : 0,
        averageResponseTime: 24.5,
        onTimeCompletion: 85.3
      },
      
      costs: {
        total: buildingItems.reduce((sum, item) => sum + (item.actualCost || item.estimatedCost || 0), 0),
        budgeted: 25000,
        variance: -2.5,
        byCategory: {
          common_areas: 8000,
          elevators: 5000,
          electrical: 3500,
          plumbing: 2800,
          hvac: 4200,
          security: 1500,
          landscaping: 1200,
          parking: 800,
          roof: 2000,
          facade: 1500,
          other: 500
        },
        byType: {
          preventive: 15000,
          corrective: 8000,
          emergency: 3000,
          inspection: 2000,
          cleaning: 1500,
          security: 500
        },
        averageCostPerItem: 450
      },
      
      performance: {
        providerRatings: [
          {
            providerId: 'provider-1',
            name: 'TechMaintenance Lda',
            rating: 4.5,
            completedJobs: 25,
            averageCost: 380,
            onTimeRate: 92
          },
          {
            providerId: 'provider-2',
            name: 'CleanPro Services',
            rating: 4.2,
            completedJobs: 18,
            averageCost: 220,
            onTimeRate: 88
          }
        ],
        
        areaPerformance: [
          { area: 'elevators', items: 12, avgCost: 650, avgDuration: 4.5, issues: 2 },
          { area: 'electrical', items: 8, avgCost: 420, avgDuration: 3.2, issues: 1 },
          { area: 'plumbing', items: 15, avgCost: 280, avgDuration: 2.8, issues: 3 },
          { area: 'hvac', items: 6, avgCost: 850, avgDuration: 6.0, issues: 1 },
          { area: 'common_areas', items: 20, avgCost: 180, avgDuration: 2.0, issues: 0 }
        ]
      },
      
      trends: {
        monthlySpend: [
          { month: 'Jan', amount: 3200 },
          { month: 'Fev', amount: 2800 },
          { month: 'Mar', amount: 4100 },
          { month: 'Abr', amount: 3600 },
          { month: 'Mai', amount: 3900 },
          { month: 'Jun', amount: 3400 }
        ],
        
        itemsByType: [
          { type: 'preventive', count: 45 },
          { type: 'corrective', count: 28 },
          { type: 'emergency', count: 8 },
          { type: 'inspection', count: 12 },
          { type: 'cleaning', count: 35 },
          { type: 'security', count: 6 }
        ],
        
        responseTimesByPriority: [
          { priority: 'critical', avgHours: 2.5 },
          { priority: 'high', avgHours: 8.2 },
          { priority: 'medium', avgHours: 24.8 },
          { priority: 'low', avgHours: 72.0 }
        ]
      },
      
      predictions: {
        upcomingMaintenance: {
          nextMonth: 18,
          nextQuarter: 52,
          estimatedCost: 12500
        },
        
        budgetForecast: {
          projectedSpend: 28500,
          projectedOverrun: 3500,
          riskLevel: 'medium'
        },
        
        equipmentLifecycle: [
          {
            equipment: 'Elevador Principal',
            currentAge: 8,
            estimatedRemainingLife: 12,
            replacementCost: 45000
          },
          {
            equipment: 'Sistema AVAC',
            currentAge: 5,
            estimatedRemainingLife: 10,
            replacementCost: 25000
          },
          {
            equipment: 'Bomba de Água',
            currentAge: 12,
            estimatedRemainingLife: 3,
            replacementCost: 8500
          }
        ]
      }
    };
  }

  // Calendar integration
  async getMaintenanceCalendar(buildingId: string, month: string): Promise<MaintenanceItem[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    return this.items.filter(item => 
      item.buildingId === buildingId &&
      new Date(item.scheduledDate) >= startDate &&
      new Date(item.scheduledDate) <= endDate
    );
  }

  // Settings
  async getSettings(buildingId: string): Promise<MaintenanceSettings | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.settings[buildingId] || null;
  }

  async updateSettings(buildingId: string, settings: Partial<MaintenanceSettings>): Promise<MaintenanceSettings> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const current = this.settings[buildingId] || this.getDefaultSettings(buildingId);
    
    this.settings[buildingId] = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    
    return this.settings[buildingId];
  }

  // Initialize sample data
  async initializeSampleData(buildingId: string): Promise<void> {
    const hasData = this.items.some(item => item.buildingId === buildingId);
    if (hasData) return;

    // Sample providers
    const sampleProviders: MaintenanceProvider[] = [
      {
        id: `provider-tech-${buildingId}`,
        buildingId,
        name: 'TechMaintenance Lda',
        category: ['elevators', 'electrical', 'hvac'],
        contactPerson: 'João Santos',
        email: 'joao@techmaintenance.pt',
        phone: '+351 912 345 678',
        address: 'Rua das Oficinas, 123, Lisboa',
        license: 'ALV-2023-001',
        insurance: 'Seguro válido até 2024',
        certifications: ['ISO 9001', 'Certificação AVAC'],
        rating: 4.5,
        completedJobs: 145,
        averageResponseTime: 4.2,
        onTimeCompletion: 92.5,
        averageCost: 380,
        paymentTerms: '30 dias',
        isActive: true,
        emergencyAvailable: true,
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
          saturday: { start: '09:00', end: '13:00' }
        },
        metadata: {
          notes: 'Fornecedor de confiança para equipamentos técnicos',
          preferredProvider: true
        },
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `provider-clean-${buildingId}`,
        buildingId,
        name: 'CleanPro Services',
        category: ['common_areas', 'landscaping'],
        contactPerson: 'Maria Silva',
        email: 'maria@cleanpro.pt',
        phone: '+351 934 567 890',
        rating: 4.2,
        completedJobs: 89,
        averageResponseTime: 12.0,
        onTimeCompletion: 88.3,
        averageCost: 220,
        isActive: true,
        emergencyAvailable: false,
        workingHours: {
          monday: { start: '07:00', end: '15:00' },
          tuesday: { start: '07:00', end: '15:00' },
          wednesday: { start: '07:00', end: '15:00' },
          thursday: { start: '07:00', end: '15:00' },
          friday: { start: '07:00', end: '15:00' }
        },
        metadata: {
          notes: 'Especialista em limpeza e jardinagem'
        },
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Sample maintenance items
    const sampleItems: MaintenanceItem[] = [
      {
        id: `maint-elevator-${buildingId}`,
        buildingId,
        title: 'Manutenção Preventiva Elevador',
        description: 'Revisão trimestral do sistema de elevadores principais',
        type: 'preventive',
        area: 'elevators',
        priority: 'medium',
        status: 'scheduled',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: 4,
        assignedTo: 'João Santos',
        providerId: sampleProviders[0].id,
        estimatedCost: 650,
        location: 'Elevador Principal - Piso 0',
        equipment: ['Motor principal', 'Cabos', 'Sistema de segurança'],
        instructions: 'Verificar todos os componentes de segurança e lubrificar mecanismos',
        createdBy: 'Sistema',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `maint-cleaning-${buildingId}`,
        buildingId,
        title: 'Limpeza Semanal Áreas Comuns',
        description: 'Limpeza profunda do hall de entrada e escadas',
        type: 'cleaning',
        area: 'common_areas',
        priority: 'low',
        status: 'completed',
        scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 2,
        actualDuration: 2.5,
        assignedTo: 'Maria Silva',
        providerId: sampleProviders[1].id,
        estimatedCost: 120,
        actualCost: 130,
        location: 'Hall principal e escadas',
        workPerformed: 'Limpeza completa realizada, incluindo enceramento do piso',
        nextMaintenanceDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdBy: 'Sistema',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `maint-emergency-${buildingId}`,
        buildingId,
        title: 'Reparação Urgente - Fuga de Água',
        description: 'Fuga de água no apartamento 3º Dto - teto do 2º Esq',
        type: 'emergency',
        area: 'plumbing',
        priority: 'critical',
        status: 'in_progress',
        scheduledDate: new Date().toISOString().split('T')[0],
        startDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 3,
        estimatedCost: 350,
        location: '3º Dto / 2º Esq',
        instructions: 'Intervenção urgente - verificar origem da fuga e reparar',
        createdBy: 'Administrador',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    // Sample budget
    const currentYear = new Date().getFullYear();
    const sampleBudgets: MaintenanceBudget[] = [
      {
        id: `budget-elevators-${buildingId}`,
        buildingId,
        year: currentYear,
        category: 'elevators',
        budgeted: 8000,
        spent: 3200,
        committed: 1500,
        available: 3300,
        preventive: 5000,
        corrective: 2500,
        emergency: 500,
        lastUpdated: new Date().toISOString(),
        projectedSpend: 7500,
        projectedOverrun: 0,
        createdAt: new Date(currentYear, 0, 1).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `budget-common-${buildingId}`,
        buildingId,
        year: currentYear,
        category: 'common_areas',
        budgeted: 6000,
        spent: 2800,
        committed: 800,
        available: 2400,
        preventive: 4000,
        corrective: 1500,
        emergency: 500,
        lastUpdated: new Date().toISOString(),
        projectedSpend: 5800,
        projectedOverrun: 0,
        createdAt: new Date(currentYear, 0, 1).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Sample alerts
    const sampleAlerts: MaintenanceAlert[] = [
      {
        id: `alert-overdue-${buildingId}`,
        buildingId,
        type: 'overdue',
        severity: 'warning',
        title: 'Manutenção em Atraso',
        message: 'A manutenção do sistema AVAC está 3 dias em atraso',
        maintenanceItemId: 'maint-hvac-123',
        actionRequired: true,
        suggestedAction: 'Contactar o fornecedor e reagendar',
        isRead: false,
        isResolved: false,
        triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        notificationsSent: [
          {
            channel: 'email',
            recipients: ['admin@condominio.pt'],
            sentAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
          }
        ],
        metadata: {
          source: 'system',
          category: 'maintenance'
        },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: `alert-budget-${buildingId}`,
        buildingId,
        type: 'budget_exceeded',
        severity: 'error',
        title: 'Orçamento Excedido',
        message: 'O orçamento de manutenção para elevadores foi excedido em 15%',
        actionRequired: true,
        suggestedAction: 'Aprovar orçamento suplementar ou adiar manutenções não críticas',
        isRead: false,
        isResolved: false,
        triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        notificationsSent: [],
        metadata: {
          source: 'system',
          category: 'budget'
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Add sample data
    this.providers.push(...sampleProviders);
    this.items.push(...sampleItems);
    this.budgets.push(...sampleBudgets);
    this.alerts.push(...sampleAlerts);

    // Create default settings
    this.settings[buildingId] = this.getDefaultSettings(buildingId);
  }

  private getDefaultSettings(buildingId: string): MaintenanceSettings {
    return {
      buildingId,
      defaultPriority: 'medium',
      defaultResponseTime: 24,
      defaultNotificationAdvance: 7,
      requireApprovalOver: 500,
      approvers: ['admin@condominio.pt'],
      notificationChannels: ['email'],
      notificationRecipients: ['admin@condominio.pt'],
      calendarIntegration: true,
      emailIntegration: true,
      allowWeekendWork: false,
      workingHours: { start: '08:00', end: '18:00' },
      emergencyContacts: [
        {
          name: 'Administrador',
          phone: '+351 912 345 678',
          email: 'admin@condominio.pt',
          role: 'Administrador'
        }
      ],
      updatedAt: new Date().toISOString()
    };
  }
}

export default new MaintenanceService();