import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBuilding } from '@/hooks/useBuilding';
import membersService from '@/utils/db/membersService';
import { Arrear } from '@/types/finance/financeTypes';
import { Member } from '@/types/memberTypes';
import { formatCurrency, formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, X, AlertTriangle, Euro, User, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ArrearFormProps {
  arrear?: Arrear;
  onSubmit: (data: Partial<Arrear>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const arrearFormSchema = z.object({
  memberId: z.string().min(1, 'Membro é obrigatório'),
  amount: z.number()
    .min(0.01, 'Valor deve ser superior a 0€')
    .max(50000, 'Valor não pode exceder 50.000€'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().optional(),
  status: z.enum(['pending', 'overdue', 'resolved']).default('pending')
});

type ArrearFormData = z.infer<typeof arrearFormSchema>;

const ArrearForm: React.FC<ArrearFormProps> = ({
  arrear,
  onSubmit,
  onCancel,
  className
}) => {
  const { currentBuilding } = useBuilding();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const isEditing = !!arrear;

  const form = useForm<ArrearFormData>({
    resolver: zodResolver(arrearFormSchema),
    defaultValues: {
      memberId: arrear?.memberId || '',
      amount: arrear?.amount || 0,
      dueDate: arrear?.dueDate ? arrear.dueDate.split('T')[0] : '',
      description: arrear?.description || '',
      status: arrear?.status || 'pending',
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, watch } = form;

  // Carregar membros
  useEffect(() => {
    const loadMembers = async () => {
      if (!currentBuilding?.id) return;

      try {
        setIsLoadingMembers(true);
        const data = await membersService.getMembers(currentBuilding.id);
        setMembers(data);
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, [currentBuilding?.id]);

  const watchedValues = watch();
  const selectedMember = members.find(m => m.id === watchedValues.memberId);

  const handleFormSubmit = async (data: ArrearFormData) => {
    try {
      const selectedMember = members.find(m => m.id === data.memberId);
      
      await onSubmit({
        ...data,
        memberName: selectedMember?.name || '',
        buildingId: currentBuilding?.id,
      });
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  // Calcular dias até vencimento
  const getDaysUntilDue = () => {
    if (watchedValues.dueDate) {
      const today = new Date();
      const dueDate = new Date(watchedValues.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Seleção de Membro */}
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Membro *</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={isLoadingMembers || isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingMembers ? 'A carregar membros...' : 'Selecionar membro'
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{member.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            {member.type === 'owner' && (
                              <Badge variant="outline" className="text-xs">
                                Proprietário
                              </Badge>
                            )}
                            {member.apartment && (
                              <Badge variant="secondary" className="text-xs">
                                {member.apartment}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {isEditing ? 'Não é possível alterar o membro numa morosidade existente' : 'Selecione o membro em situação de morosidade'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor da Morosidade */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor em Dívida *</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    min={0}
                    max={50000}
                    step={0.01}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Valor total em dívida (em euros)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Data de Vencimento */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento *</FormLabel>
                <FormControl>
                  <Input 
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Data limite para pagamento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status (apenas na edição) */}
          {isEditing && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="overdue">Vencida</SelectItem>
                      <SelectItem value="resolved">Resolvida</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Estado atual da morosidade
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Detalhes sobre a morosidade (opcional)"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Informação adicional sobre a dívida
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resumo da Morosidade */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Resumo da Morosidade</h4>
              
              <div className="space-y-3">
                {selectedMember && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Membro:</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{selectedMember.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMember.apartment && `Apartamento ${selectedMember.apartment}`}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Valor:</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(watchedValues.amount || 0)}
                  </span>
                </div>
                
                {watchedValues.dueDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Vencimento:</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDate(watchedValues.dueDate)}</p>
                      <div className="flex items-center gap-1">
                        {daysUntilDue > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {daysUntilDue} dias restantes
                          </Badge>
                        ) : daysUntilDue === 0 ? (
                          <Badge variant="warning" className="text-xs">
                            Vence hoje
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            {Math.abs(daysUntilDue)} dias em atraso
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Avisos */}
              <div className="mt-4 space-y-2">
                {daysUntilDue < 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Esta morosidade já se encontra vencida</span>
                  </div>
                )}
                
                {watchedValues.amount && watchedValues.amount > 5000 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Valor elevado. Considere contacto direto com o membro.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">💡 Dicas para Gestão de Morosidade</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• <strong>Contacto preventivo:</strong> Entre em contacto antes do vencimento</div>
                <div>• <strong>Plano de pagamento:</strong> Ofereça opções de pagamento faseado</div>
                <div>• <strong>Documentação:</strong> Mantenha registo de todas as comunicações</div>
                <div>• <strong>Prazos justos:</strong> Defina prazos realistas para pagamento</div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" variant="white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Atualizar Morosidade' : 'Registar Morosidade'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ArrearForm;