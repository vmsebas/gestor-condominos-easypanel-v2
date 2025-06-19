import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConvocatoriaWorkflow from '@/components/convocatorias/ConvocatoriaWorkflow';
import SegundaConvocatoriaManager from '@/components/convocatorias/SegundaConvocatoriaManager';
import ConvocatoriasDebug from '@/components/debug/ConvocatoriasDebug';
import { useConvocatorias, useUpdateConvocatoria, useDeleteConvocatoria } from '@/hooks/useNeonData';
import { useQueryClient } from '@tanstack/react-query';
import { exportToPdfEnhanced } from '@/utils/pdfExportUtils';
import ConvocatoriaPdfGenerator from '@/utils/convocatoriaPdfGenerator';
import { toast } from 'sonner';
import { Plus, FileText, Calendar, Users, Clock, CheckCircle, AlertCircle, Loader2, Download, Eye, Edit2, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Interface for the API response data
interface ApiConvocatoria {
  id: string;
  building_id: string;
  building_name: string;
  building_address: string;
  postal_code: string;
  assembly_number: string;
  assembly_type: string;
  meeting_date: string; // ISO date string
  time: string;
  location: string;
  second_call_enabled: boolean;
  second_call_time?: string;
  second_call_date?: string;
  administrator: string;
  secretary?: string;
  legal_reference: string;
  minutes_created: boolean;
  created_at: string;
  updated_at: string;
  city: string;
  agenda_items?: Array<{
    id: string;
    title: string;
    description?: string;
    order_index: number;
  }>;
}

// Interface for the frontend Convocatoria
interface Convocatoria {
  id: string;
  type: 'ordinaria' | 'extraordinaria';
  title: string;
  date: string;
  time: string;
  location: string;
  status: 'draft' | 'sent' | 'celebrated' | 'cancelled';
  attendees?: number;
  totalOwners?: number;
  agendaItems?: number;
  createdAt: string;
}

// Helper function to map API data to frontend format
const mapApiToConvocatoria = (apiData: ApiConvocatoria[]): Convocatoria[] => {
  return apiData.map(item => ({
    id: item.id,
    type: item.assembly_type === 'extraordinary' ? 'extraordinaria' : 'ordinaria',
    title: `Assembleia ${item.assembly_type === 'extraordinary' ? 'Extraordinária' : 'Ordinária'} - ${item.building_name}`,
    date: item.meeting_date.split('T')[0], // Extract date part from ISO string
    time: item.time,
    location: item.location || 'Por determinar',
    status: item.minutes_created ? 'celebrated' : 'sent',
    attendees: 0, // TODO: Get actual attendees count if available
    totalOwners: 0, // TODO: Get actual total owners count if available
    agendaItems: item.agenda_items?.length || 0, // Count agenda items
    createdAt: new Date(item.created_at).toISOString().split('T')[0],
  }));
};

const Convocatorias: React.FC = () => {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSegundaConvocatoriaModal, setShowSegundaConvocatoriaModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [convocatoriaToDelete, setConvocatoriaToDelete] = useState<Convocatoria | null>(null);
  const [editingConvocatoria, setEditingConvocatoria] = useState<Convocatoria | null>(null);
  const { data: apiData, isLoading, error } = useConvocatorias();
  const updateConvocatoriaMutation = useUpdateConvocatoria();
  const deleteConvocatoriaMutation = useDeleteConvocatoria();
  const queryClient = useQueryClient();
  
  // Transform API data to frontend format
  const convocatorias = React.useMemo(() => {
    console.log('Convocatorias Component - Raw API Data:', apiData);
    const mapped = apiData ? mapApiToConvocatoria(apiData) : [];
    console.log('Convocatorias Component - Mapped Data:', mapped);
    return mapped;
  }, [apiData]);

  const handleWorkflowComplete = (data: any) => {
    console.log('Convocatoria completada:', data);
    setShowWorkflow(false);
    
    // Invalidar cache do React Query para refrescar dados
    queryClient.invalidateQueries({ queryKey: ['convocatorias'] });
    
    // Mostrar toast de sucesso
    toast.success('Convocatória criada com sucesso!');
  };

  const handleViewDetails = (convocatoria: Convocatoria) => {
    setSelectedConvocatoria(convocatoria);
    setShowDetailsModal(true);
  };

  const handleConfigureSegundaConvocatoria = (convocatoria: Convocatoria) => {
    setSelectedConvocatoria(convocatoria);
    setShowSegundaConvocatoriaModal(true);
  };

  const handleSaveSegundaConvocatoria = async (data: any) => {
    if (!selectedConvocatoria) return;
    
    try {
      await updateConvocatoriaMutation.mutateAsync({
        id: selectedConvocatoria.id,
        data,
      });
      setShowSegundaConvocatoriaModal(false);
      toast.success('Segunda convocatória configurada com sucesso!');
    } catch (error) {
      console.error('Erro ao configurar segunda convocatória:', error);
      toast.error('Erro ao configurar segunda convocatória. Tente novamente.');
    }
  };

  const handleGeneratePDF = async (convocatoria: Convocatoria) => {
    try {
      setIsGeneratingPdf(true);
      
      // Buscar datos completos de la convocatoria desde la API si es necesario
      const fullConvocatoria = apiData?.find(c => c.id === convocatoria.id);
      
      if (!fullConvocatoria) {
        toast.error('Erro ao carregar dados da convocatória');
        return;
      }
      
      // Preparar datos para el generador de PDF
      const pdfData = {
        buildingName: fullConvocatoria.building_name || 'Edifício',
        buildingAddress: fullConvocatoria.building_address || '',
        postalCode: fullConvocatoria.postal_code || '',
        city: fullConvocatoria.city || '',
        assemblyNumber: fullConvocatoria.assembly_number || '',
        assemblyType: convocatoria.type,
        meetingDate: convocatoria.date,
        meetingTime: convocatoria.time,
        meetingLocation: convocatoria.location,
        secondCallEnabled: fullConvocatoria.second_call_enabled || false,
        secondCallDate: fullConvocatoria.second_call_date,
        secondCallTime: fullConvocatoria.second_call_time,
        administrator: fullConvocatoria.administrator || 'Administrador',
        secretary: fullConvocatoria.secretary,
        agendaItems: fullConvocatoria.agenda_items || [],
        legalReference: fullConvocatoria.legal_reference || 'Código Civil Português, artigos 1430.º e seguintes'
      };
      
      // Generar y descargar PDF
      await ConvocatoriaPdfGenerator.generateAndDownload(pdfData);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleEditConvocatoria = (convocatoria: Convocatoria) => {
    setEditingConvocatoria(convocatoria);
    setShowWorkflow(true);
  };

  const handleDeleteConvocatoria = (convocatoria: Convocatoria) => {
    setConvocatoriaToDelete(convocatoria);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!convocatoriaToDelete) return;
    
    try {
      await deleteConvocatoriaMutation.mutateAsync(convocatoriaToDelete.id);
      toast.success('Convocatória eliminada com sucesso!');
      setShowDeleteDialog(false);
      setConvocatoriaToDelete(null);
    } catch (error) {
      console.error('Erro ao eliminar convocatória:', error);
      toast.error('Erro ao eliminar convocatória. Tente novamente.');
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'sent':
        return <Badge variant="info">Enviada</Badge>;
      case 'celebrated':
        return <Badge variant="success">Celebrada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'celebrated':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (showWorkflow) {
    // Si estamos editando, convertir los datos al formato del workflow
    let initialData = {};
    if (editingConvocatoria) {
      const fullConvocatoria = apiData?.find(c => c.id === editingConvocatoria.id);
      if (fullConvocatoria) {
        initialData = {
          convocatoriaId: editingConvocatoria.id,
          meeting_type: fullConvocatoria.assembly_type,
          meeting_date: fullConvocatoria.meeting_date,
          meeting_time: fullConvocatoria.time,
          meeting_location: fullConvocatoria.location,
          building_id: fullConvocatoria.building_id,
          // Añadir más campos según sea necesario
        };
      }
    }
    
    return (
      <ConvocatoriaWorkflow
        initialData={initialData}
        onComplete={handleWorkflowComplete}
        onCancel={() => {
          setShowWorkflow(false);
          setEditingConvocatoria(null);
        }}
      />
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">A carregar convocatórias...</span>
      </div>
    );
  }

  // Handle error state with more details
  if (error) {
    console.error('Convocatorias component error:', error);
    
    // Extract error details from the error object
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado';
    const errorDetails = error instanceof Error ? error.stack : JSON.stringify(error, null, 2);
    
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Erro ao carregar as convocatórias
            </h3>
            <div className="mt-2 text-sm text-red-700 space-y-2">
              <p className="font-medium">{errorMessage}</p>
              
              {/* Show error details in development */}
              {import.meta.env.DEV && errorDetails && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                    Ver detalhes técnicos
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 text-red-800 text-xs rounded-md overflow-auto max-h-60">
                    {errorDetails}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-red-100 px-2.5 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={() => setShowWorkflow(true)}
                className="rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Criar nova convocatória
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (convocatorias.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Não há convocatórias</h3>
        <p className="mt-1 text-sm text-gray-500">
          Comece criando uma nova convocatória.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowWorkflow(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nova Convocatória
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Debug Component - Remove this in production */}
      {import.meta.env.DEV && <ConvocatoriasDebug />}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Convocatórias</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de assembleias de condóminos e convocatórias
          </p>
        </div>
        <Button 
          onClick={() => setShowWorkflow(true)}
          size="lg"
          variant="workflow"
          className="min-w-[200px]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Convocatória
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Convocatórias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">67%</p>
                <p className="text-sm text-muted-foreground">Participação média</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Celebrada</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Pendente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximas convocatorias */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Convocatórias</CardTitle>
          <CardDescription>
            Assembleias programadas para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {convocatorias.filter(c => c.status === 'sent').length > 0 ? (
            <div className="space-y-4">
              {convocatorias
                .filter(c => c.status === 'sent')
                .map((convocatoria) => (
                  <div
                    key={convocatoria.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{convocatoria.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>{new Date(convocatoria.date).toLocaleDateString('pt-PT')} às {convocatoria.time.split(':')[0] + 'h' + convocatoria.time.split(':')[1]}</span>
                          <span>•</span>
                          <span>{convocatoria.location}</span>
                          <span>•</span>
                          <span>{convocatoria.agendaItems || 0} itens</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(convocatoria.status)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(convocatoria)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver detalhes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGeneratePDF(convocatoria)}
                        disabled={isGeneratingPdf}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {isGeneratingPdf ? 'Gerando...' : 'PDF'}
                      </Button>
                      {convocatoria.status === 'sent' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureSegundaConvocatoria(convocatoria)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          2ª Conv.
                        </Button>
                      )}
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
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Não há convocatórias pendentes</h3>
              <p className="text-muted-foreground mt-1">
                Crie uma nova convocatória para programar uma assembleia
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de convocatorias */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Convocatórias</CardTitle>
          <CardDescription>
            Todas as assembleias celebradas e canceladas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {convocatorias.map((convocatoria) => {
              const fullConvocatoria = apiData?.find(c => c.id === convocatoria.id);
              const assemblyNumber = fullConvocatoria?.assembly_number || 'N/A';
              
              return (
                <div
                  key={convocatoria.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className="text-2xl font-bold text-primary">{assemblyNumber}</span>
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
                        <span>{convocatoria.agendaItems || 0} itens</span>
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
                      disabled={isGeneratingPdf}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    {convocatoria.status === 'sent' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleConfigureSegundaConvocatoria(convocatoria)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        2ª Conv.
                      </Button>
                    )}
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Detalhes da Convocatória</span>
            </DialogTitle>
            <DialogDescription>
              Informações completas da convocatória selecionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedConvocatoria && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="preview">Prévia PDF</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Informações da Reunião</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                    <p className="mt-1">{selectedConvocatoria.type === 'ordinaria' ? 'Assembleia Ordinária' : 'Assembleia Extraordinária'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedConvocatoria.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data</Label>
                    <p className="mt-1">{new Date(selectedConvocatoria.date).toLocaleDateString('pt-PT', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Hora</Label>
                    <p className="mt-1">{selectedConvocatoria.time.split(':')[0] + 'h' + selectedConvocatoria.time.split(':')[1]}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Local</Label>
                    <p className="mt-1">{selectedConvocatoria.location}</p>
                  </div>
                  {(() => {
                    const fullConvocatoria = apiData?.find(c => c.id === selectedConvocatoria.id);
                    if (fullConvocatoria?.second_call_enabled) {
                      return (
                        <>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">2ª Convocatória</Label>
                            <p className="mt-1">
                              {fullConvocatoria.second_call_date && fullConvocatoria.second_call_date !== fullConvocatoria.meeting_date
                                ? new Date(fullConvocatoria.second_call_date).toLocaleDateString('pt-PT')
                                : 'No mesmo dia'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Hora 2ª Conv.</Label>
                            <p className="mt-1">
                              {fullConvocatoria.second_call_time 
                                ? fullConvocatoria.second_call_time.split(':')[0] + 'h' + fullConvocatoria.second_call_time.split(':')[1]
                                : 'N/A'}
                            </p>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Estatísticas */}
              {(selectedConvocatoria.attendees || selectedConvocatoria.totalOwners) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Participação</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-blue-600">{selectedConvocatoria.attendees || 0}</p>
                      <p className="text-sm text-muted-foreground">Presentes</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-green-600">{selectedConvocatoria.totalOwners || 0}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedConvocatoria.attendees && selectedConvocatoria.totalOwners 
                          ? Math.round((selectedConvocatoria.attendees / selectedConvocatoria.totalOwners) * 100)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Participação</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agenda */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Ordem do Dia</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  {(() => {
                    const fullConvocatoria = apiData?.find(c => c.id === selectedConvocatoria.id);
                    const agendaItems = fullConvocatoria?.agenda_items;
                    
                    if (agendaItems && agendaItems.length > 0) {
                      return (
                        <div className="space-y-3">
                          {agendaItems.map((item: any, index: number) => (
                            <div key={item.id || index} className="flex">
                              <span className="font-bold text-blue-600 mr-3">{index + 1}.</span>
                              <div className="flex-1">
                                <span className="font-medium">{item.title}</span>
                                {item.description && (
                                  <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                                )}
                                {item.voting_required && (
                                  <span className="ml-2 text-xs text-blue-600">(Requer votação)</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-muted-foreground italic">
                          Não há itens na ordem do dia.
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>


              {/* Ações */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => handleGeneratePDF(selectedConvocatoria)}
                  disabled={isGeneratingPdf}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fechar
                </Button>
              </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                  <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm', padding: '25mm' }}>
                    <div dangerouslySetInnerHTML={{ 
                    __html: (() => {
                      const fullConvocatoria = apiData?.find(c => c.id === selectedConvocatoria.id);
                      if (!fullConvocatoria) return '<p>Erro ao carregar dados</p>';
                      
                      const pdfData = {
                        buildingName: fullConvocatoria.building_name || 'Edifício',
                        buildingAddress: fullConvocatoria.building_address || '',
                        postalCode: fullConvocatoria.postal_code || '',
                        city: fullConvocatoria.city || '',
                        assemblyNumber: fullConvocatoria.assembly_number || '',
                        assemblyType: selectedConvocatoria.type,
                        meetingDate: selectedConvocatoria.date,
                        meetingTime: selectedConvocatoria.time,
                        meetingLocation: selectedConvocatoria.location,
                        secondCallEnabled: fullConvocatoria.second_call_enabled || false,
                        secondCallDate: fullConvocatoria.second_call_date,
                        secondCallTime: fullConvocatoria.second_call_time,
                        administrator: fullConvocatoria.administrator || 'Administrador',
                        secretary: fullConvocatoria.secretary,
                        agendaItems: fullConvocatoria.agenda_items || [],
                        legalReference: fullConvocatoria.legal_reference || 'Código Civil Português, artigos 1430.º e seguintes'
                      };
                      
                      return ConvocatoriaPdfGenerator.generateHTML(pdfData);
                    })()
                  }} />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleGeneratePDF(selectedConvocatoria)}
                    disabled={isGeneratingPdf}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGeneratingPdf ? 'A gerar PDF...' : 'Descarregar PDF'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Segunda Convocatória */}
      <Dialog open={showSegundaConvocatoriaModal} onOpenChange={setShowSegundaConvocatoriaModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Configurar Segunda Convocatória</span>
            </DialogTitle>
            <DialogDescription>
              Configure uma segunda convocatória caso não seja atingido o quórum necessário
            </DialogDescription>
          </DialogHeader>
          
          {selectedConvocatoria && (
            <SegundaConvocatoriaManager
              convocatoria={selectedConvocatoria}
              onSave={handleSaveSegundaConvocatoria}
              onCancel={() => setShowSegundaConvocatoriaModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Convocatória</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza de que deseja eliminar esta convocatória? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Convocatorias;