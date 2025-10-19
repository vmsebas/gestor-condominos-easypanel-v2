import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConvocatoriaWorkflow from '@/components/convocatorias/ConvocatoriaWorkflow';
import { ScrollText, Plus, Calendar, Users, FileText, Clock, CheckCircle, Loader2, Home, Eye, Download, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ConvocatoriaPdfGenerator from '@/utils/convocatoriaPdfGenerator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const Convocatorias: React.FC = () => {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [convocatoriaToDelete, setConvocatoriaToDelete] = useState<any>(null);
  const [editingConvocatoria, setEditingConvocatoria] = useState<any>(null);
  const navigate = useNavigate();
  
  const {
    convocatorias: convocatoriasData,
    isLoading,
    pagination,
    createConvocatoria,
    updateConvocatoria,
    deleteConvocatoria,
    changePage,
    changePageSize
  } = useConvocatorias();
  
  // Transform API data to match our UI needs (same as Actas)
  const convocatorias = convocatoriasData?.map(convocatoria => {
    const dateString = convocatoria.meeting_date || convocatoria.date;
    const formattedDate = dateString ? dateString.split('T')[0] : '';
    
    return {
      id: convocatoria.id,
      type: convocatoria.assembly_type === 'ordinary' ? 'ordinaria' : 'extraordinaria',
      title: `Assembleia ${convocatoria.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'} - ${convocatoria.building_name || 'Condomino Buraca 1'}`,
      date: formattedDate,
      time: convocatoria.meeting_time || convocatoria.time || '18:00',
      location: convocatoria.location || 'Por determinar',
      status: convocatoria.status === 'approved' ? 'signed' : convocatoria.status === 'completed' ? 'signed' : 'draft',
      attendees: 0, // This would come from attendees data if available
      totalOwners: 20, // This would come from building data
      minute_number: convocatoria.minute_number || convocatoria.assembly_number,
      createdAt: convocatoria.created_at,
      convocatoria_id: convocatoria.convocatoria_id
    };
  }) || [];

  const handleWorkflowComplete = async (data: any) => {
    let result;
    if (editingConvocatoria) {
      // Atualizar convocatória existente
      result = await updateConvocatoria(editingConvocatoria.id, data);
    } else {
      // Criar nova convocatória
      result = await createConvocatoria(data);
    }
    
    if (result) {
      setShowWorkflow(false);
      setEditingConvocatoria(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'completed':
        return <Badge variant="info">Completada</Badge>;
      case 'signed':
        return <Badge variant="success">Celebrada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (convocatoria: any) => {
    // Navegar para página de detalhes ou abrir modal
    navigate(`/convocatorias/${convocatoria.id}`);
  };

  const handleGeneratePDF = async (convocatoria: any) => {
    try {
      // Buscar os dados originais da convocatória para ter todos os campos
      const originalConvocatoria = convocatoriasData?.find(c => c.id === convocatoria.id);
      
      if (!originalConvocatoria) {
        toast.error('Dados da convocatória não encontrados');
        return;
      }
      
      // Preparar dados para o gerador de PDF
      const pdfData = {
        // Dados do edificio
        buildingName: originalConvocatoria.building_name || '',
        buildingAddress: originalConvocatoria.building_address || '',
        postalCode: originalConvocatoria.postal_code || '',
        city: originalConvocatoria.city || 'Amadora',

        // Dados da convocatória
        assemblyNumber: originalConvocatoria.assembly_number || convocatoria.minute_number || '',
        assemblyType: originalConvocatoria.assembly_type === 'ordinary' ? 'ordinaria' : 'extraordinaria',
        meetingDate: originalConvocatoria.date || originalConvocatoria.meeting_date || '',
        meetingTime: originalConvocatoria.time || '18:00',
        meetingLocation: originalConvocatoria.location || originalConvocatoria.meeting_location || 'Hall do Prédio',

        // Segunda convocatória
        secondCallEnabled: originalConvocatoria.second_call_enabled !== false,
        secondCallDate: originalConvocatoria.second_call_date,
        secondCallTime: originalConvocatoria.second_call_time || '19:00',
        
        // Responsaveis
        administrator: originalConvocatoria.administrator || '',
        secretary: originalConvocatoria.secretary,
        
        // Agenda
        agendaItems: originalConvocatoria.agenda_items || [],
        
        // Legal
        legalReference: originalConvocatoria.legal_reference
      };
      
      // Gerar e baixar o PDF
      await ConvocatoriaPdfGenerator.generateAndDownload(pdfData);
      toast.success('PDF gerado com sucesso');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const handleEditConvocatoria = (convocatoria: any) => {
    // Reutilizar o workflow para edição
    setEditingConvocatoria(convocatoria);
    setShowWorkflow(true);
  };

  const handleDeleteConvocatoria = (convocatoria: any) => {
    setConvocatoriaToDelete(convocatoria);
  };

  const confirmDeleteConvocatoria = async () => {
    if (!convocatoriaToDelete) return;
    
    const result = await deleteConvocatoria(convocatoriaToDelete.id);
    if (result) {
      setConvocatoriaToDelete(null);
    }
  };

  if (showWorkflow) {
    return (
      <ConvocatoriaWorkflow
        onComplete={handleWorkflowComplete}
        onCancel={() => {
          setShowWorkflow(false);
          setEditingConvocatoria(null);
        }}
        initialData={editingConvocatoria}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Convocatórias</h1>
          <p className="text-muted-foreground mt-1">
            Gestão e redação de convocatórias de assembleias
          </p>
        </div>
        <Button 
          onClick={() => setShowWorkflow(true)}
          size="lg" 
          variant="workflow"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Convocatória
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">A carregar convocatórias...</span>
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
                    <p className="text-2xl font-bold">{convocatorias.length}</p>
                    <p className="text-sm text-muted-foreground">Convocatórias totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{convocatorias.filter(c => c.status === 'signed').length}</p>
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
                <p className="text-2xl font-bold">{convocatorias.filter(c => c.status === 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{convocatorias.filter(c => c.status === 'draft').length}</p>
                <p className="text-sm text-muted-foreground">Em rascunho</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Convocatórias */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Convocatórias</CardTitle>
          <CardDescription>
            Todas as convocatórias de assembleias registadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {convocatorias.length > 0 ? (
              convocatorias.map((convocatoria) => (
                <div
                  key={convocatoria.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className="text-2xl font-bold text-primary">{convocatoria.minute_number}</span>
                      <span className="text-xs text-muted-foreground">Nº</span>
                    </div>
                    <div className="border-l pl-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{convocatoria.title}</h3>
                        <Badge variant={convocatoria.type === 'ordinaria' ? 'default' : 'secondary'}>
                          {convocatoria.type === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>{new Date(convocatoria.date).toLocaleDateString('pt-PT')}</span>
                        <span>•</span>
                        <span>{convocatoria.time.split(':')[0] + 'h' + convocatoria.time.split(':')[1]}</span>
                        <span>•</span>
                        <span>0 itens</span>
                        {convocatoria.attendees && convocatoria.totalOwners && (
                          <>
                            <span>•</span>
                            <span>
                              {convocatoria.attendees}/{convocatoria.totalOwners} participantes 
                              ({Math.round((convocatoria.attendees / convocatoria.totalOwners) * 100)}%)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(convocatoria.status)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(convocatoria)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalhes
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleGeneratePDF(convocatoria)}
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
                        <DropdownMenuItem onClick={() => handleEditConvocatoria(convocatoria)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConvocatoria(convocatoria)}
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
                <h3 className="text-lg font-semibold text-muted-foreground">Não há convocatórias registadas</h3>
                <p className="text-muted-foreground mt-1">
                  Crie uma nova convocatória para registar uma assembleia
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Paginação */}
      {convocatorias.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <DataTablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              pageSizeOptions={[10, 20, 30, 50]}
            />
          </CardContent>
        </Card>
      )}
        </>
      )}
      
      {/* Alert Dialog para confirmar eliminação */}
      <AlertDialog open={!!convocatoriaToDelete} onOpenChange={(open) => !open && setConvocatoriaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar a convocatória nº {convocatoriaToDelete?.convocationNumber}?
              Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConvocatoria} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Convocatorias;