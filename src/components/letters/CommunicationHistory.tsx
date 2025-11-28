import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarIcon,
  Filter,
  Download,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useLetters } from '@/hooks/useLetters';
import { cn } from '@/lib/utils';

const CommunicationHistory: React.FC = () => {
  const { letters, isLoading } = useLetters();
  const [filters, setFilters] = useState({
    search: '',
    sendMethod: 'all',
    status: 'all',
    fromDate: null as Date | null,
    toDate: null as Date | null
  });

  // Filter letters
  const filteredLetters = letters.filter(letter => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        letter.subject?.toLowerCase().includes(searchLower) ||
        letter.recipient_name?.toLowerCase().includes(searchLower) ||
        letter.member_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Send method filter
    if (filters.sendMethod !== 'all' && letter.send_method !== filters.sendMethod) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      const hasDelivery = !!letter.delivery_confirmation;
      const hasSent = !!letter.sent_date;

      if (filters.status === 'delivered' && !hasDelivery) return false;
      if (filters.status === 'sent' && (!hasSent || hasDelivery)) return false;
      if (filters.status === 'pending' && hasSent) return false;
    }

    // Date filters
    if (filters.fromDate && letter.sent_date) {
      const sentDate = new Date(letter.sent_date);
      if (sentDate < filters.fromDate) return false;
    }
    if (filters.toDate && letter.sent_date) {
      const sentDate = new Date(letter.sent_date);
      if (sentDate > filters.toDate) return false;
    }

    return true;
  });

  const clearFilters = () => {
    setFilters({
      search: '',
      sendMethod: 'all',
      status: 'all',
      fromDate: null,
      toDate: null
    });
  };

  const exportToCSV = () => {
    // TODO: Implement CSV export
    console.log('Export to CSV:', filteredLetters);
  };

  const getStatusBadge = (letter: any) => {
    if (letter.delivery_confirmation) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Entregue
        </Badge>
      );
    } else if (letter.sent_date) {
      return (
        <Badge variant="default" className="bg-blue-600">
          <Clock className="h-3 w-3 mr-1" />
          Enviada
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    }
  };

  const getSendMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'correio_certificado':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSendMethodLabel = (method: string) => {
    switch (method) {
      case 'email':
        return 'Email';
      case 'whatsapp':
        return 'WhatsApp';
      case 'correio_certificado':
        return 'Correio Certificado';
      default:
        return method;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Histórico de Comunicações</CardTitle>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div>
            <Input
              placeholder="Buscar por assunto, destinatário..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Send Method */}
            <Select
              value={filters.sendMethod}
              onValueChange={(value) => setFilters({ ...filters, sendMethod: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Método de Envio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os métodos</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="correio_certificado">Correio Certificado</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>

            {/* From Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.fromDate ? format(filters.fromDate, "dd MMM yyyy", { locale: pt }) : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.fromDate || undefined}
                  onSelect={(date) => setFilters({ ...filters, fromDate: date || null })}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>

            {/* To Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filters.toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.toDate ? format(filters.toDate, "dd MMM yyyy", { locale: pt }) : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.toDate || undefined}
                  onSelect={(date) => setFilters({ ...filters, toDate: date || null })}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          {(filters.search || filters.sendMethod !== 'all' || filters.status !== 'all' || filters.fromDate || filters.toDate) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Lista de comunicações */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLetters.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma comunicação encontrada
            </h3>
            <p className="text-sm">
              {letters.length === 0
                ? 'Ainda não foram enviadas cartas'
                : 'Tente ajustar os filtros de busca'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            {filteredLetters.map((letter, index) => (
              <div key={letter.id} className="relative pl-8 pb-8 last:pb-0">
                {/* Timeline line */}
                {index < filteredLetters.length - 1 && (
                  <div className="absolute left-2 top-8 bottom-0 w-px bg-border" />
                )}

                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-primary bg-background" />

                {/* Card */}
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 rounded-full bg-muted">
                          {getSendMethodIcon(letter.send_method)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">{letter.subject}</h4>
                            {getStatusBadge(letter)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <strong>Para:</strong> {letter.recipient_name}
                              {letter.recipient_email && ` (${letter.recipient_email})`}
                            </p>
                            {letter.member_name && (
                              <p>
                                <strong>Membro:</strong> {letter.member_name}
                              </p>
                            )}
                            <p>
                              <strong>Método:</strong> {getSendMethodLabel(letter.send_method)}
                            </p>
                            {letter.sent_date && (
                              <p>
                                <strong>Enviada:</strong>{' '}
                                {format(new Date(letter.sent_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                              </p>
                            )}
                            {letter.delivery_confirmation && (
                              <p className="text-green-600">
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                Confirmação de entrega recebida
                              </p>
                            )}
                            {letter.tracking_number && (
                              <p>
                                <strong>Rastreamento:</strong> {letter.tracking_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && filteredLetters.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            A mostrar {filteredLetters.length} de {letters.length} {letters.length === 1 ? 'comunicação' : 'comunicações'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunicationHistory;
