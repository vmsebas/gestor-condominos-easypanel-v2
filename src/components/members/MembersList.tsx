import React, { useState } from 'react';
import type { Member } from '@/types/database';
import { useMembers } from '@/hooks/useMembers';
import { useBuilding } from '@/hooks/useBuilding';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  RefreshCw,
  Download,
  UserPlus,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import MemberCard from './MemberCard';
import { EmptyMembers, EmptySearch, DataError } from '@/components/common/EmptyState';
import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import MemberFormDialog from './MemberFormDialog';

interface MembersListProps {
  onMemberSelect?: (member: Member) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const MembersList: React.FC<MembersListProps> = ({
  onMemberSelect,
  showActions = true,
  compact = false,
  className
}) => {
  const { currentBuilding } = useBuilding();
  const {
    members,
    isLoading,
    isRefreshing,
    searchTerm,
    setSearchTerm,
    filterOptions,
    setFilterOptions,
    refreshMembers,
    isEmpty,
    filteredCount,
    totalCount,
    pagination,
    changePage,
    changePageSize,
    setSortBy,
    sortBy: currentSortBy,
    sortDesc,
    toggleSortOrder
  } = useMembers();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Membros já vêm ordenados do backend
  const sortedMembers = members;

  const handleAddSuccess = (member: Member) => {
    setShowAddDialog(false);
    refreshMembers();
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterOptions({
      isOwner: undefined,
      isResident: undefined,
      hasEmail: undefined
    });
  };

  const exportMembers = () => {
    // Implementar exportação para CSV/Excel
    console.log('Exportar membros:', members);
  };

  if (!currentBuilding) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Selecione um edifício para ver os membros.
          </p>
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
                <Users className="h-5 w-5" />
                Membros
                {totalCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredCount !== totalCount ? `${filteredCount} de ${totalCount}` : totalCount}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestão de membros do edifício {currentBuilding.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMembers}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportMembers}
                disabled={isEmpty}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setShowAddDialog(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Adicionar Membro
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controles de Pesquisa e Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Pesquisa */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, fracção ou email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filtros
                    {(filterOptions.isOwner !== undefined || 
                      filterOptions.isResident !== undefined || 
                      filterOptions.hasEmail !== undefined) && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                        !
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuCheckboxItem
                    checked={filterOptions.isActive === true}
                    onCheckedChange={(checked) => 
                      setFilterOptions(prev => ({ 
                        ...prev, 
                        isActive: checked ? true : undefined 
                      }))
                    }
                  >
                    Apenas Ativos
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuCheckboxItem
                    checked={filterOptions.hasEmail === true}
                    onCheckedChange={(checked) => 
                      setFilterOptions(prev => ({ 
                        ...prev, 
                        hasEmail: checked ? true : undefined 
                      }))
                    }
                  >
                    Com Email
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={clearFilters}
                  >
                    Limpar Filtros
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Ordenação */}
              <Select value={currentSortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Por Apartamento</SelectItem>
                  <SelectItem value="name">Por Nome</SelectItem>
                  <SelectItem value="monthly_fee">Por Quota</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Ordem */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                title={sortDesc ? "Ordem decrescente" : "Ordem crescente"}
              >
                {sortDesc ? '↓' : '↑'}
              </Button>

              {/* Modo de Visualização */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros Ativos */}
          {(searchTerm || Object.values(filterOptions).some(v => v !== undefined)) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              
              {searchTerm && (
                <Badge variant="outline">
                  Pesquisa: "{searchTerm}"
                </Badge>
              )}
              
              {filterOptions.isActive && (
                <Badge variant="outline">Ativos</Badge>
              )}
              
              {filterOptions.hasEmail && (
                <Badge variant="outline">Com Email</Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                Limpar tudo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Membros */}
      <div>
        {isLoading ? (
          <ListSkeleton count={6} />
        ) : isEmpty ? (
          <EmptyMembers onAddMember={() => setShowAddDialog(true)} />
        ) : filteredCount === 0 ? (
          <EmptySearch 
            searchTerm={searchTerm} 
            onClearSearch={clearFilters}
          />
        ) : (
          <>
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {sortedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onView={onMemberSelect}
                  showActions={showActions}
                  compact={viewMode === 'list' || compact}
                  className="cursor-pointer"
                  onClick={() => onMemberSelect?.(member)}
                />
              ))}
            </div>

            {/* Controles de Paginação */}
            {pagination.totalPages > 1 && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} de {pagination.totalCount} membros
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page - 1)}
                        disabled={!pagination.hasPrevPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.page ? "default" : "outline"}
                              size="sm"
                              onClick={() => changePage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changePage(pagination.page + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Itens por página:</span>
                      <Select 
                        value={pagination.pageSize.toString()} 
                        onValueChange={(value) => changePageSize(parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Dialog de Adicionar Membro */}
      <MemberFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default MembersList;