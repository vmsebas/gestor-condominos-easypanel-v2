import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBuildings, useCreateMember } from '@/hooks/useNeonData';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Save, X } from 'lucide-react';

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

interface AddMemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({
  onSuccess,
  onCancel,
  className
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const createMemberMutation = useCreateMember();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      votes: 1,
      new_monthly_fee: '0.00',
      new_annual_fee: '0.00',
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      setIsSubmitting(true);
      await createMemberMutation.mutateAsync(data);
      toast.success('Membro criado com sucesso!');
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar membro:', error);
      toast.error('Erro ao criar membro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Adicionar Novo Membro</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Edifício */}
          <div>
            <Label htmlFor="building_id">Edifício *</Label>
            <Select onValueChange={(value) => setValue('building_id', value)}>
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
          <div className="flex justify-end space-x-3 pt-4">
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
              {isSubmitting ? 'Criando...' : 'Criar Membro'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddMemberForm;