import React from 'react';
import { Minute } from '@/types/minutesTypes';
import { formatDate, formatTime } from '@/utils/formatters';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Vote,
  Download,
  Print,
  Share,
  FileSignature,
  CheckSquare
} from 'lucide-react';
import TaskList from '@/components/tasks/TaskList';

interface MinuteViewerProps {
  minute: Minute;
  onClose?: () => void;
  className?: string;
}

const MinuteViewer: React.FC<MinuteViewerProps> = ({
  minute,
  onClose,
  className
}) => {
  
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'outline',
      approved: 'success',
      published: 'default'
    } as const;
    
    const labels = {
      draft: 'Rascunho',
      approved: 'Aprovada',
      published: 'Publicada'
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      ordinary: 'Assembleia Geral Ordinária',
      extraordinary: 'Assembleia Geral Extraordinária',
      urgent: 'Reunião Urgente'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ordinary':
        return <Calendar className="h-4 w-4" />;
      case 'extraordinary':
        return <FileSignature className="h-4 w-4" />;
      case 'urgent':
        return <Vote className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getMeetingDuration = () => {
    if (minute.startTime && minute.endTime) {
      const start = new Date(`2000-01-01 ${minute.startTime}`);
      const end = new Date(`2000-01-01 ${minute.endTime}`);
      const diff = end.getTime() - start.getTime();
      const minutes = diff / (1000 * 60);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho da Ata */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getTypeIcon(minute.type)}
            <h1 className="text-2xl font-bold">{minute.title}</h1>
            {getStatusBadge(minute.status)}
          </div>
          <p className="text-muted-foreground">{getTypeLabel(minute.type)}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Print className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Partilhar
          </Button>
        </div>
      </div>

      {/* Informações da Reunião */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Reunião</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Data</span>
              </div>
              <p className="font-medium">{formatDate(minute.meetingDate)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Horário</span>
              </div>
              <p className="font-medium">
                {minute.startTime}
                {minute.endTime && ` - ${minute.endTime}`}
                {getMeetingDuration() && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({getMeetingDuration()})
                  </span>
                )}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Local</span>
              </div>
              <p className="font-medium">{minute.location}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Participantes</span>
              </div>
              <p className="font-medium">{minute.attendeesCount || 0} membros</p>
            </div>
          </div>
          
          {minute.description && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-muted-foreground">{minute.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ordem do Dia */}
      {minute.agendaItems && minute.agendaItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Ordem do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {minute.agendaItems.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {item.type === 'discussion' ? 'Discussão' :
                           item.type === 'voting' ? 'Votação' : 'Informativo'}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground pl-6">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    {item.presenter && (
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Apresentador:</p>
                        <p className="font-medium">{item.presenter}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Resultados de Votação */}
                  {item.voting && (
                    <div className="pl-6 space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h5 className="font-medium text-sm mb-2">Votação:</h5>
                        {item.voting.question && (
                          <p className="text-sm mb-3">{item.voting.question}</p>
                        )}
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-green-600 font-semibold">
                              {item.voting.votesFor || 0}
                            </p>
                            <p className="text-muted-foreground">A favor</p>
                          </div>
                          <div className="text-center">
                            <p className="text-red-600 font-semibold">
                              {item.voting.votesAgainst || 0}
                            </p>
                            <p className="text-muted-foreground">Contra</p>
                          </div>
                          <div className="text-center">
                            <p className="text-yellow-600 font-semibold">
                              {item.voting.abstentions || 0}
                            </p>
                            <p className="text-muted-foreground">Abstenções</p>
                          </div>
                        </div>
                        
                        {item.voting.result && (
                          <div className="mt-3 text-center">
                            <Badge variant={item.voting.result === 'approved' ? 'success' : 'destructive'}>
                              {item.voting.result === 'approved' ? 'Aprovado' : 
                               item.voting.result === 'rejected' ? 'Rejeitado' : 'Pendente'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {index < minute.agendaItems.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decisões Tomadas */}
      {minute.decisions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Decisões Tomadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {minute.decisions}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximas Ações */}
      {minute.nextActions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximas Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {minute.nextActions}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarefas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Tarefas
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TaskList 
            buildingId={minute.buildingId} 
            minuteId={minute.id}
            showFilters={false}
          />
        </CardContent>
      </Card>

      {/* Assinatura e Validação */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Validação da Ata</h4>
              <p className="text-sm text-muted-foreground">
                Esta ata foi {minute.status === 'approved' ? 'aprovada' : 
                           minute.status === 'published' ? 'publicada' : 'elaborada'} em{' '}
                {formatDate(minute.updatedAt || minute.createdAt)}
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="text-center space-y-2">
                <div className="h-16 border-b border-dashed border-muted-foreground"></div>
                <p className="text-sm text-muted-foreground">Presidente da Mesa</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="h-16 border-b border-dashed border-muted-foreground"></div>
                <p className="text-sm text-muted-foreground">Secretário</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Auditoria */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Criada em:</span> {formatDate(minute.createdAt)}
            </div>
            <div>
              <span className="font-medium">Última atualização:</span> {formatDate(minute.updatedAt || minute.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Fechar */}
      {onClose && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
};

export default MinuteViewer;