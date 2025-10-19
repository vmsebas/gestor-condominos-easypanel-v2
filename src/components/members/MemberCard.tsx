import React, { useState } from 'react';
import { Member } from '@/types/memberTypes';
import { formatCurrency, formatPhoneNumber, formatPermillage } from '@/utils/formatters';
import { useMembers } from '@/hooks/useMembers';
import { useNotifications } from '@/components/common/NotificationProvider';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Euro,
  Calculator
} from 'lucide-react';

import MemberFormDialog from './MemberFormDialog';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface MemberCardProps {
  member: Member;
  onEdit?: (member: Member) => void;
  onDelete?: (member: Member) => void;
  onView?: (member: Member) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  compact = false,
  className
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const { deleteMember, isLoading } = useMembers();
  const { success } = useNotifications();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(member);
    } else {
      setShowEditDialog(true);
    }
  };

  const handleDelete = async () => {
    const success = await deleteMember(member.id);
    if (success) {
      setShowDeleteDialog(false);
      onDelete?.(member);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(member);
    } else {
      setShowViewDialog(true);
    }
  };

  const handleEditSuccess = (updatedMember: Member) => {
    setShowEditDialog(false);
    success(`Membro ${updatedMember.name} atualizado`);
  };

  if (compact) {
    return (
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-3 w-3" />
                  <span>{member.fraction}</span>
                  {member.isOwner && <Badge variant="secondary" className="text-xs">Proprietário</Badge>}
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
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
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
  }

  return (
    <>
      <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Home className="h-3 w-3" />
                    <span>Fração {member.fraction}</span>
                  </div>
                  <div className="flex gap-1">
                    {member.isOwner && (
                      <Badge variant="secondary" className="text-xs">
                        Proprietário
                      </Badge>
                    )}
                    {member.isResident && (
                      <Badge variant="outline" className="text-xs">
                        Residente
                      </Badge>
                    )}
                  </div>
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
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Contactos */}
            <div className="space-y-2">
              {member.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatPhoneNumber(member.phone)}
                  </span>
                </div>
              )}
            </div>

            {/* Informações Financeiras */}
            {member.isOwner && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    <Calculator className="h-3 w-3" />
                    <span>Permilagem</span>
                  </div>
                  <p className="font-semibold">{formatPermillage(member.permillage)}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                    <Euro className="h-3 w-3" />
                    <span>Quota Mensal</span>
                  </div>
                  <p className="font-semibold">{formatCurrency(member.monthlyQuota || 0)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <MemberFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={member}
        onSuccess={handleEditSuccess}
      />

      {/* Dialog de Visualização */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Membro
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl font-bold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <div className="flex gap-2 mt-2">
                  {member.isOwner && <Badge variant="secondary">Proprietário</Badge>}
                  {member.isResident && <Badge variant="outline">Residente</Badge>}
                </div>
              </div>
            </div>

            {/* Informações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações Pessoais</h3>
                
                <div className="space-y-3">
                  {member.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  
                  {member.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{formatPhoneNumber(member.phone)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Propriedade</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>Fração {member.fraction}</span>
                  </div>
                  
                  {member.isOwner && (
                    <>
                      <div className="flex items-center gap-3">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <span>{formatPermillage(member.permillage)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(member.monthlyQuota || 0)} / mês</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        itemName={`o membro ${member.name}`}
        onConfirm={handleDelete}
        loading={isLoading}
      />
    </>
  );
};

export default MemberCard;