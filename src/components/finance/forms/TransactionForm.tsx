import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Euro, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useBuildings, useCreateTransaction, useUpdateTransaction } from '@/hooks/useNeonData';
import { toast } from 'sonner';

const transactionSchema = z.object({
  building_id: z.string().min(1, 'Edifício é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que 0'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  date: z.date({
    required_error: 'Data é obrigatória',
  }),
  type: z.enum(['income', 'expense'], {
    required_error: 'Tipo é obrigatório',
  }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSuccess,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(
    transaction?.date ? new Date(transaction.date) : new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: buildings, isLoading: buildingsLoading } = useBuildings();
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      building_id: transaction?.building_id || '',
      amount: transaction?.amount ? Math.abs(transaction.amount) : 0,
      description: transaction?.description || '',
      category: transaction?.category || '',
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      type: transaction?.amount ? (transaction.amount > 0 ? 'income' : 'expense') : 'expense',
    },
  });

  const watchedType = watch('type');

  const categories = {
    income: [
      { value: 'quotas', label: 'Quotas de Condomínio' },
      { value: 'reserves', label: 'Transferência de Reservas' },
      { value: 'services', label: 'Prestação de Serviços' },
      { value: 'rent', label: 'Arrendamento de Espaços' },
      { value: 'others', label: 'Outros Rendimentos' },
    ],
    expense: [
      { value: 'maintenance', label: 'Manutenção e Reparações' },
      { value: 'utilities', label: 'Serviços Públicos' },
      { value: 'insurance', label: 'Seguros' },
      { value: 'administration', label: 'Administração' },
      { value: 'cleaning', label: 'Limpeza' },
      { value: 'security', label: 'Segurança' },
      { value: 'supplies', label: 'Material de Consumo' },
      { value: 'others', label: 'Outras Despesas' },
    ],
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      
      // Converter valor para negativo se for despesa
      const finalAmount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
      
      const transactionData = {
        building_id: data.building_id,
        amount: finalAmount,
        description: data.description,
        category: data.category,
        date: format(data.date, 'yyyy-MM-dd'),
      };

      if (transaction?.id) {
        // Atualizar transação existente
        await updateTransactionMutation.mutateAsync({
          id: transaction.id,
          data: transactionData,
        });
        toast.success('Transação atualizada com sucesso!');
      } else {
        // Criar nova transação
        await createTransactionMutation.mutateAsync(transactionData);
        toast.success('Transação criada com sucesso!');
      }

      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao guardar transação:', error);
      toast.error('Erro ao guardar transação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Euro className="h-5 w-5" />
          <span>{transaction ? 'Editar Transação' : 'Nova Transação'}</span>
        </CardTitle>
        <CardDescription>
          {transaction 
            ? 'Atualize os dados da transação financeira'
            : 'Registre uma nova transação financeira no sistema'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Transação */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Transação</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={watchedType === 'income' ? 'default' : 'outline'}
                  onClick={() => setValue('type', 'income')}
                  className="justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={watchedType === 'expense' ? 'default' : 'outline'}
                  onClick={() => setValue('type', 'expense')}
                  className="justify-start"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Despesa
                </Button>
              </div>
              {errors.type && (
                <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* Valor */}
            <div>
              <Label htmlFor="amount">Valor (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('amount', { 
                  setValueAs: (value) => parseFloat(value) || 0 
                })}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Edifício */}
          <div>
            <Label htmlFor="building_id">Edifício</Label>
            <Select 
              onValueChange={(value) => setValue('building_id', value)}
              defaultValue={transaction?.building_id}
            >
              <SelectTrigger className={errors.building_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o edifício" />
              </SelectTrigger>
              <SelectContent>
                {buildingsLoading ? (
                  <SelectItem value="" disabled>A carregar...</SelectItem>
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

          {/* Categoria */}
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select 
              onValueChange={(value) => setValue('category', value)}
              defaultValue={transaction?.category}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories[watchedType]?.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Data */}
          <div>
            <Label>Data da Transação</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: pt }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date || new Date());
                    setValue('date', date || new Date());
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva a transação..."
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isSubmitting || buildingsLoading}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'A guardar...' : transaction ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;