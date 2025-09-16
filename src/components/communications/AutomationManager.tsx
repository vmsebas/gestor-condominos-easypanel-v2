import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import communicationService from '@/services/api/communications';
import { AutomationRule, AutomationCondition, AutomationAction, CommunicationType, CommunicationCategory } from '@/types/communicationTypes';
import { formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Zap,
  Plus,
  X,
  Save,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Mail,
  Users,
  AlertTriangle,
  CheckCircle,
  Settings,
  HelpCircle,
  Target,
  TrendingUp
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';

interface AutomationManagerProps {
  onClose?: () => void;
  className?: string;
}

const AutomationManager: React.FC<AutomationManagerProps> = ({ onClose, className }) => {
  const { currentBuilding } = useBuilding();
  
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<AutomationRule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    triggerType: 'schedule' as 'schedule' | 'event' | 'condition',
    conditions: [] as AutomationCondition[],
    actions: [] as AutomationAction[]
  });

  useEffect(() => {
    if (currentBuilding?.id) {
      loadRules();
    }
  }, [currentBuilding?.id]);

  const loadRules = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const data = await communicationsAPI.getAutomationRules(currentBuilding.id);
      setRules(data);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (rule?: AutomationRule) => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        isActive: rule.isActive,
        triggerType: rule.trigger.type,
        conditions: rule.trigger.conditions,
        actions: rule.actions
      });
      setEditingRule(rule);
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
        triggerType: 'schedule',
        conditions: [],
        actions: []
      });
      setEditingRule(null);
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!currentBuilding?.id || !formData.name) return;

    try {
      setIsSaving(true);
      
      const ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> = {
        buildingId: currentBuilding.id,
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        trigger: {
          type: formData.triggerType,
          conditions: formData.conditions
        },
        actions: formData.actions,
        executionCount: editingRule?.executionCount || 0,
        metadata: {
          createdBy: 'Sistema',
          category: 'communication'
        }
      };

      await communicationsAPI.createAutomationRule(ruleData);
      setShowEditor(false);
      loadRules();
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await communicationsAPI.toggleAutomationRule(ruleId);
      loadRules();
    } catch (error) {
      console.error('Erro ao alterar estado da regra:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;

    try {
      await communicationsAPI.deleteAutomationRule(deletingRule.id);
      setDeletingRule(null);
      loadRules();
    } catch (error) {
      console.error('Erro ao eliminar regra:', error);
    }
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          field: 'member.arrears',
          operator: 'greater_than',
          value: '',
          logicalOperator: prev.conditions.length > 0 ? 'and' : undefined
        }
      ]
    }));
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          type: 'send_communication',
          parameters: {
            type: 'email',
            category: 'payment_reminder',
            templateId: '',
            priority: 'normal'
          }
        }
      ]
    }));
  };

  const updateAction = (index: number, updates: Partial<AutomationAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'schedule': return <Clock className="h-4 w-4" />;
      case 'event': return <Target className="h-4 w-4" />;
      case 'condition': return <AlertTriangle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getOperatorLabel = (operator: string): string => {
    const labels = {
      equals: 'igual a',
      not_equals: 'diferente de',
      greater_than: 'maior que',
      less_than: 'menor que',
      contains: 'contém',
      is_empty: 'está vazio',
      is_not_empty: 'não está vazio'
    };
    return labels[operator as keyof typeof labels] || operator;
  };

  const RuleCard: React.FC<{ rule: AutomationRule }> = ({ rule }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-3">
              {getTriggerIcon(rule.trigger.type)}
              <h3 className="font-semibold">{rule.name}</h3>
              <Badge variant={rule.isActive ? 'success' : 'outline'}>
                {rule.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            
            {rule.description && (
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {rule.executionCount} execuções
              </span>
              
              {rule.lastRun && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Última: {formatDate(rule.lastRun)}
                </span>
              )}
              
              {rule.nextRun && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Próxima: {formatDate(rule.nextRun)}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs">
                <span className="font-medium">Condições:</span>
                <div className="mt-1">
                  {rule.trigger.conditions.map((condition, index) => (
                    <div key={index} className="text-muted-foreground">
                      {index > 0 && condition.logicalOperator && (
                        <span className="font-medium"> {condition.logicalOperator.toUpperCase()} </span>
                      )}
                      <span>{condition.field} {getOperatorLabel(condition.operator)} {condition.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-xs">
                <span className="font-medium">Ações:</span>
                <div className="mt-1 text-muted-foreground">
                  {rule.actions.map((action, index) => (
                    <div key={index}>
                      {action.type === 'send_communication' && 'Enviar comunicação'}
                      {action.type === 'create_document' && 'Criar documento'}
                      {action.type === 'update_member' && 'Atualizar membro'}
                      {action.type === 'create_arrear' && 'Criar morosidade'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={rule.isActive}
              onCheckedChange={() => handleToggleRule(rule.id)}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditor(rule)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Agora
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeletingRule(rule)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir automatizações.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Gestor de Automatização
          </h2>
          <p className="text-sm text-muted-foreground">
            Criar e gerir regras automáticas de comunicação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{rules.length}</p>
            <p className="text-sm text-muted-foreground">Total de Regras</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {rules.filter(r => r.isActive).length}
            </p>
            <p className="text-sm text-muted-foreground">Ativas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {rules.filter(r => !r.isActive).length}
            </p>
            <p className="text-sm text-muted-foreground">Inativas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {rules.reduce((sum, rule) => sum + rule.executionCount, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Execuções</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Regras */}
      {isLoading ? (
        <LoadingSpinner />
      ) : rules.length === 0 ? (
        <EmptyList
          icon={<Zap className="h-full w-full" />}
          title="Nenhuma regra criada"
          description="Crie a primeira regra de automatização para agilizar comunicações"
          actionLabel="Criar Regra"
          onAction={() => openEditor()}
        />
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}

      {/* Editor de Regra */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra' : 'Nova Regra de Automatização'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="conditions">Condições</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>

              {/* Informações Básicas */}
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome da Regra *</label>
                  <Input
                    placeholder="Ex: Lembrete Automático de Pagamento"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    placeholder="Descrição da regra e quando será executada"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Trigger</label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, triggerType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Agendamento (tempo)
                        </div>
                      </SelectItem>
                      <SelectItem value="event">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Evento (ação)
                        </div>
                      </SelectItem>
                      <SelectItem value="condition">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Condição (dados)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <label className="text-sm">Regra ativa</label>
                </div>
              </TabsContent>

              {/* Condições */}
              <TabsContent value="conditions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Condições de Trigger</h3>
                    <p className="text-sm text-muted-foreground">
                      Defina quando a regra deve ser executada
                    </p>
                  </div>
                  <Button onClick={addCondition} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Condição
                  </Button>
                </div>

                {formData.conditions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma condição definida. Clique em "Adicionar Condição" para começar.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {formData.conditions.map((condition, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            {index > 0 && (
                              <Select
                                value={condition.logicalOperator || 'and'}
                                onValueChange={(value: any) => updateCondition(index, { logicalOperator: value })}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="and">E</SelectItem>
                                  <SelectItem value="or">OU</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            <Select
                              value={condition.field}
                              onValueChange={(value) => updateCondition(index, { field: value })}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Campo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member.arrears">Morosidade do Membro</SelectItem>
                                <SelectItem value="member.quota">Quota do Membro</SelectItem>
                                <SelectItem value="date.day">Dia do Mês</SelectItem>
                                <SelectItem value="date.dayOfWeek">Dia da Semana</SelectItem>
                                <SelectItem value="building.memberCount">Número de Membros</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select
                              value={condition.operator}
                              onValueChange={(value: any) => updateCondition(index, { operator: value })}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Igual a</SelectItem>
                                <SelectItem value="not_equals">Diferente de</SelectItem>
                                <SelectItem value="greater_than">Maior que</SelectItem>
                                <SelectItem value="less_than">Menor que</SelectItem>
                                <SelectItem value="contains">Contém</SelectItem>
                                <SelectItem value="is_empty">Está vazio</SelectItem>
                                <SelectItem value="is_not_empty">Não está vazio</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Input
                              placeholder="Valor"
                              value={condition.value}
                              onChange={(e) => updateCondition(index, { value: e.target.value })}
                              className="flex-1"
                            />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCondition(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Ações */}
              <TabsContent value="actions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Ações a Executar</h3>
                    <p className="text-sm text-muted-foreground">
                      Defina o que acontece quando as condições são atendidas
                    </p>
                  </div>
                  <Button onClick={addAction} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ação
                  </Button>
                </div>

                {formData.actions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma ação definida. Clique em "Adicionar Ação" para começar.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {formData.actions.map((action, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Select
                                value={action.type}
                                onValueChange={(value: any) => updateAction(index, { type: value })}
                              >
                                <SelectTrigger className="w-60">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="send_communication">Enviar Comunicação</SelectItem>
                                  <SelectItem value="create_document">Criar Documento</SelectItem>
                                  <SelectItem value="update_member">Atualizar Membro</SelectItem>
                                  <SelectItem value="create_arrear">Criar Morosidade</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAction(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {action.type === 'send_communication' && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                  value={action.parameters?.type || 'email'}
                                  onValueChange={(value) => updateAction(index, {
                                    parameters: { ...action.parameters, type: value }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Canal" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={action.parameters?.category || 'general_announcement'}
                                  onValueChange={(value) => updateAction(index, {
                                    parameters: { ...action.parameters, category: value }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Categoria" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="payment_reminder">Lembrete de Pagamento</SelectItem>
                                    <SelectItem value="meeting_notice">Aviso de Reunião</SelectItem>
                                    <SelectItem value="maintenance_alert">Alerta de Manutenção</SelectItem>
                                    <SelectItem value="general_announcement">Anúncio Geral</SelectItem>
                                    <SelectItem value="arrears_notice">Aviso de Morosidade</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={action.parameters?.priority || 'normal'}
                                  onValueChange={(value) => updateAction(index, {
                                    parameters: { ...action.parameters, priority: value }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Prioridade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                disabled={isSaving || !formData.name}
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" variant="white" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingRule ? 'Atualizar' : 'Criar'} Regra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingRule}
        onOpenChange={(open) => !open && setDeletingRule(null)}
        itemName={`a regra "${deletingRule?.name}"`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AutomationManager;