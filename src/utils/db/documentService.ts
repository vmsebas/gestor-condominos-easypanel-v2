import { DocumentTemplate, GeneratedDocument, DocumentGenerationRequest, BulkDocumentRequest, DocumentPreviewData, DocumentStats } from '@/types/documentTypes';

// Mock service - Replace with actual API calls
class DocumentService {
  private templates: DocumentTemplate[] = [];
  private documents: GeneratedDocument[] = [];

  // Templates
  async getTemplates(buildingId: string): Promise<DocumentTemplate[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.templates.filter(t => t.buildingId === buildingId);
  }

  async getTemplate(templateId: string): Promise<DocumentTemplate | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.templates.find(t => t.id === templateId) || null;
  }

  async createTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newTemplate: DocumentTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.templates.push(newTemplate);
    return newTemplate;
  }

  async updateTemplate(templateId: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index === -1) {
      throw new Error('Template não encontrado');
    }
    
    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.templates[index];
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index === -1) {
      throw new Error('Template não encontrado');
    }
    
    this.templates.splice(index, 1);
  }

  // Documents
  async getDocuments(buildingId: string): Promise<GeneratedDocument[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return this.documents
      .filter(d => d.buildingId === buildingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDocument(documentId: string): Promise<GeneratedDocument | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.documents.find(d => d.id === documentId) || null;
  }

  async generateDocument(templateId: string, request: any): Promise<GeneratedDocument> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate generation time
    
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Process template content with variables
    let processedContent = template.content;
    const variables = request.variables || {};
    
    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, String(value));
    });

    // Remove any unreplaced variables
    processedContent = processedContent.replace(/{{.*?}}/g, '[VARIÁVEL NÃO DEFINIDA]');

    const newDocument: GeneratedDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      buildingId: template.buildingId,
      templateId,
      type: template.type,
      title: request.metadata?.title || `${template.name} - ${new Date().toLocaleDateString()}`,
      content: processedContent,
      status: 'generated',
      metadata: {
        recipient: request.metadata?.recipient,
        recipientEmail: request.metadata?.recipientEmail,
        variables,
        generatedBy: 'Sistema',
        sendMethod: request.metadata?.sendMethod || 'download'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.documents.push(newDocument);
    return newDocument;
  }

  async generateBulkDocuments(request: BulkDocumentRequest): Promise<GeneratedDocument[]> {
    // This would typically handle bulk generation on the backend
    // For now, we'll simulate with a single document
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const template = this.templates.find(t => t.id === request.templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Generate multiple documents based on filter
    const documents: GeneratedDocument[] = [];
    
    // This is a simplified version - in reality, you'd query members based on filter
    // and generate a document for each
    for (let i = 0; i < 3; i++) {
      const doc = await this.generateDocument(request.templateId, {
        variables: { ...request.variables, memberName: `Membro ${i + 1}` },
        metadata: {
          title: `${request.metadata?.batchTitle || template.name} - Membro ${i + 1}`,
          sendMethod: request.metadata?.sendMethod
        }
      });
      documents.push(doc);
    }

    return documents;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.documents.findIndex(d => d.id === documentId);
    if (index === -1) {
      throw new Error('Documento não encontrado');
    }
    
    this.documents.splice(index, 1);
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const document = this.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Documento não encontrado');
    }

    // In a real implementation, this would generate/fetch the PDF
    // For now, we'll create a simple text blob
    const content = `PDF Document: ${document.title}\n\nGenerated: ${document.createdAt}\n\nContent:\n${document.content.replace(/<[^>]*>/g, '')}`;
    return new Blob([content], { type: 'application/pdf' });
  }

  async previewDocument(templateId: string, variables: Record<string, any>): Promise<DocumentPreviewData> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    let processedContent = template.content;
    const warnings: string[] = [];

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, String(value));
    });

    // Check for unreplaced variables
    const unreplacedMatches = processedContent.match(/{{.*?}}/g);
    if (unreplacedMatches) {
      warnings.push(`Variáveis não definidas: ${unreplacedMatches.join(', ')}`);
    }

    // Estimate pages (rough calculation)
    const estimatedPages = Math.max(1, Math.ceil(processedContent.length / 3000));

    return {
      html: processedContent,
      variables,
      estimatedPages,
      warnings
    };
  }

  async getDocumentStats(buildingId: string): Promise<DocumentStats> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const buildingDocs = this.documents.filter(d => d.buildingId === buildingId);
    const now = new Date();
    const thisMonth = buildingDocs.filter(d => {
      const docDate = new Date(d.createdAt);
      return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
    });
    const thisYear = buildingDocs.filter(d => {
      const docDate = new Date(d.createdAt);
      return docDate.getFullYear() === now.getFullYear();
    });

    const byType = buildingDocs.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalGenerated: buildingDocs.length,
      byType,
      thisMonth: thisMonth.length,
      thisYear: thisYear.length,
      avgGenerationTime: 1.2 // Mock average in seconds
    };
  }

  // Email integration (mock)
  async sendDocumentByEmail(documentId: string, recipientEmail: string, subject?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const document = this.documents.find(d => d.id === documentId);
    if (!document) {
      throw new Error('Documento não encontrado');
    }

    // Mock email sending
    console.log(`Email enviado para ${recipientEmail}:`, {
      subject: subject || document.title,
      documentId,
      timestamp: new Date().toISOString()
    });

    // Update document metadata
    document.metadata.recipientEmail = recipientEmail;
    document.metadata.sendMethod = 'email';
    document.updatedAt = new Date().toISOString();
  }

  // Initialize with default templates
  async initializeDefaultTemplates(buildingId: string): Promise<void> {
    const hasExistingTemplates = this.templates.some(t => t.buildingId === buildingId);
    if (hasExistingTemplates) return;

    const defaultTemplates = [
      {
        buildingId,
        name: 'Carta de Morosidade Padrão',
        type: 'arrears_letter' as const,
        content: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;margin:40px}.header{text-align:center;margin-bottom:40px}.content{line-height:1.6}.highlight{background-color:#fff2cc;padding:10px;border-left:4px solid #f1c40f}</style></head>
<body>
<div class="header"><h1>{{buildingName}}</h1><p>{{buildingAddress}}</p></div>
<div class="content">
<p><strong>Data:</strong> {{currentDate}}</p>
<p><strong>Para:</strong> {{memberName}}<br><strong>Apartamento:</strong> {{apartmentNumber}}</p>
<h2>Assunto: Quotas em Atraso</h2>
<p>Caro(a) {{memberName}},</p>
<p>Informamos que existem quotas em atraso referentes ao apartamento {{apartmentNumber}}.</p>
<div class="highlight">
<p><strong>Valor em dívida:</strong> {{arrearAmount}}</p>
<p><strong>Vencimento:</strong> {{dueDate}}</p>
</div>
<p>Solicitamos pagamento em 15 dias úteis.</p>
<p>{{paymentInstructions}}</p>
<p>Atenciosamente,<br>{{administratorName}}</p>
</div>
</body>
</html>`,
        variables: [
          { name: 'memberName', label: 'Nome do Membro', type: 'text' as const, required: true },
          { name: 'apartmentNumber', label: 'Apartamento', type: 'text' as const, required: true },
          { name: 'arrearAmount', label: 'Valor em Dívida', type: 'currency' as const, required: true },
          { name: 'dueDate', label: 'Data de Vencimento', type: 'date' as const, required: true },
          { name: 'paymentInstructions', label: 'Instruções de Pagamento', type: 'text' as const, required: false }
        ],
        isActive: true,
        metadata: {
          description: 'Template padrão para cartas de morosidade',
          version: '1.0',
          legalCompliance: true
        }
      }
    ];

    for (const template of defaultTemplates) {
      await this.createTemplate(template);
    }
  }
}

export default new DocumentService();