import React, { useState } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import { CommunicationTemplate, CommunicationCategory, CommunicationType, DEFAULT_TEMPLATES } from '@/types/communicationTypes';
import { formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  Eye,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Save,
  X,
  Template,
  HelpCircle
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';

interface TemplateManagerProps {
  templates: CommunicationTemplate[];
  onTemplateChange: () => void;
  onClose?: () => void;
  className?: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onTemplateChange,
  onClose,
  className
}) => {
  const { currentBuilding } = useBuilding();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CommunicationCategory>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<CommunicationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CommunicationTemplate | null>(null);

  // Form data para editor
  const [formData, setFormData] = useState({
    name: '',
    category: 'general_announcement' as CommunicationCategory,
    types: ['email'] as CommunicationType[],
    subject: '',
    content: '',
    description: '',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const openEditor = (template?: CommunicationTemplate) => {
    if (template) {
      setFormData({
        name: template.name,
        category: template.category,
        types: template.type,
        subject: template.subject,
        content: template.content,
        description: template.metadata.description || '',
        isActive: template.isActive
      });
      setEditingTemplate(template);
    } else {
      // Novo template com dados padrão
      setFormData({
        name: '',
        category: 'general_announcement',
        types: ['email'],
        subject: '',
        content: '',
        description: '',
        isActive: true
      });
      setEditingTemplate(null);
    }
    setShowEditor(true);
  };

  const loadDefaultTemplate = (category: CommunicationCategory) => {
    const defaultTemplate = DEFAULT_TEMPLATES[category];
    if (defaultTemplate) {
      setFormData(prev => ({
        ...prev,
        name: defaultTemplate.name,
        subject: defaultTemplate.subject,
        content: defaultTemplate.content
      }));
    }
  };

  const handleSave = async () => {
    if (!currentBuilding?.id || !formData.name || !formData.subject || !formData.content) {
      return;
    }

    try {
      setIsSaving(true);
      
      const templateData: CommunicationTemplate = {
        id: editingTemplate?.id || `template-${Date.now()}`,
        buildingId: currentBuilding.id,
        name: formData.name,
        category: formData.category,
        type: formData.types,
        subject: formData.subject,
        content: formData.content,
        variables: extractVariables(formData.content),
        isActive: formData.isActive,
        metadata: {
          description: formData.description,
          version: '1.0',
          useCount: editingTemplate?.metadata.useCount || 0
        },
        createdAt: editingTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Aqui seria a chamada para o serviço
      // await communicationService.saveTemplate(templateData);
      
      setShowEditor(false);
      setEditingTemplate(null);
      onTemplateChange();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      // await communicationService.deleteTemplate(deletingTemplate.id);
      setDeletingTemplate(null);
      onTemplateChange();
    } catch (error) {
      console.error('Erro ao eliminar template:', error);
    }
  };

  const extractVariables = (content: string) => {
    const variableRegex = /{{(\w+)}}/g;
    const variables = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1];
      if (!variables.find(v => v.name === variableName)) {
        variables.push({
          name: variableName,
          label: getVariableLabel(variableName),
          type: 'text' as const,
          required: true
        });
      }
    }
    
    return variables;
  };

  const getVariableLabel = (name: string): string => {
    const labels: Record<string, string> = {
      memberName: 'Nome do Membro',
      apartmentNumber: 'Número do Apartamento',
      buildingName: 'Nome do Edifício',
      buildingAddress: 'Morada do Edifício',
      administratorName: 'Nome do Administrador',
      currentDate: 'Data Atual',
      currentTime: 'Hora Atual'
    };
    return labels[name] || name;
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const beforeText = formData.content.substring(0, startPos);
      const afterText = formData.content.substring(endPos);
      const newContent = beforeText + `{{${variable}}}` + afterText;
      
      setFormData(prev => ({ ...prev, content: newContent }));
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(startPos + variable.length + 4, startPos + variable.length + 4);
      }, 0);
    }
  };

  const getTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'sms': return <MessageSquare className="h-3 w-3" />;
      case 'whatsapp': return <Phone className="h-3 w-3" />;
      case 'push': return <Bell className="h-3 w-3" />;
      default: return <Mail className="h-3 w-3" />;
    }
  };

  const getCategoryLabel = (category: CommunicationCategory): string => {
    const labels = {
      payment_reminder: 'Lembrete de Pagamento',
      meeting_notice: 'Aviso de Reunião',
      maintenance_alert: 'Alerta de Manutenção',
      general_announcement: 'Anúncio Geral',
      emergency: 'Emergência',
      arrears_notice: 'Aviso de Morosidade',
      document_ready: 'Documento Pronto',
      system_notification: 'Notificação do Sistema'
    };
    return labels[category] || category;
  };

  const TemplateCard: React.FC<{ template: CommunicationTemplate }> = ({ template }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold truncate">{template.name}</h3>
              <Badge variant={template.isActive ? 'success' : 'outline'}>
                {template.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(template.category)}
              </Badge>
              <div className="flex space-x-1">
                {template.type.map(type => (
                  <div key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getTypeIcon(type)}
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.metadata.description || template.subject}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Atualizado: {formatDate(template.updatedAt)}</span>
              {template.metadata.useCount && (
                <span>{template.metadata.useCount} usos</span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => openEditor(template)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => openEditor()}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeletingTemplate(template)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  const commonVariables = [
    'memberName', 'apartmentNumber', 'buildingName', 'buildingAddress', 
    'administratorName', 'currentDate', 'currentTime'
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestor de Templates</h2>
          <p className="text-sm text-muted-foreground">
            Gerir modelos de comunicação reutilizáveis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="payment_reminder">Lembrete de Pagamento</SelectItem>
                <SelectItem value="meeting_notice">Aviso de Reunião</SelectItem>
                <SelectItem value="maintenance_alert">Alerta de Manutenção</SelectItem>
                <SelectItem value="general_announcement">Anúncio Geral</SelectItem>
                <SelectItem value="emergency">Emergência</SelectItem>
                <SelectItem value="arrears_notice">Aviso de Morosidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      {filteredTemplates.length === 0 ? (
        <EmptyList
          icon={<Template className="h-full w-full" />}
          title="Nenhum template encontrado"
          description={searchTerm ? 
            `Nenhum template corresponde à pesquisa "${searchTerm}"` : 
            'Crie o primeiro template de comunicação'
          }
          actionLabel="Criar Template"
          onAction={() => openEditor()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Editor de Template */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              </TabsList>

              {/* Informações Básicas */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome do Template *</label>
                    <Input
                      placeholder="Ex: Lembrete de Quota Mensal"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria *</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: CommunicationCategory) => {
                        setFormData(prev => ({ ...prev, category: value }));
                        if (!editingTemplate) loadDefaultTemplate(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general_announcement">Anúncio Geral</SelectItem>
                        <SelectItem value="payment_reminder">Lembrete de Pagamento</SelectItem>
                        <SelectItem value="meeting_notice">Aviso de Reunião</SelectItem>
                        <SelectItem value="maintenance_alert">Alerta de Manutenção</SelectItem>
                        <SelectItem value="emergency">Emergência</SelectItem>
                        <SelectItem value="arrears_notice">Aviso de Morosidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Canais Suportados *</label>
                  <div className="flex space-x-4">
                    {(['email', 'sms', 'whatsapp'] as CommunicationType[]).map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.types.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({ ...prev, types: [...prev.types, type] }));
                            } else {
                              setFormData(prev => ({ ...prev, types: prev.types.filter(t => t !== type) }));
                            }
                          }}
                        />
                        <div className="flex items-center gap-1">
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    placeholder="Descrição do template e quando usar"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                  />
                  <label className="text-sm">Template ativo</label>
                </div>
              </TabsContent>

              {/* Conteúdo */}
              <TabsContent value="content" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Assunto *</label>
                  <Input
                    placeholder="Assunto da mensagem"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Conteúdo da Mensagem *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Variáveis:</span>
                      {commonVariables.map(variable => (
                        <Button
                          key={variable}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable)}
                          className="text-xs h-6 px-2"
                        >
                          {variable}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="template-content"
                    placeholder="Digite o conteúdo do template. Use {{variavel}} para inserir dados dinâmicos."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={12}
                    className="resize-none font-mono text-sm"
                  />
                </div>

                <Card className="bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          💡 Como usar variáveis
                        </p>
                        <p className="text-blue-700 dark:text-blue-200">
                          Use a sintaxe <code>{'{{nomeVariavel}}'}</code> para inserir dados dinâmicos.
                          Exemplo: <code>{'{{memberName}}'}</code> será substituído pelo nome do membro.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pré-visualização */}
              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pré-visualização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                      <div className="border-b pb-2 mb-4">
                        <p className="font-semibold">
                          {formData.subject.replace(/{{(\w+)}}/g, (match, variable) => {
                            const sampleData: Record<string, string> = {
                              memberName: 'João Silva',
                              apartmentNumber: '3º Dto',
                              buildingName: currentBuilding?.name || 'Nome do Edifício',
                              administratorName: 'Administrador'
                            };
                            return sampleData[variable] || `[${variable}]`;
                          })}
                        </p>
                      </div>
                      <div className="whitespace-pre-wrap">
                        {formData.content.replace(/{{(\w+)}}/g, (match, variable) => {
                          const sampleData: Record<string, string> = {
                            memberName: 'João Silva',
                            apartmentNumber: '3º Dto',
                            buildingName: currentBuilding?.name || 'Nome do Edifício',
                            buildingAddress: currentBuilding?.address || 'Morada do Edifício',
                            administratorName: currentBuilding?.administratorName || 'Administrador',
                            currentDate: new Date().toLocaleDateString('pt-PT'),
                            currentTime: new Date().toLocaleTimeString('pt-PT')
                          };
                          return sampleData[variable] || `[${variable}]`;
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              
              <Button 
                onClick={handleSave}
                disabled={isSaving || !formData.name || !formData.subject || !formData.content}
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" variant="white" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingTemplate ? 'Atualizar' : 'Criar'} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="border-b pb-2 mb-4">
                  <p className="font-semibold">{previewTemplate.subject}</p>
                </div>
                <div className="whitespace-pre-wrap">
                  {previewTemplate.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
        itemName={`o template "${deletingTemplate?.name}"`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TemplateManager;