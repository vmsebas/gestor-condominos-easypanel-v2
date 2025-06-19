import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import { DocumentTemplate, DocumentType, TemplateVariable, TEMPLATE_DEFINITIONS, COMMON_VARIABLES } from '@/types/documentTypes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  Code, 
  FileText,
  Settings,
  HelpCircle,
  Copy
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';

interface DocumentTemplateEditorProps {
  template?: DocumentTemplate | null;
  onSave: (template: DocumentTemplate) => void;
  onCancel: () => void;
  className?: string;
}

const DocumentTemplateEditor: React.FC<DocumentTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  className
}) => {
  const { currentBuilding } = useBuilding();
  const isEditing = !!template;

  const [formData, setFormData] = useState({
    name: '',
    type: 'arrears_letter' as DocumentType,
    content: '',
    description: '',
    isActive: true
  });

  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        type: template.type,
        content: template.content,
        description: template.metadata.description || '',
        isActive: template.isActive
      });
      setVariables(template.variables);
    } else {
      // Usar template padrão para novo documento
      loadDefaultTemplate('arrears_letter');
    }
  }, [template]);

  const loadDefaultTemplate = (type: DocumentType) => {
    const definition = TEMPLATE_DEFINITIONS[type];
    const defaultVariables = [
      ...COMMON_VARIABLES,
      ...definition.requiredVariables.map(name => ({
        name,
        label: getVariableLabel(name),
        type: 'text' as const,
        required: true,
        description: `Campo obrigatório: ${getVariableLabel(name)}`
      })),
      ...definition.optionalVariables.map(name => ({
        name,
        label: getVariableLabel(name),
        type: 'text' as const,
        required: false,
        description: `Campo opcional: ${getVariableLabel(name)}`
      }))
    ];

    setVariables(defaultVariables);
    setFormData(prev => ({
      ...prev,
      type,
      content: getDefaultContent(type),
      description: definition.description
    }));
  };

  const getVariableLabel = (name: string): string => {
    const labels: Record<string, string> = {
      memberName: 'Nome do Membro',
      apartmentNumber: 'Número do Apartamento',
      arrearAmount: 'Valor em Dívida',
      dueDate: 'Data de Vencimento',
      paymentInstructions: 'Instruções de Pagamento',
      legalConsequences: 'Consequências Legais',
      contactInfo: 'Informações de Contacto',
      currentYear: 'Ano Atual',
      quotaStatus: 'Estado das Quotas',
      monthlyQuota: 'Quota Mensal',
      issueDate: 'Data de Emissão',
      validUntil: 'Válido Até',
      observations: 'Observações',
      amount: 'Valor',
      paymentDate: 'Data de Pagamento',
      description: 'Descrição',
      paymentMethod: 'Método de Pagamento',
      referenceNumber: 'Número de Referência',
      meetingDate: 'Data da Reunião',
      meetingTime: 'Hora da Reunião',
      location: 'Local',
      agenda: 'Agenda',
      meetingType: 'Tipo de Reunião',
      attendees: 'Participantes',
      decisions: 'Decisões',
      nextActions: 'Próximas Ações',
      quorumInfo: 'Informações de Quórum',
      legalNotes: 'Notas Legais',
      period: 'Período',
      totalIncome: 'Total de Receitas',
      totalExpenses: 'Total de Despesas',
      balance: 'Saldo',
      categoryBreakdown: 'Análise por Categoria',
      trends: 'Tendências',
      recommendations: 'Recomendações'
    };
    return labels[name] || name;
  };

  const getDefaultContent = (type: DocumentType): string => {
    const templates = {
      arrears_letter: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .content { line-height: 1.6; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        .highlight { background-color: #fff2cc; padding: 10px; border-left: 4px solid #f1c40f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{buildingName}}</h1>
        <p>{{buildingAddress}}</p>
    </div>
    
    <div class="content">
        <p><strong>Data:</strong> {{currentDate}}</p>
        <p><strong>Para:</strong> {{memberName}}<br>
        <strong>Apartamento:</strong> {{apartmentNumber}}</p>
        
        <h2>Assunto: Quotas em Atraso</h2>
        
        <p>Caro(a) {{memberName}},</p>
        
        <p>Informamos que, de acordo com os nossos registos, existem quotas em atraso referentes ao seu apartamento {{apartmentNumber}}.</p>
        
        <div class="highlight">
            <p><strong>Valor total em dívida:</strong> {{arrearAmount}}</p>
            <p><strong>Vencimento mais antigo:</strong> {{dueDate}}</p>
        </div>
        
        <p>Solicitamos que proceda ao pagamento no prazo de 15 dias úteis, através dos seguintes dados:</p>
        <p>{{paymentInstructions}}</p>
        
        <p><strong>Importante:</strong> {{legalConsequences}}</p>
        
        <p>Para esclarecimentos, contacte: {{contactInfo}}</p>
        
        <p>Atenciosamente,<br>{{administratorName}}</p>
    </div>
    
    <div class="footer">
        <p>Este documento foi gerado automaticamente em {{currentDate}}</p>
    </div>
</body>
</html>`,

      quota_certificate: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .certificate { border: 2px solid #2c3e50; padding: 30px; text-align: center; }
        .header { margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .stamp { border: 1px solid #ccc; padding: 20px; margin: 20px auto; width: 200px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <h1>CERTIFICADO DE QUOTAS</h1>
            <h2>{{buildingName}}</h2>
        </div>
        
        <div class="content">
            <p>Certifica-se que <strong>{{memberName}}</strong>, proprietário/inquilino do apartamento <strong>{{apartmentNumber}}</strong>, se encontra com as quotas de condomínio <strong>{{quotaStatus}}</strong> relativamente ao ano de <strong>{{currentYear}}</strong>.</p>
            
            <p><strong>Quota mensal:</strong> {{monthlyQuota}}</p>
            <p><strong>Observações:</strong> {{observations}}</p>
        </div>
        
        <div class="stamp">
            <p><strong>Válido até:</strong> {{validUntil}}</p>
            <p><strong>Emitido em:</strong> {{issueDate}}</p>
        </div>
        
        <p>{{administratorName}}<br>Administrador</p>
    </div>
</body>
</html>`,

      assembly_notice: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .important { background-color: #fff2cc; padding: 15px; border: 1px solid #f1c40f; margin: 20px 0; }
        .agenda { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONVOCATÓRIA</h1>
        <h2>{{meetingType}}</h2>
        <h3>{{buildingName}}</h3>
    </div>
    
    <p>Caro(a) {{memberName}},</p>
    
    <p>Tem a honra de ser convocado(a) para a {{meetingType}} que se realizará:</p>
    
    <div class="important">
        <p><strong>Data:</strong> {{meetingDate}}</p>
        <p><strong>Hora:</strong> {{meetingTime}}</p>
        <p><strong>Local:</strong> {{location}}</p>
    </div>
    
    <div class="agenda">
        <h3>ORDEM DO DIA</h3>
        {{agenda}}
    </div>
    
    <div class="important">
        <h4>QUÓRUM</h4>
        <p>{{quorumInfo}}</p>
    </div>
    
    <p>{{legalNotes}}</p>
    
    <p>{{buildingAddress}}, {{currentDate}}</p>
    <p>{{administratorName}}<br>Administrador</p>
</body>
</html>`
    };

    return templates[type] || templates.arrears_letter;
  };

  const addVariable = () => {
    const newVariable: TemplateVariable = {
      name: '',
      label: '',
      type: 'text',
      required: false,
      description: ''
    };
    setVariables([...variables, newVariable]);
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const insertVariable = (variableName: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const beforeText = formData.content.substring(0, startPos);
      const afterText = formData.content.substring(endPos);
      const newContent = beforeText + `{{${variableName}}}` + afterText;
      
      setFormData(prev => ({ ...prev, content: newContent }));
      
      // Manter foco e posição do cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(startPos + variableName.length + 4, startPos + variableName.length + 4);
      }, 0);
    }
  };

  const handleSave = async () => {
    if (!currentBuilding) return;

    try {
      setIsSaving(true);
      
      const templateData: DocumentTemplate = {
        id: template?.id || `template-${Date.now()}`,
        buildingId: currentBuilding.id,
        name: formData.name,
        type: formData.type,
        content: formData.content,
        variables,
        isActive: formData.isActive,
        metadata: {
          description: formData.description,
          version: '1.0',
          legalCompliance: true
        },
        createdAt: template?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSave(templateData);
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const VariableEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Variáveis do Template</h4>
        <Button onClick={addVariable} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Variável
        </Button>
      </div>
      
      <div className="space-y-3">
        {variables.map((variable, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  placeholder="ex: memberName"
                  value={variable.name}
                  onChange={(e) => updateVariable(index, 'name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Etiqueta</label>
                <Input
                  placeholder="ex: Nome do Membro"
                  value={variable.label}
                  onChange={(e) => updateVariable(index, 'label', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={variable.type}
                  onValueChange={(value) => updateVariable(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="currency">Moeda</SelectItem>
                    <SelectItem value="boolean">Sim/Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={variable.required}
                  onCheckedChange={(checked) => updateVariable(index, 'required', checked)}
                />
                <label className="text-sm">Obrigatório</label>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(variable.name)}
                  disabled={!variable.name}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVariable(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {variable.description && (
              <div className="mt-2">
                <Input
                  placeholder="Descrição da variável"
                  value={variable.description}
                  onChange={(e) => updateVariable(index, 'description', e.target.value)}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="variables">Variáveis</TabsTrigger>
        </TabsList>

        {/* Informações Básicas */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Template *</label>
              <Input
                placeholder="Ex: Carta de Morosidade Padrão"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Documento *</label>
              <Select
                value={formData.type}
                onValueChange={(value: DocumentType) => {
                  setFormData(prev => ({ ...prev, type: value }));
                  if (!isEditing) loadDefaultTemplate(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrears_letter">Carta de Morosidade</SelectItem>
                  <SelectItem value="quota_certificate">Certificado de Quotas</SelectItem>
                  <SelectItem value="receipt">Recibo</SelectItem>
                  <SelectItem value="minutes_pdf">Ata em PDF</SelectItem>
                  <SelectItem value="assembly_notice">Convocatória</SelectItem>
                  <SelectItem value="financial_report">Relatório Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              placeholder="Descrição do template e quando usar"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
            />
            <label className="text-sm">Template ativo</label>
          </div>

          {/* Informações do Tipo */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">📋 Sobre este tipo de documento</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {TEMPLATE_DEFINITIONS[formData.type]?.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Variáveis obrigatórias:</p>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_DEFINITIONS[formData.type]?.requiredVariables.map(variable => (
                      <Badge key={variable} variant="destructive" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-1">Variáveis opcionais:</p>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_DEFINITIONS[formData.type]?.optionalVariables.map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo */}
        <TabsContent value="content" className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Conteúdo HTML do Template</label>
            <Textarea
              id="content-textarea"
              placeholder="Digite o conteúdo HTML do template..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={20}
              className="font-mono text-sm"
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
                    Use a sintaxe <code>{'{{nomeVariavel}}'}</code> para inserir variáveis no template.
                    Exemplo: <code>{'{{memberName}}'}</code> será substituído pelo nome do membro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variáveis */}
        <TabsContent value="variables">
          <VariableEditor />
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar' : 'Preview'}
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={isSaving || !formData.name || !formData.content}
          >
            {isSaving ? (
              <LoadingSpinner size="sm" variant="white" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Atualizar' : 'Criar'} Template
          </Button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview do Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg p-4 bg-white text-black"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentTemplateEditor;