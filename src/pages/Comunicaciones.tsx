import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Mail,
  MessageSquare,
  Plus,
  Send,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Loader2,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
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
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import LetterWorkflow from '@/components/letters/LetterWorkflow';
import TemplateManager from '@/components/letters/TemplateManager';
import CommunicationHistory from '@/components/letters/CommunicationHistory';
import { useLetters, useLetterTemplates } from '@/hooks/useLetters';
import { useBuilding } from '@/hooks/useBuilding';

const Comunicaciones: React.FC = () => {
  const { currentBuilding } = useBuilding();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState<any>(null);
  const [editingLetter, setEditingLetter] = useState<any>(null);

  // Use hooks
  const {
    letters,
    stats,
    isLoading: loadingLetters,
    pagination,
    deleteLetter,
    changePage,
    changePageSize,
    isDeleting
  } = useLetters();

  const {
    templates,
    isLoading: loadingTemplates
  } = useLetterTemplates();

  const buildingName = currentBuilding?.name || 'Edifício';

  const handleLetterCreated = () => {
    setShowCreateDialog(false);
    setEditingLetter(null);
  };

  const handleDeleteLetter = async () => {
    if (!letterToDelete) return;
    try {
      await deleteLetter(letterToDelete.id);
      setLetterToDelete(null);
    } catch (error) {
      // Error already handled by hook with toast
    }
  };

  const getStatusBadge = (letter: any) => {
    if (letter.delivery_confirmation) {
      return <Badge variant="default" className="bg-green-600">Entregue</Badge>;
    } else if (letter.sent_date) {
      return <Badge variant="default" className="bg-blue-600">Enviada</Badge>;
    } else {
      return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  const getSendMethodBadge = (method: string) => {
    switch (method) {
      case 'email':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20">Email</Badge>;
      case 'correio_certificado':
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/20">Correio Certificado</Badge>;
      case 'whatsapp':
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/20">WhatsApp</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comunicações</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de cartas e comunicações oficiais
          </p>
        </div>
        <Button
          size="lg"
          variant="workflow"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Carta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total || 0}</p>
                <p className="text-sm text-muted-foreground">Cartas enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.delivered || 0}</p>
                <p className="text-sm text-muted-foreground">Entregues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{templates.length}</p>
                <p className="text-sm text-muted-foreground">Modelos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="letters" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="letters">Cartas Enviadas</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="letters">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Cartas</CardTitle>
              <CardDescription>
                Todas as comunicações enviadas aos proprietários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLetters ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : letters.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Nenhuma carta enviada
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Comece por criar a sua primeira carta clicando no botão "Nova Carta"
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira carta
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de cartas */}
                  {letters.map((letter) => (
                    <div
                      key={letter.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {letter.subject}
                            </h3>
                            {getStatusBadge(letter)}
                            {getSendMethodBadge(letter.send_method)}
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              <strong>Para:</strong> {letter.recipient_name}
                              {letter.recipient_email && ` (${letter.recipient_email})`}
                            </p>
                            {letter.member_name && (
                              <p>
                                <strong>Membro:</strong> {letter.member_name}
                              </p>
                            )}
                            {letter.template_name && (
                              <p>
                                <strong>Modelo:</strong> {letter.template_name}
                              </p>
                            )}
                            <p>
                              <strong>Criada:</strong>{' '}
                              {format(new Date(letter.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                            </p>
                            {letter.sent_date && (
                              <p>
                                <strong>Enviada:</strong>{' '}
                                {format(new Date(letter.sent_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dropdown menu de ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              // TODO: Implementar visualização
                              toast.info('Funcionalidade em desenvolvimento');
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              // TODO: Implementar download
                              toast.info('Funcionalidade em desenvolvimento');
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingLetter(letter);
                              setShowCreateDialog(true);
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setLetterToDelete(letter)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {/* Paginação */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-6">
                      <DataTablePagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        pageSize={pagination.pageSize}
                        totalItems={pagination.total}
                        onPageChange={changePage}
                        onPageSizeChange={changePageSize}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <TemplateManager
            templates={templates}
            isLoading={loadingTemplates}
            onUseTemplate={(template) => {
              // TODO: Abrir workflow com template selecionado
              toast.info('Funcionalidade em desenvolvimento');
            }}
          />
        </TabsContent>

        <TabsContent value="history">
          <CommunicationHistory />
        </TabsContent>
      </Tabs>

      {/* Dialog - Workflow */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <LetterWorkflow
            buildingId={currentBuilding?.id}
            buildingName={buildingName}
            buildingAddress={currentBuilding?.address || ''}
            onComplete={handleLetterCreated}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingLetter(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* AlertDialog - Delete Confirmation */}
      <AlertDialog open={!!letterToDelete} onOpenChange={() => setLetterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Carta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar a carta "{letterToDelete?.subject}"?
              <br /><br />
              <span className="text-red-600 font-medium">
                Esta ação é irreversível e todos os dados da carta serão permanentemente eliminados.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLetter}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A eliminar...
                </>
              ) : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comunicaciones;
