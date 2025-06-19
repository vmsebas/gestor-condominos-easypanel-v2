import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import communicationService from '@/utils/db/communicationService';
import { CommunicationMessage, CommunicationType, CommunicationCategory, CommunicationStatus } from '@/types/communicationTypes';
import { formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Filter,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';

interface CommunicationHistoryProps {
  className?: string;
}

const CommunicationHistory: React.FC<CommunicationHistoryProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CommunicationStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CommunicationType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CommunicationCategory>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Dialogs
  const [selectedMessage, setSelectedMessage] = useState<CommunicationMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<CommunicationMessage | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(20);

  useEffect(() => {
    if (currentBuilding?.id) {
      loadMessages();
    }
  }, [currentBuilding?.id, currentPage]);

  const loadMessages = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const data = await communicationService.getMessages(currentBuilding.id, currentPage, messagesPerPage);
      setMessages(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMessage) return;

    try {
      await communicationService.deleteMessage(deletingMessage.id);
      setDeletingMessage(null);
      loadMessages();
    } catch (error) {
      console.error('Erro ao eliminar mensagem:', error);
    }
  };

  // Filtros
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesType = typeFilter === 'all' || message.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || message.category === categoryFilter;
    
    const messageDate = new Date(message.createdAt);
    const now = new Date();
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && messageDate.toDateString() === now.toDateString()) ||
      (dateFilter === 'week' && messageDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === 'month' && messageDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesDate;
  });

  const getTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <Phone className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: CommunicationStatus) => {
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
    
    const icons = {
      sent: <CheckCircle className="h-3 w-3" />,
      delivered: <CheckCircle className="h-3 w-3" />,
      read: <Eye className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      bounced: <AlertCircle className="h-3 w-3" />
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    );
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

  const MessageCard: React.FC<{ message: CommunicationMessage }> = ({ message }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-3">
              {getTypeIcon(message.type)}
              <h3 className="font-semibold truncate">{message.subject}</h3>
              {getStatusBadge(message.status)}
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <Badge variant="outline" className="text-xs">
                {getCategoryLabel(message.category)}
              </Badge>
              
              <span className={`flex items-center gap-1 ${getPriorityColor(message.priority)}`}>
                {message.priority === 'urgent' ? '🚨' : 
                 message.priority === 'high' ? '⚡' : 
                 message.priority === 'normal' ? '📝' : '📋'} 
                {message.priority}
              </span>
              
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(message.createdAt)}
              </span>
              
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                {message.recipients.length} destinatários
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {message.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
            </p>
            
            {message.statusDetails && (
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {message.statusDetails.delivered || 0} entregues
                </span>
                <span className="text-blue-600 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {message.statusDetails.read || 0} lidas
                </span>
                {message.statusDetails.failed && message.statusDetails.failed > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {message.statusDetails.failed} falhadas
                  </span>
                )}
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
              <DropdownMenuItem onClick={() => setSelectedMessage(message)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeletingMessage(message)}
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

  const MessageStats = () => {
    const stats = {
      total: filteredMessages.length,
      sent: filteredMessages.filter(m => m.status === 'sent' || m.status === 'delivered').length,
      pending: filteredMessages.filter(m => m.status === 'pending').length,
      failed: filteredMessages.filter(m => m.status === 'failed' || m.status === 'bounced').length
    };

    return (
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            <p className="text-sm text-muted-foreground">Enviadas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-muted-foreground">Falhadas</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para ver o histórico de comunicações.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Comunicações
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Consultar e gerir mensagens enviadas
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMessages}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="sent">Enviadas</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="failed">Falhadas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Canais</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="payment_reminder">Lembrete de Pagamento</SelectItem>
                <SelectItem value="meeting_notice">Aviso de Reunião</SelectItem>
                <SelectItem value="maintenance_alert">Alerta de Manutenção</SelectItem>
                <SelectItem value="general_announcement">Anúncio Geral</SelectItem>
                <SelectItem value="emergency">Emergência</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <MessageStats />

      {/* Lista de Mensagens */}
      {isLoading ? (
        <ListSkeleton count={5} />
      ) : filteredMessages.length === 0 ? (
        <EmptyList
          icon={<Mail className="h-full w-full" />}
          title="Nenhuma mensagem encontrada"
          description={searchTerm ? 
            `Nenhuma mensagem corresponde aos filtros aplicados` : 
            'Ainda não foram enviadas comunicações'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
          
          {/* Paginação placeholder */}
          {filteredMessages.length === messagesPerPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Carregar Mais
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assunto</label>
                  <p className="text-sm">{selectedMessage.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Canal</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedMessage.type)}
                    <span className="text-sm capitalize">{selectedMessage.type}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p className="text-sm">{getCategoryLabel(selectedMessage.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <p className={`text-sm ${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Envio</label>
                  <p className="text-sm">{formatDate(selectedMessage.createdAt)}</p>
                </div>
              </div>

              {/* Conteúdo */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Conteúdo</label>
                <div className="mt-2 p-4 border rounded-lg bg-muted/30">
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedMessage.content}
                  </div>
                </div>
              </div>

              {/* Destinatários */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Destinatários ({selectedMessage.recipients.length})
                </label>
                <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                  {selectedMessage.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {recipient.apartmentNumber && `Apt. ${recipient.apartmentNumber} • `}
                          {recipient.email || recipient.phone}
                        </p>
                      </div>
                      {getStatusBadge(recipient.status)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Estatísticas */}
              {selectedMessage.statusDetails && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estatísticas de Entrega</label>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold">{selectedMessage.statusDetails.sent || 0}</p>
                      <p className="text-xs text-muted-foreground">Enviadas</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-green-600">{selectedMessage.statusDetails.delivered || 0}</p>
                      <p className="text-xs text-muted-foreground">Entregues</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{selectedMessage.statusDetails.read || 0}</p>
                      <p className="text-xs text-muted-foreground">Lidas</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-lg font-bold text-red-600">{selectedMessage.statusDetails.failed || 0}</p>
                      <p className="text-xs text-muted-foreground">Falhadas</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingMessage}
        onOpenChange={(open) => !open && setDeletingMessage(null)}
        itemName={`a mensagem "${deletingMessage?.subject}"`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CommunicationHistory;