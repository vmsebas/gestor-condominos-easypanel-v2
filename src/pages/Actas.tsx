import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ActaWorkflow from '@/components/actas/ActaWorkflow';
import { ScrollText, Plus, Calendar, Users, FileText, Clock, CheckCircle, Loader2, Home, Eye, Download, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useActas } from '@/hooks/useNeonDataWithAuth';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';



const Actas: React.FC = () => {
  const [showWorkflow, setShowWorkflow] = useState(false);
  
  const { data: actasData, isLoading, error } = useActas();
  
  // Transform API data to match our UI needs
  const actas = actasData?.map(acta => {
    const dateString = acta.meeting_date || acta.date;
    const formattedDate = dateString ? dateString.split('T')[0] : '';
    
    return {
      id: acta.id,
      type: acta.assembly_type === 'ordinary' ? 'ordinaria' : 'extraordinaria',
      title: `Assembleia ${acta.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'} - ${acta.building_name || 'Condomino Buraca 1'}`,
      date: formattedDate,
      time: acta.meeting_time || acta.time || '18:00',
      location: acta.location || 'Por determinar',
      status: acta.status === 'approved' ? 'signed' : acta.status === 'completed' ? 'signed' : 'draft',
      attendees: 0, // This would come from attendees data if available
      totalOwners: 20, // This would come from building data
      minute_number: acta.minute_number || acta.assembly_number,
      createdAt: acta.created_at,
      convocatoria_id: acta.convocatoria_id
    };
  }) || [];

  const handleWorkflowComplete = (data: any) => {
    console.log('Acta concluída:', data);
    setShowWorkflow(false);
    // Aqui seria a lógica para guardar na base de dados
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'completed':
        return <Badge variant="info">Concluída</Badge>;
      case 'signed':
        return <Badge variant="success">Celebrada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (acta: any) => {
    window.location.href = `/actas/${acta.id}`;
  };

  const handleGeneratePDF = (acta: any) => {
    console.log('Gerar PDF da acta:', acta);
    // TODO: Implementar geração de PDF
  };

  const handleEditActa = (acta: any) => {
    console.log('Editar acta:', acta);
    // TODO: Implementar edição
  };

  const handleDeleteActa = (acta: any) => {
    console.log('Eliminar acta:', acta);
    // TODO: Implementar eliminação
  };

  if (showWorkflow) {
    return (
      <ActaWorkflow
        onComplete={handleWorkflowComplete}
        onCancel={() => setShowWorkflow(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atas</h1>
          <p className="text-muted-foreground mt-1">
            Gestão e redação de atas de assembleias
          </p>
        </div>
        <Button 
          onClick={() => setShowWorkflow(true)}
          size="lg" 
          variant="workflow"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Ata
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">A carregar atas...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>Erro ao carregar as atas: {error.message}</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <ScrollText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{actas.length}</p>
                    <p className="text-sm text-muted-foreground">Atas totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{actas.filter(a => a.status === 'signed').length}</p>
                    <p className="text-sm text-muted-foreground">Celebradas</p>
                  </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{actas.filter(a => a.status === 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{actas.filter(a => a.status === 'draft').length}</p>
                <p className="text-sm text-muted-foreground">Em rascunho</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Atas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atas</CardTitle>
          <CardDescription>
            Todas as atas de assembleias registadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actas.length > 0 ? (
              actas.map((acta) => (
                <div
                  key={acta.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className="text-2xl font-bold text-primary">{acta.minute_number}</span>
                      <span className="text-xs text-muted-foreground">Nº</span>
                    </div>
                    <div className="border-l pl-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{acta.title}</h3>
                        <Badge variant={acta.type === 'ordinaria' ? 'default' : 'secondary'}>
                          {acta.type === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>{new Date(acta.date).toLocaleDateString('pt-PT')}</span>
                        <span>•</span>
                        <span>{acta.time.split(':')[0] + 'h' + acta.time.split(':')[1]}</span>
                        <span>•</span>
                        <span>0 itens</span>
                        {acta.attendees && acta.totalOwners && (
                          <>
                            <span>•</span>
                            <span>
                              {acta.attendees}/{acta.totalOwners} participantes 
                              ({Math.round((acta.attendees / acta.totalOwners) * 100)}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(acta.status)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(acta)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalhes
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleGeneratePDF(acta)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditActa(acta)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteActa(acta)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">Não há atas registadas</h3>
                <p className="text-muted-foreground mt-1">
                  Crie uma nova ata para registar uma assembleia
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
};

export default Actas;