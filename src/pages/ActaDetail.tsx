import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users, FileText, Download, Edit, Printer, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMinuteById } from '@/lib/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const ActaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: acta, isLoading, error } = useQuery({
    queryKey: ['minute', id],
    queryFn: () => getMinuteById(id!),
    enabled: !!id,
  });

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

  if (error || !acta) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Ata não encontrada</p>
            <Button onClick={() => navigate('/actas')} className="mt-4">
              Voltar para Atas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = acta.data || acta;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'completed':
        return <Badge variant="info">Completada</Badge>;
      case 'signed':
      case 'approved':
        return <Badge variant="success">Aprovada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/actas')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Ata Nº {data.minute_number}
            </h1>
            <p className="text-muted-foreground">
              {data.building_name} - {data.building_address}
            </p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(data.status)}
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Reunião</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {data.meeting_date ? format(new Date(data.meeting_date), "d 'de' MMMM 'de' yyyy", { locale: pt }) : 'Não definida'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">{data.meeting_time || 'Não definida'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{data.location || 'Não definido'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Assembleia</p>
                  <Badge variant={data.assembly_type === 'ordinary' ? 'default' : 'secondary'}>
                    {data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h3 className="font-semibold mb-1">Presidente</h3>
                <p>{data.president_name || 'Não definido'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secretário</h3>
                <p>{data.secretary_name || 'Não definido'}</p>
              </div>
            </div>

            {data.agenda_items && data.agenda_items.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Ordem de Trabalhos</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {data.agenda_items.map((item: any, index: number) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{item.title}</span>
                      {item.resolution && (
                        <div className="ml-5 mt-1 text-muted-foreground">
                          Resolução: {item.resolution}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {data.notes && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Notas</h3>
                <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {data.status !== 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Ata
                </Button>
                <Button variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar Ata
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Adicionar Anexos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActaDetail;