import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import membersService from '@/services/api/members';
import { CommunicationTemplate, CommunicationType, CommunicationPriority, CommunicationCategory, DEFAULT_TEMPLATES } from '@/types/communicationTypes';
import { Member } from '@/types/memberTypes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  X, 
  Plus, 
  Trash2, 
  Eye, 
  Users,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Calendar,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';

interface MessageComposerProps {
  templates: CommunicationTemplate[];
  onSend: (message: any) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  templates,
  onSend,
  onCancel,
  className
}) => {
  const { currentBuilding } = useBuilding();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    type: 'email' as CommunicationType,
    category: 'general_announcement' as CommunicationCategory,
    priority: 'normal' as CommunicationPriority,
    subject: '',
    content: '',
    scheduledFor: '',
    templateId: ''
  });
  
  // Filtros para seleção de membros
  const [memberFilters, setMemberFilters] = useState({
    memberType: 'all' as 'all' | 'owner' | 'resident',
    hasEmail: false,
    hasPhone: false,
    apartmentFilter: ''
  });

  // Carregar membros
  useEffect(() => {
    const loadMembers = async () => {
      if (!currentBuilding?.id) return;

      try {
        setIsLoadingMembers(true);
        const data = await membersAPI.getAll(currentBuilding.id);
        setMembers(data);
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [currentBuilding?.id]);

  // Auto-selecionar template quando categoria muda
  useEffect(() => {
    if (formData.category && !formData.templateId) {
      const defaultTemplate = DEFAULT_TEMPLATES[formData.category];
      if (defaultTemplate) {
        setFormData(prev => ({
          ...prev,
          subject: defaultTemplate.subject,
          content: defaultTemplate.content,
          priority: defaultTemplate.priority
        }));
      }
    }
  }, [formData.category, formData.templateId]);

  // Aplicar template selecionado
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content,
        templateId: template.id
      }));
    }
  };

  // Filtrar membros
  const filteredMembers = members.filter(member => {
    // Filtro por tipo
    if (memberFilters.memberType !== 'all' && member.type !== memberFilters.memberType) {
      return false;
    }
    
    // Filtro por canal de comunicação
    if (formData.type === 'email' && (!member.email || memberFilters.hasEmail)) {
      return false;
    }
    
    if ((formData.type === 'sms' || formData.type === 'whatsapp') && (!member.phone || memberFilters.hasPhone)) {
      return false;
    }
    
    // Filtro por apartamento
    if (memberFilters.apartmentFilter && !member.apartment?.toLowerCase().includes(memberFilters.apartmentFilter.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedMembers(checked ? filteredMembers.map(m => m.id) : []);
  };

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    setSelectedMembers(prev => 
      checked 
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    );
  };

  const getChannelIcon = (type: CommunicationType) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <Phone className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: CommunicationPriority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const beforeText = formData.content.substring(0, startPos);
      const afterText = formData.content.substring(endPos);
      const newContent = beforeText + `{{${variable}}}` + afterText;
      
      setFormData(prev => ({ ...prev, content: newContent }));
      
      // Manter foco e posição do cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(startPos + variable.length + 4, startPos + variable.length + 4);
      }, 0);
    }
  };

  const handleSend = async () => {
    if (!selectedMembers.length || !formData.subject || !formData.content) {
      return;
    }

    try {
      setIsSending(true);
      
      const recipients = selectedMembers.map(memberId => {
        const member = members.find(m => m.id === memberId);
        return {
          id: member?.id || '',
          memberId: member?.id,
          name: member?.name || '',
          email: member?.email,
          phone: member?.phone,
          apartmentNumber: member?.apartment,
          status: 'pending' as const,
          variables: {
            memberName: member?.name,
            apartmentNumber: member?.apartment,
            buildingName: currentBuilding?.name,
            buildingAddress: currentBuilding?.address,
            administratorName: currentBuilding?.administratorName,
            currentDate: new Date().toLocaleDateString('pt-PT')
          }
        };
      });

      const messageData = {
        buildingId: currentBuilding?.id,
        templateId: formData.templateId || undefined,
        type: formData.type,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject,
        content: formData.content,
        recipients,
        scheduledFor: formData.scheduledFor || undefined,
        metadata: {
          sender: 'Sistema',
          totalRecipients: recipients.length,
          campaignName: `Mensagem ${formData.category} - ${new Date().toLocaleDateString()}`
        }
      };

      await onSend(messageData);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const commonVariables = [
    'memberName', 'apartmentNumber', 'buildingName', 'buildingAddress', 
    'administratorName', 'currentDate', 'currentTime'
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compor</TabsTrigger>
          <TabsTrigger value="recipients">Destinatários</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
        </TabsList>

        {/* Composição */}
        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Detalhes da Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Canal e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Canal de Comunicação *</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: CommunicationType) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          SMS
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria *</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: CommunicationCategory) => setFormData(prev => ({ ...prev, category: value }))}
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value: CommunicationPriority) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <span className="text-gray-600">📋 Baixa</span>
                      </SelectItem>
                      <SelectItem value="normal">
                        <span className="text-blue-600">📝 Normal</span>
                      </SelectItem>
                      <SelectItem value="high">
                        <span className="text-orange-600">⚡ Alta</span>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <span className="text-red-600">🚨 Urgente</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template */}
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
                    {templates.filter(t => t.isActive).map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assunto */}
              <div>
                <label className="text-sm font-medium mb-2 block">Assunto *</label>
                <Input
                  placeholder="Assunto da mensagem"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              {/* Conteúdo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Mensagem *</label>
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
                  id="message-content"
                  placeholder="Digite a mensagem aqui. Use {{variavel}} para inserir dados dinâmicos."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={formData.type === 'sms' ? 4 : 8}
                  className="resize-none"
                />
                {formData.type === 'sms' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    SMS: {formData.content.length}/160 caracteres
                    {formData.content.length > 160 && (
                      <span className="text-red-600 ml-2">
                        Será enviado como {Math.ceil(formData.content.length / 160)} mensagens
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Agendamento */}
              <div>
                <label className="text-sm font-medium mb-2 block">Agendar Envio (Opcional)</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Destinatários */}
        <TabsContent value="recipients" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Selecionar Destinatários
                <Badge variant="secondary">
                  {selectedMembers.length} selecionados
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select 
                  value={memberFilters.memberType} 
                  onValueChange={(value: any) => setMemberFilters(prev => ({ ...prev, memberType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="owner">Proprietários</SelectItem>
                    <SelectItem value="resident">Inquilinos</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filtrar por apartamento"
                  value={memberFilters.apartmentFilter}
                  onChange={(e) => setMemberFilters(prev => ({ ...prev, apartmentFilter: e.target.value }))}
                />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label className="text-sm">Selecionar todos ({filteredMembers.length})</label>
                </div>
              </div>

              <Separator />

              {/* Lista de Membros */}
              {isLoadingMembers ? (
                <LoadingSpinner />
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {filteredMembers.map((member) => {
                    const hasChannel = formData.type === 'email' ? !!member.email : 
                                     formData.type === 'sms' || formData.type === 'whatsapp' ? !!member.phone : true;
                    
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          !hasChannel ? 'opacity-50 bg-muted/20' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={(checked) => handleMemberToggle(member.id, !!checked)}
                          disabled={!hasChannel}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {member.apartment && (
                                  <Badge variant="outline" className="text-xs">
                                    {member.apartment}
                                  </Badge>
                                )}
                                <Badge 
                                  variant={member.type === 'owner' ? 'default' : 'secondary'} 
                                  className="text-xs"
                                >
                                  {member.type === 'owner' ? 'Proprietário' : 'Inquilino'}
                                </Badge>
                                {!hasChannel && (
                                  <Badge variant="destructive" className="text-xs">
                                    Sem {formData.type === 'email' ? 'email' : 'telefone'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formData.type === 'email' && member.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </div>
                              )}
                              {(formData.type === 'sms' || formData.type === 'whatsapp') && member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {member.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pré-visualização */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Pré-visualização da Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações da mensagem */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Canal</p>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(formData.type)}
                    <span className="capitalize">{formData.type}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prioridade</p>
                  <span className={getPriorityColor(formData.priority)}>
                    {formData.priority === 'urgent' ? '🚨' : 
                     formData.priority === 'high' ? '⚡' : 
                     formData.priority === 'normal' ? '📝' : '📋'} 
                    {formData.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destinatários</p>
                  <span>{selectedMembers.length} membros</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agendamento</p>
                  <span>{formData.scheduledFor ? 'Agendado' : 'Imediato'}</span>
                </div>
              </div>

              {/* Preview da mensagem */}
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="border-b pb-2 mb-4">
                  <p className="font-semibold">{formData.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    De: {currentBuilding?.administratorName || 'Administração'} &lt;{currentBuilding?.administratorEmail || 'admin@condominio.pt'}&gt;
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

              {formData.scheduledFor && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    Agendado para: {new Date(formData.scheduledFor).toLocaleString('pt-PT')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button 
          onClick={handleSend}
          disabled={isSending || !selectedMembers.length || !formData.subject || !formData.content}
        >
          {isSending ? (
            <LoadingSpinner size="sm" variant="white" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {formData.scheduledFor ? 'Agendar' : 'Enviar'} Mensagem ({selectedMembers.length})
        </Button>
      </div>
    </div>
  );
};

export default MessageComposer;