import { 
  CommunicationMessage, 
  CommunicationTemplate, 
  CommunicationCampaign, 
  CommunicationStats,
  CommunicationType,
  CommunicationCategory,
  CommunicationStatus,
  AutomationRule,
  CommunicationSettings
} from '@/types/communicationTypes';

// Mock service - Replace with actual API calls
class CommunicationService {
  private messages: CommunicationMessage[] = [];
  private templates: CommunicationTemplate[] = [];
  private campaigns: CommunicationCampaign[] = [];
  private automationRules: AutomationRule[] = [];
  private settings: Record<string, CommunicationSettings> = {};

  // Messages
  async getMessages(buildingId: string, page = 1, limit = 20): Promise<CommunicationMessage[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const buildingMessages = this.messages
      .filter(m => m.buildingId === buildingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const start = (page - 1) * limit;
    return buildingMessages.slice(start, start + limit);
  }

  async getRecentMessages(buildingId: string, limit = 10): Promise<CommunicationMessage[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return this.messages
      .filter(m => m.buildingId === buildingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getMessage(messageId: string): Promise<CommunicationMessage | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.messages.find(m => m.id === messageId) || null;
  }

  async sendMessage(messageData: any): Promise<CommunicationMessage> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate send time
    
    const newMessage: CommunicationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      buildingId: messageData.buildingId,
      templateId: messageData.templateId,
      type: messageData.type,
      category: messageData.category,
      priority: messageData.priority,
      subject: messageData.subject,
      content: messageData.content,
      recipients: messageData.recipients.map((r: any) => ({
        ...r,
        status: 'sent' as CommunicationStatus,
        deliveredAt: new Date().toISOString()
      })),
      scheduledFor: messageData.scheduledFor,
      sendAt: messageData.scheduledFor || new Date().toISOString(),
      status: messageData.scheduledFor ? 'pending' : 'sent',
      statusDetails: {
        sent: messageData.recipients.length,
        delivered: messageData.recipients.length,
        read: Math.floor(messageData.recipients.length * 0.8), // Mock 80% read rate
        failed: 0,
        bounced: 0
      },
      metadata: messageData.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.messages.push(newMessage);
    
    // Update template usage if template was used
    if (messageData.templateId) {
      const template = this.templates.find(t => t.id === messageData.templateId);
      if (template) {
        template.metadata.useCount = (template.metadata.useCount || 0) + 1;
        template.metadata.lastUsed = new Date().toISOString();
      }
    }

    return newMessage;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
      throw new Error('Mensagem não encontrada');
    }
    
    this.messages.splice(index, 1);
  }

  // Templates
  async getTemplates(buildingId: string): Promise<CommunicationTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.templates.filter(t => t.buildingId === buildingId);
  }

  async getTemplate(templateId: string): Promise<CommunicationTemplate | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.templates.find(t => t.id === templateId) || null;
  }

  async saveTemplate(template: CommunicationTemplate): Promise<CommunicationTemplate> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const existingIndex = this.templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      // Update existing
      this.templates[existingIndex] = {
        ...template,
        updatedAt: new Date().toISOString()
      };
      return this.templates[existingIndex];
    } else {
      // Create new
      const newTemplate = {
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.templates.push(newTemplate);
      return newTemplate;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index === -1) {
      throw new Error('Template não encontrado');
    }
    
    this.templates.splice(index, 1);
  }

  // Campaigns
  async getCampaigns(buildingId: string): Promise<CommunicationCampaign[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return this.campaigns.filter(c => c.buildingId === buildingId);
  }

  async createCampaign(campaign: Omit<CommunicationCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunicationCampaign> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newCampaign: CommunicationCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  async updateCampaign(campaignId: string, updates: Partial<CommunicationCampaign>): Promise<CommunicationCampaign> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) {
      throw new Error('Campanha não encontrada');
    }
    
    this.campaigns[index] = {
      ...this.campaigns[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.campaigns[index];
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) {
      throw new Error('Campanha não encontrada');
    }
    
    this.campaigns.splice(index, 1);
  }

  async launchCampaign(campaignId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate campaign launch
    
    const campaign = this.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      throw new Error('Campanha não encontrada');
    }

    // Mock campaign execution
    campaign.status = 'sending';
    campaign.results = {
      totalSent: 150,
      delivered: 145,
      read: 120,
      failed: 5,
      cost: 12.50
    };
    
    // After a delay, mark as completed
    setTimeout(() => {
      campaign.status = 'completed';
    }, 2000);
  }

  // Automation Rules
  async getAutomationRules(buildingId: string): Promise<AutomationRule[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.automationRules.filter(r => r.buildingId === buildingId);
  }

  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationRule> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.automationRules.push(newRule);
    return newRule;
  }

  async toggleAutomationRule(ruleId: string): Promise<AutomationRule> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error('Regra não encontrada');
    }
    
    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date().toISOString();
    
    return rule;
  }

  async deleteAutomationRule(ruleId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.automationRules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      throw new Error('Regra não encontrada');
    }
    
    this.automationRules.splice(index, 1);
  }

  // Statistics
  async getStats(buildingId: string): Promise<CommunicationStats> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const buildingMessages = this.messages.filter(m => m.buildingId === buildingId);
    const buildingTemplates = this.templates.filter(t => t.buildingId === buildingId);
    
    const now = new Date();
    const thisMonth = buildingMessages.filter(m => {
      const msgDate = new Date(m.createdAt);
      return msgDate.getMonth() === now.getMonth() && msgDate.getFullYear() === now.getFullYear();
    });
    
    const thisYear = buildingMessages.filter(m => {
      const msgDate = new Date(m.createdAt);
      return msgDate.getFullYear() === now.getFullYear();
    });

    // Calculate aggregated stats
    const totalSent = buildingMessages.reduce((sum, msg) => sum + (msg.statusDetails?.sent || 0), 0);
    const totalDelivered = buildingMessages.reduce((sum, msg) => sum + (msg.statusDetails?.delivered || 0), 0);
    const totalRead = buildingMessages.reduce((sum, msg) => sum + (msg.statusDetails?.read || 0), 0);
    const totalBounced = buildingMessages.reduce((sum, msg) => sum + (msg.statusDetails?.bounced || 0), 0);

    const byType = buildingMessages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<CommunicationType, number>);

    const byCategory = buildingMessages.reduce((acc, msg) => {
      acc[msg.category] = (acc[msg.category] || 0) + 1;
      return acc;
    }, {} as Record<CommunicationCategory, number>);

    // Top templates
    const templateUsage = buildingTemplates
      .filter(t => t.metadata.useCount && t.metadata.useCount > 0)
      .sort((a, b) => (b.metadata.useCount || 0) - (a.metadata.useCount || 0))
      .slice(0, 5)
      .map(t => ({
        templateId: t.id,
        name: t.name,
        useCount: t.metadata.useCount || 0
      }));

    return {
      totalSent,
      deliveryRate: totalSent > 0 ? totalDelivered / totalSent : 0,
      readRate: totalSent > 0 ? totalRead / totalSent : 0,
      bounceRate: totalSent > 0 ? totalBounced / totalSent : 0,
      byType,
      byCategory,
      thisMonth: thisMonth.length,
      thisYear: thisYear.length,
      avgResponseTime: 1.5, // Mock average response time in hours
      topTemplates: templateUsage
    };
  }

  // Settings
  async getSettings(buildingId: string): Promise<CommunicationSettings | null> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.settings[buildingId] || null;
  }

  async updateSettings(buildingId: string, settings: Partial<CommunicationSettings>): Promise<CommunicationSettings> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const current = this.settings[buildingId] || this.getDefaultSettings(buildingId);
    
    this.settings[buildingId] = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    
    return this.settings[buildingId];
  }

  private getDefaultSettings(buildingId: string): CommunicationSettings {
    return {
      buildingId,
      emailProvider: 'smtp',
      emailConfig: {
        senderName: 'Administração',
        senderEmail: 'admin@condominio.pt'
      },
      smsProvider: 'twilio',
      smsConfig: {
        senderName: 'Condominio'
      },
      whatsappConfig: {},
      defaultPriority: 'normal',
      enableAutoRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 300,
      enableDeliveryReports: true,
      enableReadReceipts: true,
      privacySettings: {
        requireOptIn: false,
        allowOptOut: true,
        gdprCompliant: true,
        dataRetentionDays: 365
      },
      updatedAt: new Date().toISOString()
    };
  }

  // Initialize sample data
  async initializeSampleData(buildingId: string): Promise<void> {
    const hasData = this.templates.some(t => t.buildingId === buildingId) || 
                   this.messages.some(m => m.buildingId === buildingId);
    
    if (hasData) return;

    // Create sample templates
    const sampleTemplates: CommunicationTemplate[] = [
      {
        id: `template-payment-${buildingId}`,
        buildingId,
        name: 'Lembrete de Pagamento Mensal',
        category: 'payment_reminder',
        type: ['email', 'sms'],
        subject: 'Lembrete: Quota do mês {{month}} - {{buildingName}}',
        content: `Caro(a) {{memberName}},\n\nEste é um lembrete de que a quota de condomínio do mês {{month}} tem vencimento em {{dueDate}}.\n\nValor: {{quotaAmount}}\n\nPor favor, efetue o pagamento até à data indicada.\n\nAtenciosamente,\n{{administratorName}}`,
        variables: [
          { name: 'memberName', label: 'Nome do Membro', type: 'text', required: true },
          { name: 'month', label: 'Mês', type: 'text', required: true },
          { name: 'dueDate', label: 'Data de Vencimento', type: 'date', required: true },
          { name: 'quotaAmount', label: 'Valor da Quota', type: 'currency', required: true }
        ],
        isActive: true,
        metadata: {
          description: 'Template para lembretes de pagamento mensal',
          version: '1.0',
          useCount: 15
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `template-meeting-${buildingId}`,
        buildingId,
        name: 'Convocatória de Reunião',
        category: 'meeting_notice',
        type: ['email'],
        subject: 'Convocatória: {{meetingType}} - {{meetingDate}}',
        content: `Caro(a) {{memberName}},\n\nTem a honra de ser convocado(a) para a {{meetingType}} que se realizará:\n\n📅 Data: {{meetingDate}}\n🕒 Hora: {{meetingTime}}\n📍 Local: {{meetingLocation}}\n\nOrdem do Dia:\n{{agenda}}\n\nA sua presença é importante.\n\n{{administratorName}}`,
        variables: [
          { name: 'memberName', label: 'Nome do Membro', type: 'text', required: true },
          { name: 'meetingType', label: 'Tipo de Reunião', type: 'text', required: true },
          { name: 'meetingDate', label: 'Data da Reunião', type: 'date', required: true },
          { name: 'meetingTime', label: 'Hora da Reunião', type: 'text', required: true },
          { name: 'meetingLocation', label: 'Local da Reunião', type: 'text', required: true },
          { name: 'agenda', label: 'Ordem do Dia', type: 'text', required: true }
        ],
        isActive: true,
        metadata: {
          description: 'Template para convocatórias de reuniões',
          version: '1.0',
          useCount: 8
        },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Create sample messages
    const sampleMessages: CommunicationMessage[] = [
      {
        id: `msg-sample-1-${buildingId}`,
        buildingId,
        templateId: sampleTemplates[0].id,
        type: 'email',
        category: 'payment_reminder',
        priority: 'normal',
        subject: 'Lembrete: Quota do mês Janeiro - Edifício Central',
        content: 'Caro(a) João Silva,\n\nEste é um lembrete de que a quota de condomínio do mês Janeiro tem vencimento em 31/01/2024...',
        recipients: [
          {
            id: 'recipient-1',
            memberId: 'member-1',
            name: 'João Silva',
            email: 'joao.silva@email.com',
            apartmentNumber: '3º Dto',
            status: 'delivered',
            deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            variables: {
              memberName: 'João Silva',
              month: 'Janeiro',
              quotaAmount: '75.00€',
              dueDate: '31/01/2024'
            }
          }
        ],
        status: 'sent',
        statusDetails: {
          sent: 1,
          delivered: 1,
          read: 1,
          failed: 0,
          bounced: 0
        },
        metadata: {
          campaignName: 'Lembrete Janeiro 2024',
          sender: 'Sistema',
          totalRecipients: 1
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    this.templates.push(...sampleTemplates);
    this.messages.push(...sampleMessages);
  }
}

export default new CommunicationService();