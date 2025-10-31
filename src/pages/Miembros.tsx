import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Phone, Home, Loader2, User, Euro, Eye, Edit3, Trash2, MoreVertical, Download, Upload } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMembers, exportMembersCSV, importMembersCSV } from '@/lib/api';
import MemberFormDialog from '@/components/members/MemberFormDialog';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import axios from 'axios';

const Miembros: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: membersResponse, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers(),
  });

  const membersData = membersResponse?.data?.members || [];

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await axios.delete(`/api/members/${memberId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
  const navigate = useNavigate();
  
  // Dialog states
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  
  const handleCreateMember = () => {
    setFormMode('create');
    setSelectedMember(null);
    setMemberFormOpen(true);
  };
  
  const handleEditMember = (member: any) => {
    setFormMode('edit');
    setSelectedMember(member);
    setMemberFormOpen(true);
  };
  
  const handleDeleteMember = (member: any) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await deleteMemberMutation.mutateAsync(memberToDelete.id);
      toast.success('Membro eliminado com sucesso!');
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Erro ao eliminar membro');
    }
  };

  const handleExportCSV = async () => {
    try {
      const BUILDING_ID = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc'; // Hardcoded for now
      const csvBlob = await exportMembersCSV(BUILDING_ID);

      // Create download link
      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `membros_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CSV exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erro ao exportar CSV');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const BUILDING_ID = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc'; // Hardcoded for now
      const result = await importMembersCSV(BUILDING_ID, file);

      queryClient.invalidateQueries({ queryKey: ['members'] });

      toast.success(
        `Importação concluída! ${result.data.created} criados, ${result.data.updated} atualizados${
          result.data.errors > 0 ? `, ${result.data.errors} erros` : ''
        }`
      );
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast.error(`Erro ao importar CSV: ${error.response?.data?.error || error.message}`);
    }

    // Reset input
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">A carregar membros...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>Erro ao carregar os membros: {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Membros</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de proprietários e residentes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="lg" variant="outline" onClick={handleExportCSV}>
            <Download className="h-5 w-5 mr-2" />
            Exportar CSV
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => document.getElementById('csv-upload')?.click()}
          >
            <Upload className="h-5 w-5 mr-2" />
            Importar CSV
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCSV}
          />
          <Button size="lg" variant="workflow" onClick={handleCreateMember}>
            <UserPlus className="h-5 w-5 mr-2" />
            Novo Membro
          </Button>
        </div>
      </div>

      {membersData && membersData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {membersData.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Home className="h-4 w-4 mr-1" />
                      Fração {member.fraction} - {member.apartment}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <div className="w-24 text-muted-foreground">Votos</div>
                    <Badge variant="outline">{member.votes}</Badge>
                  </div>
                  {member.email && (
                    <div className="flex items-center text-sm">
                      <div className="w-24 text-muted-foreground">Email</div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {member.email}
                      </div>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center text-sm">
                      <div className="w-24 text-muted-foreground">Telefone</div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {member.phone}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Quota Mensal</div>
                      <div className="flex items-center font-medium">
                        <Euro className="h-4 w-4 mr-1" />
                        {member.new_monthly_fee || '0.00'}
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Quota Anual</div>
                      <div className="flex items-center font-medium">
                        <Euro className="h-4 w-4 mr-1" />
                        {member.new_annual_fee || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">
                      Atualizado em {format(new Date(member.updated_at), 'PP', { locale: pt })}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/miembros/${member.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMember(member)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/miembros/${member.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Perfil Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            Nenhum membro encontrado
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Adicione um novo membro para começar a gerir o seu condomínio
          </p>
        </div>
      )}
      
      {/* Member Form Dialog */}
      <MemberFormDialog
        isOpen={memberFormOpen}
        onClose={() => setMemberFormOpen(false)}
        member={selectedMember}
        mode={formMode}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar o membro <strong>{memberToDelete?.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A eliminar...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Miembros;