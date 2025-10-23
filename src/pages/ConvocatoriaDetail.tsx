import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users, FileText, Download, Edit, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getConvocatoriaById } from '@/lib/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const ConvocatoriaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: convocatoria, isLoading, error } = useQuery({
    queryKey: ['convocatoria', id],
    queryFn: () => getConvocatoriaById(id!),
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
            <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
            <p className="text-muted-foreground">
              {data.building_name} - {data.building_address}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
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
                <h3 className="font-semibold mb-2">Ordem de Trabalhos</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {data.agenda_items.map((item: any, index: number) => (
                    <li key={item.id || index} className="text-sm">
                      <strong>{item.title}</strong>
                      {item.description && (
                        <p className="text-muted-foreground mt-1 ml-5">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Criar Ata
              </Button>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Registar Presenças
              </Button>
              <Button variant="outline">
                Enviar Notificações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConvocatoriaDetail;