import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import communicationService from '@/services/api/communications';
import membersService from '@/services/api/members';
import { CommunicationCampaign, CommunicationTemplate, CommunicationType, CommunicationCategory } from '@/types/communicationTypes';
import { Member } from '@/types/memberTypes';
import { formatDate, formatCurrency } from '@/utils/formatters';

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
  Target,
  Plus,
  X,
  Save,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  Mail,
  MessageSquare,
  Phone,
  TrendingUp,
  Clock,
  Send,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';

interface CampaignManagerProps {
  templates: CommunicationTemplate[];
  onClose?: () => void;
  className?: string;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ templates, onClose, className }) => {
  const { currentBuilding } = useBuilding();
  
  const [campaigns, setCampaigns] = useState<CommunicationCampaign[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CommunicationCampaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<CommunicationCampaign | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: ['email'] as CommunicationType[],
    category: 'general_announcement' as CommunicationCategory,
    templateId: '',
    subject: '',
    content: '',
    targetAudience: {
      memberType: 'all' as 'owner' | 'resident' | 'all',
      apartments: [] as string[],
      hasArrears: false,
      customFilter: ''
    },
    scheduledFor: '',
    repeatSettings: {
      enabled: false,
      frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      interval: 1,
      endDate: ''
    }
  });

  useEffect(() => {
    if (currentBuilding?.id) {
      loadData();
    }
  }, [currentBuilding?.id]);

  const loadData = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const [campaignsData, membersData] = await Promise.all([
        communicationsAPI.getCampaigns(currentBuilding.id),
        membersAPI.getAll(currentBuilding.id)
      ]);
      
      setCampaigns(campaignsData);
      setMembers(membersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (campaign?: CommunicationCampaign) => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        type: campaign.type,
        category: campaign.category,
        templateId: campaign.templateId || '',
        subject: campaign.subject,
        content: campaign.content,
        targetAudience: campaign.targetAudience,
        scheduledFor: campaign.scheduledFor || '',
        repeatSettings: campaign.repeatSettings || {
          enabled: false,
          frequency: 'monthly',
          interval: 1,
          endDate: ''
        }
      });
      setEditingCampaign(campaign);
    } else {
      setFormData({
        name: '',
        description: '',
        type: ['email'],
        category: 'general_announcement',
        templateId: '',
        subject: '',
        content: '',
        targetAudience: {
          memberType: 'all',
          apartments: [],
          hasArrears: false,
          customFilter: ''
        },
        scheduledFor: '',
        repeatSettings: {
          enabled: false,
          frequency: 'monthly',
          interval: 1,
          endDate: ''
        }
      });
      setEditingCampaign(null);
    }
    setShowEditor(true);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        content: template.content,
        category: template.category,
        type: template.type
      }));
    }
  };

  const handleSave = async () => {
    if (!currentBuilding?.id || !formData.name || !formData.subject || !formData.content) return;

    try {
      setIsSaving(true);
      
      const campaignData: Omit<CommunicationCampaign, 'id' | 'createdAt' | 'updatedAt'> = {
        buildingId: currentBuilding.id,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        templateId: formData.templateId,
        subject: formData.subject,
        content: formData.content,
        targetAudience: formData.targetAudience,
        scheduledFor: formData.scheduledFor,
        repeatSettings: formData.repeatSettings.enabled ? formData.repeatSettings : undefined,
        status: 'draft'
      };

      await communicationsAPI.createCampaign(campaignData);
      setShowEditor(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunch = async (campaignId: string) => {
    try {
      setIsLaunching(true);
      await communicationsAPI.launchCampaign(campaignId);
      loadData();
    } catch (error) {
      console.error('Erro ao lançar campanha:', error);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCampaign) return;

    try {
      await communicationsAPI.deleteCampaign(deletingCampaign.id);
      setDeletingCampaign(null);
      loadData();
    } catch (error) {
      console.error('Erro ao eliminar campanha:', error);
    }
  };

  const getEstimatedRecipients = () => {
    let filtered = members;

    if (formData.targetAudience.memberType !== 'all') {
      filtered = filtered.filter(m => m.type === formData.targetAudience.memberType);
    }

    if (formData.targetAudience.hasArrears) {
      // Mock filter for members with arrears
      filtered = filtered.filter(m => Math.random() > 0.7);
    }

    if (formData.targetAudience.apartments.length > 0) {
      filtered = filtered.filter(m => 
        formData.targetAudience.apartments.includes(m.apartment || '')
      );
    }

    // Filter by communication channel availability
    filtered = filtered.filter(member => {
      return formData.type.some(type => {
        if (type === 'email') return !!member.email;
        if (type === 'sms' || type === 'whatsapp') return !!member.phone;
        return true;
      });
    });

    return filtered.length;
  };

  const getTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <Phone className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'outline',
      scheduled: 'warning',
      sending: 'warning',
      sent: 'success',
      completed: 'success',
      failed: 'destructive'
    } as const;
    
    const labels = {
      draft: 'Rascunho',
      scheduled: 'Agendada',
      sending: 'Enviando',
      sent: 'Enviada',
      completed: 'Concluída',
      failed: 'Falhada'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
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

  const CampaignCard: React.FC<{ campaign: CommunicationCampaign }> = ({ campaign }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-3">
              <Target className="h-4 w-4" />
              <h3 className="font-semibold">{campaign.name}</h3>
              {getStatusBadge(campaign.status)}
            </div>
            
            {campaign.description && (
              <p className="text-sm text-muted-foreground">{campaign.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm">
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(campaign.category)}
              </Badge>
              
              <div className="flex space-x-1">
                {campaign.type.map(type => (
                  <div key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getTypeIcon(type)}
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
              
              {campaign.scheduledFor && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(campaign.scheduledFor)}
                </span>
              )}
            </div>
            
            {campaign.results && (
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {campaign.results.delivered} entregues
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {campaign.results.read} lidas
                </span>
                {campaign.results.failed > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {campaign.results.failed} falhadas
                  </span>
                )}
                <span className="text-muted-foreground">
                  Custo: {formatCurrency(campaign.results.cost)}
                </span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditor(campaign)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              
              {campaign.status === 'draft' && (
                <>
                  <DropdownMenuItem onClick={() => openEditor(campaign)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => handleLaunch(campaign.id)}
                    disabled={isLaunching}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Lançar Campanha
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeletingCampaign(campaign)}
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

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir campanhas.
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
            <Target className="h-5 w-5" />
            Gestor de Campanhas
          </h2>
          <p className="text-sm text-muted-foreground">
            Criar e gerir campanhas de comunicação em massa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
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
            <p className="text-2xl font-bold">{campaigns.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.status === 'completed').length}
            </p>
            <p className="text-sm text-muted-foreground">Concluídas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {campaigns.filter(c => c.status === 'draft' || c.status === 'scheduled').length}
            </p>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {campaigns.reduce((sum, c) => sum + (c.results?.totalSent || 0), 0)}
            </p>
            <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campanhas */}
      {isLoading ? (
        <LoadingSpinner />
      ) : campaigns.length === 0 ? (
        <EmptyList
          icon={<Target className="h-full w-full" />}
          title="Nenhuma campanha criada"
          description="Crie a primeira campanha para comunicação em massa"
          actionLabel="Criar Campanha"
          onAction={() => openEditor()}
        />
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Editor de Campanha */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="audience">Público-alvo</TabsTrigger>
                <TabsTrigger value="schedule">Agendamento</TabsTrigger>
              </TabsList>

              {/* Informações Básicas */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome da Campanha *</label>
                    <Input
                      placeholder="Ex: Lembrete Quota Janeiro 2024"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria *</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: CommunicationCategory) => 
                        setFormData(prev => ({ ...prev, category: value }))
                      }
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
                  <label className="text-sm font-medium mb-2 block">Descrição</label>
                  <Textarea
                    placeholder="Descrição da campanha e objetivo"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Canais de Comunicação *</label>
                  <div className="flex space-x-4">
                    {(['email', 'sms', 'whatsapp'] as CommunicationType[]).map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.type.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({ ...prev, type: [...prev.type, type] }));
                            } else {
                              setFormData(prev => ({ ...prev, type: prev.type.filter(t => t !== type) }));
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
              </TabsContent>

              {/* Conteúdo */}
              <TabsContent value="content" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Template (Opcional)</label>
                  <Select 
                    value={formData.templateId} 
                    onValueChange={applyTemplate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar template existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.isActive && t.category === formData.category).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Assunto *</label>
                  <Input
                    placeholder="Assunto da mensagem"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo da Mensagem *</label>
                  <Textarea
                    placeholder="Digite o conteúdo da campanha. Use {{variavel}} para dados dinâmicos."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={12}
                  />
                </div>
              </TabsContent>

              {/* Público-alvo */}
              <TabsContent value="audience" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Definir Público-alvo</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure os filtros para selecionar destinatários
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {getEstimatedRecipients()} destinatários
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Membro</label>
                    <Select
                      value={formData.targetAudience.memberType}
                      onValueChange={(value: any) => 
                        setFormData(prev => ({
                          ...prev,
                          targetAudience: { ...prev.targetAudience, memberType: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="owner">Apenas Proprietários</SelectItem>
                        <SelectItem value="resident">Apenas Inquilinos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.targetAudience.hasArrears}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          targetAudience: { ...prev.targetAudience, hasArrears: !!checked }
                        }))
                      }
                    />
                    <label className="text-sm">Apenas membros com morosidades</label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Apartamentos Específicos</label>
                  <Input
                    placeholder="Ex: 1A, 2B, 3C (separados por vírgula)"
                    value={formData.targetAudience.apartments.join(', ')}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        targetAudience: { 
                          ...prev.targetAudience, 
                          apartments: e.target.value.split(',').map(apt => apt.trim()).filter(Boolean)
                        }
                      }))
                    }
                  />
                </div>
              </TabsContent>

              {/* Agendamento */}
              <TabsContent value="schedule" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Agendar Envio (Opcional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.repeatSettings.enabled}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          repeatSettings: { ...prev.repeatSettings, enabled: !!checked }
                        }))
                      }
                    />
                    <label className="text-sm font-medium">Repetir automaticamente</label>
                  </div>

                  {formData.repeatSettings.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Frequência</label>
                        <Select
                          value={formData.repeatSettings.frequency}
                          onValueChange={(value: any) => 
                            setFormData(prev => ({
                              ...prev,
                              repeatSettings: { ...prev.repeatSettings, frequency: value }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diariamente</SelectItem>
                            <SelectItem value="weekly">Semanalmente</SelectItem>
                            <SelectItem value="monthly">Mensalmente</SelectItem>
                            <SelectItem value="yearly">Anualmente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Intervalo</label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.repeatSettings.interval}
                          onChange={(e) => 
                            setFormData(prev => ({
                              ...prev,
                              repeatSettings: { ...prev.repeatSettings, interval: parseInt(e.target.value) || 1 }
                            }))
                          }
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Data de Fim</label>
                        <Input
                          type="date"
                          value={formData.repeatSettings.endDate}
                          onChange={(e) => 
                            setFormData(prev => ({
                              ...prev,
                              repeatSettings: { ...prev.repeatSettings, endDate: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || !formData.name || !formData.subject || !formData.content}
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Rascunho
                </Button>
                
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || !formData.name || !formData.subject || !formData.content}
                >
                  {isSaving ? (
                    <LoadingSpinner size="sm" variant="white" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {formData.scheduledFor ? 'Agendar' : 'Criar e Lançar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingCampaign}
        onOpenChange={(open) => !open && setDeletingCampaign(null)}
        itemName={`a campanha "${deletingCampaign?.name}"`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CampaignManager;