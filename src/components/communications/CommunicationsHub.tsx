import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import communicationService from '@/services/api/communications';
import { CommunicationMessage, CommunicationTemplate, CommunicationCampaign, CommunicationStats } from '@/types/communicationTypes';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { useNotifications } from '@/components/common/NotificationProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Bell, 
  Send,
  Plus,
  RefreshCw,
  Settings,
  BarChart3,
  Calendar,
  Users,
  Zap,
  AlertTriangle,
  Search,
  Filter,
  History,
  Target
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import MessageComposer from './MessageComposer';
import CampaignManager from './CampaignManager';
import TemplateManager from './TemplateManager';
import CommunicationHistory from './CommunicationHistory';
import AutomationManager from './AutomationManager';

interface CommunicationsHubProps {
  className?: string;
}

const CommunicationsHub: React.FC<CommunicationsHubProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  const { success, error } = useNotifications();
  
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<CommunicationMessage[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialogs
  const [showComposer, setShowComposer] = useState(false);
  const [showCampaignManager, setShowCampaignManager] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showAutomationManager, setShowAutomationManager] = useState(false);

  // Carregar dados
  useEffect(() => {
    if (currentBuilding?.id) {
      loadData();
    }
  }, [currentBuilding?.id]);

  const loadData = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const [statsData, messagesData, templatesData] = await Promise.all([
        communicationsAPI.getStats(currentBuilding.id),
        communicationsAPI.getRecentMessages(currentBuilding.id, 10),
        communicationsAPI.getTemplates(currentBuilding.id)
      ]);
      
      setStats(statsData);
      setRecentMessages(messagesData);
      setTemplates(templatesData);
    } catch (err) {
      console.error('Erro ao carregar dados de comunicação:', err);
      error('Erro ao carregar dados de comunicação');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <Phone className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'success',
      delivered: 'success',
      read: 'default',
      pending: 'warning',
      failed: 'destructive',
      bounced: 'destructive'
    } as const;
    
    const labels = {
      sent: 'Enviado',
      delivered: 'Entregue',
      read: 'Lido',
      pending: 'Pendente',
      failed: 'Falhado',
      bounced: 'Rejeitado'
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const QuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowComposer(true)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Enviar Mensagem</h3>
              <p className="text-sm text-muted-foreground">Mensagem rápida</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCampaignManager(true)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">Campanha</h3>
              <p className="text-sm text-muted-foreground">Mensagem em massa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowTemplateManager(true)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">Templates</h3>
              <p className="text-sm text-muted-foreground">Gerir modelos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAutomationManager(true)}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-medium">Automatização</h3>
              <p className="text-sm text-muted-foreground">Regras automáticas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const RecentMessageCard: React.FC<{ message: CommunicationMessage }> = ({ message }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              {getTypeIcon(message.type)}
              <h3 className="font-semibold truncate">{message.subject}</h3>
              {getStatusBadge(message.status)}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className={getPriorityColor(message.priority)}>
                {message.priority === 'urgent' ? '🚨' : 
                 message.priority === 'high' ? '⚡' : 
                 message.priority === 'normal' ? '📝' : '📋'} 
                {message.priority}
              </span>
              <span>{formatDate(message.createdAt)}</span>
              <span>{message.recipients.length} destinatários</span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {message.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </p>
            
            {message.statusDetails && (
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-green-600">
                  ✓ {message.statusDetails.delivered || 0} entregues
                </span>
                <span className="text-blue-600">
                  👁 {message.statusDetails.read || 0} lidas
                </span>
                {message.statusDetails.failed && message.statusDetails.failed > 0 && (
                  <span className="text-red-600">
                    ✗ {message.statusDetails.failed} falhadas
                  </span>
                )}
              </div>
            )}
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
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir comunicações.
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
                <Mail className="h-5 w-5" />
                Centro de Comunicações
                {stats && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.totalSent} enviadas
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestão avançada de comunicações para {currentBuilding.name}
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
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              
              <Button
                onClick={() => setShowComposer(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Mensagem
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <LoadingSpinner />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalSent}</p>
                <p className="text-sm text-muted-foreground">Total Enviadas</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.thisMonth} este mês
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {(stats.deliveryRate * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimos 30 dias
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {(stats.readRate * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa de Leitura</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Emails e SMS
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {templates.filter(t => t.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Templates Ativos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {templates.length} total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Acesso rápido às funcionalidades mais utilizadas
              </p>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>

          {/* Mensagens Recentes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Mensagens Recentes
                </CardTitle>
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ListSkeleton count={3} />
              ) : recentMessages.length === 0 ? (
                <EmptyList
                  icon={<Mail className="h-full w-full" />}
                  title="Nenhuma mensagem enviada"
                  description="Comece enviando a primeira comunicação"
                  actionLabel="Enviar Mensagem"
                  onAction={() => setShowComposer(true)}
                />
              ) : (
                <div className="space-y-4">
                  {recentMessages.slice(0, 5).map((message) => (
                    <RecentMessageCard key={message.id} message={message} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history">
          <CommunicationHistory />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <>
              {/* Distribuição por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Distribuição por Canal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <Card key={type} className="border-dashed">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            {getTypeIcon(type)}
                          </div>
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {type === 'email' ? 'Email' :
                             type === 'sms' ? 'SMS' :
                             type === 'whatsapp' ? 'WhatsApp' : type}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Templates Mais Usados */}
              <Card>
                <CardHeader>
                  <CardTitle>Templates Mais Utilizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topTemplates.map((template, index) => (
                      <div key={template.templateId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{template.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {template.useCount} usos
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <TemplateManager
            templates={templates}
            onTemplateChange={loadData}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showComposer} onOpenChange={setShowComposer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Compor Nova Mensagem</DialogTitle>
          </DialogHeader>
          <MessageComposer
            templates={templates}
            onSend={async (message) => {
              try {
                await communicationsAPI.sendMessage(message);
                setShowComposer(false);
                loadData();
                success('Mensagem enviada com sucesso');
              } catch (err) {
                error('Erro ao enviar mensagem');
              }
            }}
            onCancel={() => setShowComposer(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCampaignManager} onOpenChange={setShowCampaignManager}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Gestor de Campanhas</DialogTitle>
          </DialogHeader>
          <CampaignManager
            templates={templates}
            onClose={() => setShowCampaignManager(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplateManager} onOpenChange={setShowTemplateManager}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Gestor de Templates</DialogTitle>
          </DialogHeader>
          <TemplateManager
            templates={templates}
            onTemplateChange={loadData}
            onClose={() => setShowTemplateManager(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAutomationManager} onOpenChange={setShowAutomationManager}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Gestor de Automatização</DialogTitle>
          </DialogHeader>
          <AutomationManager
            onClose={() => setShowAutomationManager(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationsHub;