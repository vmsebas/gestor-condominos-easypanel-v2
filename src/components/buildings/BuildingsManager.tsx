import React, { useState, useEffect } from 'react';
import { buildingsAPI } from '@/services/api/buildings';
import { Building } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Building as BuildingIcon, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Settings,
  Users,
  Euro,
  FileText,
  MapPin,
  Eye,
  Star
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import BuildingForm from './forms/BuildingForm';
import BuildingDetails from './BuildingDetails';

interface BuildingsManagerProps {
  onBuildingSelect?: (building: Building) => void;
  selectedBuildingId?: string;
  className?: string;
}

const BuildingsManager: React.FC<BuildingsManagerProps> = ({
  onBuildingSelect,
  selectedBuildingId,
  className
}) => {
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [viewingBuilding, setViewingBuilding] = useState<Building | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);
  
  // Estado de paginação
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

  // Carregar edifícios
  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      const response = await buildingsAPI.getAll();
      // La API devuelve { data: Building[], pagination: {...} }
      setBuildings(response.data || []);
      
      // Actualizar información de paginación si existe
      if (response.pagination) {
        setPagination(response.pagination);
      } else {
        // Si no hay paginación, actualizar con los valores por defecto
        setPagination(prev => ({
          ...prev,
          totalItems: response.data?.length || 0,
          totalPages: Math.ceil((response.data?.length || 0) / prev.pageSize)
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar edifícios:', err);
      toast.error('Erro ao carregar lista de edifícios');
      setBuildings([]); // Asegurar que siempre sea un array
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funciones de paginación
  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Si la API soporta paginación, recargar con los parámetros
    // loadBuildings(newPage, pagination.pageSize);
  };
  
  const changePageSize = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1, // Reset a la primera página cuando cambia el tamaño
      totalPages: Math.ceil(prev.totalItems / newPageSize)
    }));
    // Si la API soporta paginación, recargar con los parámetros
    // loadBuildings(1, newPageSize);
  };

  const handleCreateBuilding = async (buildingData: Partial<Building>) => {
    try {
      const newBuilding = await buildingsAPI.create(buildingData);
      
      setBuildings(prev => [...prev, newBuilding]);
      setShowAddDialog(false);
      toast.success(`Edifício "${newBuilding.name}" criado com sucesso`);
    } catch (err) {
      console.error('Erro ao criar edifício:', err);
      toast.error('Erro ao criar edifício');
    }
  };

  const handleUpdateBuilding = async (buildingData: Partial<Building>) => {
    if (!editingBuilding) return;
    
    try {
      const updatedBuilding = await buildingsAPI.update(editingBuilding.id, buildingData);
      
      setBuildings(prev => prev.map(b => b.id === editingBuilding.id ? updatedBuilding : b));
      setEditingBuilding(null);
      toast.success(`Edifício atualizado com sucesso`);
    } catch (err) {
      console.error('Erro ao atualizar edifício:', err);
      toast.error('Erro ao atualizar edifício');
    }
  };

  const handleDeleteBuilding = async () => {
    if (!deletingBuilding) return;

    try {
      await buildingsAPI.delete(deletingBuilding.id);
      
      setBuildings(prev => prev.filter(b => b.id !== deletingBuilding.id));
      setDeletingBuilding(null);
      toast.success(`Edifício "${deletingBuilding.name}" eliminado`);
    } catch (err) {
      console.error('Erro ao eliminar edifício:', err);
      toast.error('Erro ao eliminar edifício');
    }
  };

  const setFavoriteBuilding = async (buildingId: string, isFavorite: boolean) => {
    try {
      await buildingsAPI.update(buildingId, { isFavorite });
      
      setBuildings(prev => prev.map(b => 
        b.id === buildingId ? { ...b, isFavorite } : { ...b, isFavorite: false }
      ));
      
      toast.success(isFavorite ? 'Edifício marcado como favorito' : 'Favorito removido');
    } catch (err) {
      console.error('Erro ao definir favorito:', err);
      toast.error('Erro ao definir edifício favorito');
    }
  };

  // Filtros
  const filteredBuildings = buildings.filter(building => 
    building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const BuildingCard: React.FC<{ building: Building }> = ({ building }) => {
    const isSelected = building.id === selectedBuildingId;
    
    return (
      <Card 
        className={`hover:shadow-md transition-shadow cursor-pointer ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => onBuildingSelect?.(building)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2">
                <BuildingIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold truncate">{building.name}</h3>
                {building.isFavorite && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
              </div>
              
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{building.address}</span>
              </div>
              
              {building.city && (
                <p className="text-sm text-muted-foreground">{building.city}</p>
              )}
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{building.number_of_units || 0} frações</span>
                </div>
                
                {building.default_monthly_fee && (
                  <div className="flex items-center space-x-1">
                    <Euro className="h-3 w-3 text-muted-foreground" />
                    <span>{formatCurrency(parseFloat(building.default_monthly_fee))}/mês</span>
                  </div>
                )}
              </div>
              
              {building.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {building.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-1 ml-2">
              {isSelected && (
                <Badge variant="default" className="text-xs">
                  Selecionado
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setViewingBuilding(building);
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onBuildingSelect?.(building);
                  }}>
                    <BuildingIcon className="h-4 w-4 mr-2" />
                    Selecionar
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setFavoriteBuilding(building.id, !building.isFavorite);
                  }}>
                    <Star className="h-4 w-4 mr-2" />
                    {building.isFavorite ? 'Remover Favorito' : 'Marcar Favorito'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setEditingBuilding(building);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    // Navegar para configurações
                  }}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingBuilding(building);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Estatísticas rápidas
  const totalBuildings = filteredBuildings.length;
  const favoriteBuildings = filteredBuildings.filter(b => b.isFavorite).length;
  const totalUnits = filteredBuildings.reduce((sum, b) => sum + (b.totalUnits || 0), 0);
  const averageQuota = filteredBuildings.length > 0 ? 
    filteredBuildings.reduce((sum, b) => sum + (b.baseQuota || 0), 0) / filteredBuildings.length : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5" />
                Gestão de Edifícios
                <Badge variant="secondary" className="ml-2">
                  {totalBuildings}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerir informações e configurações dos edifícios
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadBuildings}
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
                Novo Edifício
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
              <p className="text-2xl font-bold">{totalBuildings}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{favoriteBuildings}</p>
              <p className="text-sm text-muted-foreground">Favoritos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalUnits}</p>
              <p className="text-sm text-muted-foreground">Frações</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(averageQuota)}</p>
              <p className="text-sm text-muted-foreground">Quota Média</p>
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
                  placeholder="Pesquisar por nome, morada ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Edifícios */}
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : filteredBuildings.length === 0 ? (
        <EmptyList
          icon={<BuildingIcon className="h-full w-full" />}
          title="Nenhum edifício encontrado"
          description={searchTerm ? 
            `Nenhum edifício corresponde à pesquisa "${searchTerm}"` : 
            'Não há edifícios registados. Comece por criar o primeiro edifício.'
          }
          actionLabel="Criar Primeiro Edifício"
          onAction={() => setShowAddDialog(true)}
        />
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos ({totalBuildings})</TabsTrigger>
            <TabsTrigger value="favorites">Favoritos ({favoriteBuildings})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBuildings.map((building) => (
                <BuildingCard key={building.id} building={building} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBuildings.filter(b => b.isFavorite).map((building) => (
                <BuildingCard key={building.id} building={building} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Paginação */}
      {buildings.length > 0 && (
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

      {/* Dialog de Novo Edifício */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Novo Edifício</DialogTitle>
          </DialogHeader>
          <BuildingForm
            onSubmit={handleCreateBuilding}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Edifício */}
      <Dialog open={!!editingBuilding} onOpenChange={(open) => !open && setEditingBuilding(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Edifício</DialogTitle>
          </DialogHeader>
          {editingBuilding && (
            <BuildingForm
              building={editingBuilding}
              onSubmit={handleUpdateBuilding}
              onCancel={() => setEditingBuilding(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Edifício */}
      <Dialog open={!!viewingBuilding} onOpenChange={(open) => !open && setViewingBuilding(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Edifício</DialogTitle>
          </DialogHeader>
          {viewingBuilding && (
            <BuildingDetails 
              building={viewingBuilding}
              onClose={() => setViewingBuilding(null)}
              onEdit={() => {
                setViewingBuilding(null);
                setEditingBuilding(viewingBuilding);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingBuilding}
        onOpenChange={(open) => !open && setDeletingBuilding(null)}
        itemName={`o edifício "${deletingBuilding?.name}"`}
        onConfirm={handleDeleteBuilding}
        warningMessage="Esta ação eliminará também todos os dados associados (membros, atas, finanças, etc.)"
      />
    </div>
  );
};

export default BuildingsManager;