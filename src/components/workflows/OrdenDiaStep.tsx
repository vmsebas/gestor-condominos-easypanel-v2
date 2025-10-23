import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, FileText, Scale, Calculator, Users, Edit2, Library, CheckCircle2, AlertCircle, Hammer, FileCheck } from 'lucide-react';

interface AgendaItem {
  id: string;
  item_number?: number;
  title: string;
  description: string;
  type: 'informativo' | 'votacion' | 'economico' | 'administrativo';
  requiredMajority?: 'simple' | 'cualificada' | 'unanimidad';
  documents?: string[];
}

interface TemplateItem extends Partial<AgendaItem> {
  category: string;
  isRequired?: boolean;
}

interface OrdenDiaStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const OrdenDiaStep: React.FC<OrdenDiaStepProps> = ({ data, onUpdate, onPrevious, onNext }) => {
  const [newItem, setNewItem] = useState<Partial<AgendaItem>>({ type: 'informativo' });
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  const agendaItems: AgendaItem[] = data.agenda_items || [];

  const typeOptions = [
    { value: 'informativo', label: 'Informativo', icon: FileText, color: 'text-blue-600' },
    { value: 'votacion', label: 'Votação', icon: Scale, color: 'text-purple-600' },
    { value: 'economico', label: 'Económico', icon: Calculator, color: 'text-green-600' },
    { value: 'administrativo', label: 'Administrativo', icon: Users, color: 'text-orange-600' }
  ];

  const majorityOptions = [
    { value: 'simple', label: 'Maioria Simples', description: '>50% dos presentes' },
    { value: 'cualificada', label: 'Maioria Qualificada', description: '>2/3 do total de coeficientes' },
    { value: 'unanimidad', label: 'Unanimidade', description: '100% de acordo' }
  ];

  // 📚 BIBLIOTECA EXTENSA DE PONTOS TÍPICOS (baseado na lei portuguesa)
  const templateLibrary: Record<string, TemplateItem[]> = {
    'obrigatorios': [
      {
        title: 'Prestação de contas do exercício anterior',
        description: 'Apresentação e aprovação do estado de contas e despesas do ano anterior (obrigatório Art. 1430.º CC)',
        type: 'economico',
        requiredMajority: 'simple',
        category: 'Obrigatórios',
        isRequired: true
      },
      {
        title: 'Aprovação do orçamento para o exercício corrente',
        description: 'Votação do orçamento de receitas e despesas para o ano em curso (obrigatório Art. 1430.º CC)',
        type: 'economico',
        requiredMajority: 'simple',
        category: 'Obrigatórios',
        isRequired: true
      },
      {
        title: 'Leitura e aprovação da acta anterior',
        description: 'Revisão e aprovação da acta da assembleia anterior',
        type: 'votacion',
        requiredMajority: 'simple',
        category: 'Obrigatórios'
      }
    ],
    'administrativos': [
      {
        title: 'Designação de cargos',
        description: 'Eleição ou ratificação de Presidente, Secretário e Administrador',
        type: 'administrativo',
        requiredMajority: 'simple',
        category: 'Administrativos'
      },
      {
        title: 'Eleição da mesa da assembleia',
        description: 'Eleição de Presidente e Secretário da mesa para dirigir a assembleia',
        type: 'administrativo',
        requiredMajority: 'simple',
        category: 'Administrativos'
      },
      {
        title: 'Nomeação ou destituição do administrador',
        description: 'Decisão sobre a contratação, renovação ou destituição do administrador do condomínio',
        type: 'administrativo',
        requiredMajority: 'simple',
        category: 'Administrativos'
      },
      {
        title: 'Alteração do regulamento interno',
        description: 'Modificações às regras de funcionamento e convivência do condomínio',
        type: 'administrativo',
        requiredMajority: 'unanimidad',
        category: 'Administrativos'
      }
    ],
    'economicos': [
      {
        title: 'Alteração de quotas de condomínio',
        description: 'Ajuste dos valores das quotas mensais dos condóminos',
        type: 'economico',
        requiredMajority: 'simple',
        category: 'Económicos'
      },
      {
        title: 'Criação de fundo de reserva',
        description: 'Estabelecimento de um fundo para despesas futuras ou emergências',
        type: 'economico',
        requiredMajority: 'simple',
        category: 'Económicos'
      },
      {
        title: 'Aprovação de despesas extraordinárias',
        description: 'Votação de gastos não previstos no orçamento anual',
        type: 'economico',
        requiredMajority: 'cualificada',
        category: 'Económicos'
      },
      {
        title: 'Renovação de seguros do condomínio',
        description: 'Aprovação da renovação e condições das apólices de seguro (incêndio, água, responsabilidade civil)',
        type: 'economico',
        requiredMajority: 'simple',
        category: 'Económicos'
      },
      {
        title: 'Análise de devedores e medidas de cobrança',
        description: 'Avaliação de quotas em atraso e decisão sobre ações legais',
        type: 'economico',
        requiredMajority: 'simple',
        category: 'Económicos'
      },
      {
        title: 'Contratação de auditoria externa',
        description: 'Decisão sobre a contratação de revisão oficial de contas',
        type: 'economico',
        requiredMajority: 'simple',
        category: 'Económicos'
      }
    ],
    'obras': [
      {
        title: 'Obras de conservação ordinária',
        description: 'Reparações e manutenção necessária das partes comuns (Art. 1424.º CC)',
        type: 'votacion',
        requiredMajority: 'simple',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Obras de melhoramento extraordinário',
        description: 'Benfeitorias que não sejam estritamente necessárias mas aumentem o valor do prédio',
        type: 'votacion',
        requiredMajority: 'cualificada',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Reabilitação da fachada do edifício',
        description: 'Restauração e pintura exterior do prédio (mínimo 3 orçamentos obrigatórios)',
        type: 'votacion',
        requiredMajority: 'cualificada',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Impermeabilização do terraço/cobertura',
        description: 'Trabalhos de impermeabilização para evitar infiltrações',
        type: 'votacion',
        requiredMajority: 'simple',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Renovação ou modernização de elevadores',
        description: 'Substituição ou modernização dos elevadores do edifício',
        type: 'votacion',
        requiredMajority: 'cualificada',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Pintura das partes comuns',
        description: 'Pintura de escadas, halls, garagem e outras áreas comuns',
        type: 'votacion',
        requiredMajority: 'simple',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Reparação do sistema de esgotos',
        description: 'Intervenção no sistema de canalização e esgotos comuns',
        type: 'votacion',
        requiredMajority: 'simple',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Instalação de sistema de segurança',
        description: 'Implementação de videovigilância, interfones ou controlo de acessos',
        type: 'votacion',
        requiredMajority: 'cualificada',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Melhorias de eficiência energética',
        description: 'Isolamento térmico, painéis solares, iluminação LED nas áreas comuns',
        type: 'votacion',
        requiredMajority: 'cualificada',
        category: 'Obras e Manutenção'
      },
      {
        title: 'Instalação de carregadores elétricos',
        description: 'Colocação de pontos de carregamento para veículos elétricos na garagem',
        type: 'votacion',
        requiredMajority: 'cualificada',
        category: 'Obras e Manutenção'
      }
    ],
    'outros': [
      {
        title: 'Assuntos de interesse geral dos condóminos',
        description: 'Ponto aberto para que os condóminos possam apresentar questões diversas (último ponto típico)',
        type: 'informativo',
        category: 'Outros'
      },
      {
        title: 'Problemas de convivência e utilização de espaços comuns',
        description: 'Discussão de questões relacionadas com o uso de áreas comuns e relações entre vizinhos',
        type: 'informativo',
        category: 'Outros'
      },
      {
        title: 'Ratificação de decisões urgentes',
        description: 'Aprovação formal de decisões tomadas pelo administrador em situações de urgência',
        type: 'votacion',
        requiredMajority: 'simple',
        category: 'Outros'
      },
      {
        title: 'Autorização para obras em frações privativas',
        description: 'Análise de pedidos de condóminos para obras que afetem partes comuns',
        type: 'votacion',
        requiredMajority: 'simple',
        category: 'Outros'
      }
    ]
  };

  const addItem = () => {
    if (!newItem.title?.trim()) {
      setErrors({ title: 'O título é obrigatório' });
      return;
    }

    const item: AgendaItem = {
      id: Date.now().toString(),
      title: newItem.title,
      description: newItem.description || '',
      type: newItem.type as AgendaItem['type'],
      requiredMajority: newItem.type === 'votacion' ? newItem.requiredMajority : undefined,
      item_number: agendaItems.length + 1
    };

    const updatedItems = [...agendaItems, item];
    onUpdate({ agenda_items: updatedItems });
    setNewItem({ type: 'informativo' });
    setErrors({});
  };

  const updateItem = () => {
    if (!editingItem || !editingItem.title?.trim()) {
      setErrors({ title: 'O título é obrigatório' });
      return;
    }

    const updatedItems = agendaItems.map(item =>
      item.id === editingItem.id ? editingItem : item
    );
    onUpdate({ agenda_items: updatedItems });
    setEditingItem(null);
    setErrors({});
  };

  const removeItem = (id: string) => {
    const updatedItems = agendaItems.filter(item => item.id !== id);
    onUpdate({ agenda_items: updatedItems });
  };

  const addTemplateItem = (template: TemplateItem) => {
    const item: AgendaItem = {
      id: Date.now().toString() + Math.random(),
      title: template.title!,
      description: template.description || '',
      type: template.type as AgendaItem['type'],
      requiredMajority: template.requiredMajority,
      item_number: agendaItems.length + 1
    };

    const updatedItems = [...agendaItems, item];
    onUpdate({ agenda_items: updatedItems });
  };

  const addRequiredItems = () => {
    const required = templateLibrary.obrigatorios.filter(t => t.isRequired);
    const itemsWithIds = required.map((template, index) => ({
      id: Date.now().toString() + Math.random(),
      title: template.title!,
      description: template.description || '',
      type: template.type as AgendaItem['type'],
      requiredMajority: template.requiredMajority,
      item_number: agendaItems.length + index + 1
    } as AgendaItem));

    onUpdate({ agenda_items: [...agendaItems, ...itemsWithIds] });
  };

  const validateAndNext = () => {
    if (agendaItems.length === 0) {
      setErrors({ general: 'Deve adicionar pelo menos um ponto à ordem do dia' });
      return;
    }
    setErrors({});
    onNext();
  };

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option ? <option.icon className={`h-4 w-4 ${option.color}`} /> : null;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Obrigatórios': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'Económicos': return <Calculator className="h-4 w-4 text-green-600" />;
      case 'Obras e Manutenção': return <Hammer className="h-4 w-4 text-orange-600" />;
      case 'Administrativos': return <FileCheck className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Ordem do Dia</h2>
        <p className="text-muted-foreground">
          Define os pontos que serão tratados na assembleia de condóminos
        </p>
      </div>

      {/* Sugestão de pontos obrigatórios */}
      {data.meetingType === 'ordinaria' && agendaItems.length === 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Pontos Obrigatórios para Assembleia Ordinária
                </h3>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  Segundo o Art. 1430.º do Código Civil, a assembleia ordinária deve incluir:
                  prestação de contas do exercício anterior e aprovação do orçamento corrente
                </p>
              </div>
              <Button onClick={addRequiredItems} className="bg-red-600 hover:bg-red-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Adicionar Pontos Obrigatórios
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biblioteca de Templates */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-blue-300">
                <Library className="h-4 w-4 mr-2" />
                Explorar Biblioteca de Pontos Típicos ({Object.values(templateLibrary).flat().length} modelos)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Library className="h-5 w-5" />
                  <span>Biblioteca de Pontos Típicos de Assembleias</span>
                </DialogTitle>
                <DialogDescription>
                  Pontos comuns baseados na Lei de Propriedade Horizontal (LPH) e práticas habituais em Portugal
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="obrigatorios" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="obrigatorios">Obrigatórios</TabsTrigger>
                  <TabsTrigger value="administrativos">Administrativos</TabsTrigger>
                  <TabsTrigger value="economicos">Económicos</TabsTrigger>
                  <TabsTrigger value="obras">Obras</TabsTrigger>
                  <TabsTrigger value="outros">Outros</TabsTrigger>
                </TabsList>

                {Object.entries(templateLibrary).map(([key, templates]) => (
                  <TabsContent key={key} value={key} className="space-y-3">
                    {templates.map((template, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getCategoryIcon(template.category!)}
                                <CardTitle className="text-base">{template.title}</CardTitle>
                                {template.isRequired && (
                                  <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm mt-1">
                                {template.description}
                              </CardDescription>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                addTemplateItem(template);
                                setShowTemplates(false);
                              }}
                              className="ml-4"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <span className="px-2 py-1 rounded-full bg-muted">
                              {typeOptions.find(t => t.value === template.type)?.label}
                            </span>
                            {template.requiredMajority && (
                              <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                {majorityOptions.find(m => m.value === template.requiredMajority)?.label}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Lista de pontos atuais */}
      {agendaItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pontos da Ordem do Dia ({agendaItems.length})</CardTitle>
            <CardDescription>
              Os pontos serão apresentados nesta ordem durante a assembleia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {agendaItems.map((item, index) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(item.type)}
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {typeOptions.find(t => t.value === item.type)?.label}
                          </span>
                          {item.requiredMajority && (
                            <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {majorityOptions.find(m => m.value === item.requiredMajority)?.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Formulário para agregar novo ponto OU editar existente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {editingItem ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            <span>{editingItem ? 'Editar Ponto' : 'Adicionar Novo Ponto'}</span>
          </CardTitle>
          <CardDescription>
            {editingItem ? 'Modifique os dados do ponto selecionado' : 'Crie um ponto personalizado para a ordem do dia'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemTitle">Título do ponto *</Label>
              <Input
                id="itemTitle"
                placeholder="Ex: Aprovação de obras de melhoria"
                value={editingItem ? editingItem.title : newItem.title || ''}
                onChange={(e) => editingItem
                  ? setEditingItem({ ...editingItem, title: e.target.value })
                  : setNewItem({ ...newItem, title: e.target.value })
                }
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="itemType">Tipo de ponto</Label>
              <Select
                value={editingItem ? editingItem.type : newItem.type}
                onValueChange={(value) => editingItem
                  ? setEditingItem({ ...editingItem, type: value as AgendaItem['type'] })
                  : setNewItem({ ...newItem, type: value as AgendaItem['type'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <option.icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="itemDescription">Descrição</Label>
            <Textarea
              id="itemDescription"
              placeholder="Descrição detalhada do ponto a tratar..."
              value={editingItem ? editingItem.description : newItem.description || ''}
              onChange={(e) => editingItem
                ? setEditingItem({ ...editingItem, description: e.target.value })
                : setNewItem({ ...newItem, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {(editingItem?.type === 'votacion' || newItem.type === 'votacion') && (
            <div>
              <Label htmlFor="majorityType">Tipo de maioria requerida</Label>
              <Select
                value={editingItem ? editingItem.requiredMajority : newItem.requiredMajority}
                onValueChange={(value) => editingItem
                  ? setEditingItem({ ...editingItem, requiredMajority: value as AgendaItem['requiredMajority'] })
                  : setNewItem({ ...newItem, requiredMajority: value as AgendaItem['requiredMajority'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar maioria" />
                </SelectTrigger>
                <SelectContent>
                  {majorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {editingItem ? (
            <div className="flex space-x-3">
              <Button onClick={updateItem} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Guardar Alterações
              </Button>
              <Button onClick={() => setEditingItem(null)} variant="outline">
                Cancelar
              </Button>
            </div>
          ) : (
            <Button onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ponto
            </Button>
          )}
        </CardContent>
      </Card>

      {errors.general && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button onClick={validateAndNext} variant="workflow" size="lg">
          Continuar ({agendaItems.length} pontos)
        </Button>
      </div>
    </div>
  );
};

export default OrdenDiaStep;
