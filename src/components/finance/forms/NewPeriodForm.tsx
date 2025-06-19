import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FinancialPeriod } from '@/types/finance/financeTypes';
import { formatCurrency } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Save, X, AlertCircle, Calculator } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface NewPeriodFormProps {
  onSubmit: (data: Partial<FinancialPeriod>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const periodFormSchema = z.object({
  year: z.number()
    .min(2020, 'Ano deve ser superior a 2020')
    .max(2030, 'Ano deve ser inferior a 2030'),
  startDate: z.string()
    .min(1, 'Data de início é obrigatória'),
  endDate: z.string()
    .min(1, 'Data de fim é obrigatória'),
  budgetAmount: z.number()
    .min(0, 'Orçamento deve ser positivo')
    .max(1000000, 'Orçamento não pode exceder 1.000.000€')
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['endDate']
}).refine((data) => {
  const startYear = new Date(data.startDate).getFullYear();
  const endYear = new Date(data.endDate).getFullYear();
  return startYear === data.year && endYear === data.year;
}, {
  message: 'As datas devem corresponder ao ano selecionado',
  path: ['year']
});

type PeriodFormData = z.infer<typeof periodFormSchema>;

const NewPeriodForm: React.FC<NewPeriodFormProps> = ({
  onSubmit,
  onCancel,
  className
}) => {
  const currentYear = new Date().getFullYear();
  
  const form = useForm<PeriodFormData>({
    resolver: zodResolver(periodFormSchema),
    defaultValues: {
      year: currentYear,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      budgetAmount: 50000,
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, watch } = form;

  const watchedValues = watch();

  const handleFormSubmit = async (data: PeriodFormData) => {
    try {
      await onSubmit({
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        budgetAmount: data.budgetAmount,
      });
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  // Calcular duração do período
  const getPeriodDuration = () => {
    if (watchedValues.startDate && watchedValues.endDate) {
      const start = new Date(watchedValues.startDate);
      const end = new Date(watchedValues.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  // Calcular orçamento mensal médio
  const getMonthlyBudget = () => {
    const duration = getPeriodDuration();
    if (duration > 0 && watchedValues.budgetAmount) {
      return (watchedValues.budgetAmount / (duration / 30.44)); // Média de dias por mês
    }
    return 0;
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Ano do Período */}
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano do Período *</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="2024"
                    min={2020}
                    max={2030}
                    {...field}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      field.onChange(year);
                      
                      // Atualizar datas automaticamente
                      if (year >= 2020 && year <= 2030) {
                        form.setValue('startDate', `${year}-01-01`);
                        form.setValue('endDate', `${year}-12-31`);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Ano fiscal para este período (ex: 2024)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Datas do Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Quando inicia o período fiscal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Fim *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Quando termina o período fiscal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Orçamento */}
          <FormField
            control={form.control}
            name="budgetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orçamento Total *</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="50000"
                    min={0}
                    max={1000000}
                    step={100}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Orçamento total previsto para o período (em euros)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Resumo do Período */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Resumo do Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duração</p>
                  <p className="font-medium">
                    {getPeriodDuration()} dias
                  </p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Orçamento Total</p>
                  <p className="font-medium">
                    {formatCurrency(watchedValues.budgetAmount || 0)}
                  </p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Orçamento Mensal</p>
                  <p className="font-medium">
                    {formatCurrency(getMonthlyBudget())}
                  </p>
                </div>
              </div>

              {/* Avisos */}
              <div className="space-y-2">
                {watchedValues.year === currentYear && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Este é o período para o ano atual</span>
                  </div>
                )}
                
                {watchedValues.budgetAmount && watchedValues.budgetAmount < 10000 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Orçamento baixo. Considere aumentar se necessário.</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sugestões de Orçamento */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">💡 Sugestões de Orçamento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-green-600">Conservador</p>
                  <p className="text-muted-foreground">€30.000 - €50.000</p>
                  <Badge variant="outline" className="text-xs">Edifícios pequenos</Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium text-blue-600">Moderado</p>
                  <p className="text-muted-foreground">€50.000 - €100.000</p>
                  <Badge variant="outline" className="text-xs">Edifícios médios</Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium text-purple-600">Abrangente</p>
                  <p className="text-muted-foreground">€100.000+</p>
                  <Badge variant="outline" className="text-xs">Edifícios grandes</Badge>
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
              Criar Período
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

export default NewPeriodForm;