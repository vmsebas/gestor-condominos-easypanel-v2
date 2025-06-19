import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBuildings, useUpdateMember, useDeleteMember } from '@/hooks/useNeonData';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserCog, Save, X, Trash } from 'lucide-react';

const memberSchema = z.object({
  building_id: z.string().min(1, 'Edifício é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  apartment: z.string().min(1, 'Apartamento é obrigatório'),
  fraction: z.string().min(1, 'Fração é obrigatória'),
  votes: z.number().min(1, 'Número de votos deve ser maior que 0'),
  new_monthly_fee: z.string().min(1, 'Taxa mensal é obrigatória'),
  new_annual_fee: z.string().min(1, 'Taxa anual é obrigatória'),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface EditMemberFormProps {
  member: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({
  member,
  onSuccess,
  onCancel,
  className
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      building_id: member?.building_id || '',
      name: member?.name || '',
      email: member?.email || '',
      phone: member?.phone || '',
      apartment: member?.apartment || '',
      fraction: member?.fraction || '',
      votes: member?.votes || 1,
      new_monthly_fee: member?.new_monthly_fee || '0.00',
      new_annual_fee: member?.new_annual_fee || '0.00',
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      setIsSubmitting(true);
      await updateMemberMutation.mutateAsync({
        id: member.id,
        data,
      });
      toast.success('Membro atualizado com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      toast.error('Erro ao atualizar membro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMemberMutation.mutateAsync(member.id);
      toast.success('Membro removido com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCog className="h-5 w-5" />
          <span>Editar Membro</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Edifício */}
          <div>
            <Label htmlFor="building_id">Edifício *</Label>
            <Select 
              onValueChange={(value) => setValue('building_id', value)}
              defaultValue={member?.building_id}
            >
              <SelectTrigger className={errors.building_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o edifício" />
              </SelectTrigger>
              <SelectContent>
                {buildingsLoading ? (
                  <SelectItem value="" disabled>Carregando...</SelectItem>
                ) : (
                  buildings?.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.building_id && (
              <p className="text-sm text-red-600 mt-1">{errors.building_id.message}</p>
            )}
          </div>

          {/* Nome */}
          <div>
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="+351 912 345 678"
              {...register('phone')}
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Apartamento e Fração */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apartment">Apartamento *</Label>
              <Input
                id="apartment"
                placeholder="Ex: 3A"
                {...register('apartment')}
                className={errors.apartment ? 'border-red-500' : ''}
              />
              {errors.apartment && (
                <p className="text-sm text-red-600 mt-1">{errors.apartment.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="fraction">Fração *</Label>
              <Input
                id="fraction"
                placeholder="Ex: A"
                {...register('fraction')}
                className={errors.fraction ? 'border-red-500' : ''}
              />
              {errors.fraction && (
                <p className="text-sm text-red-600 mt-1">{errors.fraction.message}</p>
              )}
            </div>
          </div>

          {/* Votos */}
          <div>
            <Label htmlFor="votes">Número de Votos *</Label>
            <Input
              id="votes"
              type="number"
              min="1"
              {...register('votes', { 
                setValueAs: (value) => parseInt(value) || 1 
              })}
              className={errors.votes ? 'border-red-500' : ''}
            />
            {errors.votes && (
              <p className="text-sm text-red-600 mt-1">{errors.votes.message}</p>
            )}
          </div>

          {/* Taxas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new_monthly_fee">Taxa Mensal (€) *</Label>
              <Input
                id="new_monthly_fee"
                placeholder="0.00"
                {...register('new_monthly_fee')}
                className={errors.new_monthly_fee ? 'border-red-500' : ''}
              />
              {errors.new_monthly_fee && (
                <p className="text-sm text-red-600 mt-1">{errors.new_monthly_fee.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="new_annual_fee">Taxa Anual (€) *</Label>
              <Input
                id="new_annual_fee"
                placeholder="0.00"
                {...register('new_annual_fee')}
                className={errors.new_annual_fee ? 'border-red-500' : ''}
              />
              {errors.new_annual_fee && (
                <p className="text-sm text-red-600 mt-1">{errors.new_annual_fee.message}</p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between pt-4">
            {/* Botão Remover */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                  <Trash className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover o membro "{member?.name}"? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Removendo...' : 'Remover'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Botões Cancelar/Salvar */}
            <div className="flex space-x-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting || buildingsLoading}
                className="min-w-[120px]"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditMemberForm;