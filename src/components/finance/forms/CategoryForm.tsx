import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionCategorySchema } from '@/utils/validation';
import { TransactionCategory } from '@/types/finance/financeTypes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Save, X } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface CategoryFormProps {
  category?: TransactionCategory;
  onSubmit: (data: Partial<TransactionCategory>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

type CategoryFormData = {
  name: string;
  type: 'income' | 'expense';
  description: string;
};

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  className
}) => {
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(transactionCategorySchema.omit({ 
      id: true, 
      buildingId: true, 
      isActive: true,
      createdAt: true, 
      updatedAt: true 
    })),
    defaultValues: {
      name: category?.name || '',
      type: category?.type || 'expense',
      description: category?.description || '',
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, watch } = form;

  const selectedType = watch('type');

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit({
        ...data,
        description: data.description || undefined,
      });
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Nome da Categoria */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Categoria *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Quotas mensais, Limpeza, Manutenção..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Nome único para identificar esta categoria
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de Categoria */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Categoria *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="space-y-2">
                      <Card className={`cursor-pointer transition-colors ${
                        field.value === 'income' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'hover:bg-muted/50'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="income" id="income" />
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                              <div>
                                <label htmlFor="income" className="font-medium cursor-pointer">
                                  Receita
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  Dinheiro que entra (quotas, rendas, etc.)
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      <Card className={`cursor-pointer transition-colors ${
                        field.value === 'expense' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'hover:bg-muted/50'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="expense" id="expense" />
                            <div className="flex items-center space-x-2">
                              <TrendingDown className="h-5 w-5 text-red-600" />
                              <div>
                                <label htmlFor="expense" className="font-medium cursor-pointer">
                                  Despesa
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  Dinheiro que sai (manutenção, serviços, etc.)
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descrição detalhada da categoria (opcional)"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Informação adicional sobre quando usar esta categoria
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pré-visualização */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Pré-visualização</h4>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  selectedType === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {selectedType === 'income' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {form.watch('name') || 'Nome da categoria'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {form.watch('description') || 'Sem descrição'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exemplos de Categorias */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">💡 Exemplos de Categorias</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-600 mb-2">📈 Receitas</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Quotas Mensais</li>
                    <li>• Fundo de Reserva</li>
                    <li>• Multas e Juros</li>
                    <li>• Rendas de Garagens</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-red-600 mb-2">📉 Despesas</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Limpeza</li>
                    <li>• Manutenção</li>
                    <li>• Seguros</li>
                    <li>• Administração</li>
                  </ul>
                </div>
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
              {isEditing ? 'Atualizar Categoria' : 'Criar Categoria'}
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

export default CategoryForm;