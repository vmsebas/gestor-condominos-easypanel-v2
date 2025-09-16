import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import financeService from '@/services/api/finance';
import { TransactionCategory } from '@/types/finance/financeTypes';
import { useNotifications } from '@/components/common/NotificationProvider';

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
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Tag,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';
import CategoryForm from '../forms/CategoryForm';

interface CategoriesListProps {
  onCategorySelect?: (category: TransactionCategory) => void;
  showActions?: boolean;
  className?: string;
}

const CategoriesList: React.FC<CategoriesListProps> = ({
  onCategorySelect,
  showActions = true,
  className
}) => {
  const { currentBuilding } = useBuilding();
  const { success, error } = useNotifications();
  
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<TransactionCategory | null>(null);

  // Carregar categorias
  useEffect(() => {
    if (currentBuilding?.id) {
      loadCategories();
    }
  }, [currentBuilding?.id]);

  const loadCategories = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const data = await financeAPI.getCategories(currentBuilding.id);
      setCategories(data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      error('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData: Partial<TransactionCategory>) => {
    try {
      const newCategory = await financeAPI.createCategory({
        ...categoryData,
        buildingId: currentBuilding?.id
      });
      
      setCategories(prev => [...prev, newCategory]);
      setShowAddDialog(false);
      success(`Categoria ${newCategory.name} criada com sucesso`);
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
      error('Erro ao criar categoria');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      // Aqui implementaríamos a eliminação no serviço
      // await financeAPI.deleteCategory(deletingCategory.id);
      
      setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
      setDeletingCategory(null);
      success(`Categoria ${deletingCategory.name} eliminada`);
    } catch (err) {
      console.error('Erro ao eliminar categoria:', err);
      error('Erro ao eliminar categoria');
    }
  };

  // Filtros
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || category.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const incomeCategories = filteredCategories.filter(c => c.type === 'income');
  const expenseCategories = filteredCategories.filter(c => c.type === 'expense');

  const CategoryCard: React.FC<{ category: TransactionCategory }> = ({ category }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              category.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {category.type === 'income' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            
            <div>
              <h3 className="font-medium">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={category.type === 'income' ? 'success' : 'destructive'} className="text-xs">
                  {category.type === 'income' ? 'Receita' : 'Despesa'}
                </Badge>
                {category.buildingId ? (
                  <Badge variant="outline" className="text-xs">Personalizada</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Sistema</Badge>
                )}
              </div>
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCategorySelect?.(category)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </DropdownMenuItem>
                {category.buildingId && (
                  <>
                    <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeletingCategory(category)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir categorias.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categorias de Transações
                <Badge variant="secondary" className="ml-2">
                  {filteredCategories.length}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerir categorias para organizar receitas e despesas
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadCategories}
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
                Nova Categoria
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controles de Pesquisa */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                Todas ({categories.length})
              </Button>
              <Button
                variant={selectedType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('income')}
              >
                Receitas ({categories.filter(c => c.type === 'income').length})
              </Button>
              <Button
                variant={selectedType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('expense')}
              >
                Despesas ({categories.filter(c => c.type === 'expense').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      {isLoading ? (
        <ListSkeleton count={6} />
      ) : filteredCategories.length === 0 ? (
        <EmptyList
          icon={<Tag className="h-full w-full" />}
          title="Nenhuma categoria encontrada"
          description={searchTerm ? `Nenhuma categoria corresponde à pesquisa "${searchTerm}"` : 'Comece por criar a primeira categoria de transação'}
          actionLabel="Criar Categoria"
          onAction={() => setShowAddDialog(true)}
        />
      ) : (
        <Tabs value={selectedType} onValueChange={(value: any) => setSelectedType(value)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expense">Despesas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomeCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="expense" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog de Adicionar Categoria */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreateCategory}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Categoria */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={async (data) => {
                // Implementar edição
                setEditingCategory(null);
              }}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        itemName={`a categoria ${deletingCategory?.name}`}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
};

export default CategoriesList;