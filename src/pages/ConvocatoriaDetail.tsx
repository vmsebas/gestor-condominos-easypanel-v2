import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users, FileText, Download, Edit, Trash2, CheckCircle, AlertCircle, FileSignature, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getConvocatoriaById } from '@/lib/api';
import { format, isPast, isToday, isFuture, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ConvocatoriaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: convocatoria, isLoading, error } = useQuery({
    queryKey: ['convocatoria', id],
    queryFn: () => getConvocatoriaById(id!),
    enabled: !!id,
  });

  /**
   * Determina qué acciones están disponibles según el estado de la convocatoria
   * LÓGICA DE NEGOCIO según legislación portuguesa
   */
  const getAvailableActions = (data: any) => {
    const meetingDate = parseISO(data.date);
    const isReunionDay = isToday(meetingDate);
    const isAfterReunion = isPast(meetingDate);
    const hasActa = data.minutes_created && data.minute_id;

    const actions = {
      canEdit: false,
      canSend: false,
      canDelete: false,
      canCreateActa: false,
      canViewActa: false,
      canDistributeActa: false,
      showWarning: false,
      warningMessage: ''
    };

    // CONVOCATORIA EN RASCUNHO
    if (data.status === 'draft') {
      actions.canEdit = true;
      actions.canSend = true;
      actions.canDelete = true;
      return actions;
    }

    // CONVOCATORIA ENVIADA
    if (data.status === 'sent') {
      if (isFuture(meetingDate)) {
        return actions; // Solo visualizar
      }

      if (isReunionDay && !hasActa) {
        actions.canCreateActa = true;
        return actions;
      }

      if (isAfterReunion) {
        if (hasActa) {
          actions.canViewActa = true;
          if (data.minute_status === 'signed') {
            actions.canDistributeActa = true;
          }
        } else {
          actions.canCreateActa = true;
          actions.showWarning = true;
          actions.warningMessage = 'Reunião realizada sem acta registada';
        }
        return actions;
      }
    }

    return actions;
  };

  const handleCreateActa = () => {
    navigate(`/actas/nova?convocatoria=${id}`);
  };

  const handleViewActa = (minuteId: string) => {
    navigate(`/actas/${minuteId}`);
  };

  const handleDistributeActa = () => {
    toast.info('Funcionalidade de distribuição em desenvolvimento');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !convocatoria) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Convocatória não encontrada</p>
            <Button onClick={() => navigate('/convocatorias')} className="mt-4">
              Voltar para Convocatórias
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = convocatoria.data || convocatoria;
  const actions = getAvailableActions(data);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/convocatorias')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{data.title || `Assembleia ${data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'} #${data.assembly_number}`}</h1>
              <Badge variant={data.assembly_type === 'ordinary' ? 'default' : 'secondary'}>
                {data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'}
              </Badge>
              <Badge variant={data.status === 'draft' ? 'outline' : 'default'}>
                {data.status === 'draft' ? 'Rascunho' : data.status === 'sent' ? 'Enviada' : data.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {data.building_name} - {data.building_address}
            </p>

            {/* Alerta de reunião sem acta */}
            {actions.showWarning && (
              <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{actions.warningMessage}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            {actions.canEdit && (
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Assembleia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {data.date ? format(new Date(data.date), "d 'de' MMMM 'de' yyyy", { locale: pt }) : 'Por definir'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">{data.time || 'Por definir'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{data.location || 'Por definir'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant={data.assembly_type === 'ordinary' ? 'default' : 'secondary'}>
                    {data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Administrador</h3>
              <p>{data.administrator || 'Não definido'}</p>
            </div>

            {data.agenda_items && data.agenda_items.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ordem de Trabalhos ({data.agenda_items.length} pontos)
                </h3>
                <div className="space-y-3">
                  {data.agenda_items.map((item: any, index: number) => (
                    <div key={item.id || index} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {item.item_number || index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-sm">{item.title}</strong>
                          {item.type && (
                            <Badge variant={item.type === 'votacion' ? 'default' : 'secondary'} className="text-xs">
                              {item.type === 'votacion' ? 'Votação' : item.type === 'informativo' ? 'Informativo' : item.type}
                            </Badge>
                          )}
                          {item.requiredMajority && (
                            <Badge variant="outline" className="text-xs">
                              {item.requiredMajority === 'simple' ? 'Maioria Simples' : 'Maioria Qualificada'}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección de Acta Relacionada */}
        {data.minute_id && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <CardTitle>Acta da Assembleia</CardTitle>
                </div>
                <Badge variant={data.minute_status === 'signed' ? 'default' : 'secondary'} className="bg-green-600 text-white">
                  {data.minute_status === 'signed' ? 'Assinada' : data.minute_status === 'draft' ? 'Rascunho' : data.minute_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Número da Acta</p>
                  <p className="font-semibold">Acta #{data.minute_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <p className="font-semibold capitalize">{data.minute_status === 'signed' ? 'Assinada' : data.minute_status}</p>
                </div>
                {data.minute_meeting_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data da Reunião</p>
                    <p className="font-semibold">
                      {format(new Date(data.minute_meeting_date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                    </p>
                  </div>
                )}
                {data.minute_signed_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Assinatura</p>
                    <p className="font-semibold">
                      {format(new Date(data.minute_signed_date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleViewActa(data.minute_id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Acta Completa
                </Button>
                {data.minute_status === 'signed' && (
                  <Button variant="outline" onClick={handleDistributeActa}>
                    <Send className="mr-2 h-4 w-4" />
                    Distribuir Acta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações Contextuales */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Disponíveis</CardTitle>
            <CardDescription>Ações baseadas no estado atual da convocatória</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {actions.canCreateActa && (
                <Button
                  variant={actions.showWarning ? "destructive" : "default"}
                  onClick={handleCreateActa}
                >
                  <FileSignature className="mr-2 h-4 w-4" />
                  Criar Acta
                </Button>
              )}
              {actions.canSend && (
                <Button variant="default">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Convocatória
                </Button>
              )}
              {!actions.canCreateActa && !actions.canViewActa && !actions.canSend && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Nenhuma ação disponível no momento. A reunião ainda não foi realizada.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConvocatoriaDetail;