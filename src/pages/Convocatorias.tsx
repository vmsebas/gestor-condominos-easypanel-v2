import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConvocatoriaWorkflow from '@/components/convocatorias/ConvocatoriaWorkflow';
import SendCommunicationDialog from '@/components/communications/SendCommunicationDialog';
import { ScrollText, Plus, Calendar, Users, FileText, Clock, CheckCircle, Loader2, Home, Eye, Download, Edit2, Trash2, MoreVertical, Send, AlertCircle, FileSignature } from 'lucide-react';
import { useConvocatorias } from '@/hooks/useConvocatorias';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateConvocatoriaPDF } from '@/lib/pdfGenerator';
import { formatDatePortuguese } from '@/lib/communicationTemplates';
import type { TemplateData } from '@/lib/communicationTemplates';
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
import { format, isPast, isToday, isFuture, parseISO } from 'date-fns';
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
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [convocatoriaToSend, setConvocatoriaToSend] = useState<any>(null);
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
  
  // Transform API data to match our UI needs (incluindo dados de actas)
  const convocatorias = convocatoriasData?.map(convocatoria => {
    const dateString = convocatoria.meeting_date || convocatoria.date;
    const formattedDate = dateString ? dateString.split('T')[0] : '';

    return {
      id: convocatoria.id,
      assembly_number: convocatoria.assembly_number,
      type: convocatoria.assembly_type === 'ordinary' ? 'ordinaria' : 'extraordinaria',
      title: `Assembleia ${convocatoria.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'} - ${convocatoria.building_name || 'Condomino Buraca 1'}`,
      date: formattedDate,
      time: convocatoria.meeting_time || convocatoria.time || '18:00',
      location: convocatoria.location || 'Por determinar',
      status: convocatoria.status,
      attendees: 0, // This would come from attendees data if available
      totalOwners: 20, // This would come from building data
      minute_number: convocatoria.minute_number || convocatoria.assembly_number,
      createdAt: convocatoria.created_at,
      convocatoria_id: convocatoria.convocatoria_id,
      agenda_items: convocatoria.agenda_items || [],
      // Dados da acta relacionada
      minutes_created: convocatoria.minutes_created,
      minute_id: convocatoria.minute_id,
      minute_status: convocatoria.minute_status,
      minute_meeting_date: convocatoria.minute_meeting_date,
      minute_signed_date: convocatoria.minute_signed_date,
      // Convocatoria data original para outros usos
      building_id: convocatoria.building_id,
      building_name: convocatoria.building_name,
      building_address: convocatoria.building_address
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
      case 'sent':
        return <Badge variant="default">Enviada</Badge>;
      case 'completed':
        return <Badge variant="info">Completada</Badge>;
      case 'signed':
        return <Badge variant="success">Celebrada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * Determina qué acciones están disponibles según el estado de la convocatoria
   * LÓGICA DE NEGOCIO según legislación portuguesa
   */
  const getAvailableActions = (convocatoria: any) => {
    const meetingDate = parseISO(convocatoria.date);
    const isReunionDay = isToday(meetingDate);
    const isAfterReunion = isPast(meetingDate);
    const hasActa = convocatoria.minutes_created && convocatoria.minute_id;

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
    if (convocatoria.status === 'draft') {
      actions.canEdit = true;
      actions.canSend = true;
      actions.canDelete = true;
      return actions;
    }

    // CONVOCATORIA ENVIADA
    if (convocatoria.status === 'sent') {
      // Reunión futura - solo visualizar y generar PDF
      if (isFuture(meetingDate)) {
        // No se puede editar después de enviar (requisito legal)
        return actions;
      }

      // DÍA DE LA REUNIÓN - puede crear acta
      if (isReunionDay && !hasActa) {
        actions.canCreateActa = true;
        return actions;
      }

      // DESPUÉS DE LA REUNIÓN
      if (isAfterReunion) {
        if (hasActa) {
          // Tiene acta - puede ver y distribuir
          actions.canViewActa = true;
          if (convocatoria.minute_status === 'signed') {
            actions.canDistributeActa = true;
          }
        } else {
          // NO tiene acta - ALERTA
          actions.canCreateActa = true;
          actions.showWarning = true;
          actions.warningMessage = 'Reunião realizada sem acta registada';
        }
        return actions;
      }
    }

    return actions;
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

      console.log('📄 Gerando PDF da convocatória:', originalConvocatoria);

      // Preparar dados no formato TemplateData para o gerador de PDF
      const templateData: TemplateData = {
        building_name: originalConvocatoria.building_name || 'Edifício',
        building_address: originalConvocatoria.building_address || '',
        building_postal_code: originalConvocatoria.postal_code || '',
        building_city: originalConvocatoria.city || '',
        member_name: '', // Não aplicável para convocatória geral
        assembly_type: originalConvocatoria.assembly_type || 'ordinary',
        assembly_number: originalConvocatoria.assembly_number,
        meeting_date: originalConvocatoria.date || originalConvocatoria.meeting_date
          ? formatDatePortuguese(originalConvocatoria.date || originalConvocatoria.meeting_date)
          : '',
        meeting_time: originalConvocatoria.time || originalConvocatoria.meeting_time || '18:00',
        first_call_time: originalConvocatoria.first_call_time || originalConvocatoria.time || '18:00',
        second_call_time: originalConvocatoria.second_call_time || '19:00',
        location: originalConvocatoria.location || originalConvocatoria.meeting_location || 'Local a definir',
        agenda_items: originalConvocatoria.agenda_items || [],
        convocatoria_number: originalConvocatoria.assembly_number,
        sender_name: originalConvocatoria.administrator || 'A Administração',
        sender_role: 'Administrador do Condomínio'
      };

      console.log('📄 Template data preparado:', templateData);

      // Gerar e baixar o PDF usando função simples e funcional
      generateConvocatoriaPDF(templateData, true);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF da convocatória');
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

  const handleSendConvocatoria = (convocatoria: any) => {
    // Find original data with all fields
    const originalConvocatoria = convocatoriasData?.find(c => c.id === convocatoria.id);
    console.log('📤 Sending convocatoria:', originalConvocatoria);
    console.log('📤 Agenda items:', originalConvocatoria?.agenda_items);
    setConvocatoriaToSend(originalConvocatoria || convocatoria);
    setShowSendDialog(true);
  };

  /**
   * Cria nova acta a partir de uma convocatoria
   */
  const handleCreateActa = (convocatoria: any) => {
    // Navegar para workflow de acta com convocatoria_id
    navigate(`/actas/nova?convocatoria=${convocatoria.id}`);
  };

  /**
   * Visualiza acta relacionada
   */
  const handleViewActa = (convocatoria: any) => {
    if (convocatoria.minute_id) {
      navigate(`/actas/${convocatoria.minute_id}`);
    }
  };

  /**
   * Distribui acta assinada
   */
  const handleDistributeActa = (convocatoria: any) => {
    // TODO: Implementar distribución de acta
    toast.info('Funcionalidade de distribuição em desenvolvimento');
  };

  if (showWorkflow) {
    // Get building data from first convocatoria or use default
    const buildingData = convocatoriasData?.[0] || {};
    const buildingId = buildingData.building_id || 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';
    const buildingName = buildingData.building_name || 'Condomino Buraca 1';
    const buildingAddress = buildingData.building_address || 'Estrada da Circunvalação, nº 1';

    return (
      <ConvocatoriaWorkflow
        buildingId={buildingId}
        initialData={{
          ...editingConvocatoria,
          building_id: buildingId,
          building_name: buildingName,
          building_address: buildingAddress,
        }}
        onComplete={handleWorkflowComplete}
        onCancel={() => {
          setShowWorkflow(false);
          setEditingConvocatoria(null);
        }}
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
              convocatorias.map((convocatoria) => {
                const actions = getAvailableActions(convocatoria);
                const meetingDate = parseISO(convocatoria.date);
                const isAfterMeeting = isPast(meetingDate);

                return (
                <div
                  key={convocatoria.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className="text-2xl font-bold text-primary">{convocatoria.assembly_number}</span>
                      <span className="text-xs text-muted-foreground">Nº</span>
                    </div>
                    <div className="border-l pl-4 flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{convocatoria.title}</h3>
                        <Badge variant={convocatoria.type === 'ordinaria' ? 'default' : 'secondary'}>
                          {convocatoria.type === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}
                        </Badge>
                        {getStatusBadge(convocatoria.status)}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(convocatoria.date).toLocaleDateString('pt-PT')}
                        </span>
                        <span>•</span>
                        <span>{convocatoria.time.split(':')[0] + 'h' + convocatoria.time.split(':')[1]}</span>
                        <span>•</span>
                        <span>{convocatoria.agenda_items?.length || 0} pontos</span>
                      </div>

                      {/* Mostrar Acta Relacionada */}
                      {convocatoria.minute_id && (
                        <div className="mt-2 flex items-center space-x-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">└─</span>
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Acta #{convocatoria.minute_number} {convocatoria.minute_status === 'signed' ? 'assinada' : 'em rascunho'}
                          </span>
                          {convocatoria.minute_meeting_date && (
                            <span className="text-muted-foreground">
                              · {new Date(convocatoria.minute_meeting_date).toLocaleDateString('pt-PT')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Alerta de Reunión Sin Acta */}
                      {actions.showWarning && (
                        <div className="mt-2 flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">{actions.warningMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Botões Contextuais Dinâmicos baseados em getAvailableActions() */}

                    {/* Botão Criar Acta - Prioridade ALTA */}
                    {actions.canCreateActa && (
                      <Button
                        variant={actions.showWarning ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleCreateActa(convocatoria)}
                      >
                        <FileSignature className="h-4 w-4 mr-1" />
                        Criar Acta
                      </Button>
                    )}

                    {/* Botão Ver Acta */}
                    {actions.canViewActa && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewActa(convocatoria)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Acta
                      </Button>
                    )}

                    {/* Botão Distribuir Acta */}
                    {actions.canDistributeActa && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleDistributeActa(convocatoria)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Distribuir
                      </Button>
                    )}

                    {/* Botão Enviar Convocatoria */}
                    {actions.canSend && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSendConvocatoria(convocatoria)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Enviar
                      </Button>
                    )}

                    {/* Botão Editar */}
                    {actions.canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditConvocatoria(convocatoria)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    )}

                    {/* Separador visual se tem ações */}
                    {(actions.canCreateActa || actions.canViewActa || actions.canDistributeActa || actions.canSend || actions.canEdit) && (
                      <div className="border-l h-6 mx-1" />
                    )}

                    {/* Botões Sempre Disponíveis */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(convocatoria)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGeneratePDF(convocatoria)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>

                    {/* Menu Dropdown para ações secundárias */}
                    {(actions.canDelete || !actions.canEdit) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações adicionais</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {actions.canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteConvocatoria(convocatoria)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                          {!actions.canEdit && (
                            <DropdownMenuItem disabled>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Não editável (enviada)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })
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

      {/* Send Communication Dialog */}
      {convocatoriaToSend && (
        <SendCommunicationDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          communicationType="convocatoria"
          buildingId={convocatoriaToSend.building_id}
          buildingName={convocatoriaToSend.building_name || 'Edifício'}
          buildingAddress={convocatoriaToSend.building_address || ''}
          communicationData={convocatoriaToSend}
          onSendComplete={() => {
            toast.success('Comunicações enviadas!');
            setShowSendDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default Convocatorias;