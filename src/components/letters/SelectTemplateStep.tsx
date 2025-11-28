import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Loader2, ChevronRight } from 'lucide-react';
import { getLetterTemplates } from '@/lib/api';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  content: string;
  variables: string[] | null;
  category: string | null;
}

interface SelectTemplateStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SelectTemplateStep: React.FC<SelectTemplateStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(data.template_id || null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const result = await getLetterTemplates({ building_id: data.buildingId });
      // API returns { success: true, data: [...] } where data is the array
      const templatesData = Array.isArray(result.data) ? result.data : (result.data?.templates || result.templates || []);
      console.log('Templates loaded:', templatesData.length, templatesData);
      setTemplates(templatesData);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates de cartas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template.id);
    console.log('Template selected:', template.name, 'Subject:', template.subject);
    onUpdate({
      template_id: template.id,
      template_name: template.name,
      template_type: template.type,
      template_content: template.content,
      template_variables: template.variables || [],
      subject: template.subject || '',           // Keep for backwards compatibility
      template_subject: template.subject || '',  // Explicit template subject
      category: template.category
    });
  };

  const handleContinue = () => {
    if (!selectedTemplate) {
      toast.error('Por favor seleccione um template');
      return;
    }
    onNext();
  };

  // Categorizar templates
  const categorizeTemplates = () => {
    const categories: Record<string, Template[]> = {
      'Avisos e Notificações': [],
      'Cobrança': [],
      'Assembleias': [],
      'Documentos': [],
      'Outros': []
    };

    templates.forEach(template => {
      const type = template.type;
      if (type.includes('work') || type.includes('rule')) {
        categories['Avisos e Notificações'].push(template);
      } else if (type.includes('payment') || type.includes('late')) {
        categories['Cobrança'].push(template);
      } else if (type.includes('assembly') || type.includes('urgent')) {
        categories['Assembleias'].push(template);
      } else if (type.includes('certificate') || type.includes('document')) {
        categories['Documentos'].push(template);
      } else {
        categories['Outros'].push(template);
      }
    });

    // Remove categorias vazias
    return Object.entries(categories).filter(([_, temps]) => temps.length > 0);
  };

  const getTemplateIcon = (type: string) => {
    return <FileText className="h-5 w-5" />;
  };

  const getTemplateColor = (type: string) => {
    if (type.includes('work') || type.includes('rule')) return 'bg-orange-50 border-orange-200 dark:bg-orange-950/20';
    if (type.includes('payment') || type.includes('late')) return 'bg-red-50 border-red-200 dark:bg-red-950/20';
    if (type.includes('assembly') || type.includes('urgent')) return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20';
    if (type.includes('certificate')) return 'bg-green-50 border-green-200 dark:bg-green-950/20';
    return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">A carregar templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum template disponível</h3>
        <p className="text-muted-foreground mb-6">
          Não foram encontrados templates de cartas para este edifício.
        </p>
        <div className="flex justify-center space-x-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  const categorizedTemplates = categorizeTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-4">
          Seleccione um template profissional ({templates.length} disponíveis)
        </h4>

        <div className="space-y-6">
          {categorizedTemplates.map(([category, categoryTemplates]) => (
            <div key={category}>
              <h5 className="text-sm font-medium text-muted-foreground mb-3">{category}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryTemplates.map((template) => {
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'ring-2 ring-primary border-primary'
                          : getTemplateColor(template.type)
                      }`}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'
                            }`}>
                              {getTemplateIcon(template.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base mb-1 truncate">
                                {template.name}
                              </CardTitle>
                              {template.subject && (
                                <CardDescription className="text-xs line-clamp-2">
                                  {template.subject}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {template.variables && template.variables.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {template.variables.length} variáveis
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {template.type.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrevious} disabled>
          Anterior
        </Button>
        <Button onClick={handleContinue} disabled={!selectedTemplate}>
          Continuar
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SelectTemplateStep;
