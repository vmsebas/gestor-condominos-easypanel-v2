import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import documentService from '@/services/api/documents';
import { DocumentTemplate, DocumentType, GeneratedDocument } from '@/types/documentTypes';
import { formatDate } from '@/utils/formatters';
import { useNotifications } from '@/components/common/NotificationProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus,
  RefreshCw,
  Mail,
  FileDown,
  Calendar,
  Euro,
  AlertTriangle,
  Settings,
  Template,
  History
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import DocumentTemplateEditor from './DocumentTemplateEditor';
import DocumentPreview from './DocumentPreview';
import BulkDocumentGenerator from './BulkDocumentGenerator';

interface DocumentGeneratorProps {
  className?: string;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  const { success, error } = useNotifications();
  
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [previewDocument, setPreviewDocument] = useState<GeneratedDocument | null>(null);
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);

  // Carregar templates e documentos
  useEffect(() => {
    if (currentBuilding?.id) {
      loadData();
    }
  }, [currentBuilding?.id]);

  const loadData = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const [templatesData, documentsData] = await Promise.all([
        documentsAPI.getTemplates(currentBuilding.id),
        documentsAPI.getDocuments(currentBuilding.id)
      ]);
      
      setTemplates(templatesData);
      setDocuments(documentsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      error('Erro ao carregar documentos e templates');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDocument = async (templateId: string, data: any) => {
    try {
      const document = await documentsAPI.generateDocument(templateId, data);
      setDocuments(prev => [document, ...prev]);
      success('Documento gerado com sucesso');
      return document;
    } catch (err) {
      console.error('Erro ao gerar documento:', err);
      error('Erro ao gerar documento');
      throw err;
    }
  };

  const downloadDocument = async (documentId: string) => {
    try {
      const blob = await documentsAPI.downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documento-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Download iniciado');
    } catch (err) {
      console.error('Erro ao fazer download:', err);
      error('Erro ao fazer download do documento');
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels = {
      arrears_letter: 'Carta de Morosidade',
      quota_certificate: 'Certificado de Quotas',
      receipt: 'Recibo',
      minutes_pdf: 'Ata em PDF',
      assembly_notice: 'Convocatória',
      financial_report: 'Relatório Financeiro'
    };
    return labels[type] || type;
  };

  const getDocumentTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'arrears_letter': return <AlertTriangle className="h-4 w-4" />;
      case 'quota_certificate': return <FileText className="h-4 w-4" />;
      case 'receipt': return <Euro className="h-4 w-4" />;
      case 'minutes_pdf': return <FileDown className="h-4 w-4" />;
      case 'assembly_notice': return <Calendar className="h-4 w-4" />;
      case 'financial_report': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      generated: 'success',
      processing: 'warning',
      failed: 'destructive'
    } as const;
    
    const labels = {
      generated: 'Gerado',
      processing: 'Processando',
      failed: 'Erro'
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>;
  };

  // Filtrar documentos por tipo
  const filteredDocuments = documents.filter(doc => 
    selectedType === 'all' || doc.type === selectedType
  );

  // Estatísticas
  const totalDocuments = documents.length;
  const documentsThisMonth = documents.filter(doc => 
    new Date(doc.createdAt).getMonth() === new Date().getMonth()
  ).length;
  const activeTemplates = templates.filter(t => t.isActive).length;

  const QuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowBulkGenerator(true)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-medium">Cartas de Morosidade</h3>
              <p className="text-sm text-muted-foreground">Gerar cartas automáticas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">Certificados</h3>
              <p className="text-sm text-muted-foreground">Certificados de quotas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Convocatórias</h3>
              <p className="text-sm text-muted-foreground">Avisos de assembleia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DocumentCard: React.FC<{ document: GeneratedDocument }> = ({ document }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              {getDocumentTypeIcon(document.type)}
              <h3 className="font-semibold truncate">{document.title}</h3>
              {getStatusBadge(document.status)}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{getDocumentTypeLabel(document.type)}</span>
              <span>{formatDate(document.createdAt)}</span>
            </div>
            
            {document.metadata?.recipient && (
              <p className="text-sm text-muted-foreground">
                Para: {document.metadata.recipient}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setPreviewDocument(document)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => downloadDocument(document.id)}
              disabled={document.status !== 'generated'}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir documentos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerador de Documentos
                <Badge variant="secondary" className="ml-2">
                  {totalDocuments}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Automação de documentos para {currentBuilding.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateEditor(true)}
              >
                <Template className="h-4 w-4 mr-2" />
                Templates
              </Button>
              
              <Button
                onClick={() => setShowBulkGenerator(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Gerar Documentos
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalDocuments}</p>
              <p className="text-sm text-muted-foreground">Total de Documentos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{documentsThisMonth}</p>
              <p className="text-sm text-muted-foreground">Este Mês</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{activeTemplates}</p>
              <p className="text-sm text-muted-foreground">Templates Ativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="quick-actions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quick-actions">Ações Rápidas</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Ações Rápidas */}
        <TabsContent value="quick-actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Documentos Comuns</CardTitle>
              <p className="text-sm text-muted-foreground">
                Acesso rápido aos documentos mais utilizados
              </p>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lista de Documentos */}
        <TabsContent value="documents" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                  <SelectTrigger className="w-full sm:w-60">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="arrears_letter">Cartas de Morosidade</SelectItem>
                    <SelectItem value="quota_certificate">Certificados</SelectItem>
                    <SelectItem value="receipt">Recibos</SelectItem>
                    <SelectItem value="minutes_pdf">Atas PDF</SelectItem>
                    <SelectItem value="assembly_notice">Convocatórias</SelectItem>
                    <SelectItem value="financial_report">Relatórios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Documentos */}
          {isLoading ? (
            <ListSkeleton count={4} />
          ) : filteredDocuments.length === 0 ? (
            <EmptyList
              icon={<FileText className="h-full w-full" />}
              title="Nenhum documento encontrado"
              description="Ainda não há documentos gerados. Comece criando o primeiro documento."
              actionLabel="Gerar Documento"
              onAction={() => setShowBulkGenerator(true)}
            />
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Template className="h-5 w-5" />
                  Templates de Documentos
                </CardTitle>
                <Button onClick={() => setShowTemplateEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <EmptyList
                  icon={<Template className="h-full w-full" />}
                  title="Nenhum template configurado"
                  description="Crie templates personalizados para gerar documentos automaticamente."
                  actionLabel="Criar Template"
                  onAction={() => setShowTemplateEditor(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {getDocumentTypeIcon(template.type)}
                              <h3 className="font-medium">{template.name}</h3>
                              <Badge variant={template.isActive ? 'success' : 'outline'}>
                                {template.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getDocumentTypeLabel(template.type)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Atualizado: {formatDate(template.updatedAt)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Editor de Templates */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <DocumentTemplateEditor
            template={editingTemplate}
            onSave={(template) => {
              setTemplates(prev => 
                editingTemplate 
                  ? prev.map(t => t.id === editingTemplate.id ? template : t)
                  : [...prev, template]
              );
              setShowTemplateEditor(false);
              setEditingTemplate(null);
              success('Template salvo com sucesso');
            }}
            onCancel={() => {
              setShowTemplateEditor(false);
              setEditingTemplate(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerador em Massa */}
      <Dialog open={showBulkGenerator} onOpenChange={setShowBulkGenerator}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gerador de Documentos em Massa</DialogTitle>
          </DialogHeader>
          <BulkDocumentGenerator
            templates={templates.filter(t => t.isActive)}
            onGenerate={generateDocument}
            onClose={() => setShowBulkGenerator(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview do Documento</DialogTitle>
          </DialogHeader>
          {previewDocument && (
            <DocumentPreview
              document={previewDocument}
              onDownload={() => downloadDocument(previewDocument.id)}
              onClose={() => setPreviewDocument(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentGenerator;