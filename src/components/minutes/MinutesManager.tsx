import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import minutesService from '@/services/api/minutes';
import { Minute } from '@/types/minutesTypes';
import { formatDate } from '@/utils/formatters';
import { useNotifications } from '@/components/common/NotificationProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Download,
  Calendar,
  Users,
  Vote,
  FileSignature,
  Eye
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';
import MinuteForm from './forms/MinuteForm';
import MinuteViewer from './MinuteViewer';

interface MinutesManagerProps {
  className?: string;
}

const MinutesManager: React.FC<MinutesManagerProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  const { success, error } = useNotifications();
  
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved' | 'published'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMinute, setEditingMinute] = useState<Minute | null>(null);
  const [viewingMinute, setViewingMinute] = useState<Minute | null>(null);
  const [deletingMinute, setDeletingMinute] = useState<Minute | null>(null);

  // Carregar atas
  useEffect(() => {
    if (currentBuilding?.id) {
      loadMinutes();
    }
  }, [currentBuilding?.id]);

  const loadMinutes = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const data = await minutesAPI.getMinutes(currentBuilding.id);
      setMinutes(data);
    } catch (err) {
      console.error('Erro ao carregar atas:', err);
      error('Erro ao carregar lista de atas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMinute = async (minuteData: Partial<Minute>) => {
    try {
      const newMinute = await minutesAPI.createMinute({
        ...minuteData,
        buildingId: currentBuilding?.id
      });
      
      setMinutes(prev => [...prev, newMinute]);
      setShowAddDialog(false);
      success(`Ata "${newMinute.title}" criada com sucesso`);
    } catch (err) {
      console.error('Erro ao criar ata:', err);
      error('Erro ao criar ata');
    }
  };

  const handleUpdateMinute = async (minuteData: Partial<Minute>) => {
    if (!editingMinute) return;
    
    try {
      const updatedMinute = await minutesAPI.updateMinute(editingMinute.id, minuteData);
      
      setMinutes(prev => prev.map(m => m.id === editingMinute.id ? updatedMinute : m));
      setEditingMinute(null);
      success(`Ata atualizada com sucesso`);
    } catch (err) {
      console.error('Erro ao atualizar ata:', err);
      error('Erro ao atualizar ata');
    }
  };

  const handleDeleteMinute = async () => {
    if (!deletingMinute) return;

    try {
      await minutesAPI.deleteMinute(deletingMinute.id);
      
      setMinutes(prev => prev.filter(m => m.id !== deletingMinute.id));
      setDeletingMinute(null);
      success(`Ata "${deletingMinute.title}" eliminada`);
    } catch (err) {
      console.error('Erro ao eliminar ata:', err);
      error('Erro ao eliminar ata');
    }
  };

  const changeStatus = async (minuteId: string, newStatus: string) => {
    try {
      const updatedMinute = await minutesAPI.updateMinute(minuteId, { status: newStatus });
      
      setMinutes(prev => prev.map(m => m.id === minuteId ? updatedMinute : m));
      
      const statusLabels = {
        draft: 'rascunho',
        approved: 'aprovada',
        published: 'publicada'
      };
      
      success(`Ata marcada como ${statusLabels[newStatus as keyof typeof statusLabels]}`);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      error('Erro ao alterar status da ata');
    }
  };

  // Filtros
  const availableYears = [...new Set(minutes.map(m => new Date(m.meetingDate).getFullYear()))].sort((a, b) => b - a);
  
  const filteredMinutes = minutes.filter(minute => {
    const matchesSearch = minute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         minute.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || minute.status === statusFilter;
    
    const matchesYear = yearFilter === 'all' || 
                       new Date(minute.meetingDate).getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

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

  const MinuteCard: React.FC<{ minute: Minute }> = ({ minute }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              {getTypeIcon(minute.type)}
              <h3 className="font-semibold truncate">{minute.title}</h3>
              {getStatusBadge(minute.status)}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(minute.meetingDate)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{minute.attendeesCount || 0} participantes</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {minute.description || 'Sem descrição'}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewingMinute(minute)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Ata
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setEditingMinute(minute)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {minute.status === 'draft' && (
                <DropdownMenuItem onClick={() => changeStatus(minute.id, 'approved')}>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Marcar como Aprovada
                </DropdownMenuItem>
              )}
              
              {minute.status === 'approved' && (
                <DropdownMenuItem onClick={() => changeStatus(minute.id, 'published')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Publicar
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeletingMinute(minute)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir as atas de reunião.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estatísticas rápidas
  const totalMinutes = filteredMinutes.length;
  const draftMinutes = filteredMinutes.filter(m => m.status === 'draft').length;
  const approvedMinutes = filteredMinutes.filter(m => m.status === 'approved').length;
  const publishedMinutes = filteredMinutes.filter(m => m.status === 'published').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestão de Atas
                <Badge variant="secondary" className="ml-2">
                  {totalMinutes}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Atas de reunião do edifício {currentBuilding.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMinutes}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                onClick={() => setShowAddDialog(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Ata
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalMinutes}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{draftMinutes}</p>
              <p className="text-sm text-muted-foreground">Rascunhos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{approvedMinutes}</p>
              <p className="text-sm text-muted-foreground">Aprovadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{publishedMinutes}</p>
              <p className="text-sm text-muted-foreground">Publicadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Pesquisa */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar atas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ({totalMinutes})</SelectItem>
                  <SelectItem value="draft">Rascunhos ({draftMinutes})</SelectItem>
                  <SelectItem value="approved">Aprovadas ({approvedMinutes})</SelectItem>
                  <SelectItem value="published">Publicadas ({publishedMinutes})</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atas */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filteredMinutes.length === 0 ? (
        <EmptyList
          icon={<FileText className="h-full w-full" />}
          title="Nenhuma ata encontrada"
          description={searchTerm ? 
            `Nenhuma ata corresponde à pesquisa "${searchTerm}"` : 
            'Não há atas de reunião registadas para este edifício'
          }
          actionLabel="Criar Primeira Ata"
          onAction={() => setShowAddDialog(true)}
        />
      ) : (
        <Tabs value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="published">Publicadas</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMinutes.map((minute) => (
                <MinuteCard key={minute.id} minute={minute} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog de Nova Ata */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nova Ata de Reunião</DialogTitle>
          </DialogHeader>
          <MinuteForm
            onSubmit={handleCreateMinute}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Ata */}
      <Dialog open={!!editingMinute} onOpenChange={(open) => !open && setEditingMinute(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Ata</DialogTitle>
          </DialogHeader>
          {editingMinute && (
            <MinuteForm
              minute={editingMinute}
              onSubmit={handleUpdateMinute}
              onCancel={() => setEditingMinute(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualizar Ata */}
      <Dialog open={!!viewingMinute} onOpenChange={(open) => !open && setViewingMinute(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Ata</DialogTitle>
          </DialogHeader>
          {viewingMinute && (
            <MinuteViewer 
              minute={viewingMinute}
              onClose={() => setViewingMinute(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingMinute}
        onOpenChange={(open) => !open && setDeletingMinute(null)}
        itemName={`a ata "${deletingMinute?.title}"`}
        onConfirm={handleDeleteMinute}
      />
    </div>
  );
};

export default MinutesManager;