import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import financeService from '@/services/api/finance';
import { Arrear } from '@/types/finance/financeTypes';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useNotifications } from '@/components/common/NotificationProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  AlertTriangle, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Clock,
  Euro,
  User,
  Plus,
  RefreshCw,
  FileText,
  Mail,
  Phone
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';
import ArrearForm from '../forms/ArrearForm';

interface ArrearsListProps {
  showActions?: boolean;
  className?: string;
}

const ArrearsList: React.FC<ArrearsListProps> = ({
  showActions = true,
  className
}) => {
  const { currentBuilding } = useBuilding();
  const { success, error } = useNotifications();
  
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'resolved'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingArrear, setEditingArrear] = useState<Arrear | null>(null);
  const [deletingArrear, setDeletingArrear] = useState<Arrear | null>(null);

  // Carregar morosidade
  useEffect(() => {
    if (currentBuilding?.id) {
      loadArrears();
    }
  }, [currentBuilding?.id]);

  const loadArrears = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const data = await financeAPI.getArrears(currentBuilding.id);
      setArrears(data);
    } catch (err) {
      console.error('Erro ao carregar morosidade:', err);
      error('Erro ao carregar lista de morosidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateArrear = async (arrearData: Partial<Arrear>) => {
    try {
      const newArrear = await financeAPI.createArrear({
        ...arrearData,
        buildingId: currentBuilding?.id
      });
      
      setArrears(prev => [...prev, newArrear]);
      setShowAddDialog(false);
      success(`Morosidade para ${newArrear.memberName} registada`);
    } catch (err) {
      console.error('Erro ao criar morosidade:', err);
      error('Erro ao registar morosidade');
    }
  };

  const handleUpdateArrear = async (arrearData: Partial<Arrear>) => {
    if (!editingArrear) return;
    
    try {
      const updatedArrear = await financeAPI.updateArrear(editingArrear.id, arrearData);
      
      setArrears(prev => prev.map(a => a.id === editingArrear.id ? updatedArrear : a));
      setEditingArrear(null);
      success(`Morosidade atualizada`);
    } catch (err) {
      console.error('Erro ao atualizar morosidade:', err);
      error('Erro ao atualizar morosidade');
    }
  };

  const handleDeleteArrear = async () => {
    if (!deletingArrear) return;

    try {
      await financeAPI.deleteArrear(deletingArrear.id);
      
      setArrears(prev => prev.filter(a => a.id !== deletingArrear.id));
      setDeletingArrear(null);
      success(`Morosidade removida`);
    } catch (err) {
      console.error('Erro ao eliminar morosidade:', err);
      error('Erro ao eliminar morosidade');
    }
  };

  const markAsResolved = async (arrearId: string) => {
    try {
      const updatedArrear = await financeAPI.updateArrear(arrearId, { status: 'resolved' });
      
      setArrears(prev => prev.map(a => a.id === arrearId ? updatedArrear : a));
      success('Morosidade marcada como resolvida');
    } catch (err) {
      console.error('Erro ao resolver morosidade:', err);
      error('Erro ao resolver morosidade');
    }
  };

  // Filtros
  const filteredArrears = arrears.filter(arrear => {
    const matchesSearch = arrear.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arrear.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || arrear.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'resolved';
    
    if (status === 'resolved') {
      return <Badge variant="success">Resolvida</Badge>;
    }
    
    if (isOverdue) {
      return <Badge variant="destructive">Vencida</Badge>;
    }
    
    return <Badge variant="warning">Pendente</Badge>;
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const ArrearCard: React.FC<{ arrear: Arrear }> = ({ arrear }) => {
    const daysOverdue = getDaysOverdue(arrear.dueDate);
    const isOverdue = daysOverdue > 0 && arrear.status !== 'resolved';
    
    return (
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{arrear.memberName}</h3>
                {getStatusBadge(arrear.status, arrear.dueDate)}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Euro className="h-3 w-3" />
                  <span className="font-medium">{formatCurrency(arrear.amount)}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Vence: {formatDate(arrear.dueDate)}</span>
                </div>
              </div>
              
              {arrear.description && (
                <p className="text-sm text-muted-foreground">{arrear.description}</p>
              )}
              
              {isOverdue && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{daysOverdue} dias em atraso</span>
                </div>
              )}
            </div>

            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {arrear.status !== 'resolved' && (
                    <>
                      <DropdownMenuItem onClick={() => markAsResolved(arrear.id)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Marcar como Resolvida
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={() => setEditingArrear(arrear)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Lembrete
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem>
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Carta
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeletingArrear(arrear)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir a morosidade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estatísticas rápidas
  const totalArrears = filteredArrears.length;
  const pendingArrears = filteredArrears.filter(a => a.status === 'pending').length;
  const overdueArrears = filteredArrears.filter(a => 
    new Date(a.dueDate) < new Date() && a.status !== 'resolved'
  ).length;
  const totalAmount = filteredArrears.reduce((sum, a) => 
    a.status !== 'resolved' ? sum + a.amount : sum, 0
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Gestão de Morosidade
                <Badge variant="secondary" className="ml-2">
                  {totalArrears}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Controlo de pagamentos em atraso
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadArrears}
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
                Nova Morosidade
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
              <p className="text-2xl font-bold">{totalArrears}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingArrears}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{overdueArrears}</p>
              <p className="text-sm text-muted-foreground">Vencidas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              <p className="text-sm text-muted-foreground">Em Dívida</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Pesquisa */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por membro ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ({totalArrears})</SelectItem>
                <SelectItem value="pending">Pendentes ({pendingArrears})</SelectItem>
                <SelectItem value="overdue">Vencidas ({overdueArrears})</SelectItem>
                <SelectItem value="resolved">Resolvidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Morosidade */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filteredArrears.length === 0 ? (
        <EmptyList
          icon={<AlertTriangle className="h-full w-full" />}
          title="Nenhuma morosidade encontrada"
          description={searchTerm ? 
            `Nenhuma morosidade corresponde à pesquisa "${searchTerm}"` : 
            'Não há registos de morosidade para este edifício'
          }
          actionLabel="Registar Morosidade"
          onAction={() => setShowAddDialog(true)}
        />
      ) : (
        <div className="space-y-4">
          {filteredArrears.map((arrear) => (
            <ArrearCard key={arrear.id} arrear={arrear} />
          ))}
        </div>
      )}

      {/* Dialog de Nova Morosidade */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Nova Morosidade</DialogTitle>
          </DialogHeader>
          <ArrearForm
            onSubmit={handleCreateArrear}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Morosidade */}
      <Dialog open={!!editingArrear} onOpenChange={(open) => !open && setEditingArrear(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Morosidade</DialogTitle>
          </DialogHeader>
          {editingArrear && (
            <ArrearForm
              arrear={editingArrear}
              onSubmit={handleUpdateArrear}
              onCancel={() => setEditingArrear(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingArrear}
        onOpenChange={(open) => !open && setDeletingArrear(null)}
        itemName={`a morosidade de ${deletingArrear?.memberName}`}
        onConfirm={handleDeleteArrear}
      />
    </div>
  );
};

export default ArrearsList;