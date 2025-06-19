import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import financeService from '@/utils/db/financeService';
import { formatCurrency, formatPercentage, formatDate } from '@/utils/formatters';
import { calculateTrend, calculateBudgetExecution } from '@/utils/calculators';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Euro, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Download,
  Plus
} from 'lucide-react';

import LoadingSpinner, { CardSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyTransactions, DataError } from '@/components/common/EmptyState';
import FinancialChart from '../reports/FinancialChart';

interface FinancialDashboardProps {
  className?: string;
}

interface FinancialSummary {
  periodId: string;
  periodYear: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  budgetAmount: number;
  budgetUtilization: number;
  incomeByCategory: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    count: number;
  }>;
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    count: number;
  }>;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados
  useEffect(() => {
    if (currentBuilding?.id) {
      loadFinancialData();
    }
  }, [currentBuilding?.id, selectedPeriod]);

  const loadFinancialData = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Carregar períodos se não estão carregados
      if (periods.length === 0) {
        const periodsData = await financeService.getFinancialPeriods(currentBuilding.id);
        setPeriods(periodsData);
        
        // Selecionar período ativo por padrão
        const activePeriod = periodsData.find(p => p.isActive) || periodsData[0];
        if (activePeriod && !selectedPeriod) {
          setSelectedPeriod(activePeriod.id);
          return; // useEffect será chamado novamente
        }
      }

      // Carregar resumo financeiro
      const summaryData = await financeService.getFinancialSummary(
        currentBuilding.id,
        selectedPeriod || undefined
      );
      setSummary(summaryData);

    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: { value: number; direction: 'up' | 'down' | 'stable' };
    variant?: 'default' | 'success' | 'warning' | 'destructive';
    description?: string;
  }> = ({ title, value, icon, trend, variant = 'default', description }) => {
    const variantStyles = {
      default: 'text-foreground',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      destructive: 'text-red-600'
    };

    const trendIcon = trend ? (
      trend.direction === 'up' ? (
        <TrendingUp className="h-3 w-3 text-green-500" />
      ) : trend.direction === 'down' ? (
        <TrendingDown className="h-3 w-3 text-red-500" />
      ) : null
    ) : null;

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className={`text-2xl font-bold ${variantStyles[variant]}`}>
                {value}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
              {trend && (
                <div className="flex items-center mt-2 text-xs">
                  {trendIcon}
                  <span className="ml-1 text-muted-foreground">
                    {formatPercentage(Math.abs(trend.value))} vs. anterior
                  </span>
                </div>
              )}
            </div>
            <div className={`p-2 rounded-full bg-muted ${variantStyles[variant]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para ver os dados financeiros.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <DataError 
        message={error}
        onRetry={loadFinancialData}
        className={className}
      />
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
                <BarChart3 className="h-5 w-5" />
                Dashboard Financeiro
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Visão geral das finanças do edifício {currentBuilding.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Seletor de Período */}
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.year}
                      {period.isActive && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Ativo
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadFinancialData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={!summary}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))
        ) : summary ? (
          <>
            <StatCard
              title="Receitas"
              value={formatCurrency(summary.totalIncome)}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
              description="Total de receitas"
            />
            
            <StatCard
              title="Despesas"
              value={formatCurrency(summary.totalExpenses)}
              icon={<TrendingDown className="h-5 w-5" />}
              variant="destructive"
              description="Total de despesas"
            />
            
            <StatCard
              title="Saldo"
              value={formatCurrency(summary.balance)}
              icon={<DollarSign className="h-5 w-5" />}
              variant={summary.balance >= 0 ? 'success' : 'destructive'}
              description="Receitas - Despesas"
            />
            
            <StatCard
              title="Execução Orçamental"
              value={formatPercentage(summary.budgetUtilization)}
              icon={<PieChart className="h-5 w-5" />}
              variant={
                summary.budgetUtilization > 100 ? 'destructive' :
                summary.budgetUtilization > 80 ? 'warning' : 'success'
              }
              description={`de ${formatCurrency(summary.budgetAmount)}`}
            />
          </>
        ) : (
          <div className="col-span-4">
            <EmptyTransactions />
          </div>
        )}
      </div>

      {/* Gráficos e Detalhes */}
      {summary && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Receitas vs Despesas */}
              <Card>
                <CardHeader>
                  <CardTitle>Receitas vs Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialChart
                    data={[
                      { name: 'Receitas', value: summary.totalIncome, fill: '#22c55e' },
                      { name: 'Despesas', value: summary.totalExpenses, fill: '#ef4444' }
                    ]}
                    type="pie"
                  />
                </CardContent>
              </Card>

              {/* Execução Orçamental */}
              <Card>
                <CardHeader>
                  <CardTitle>Execução do Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Orçamento</span>
                      <span className="font-semibold">{formatCurrency(summary.budgetAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Executado</span>
                      <span className="font-semibold">{formatCurrency(summary.totalExpenses)}</span>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          summary.budgetUtilization > 100 ? 'bg-red-500' :
                          summary.budgetUtilization > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(summary.budgetUtilization, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Utilização</span>
                      <Badge variant={
                        summary.budgetUtilization > 100 ? 'destructive' :
                        summary.budgetUtilization > 80 ? 'warning' : 'success'
                      }>
                        {formatPercentage(summary.budgetUtilization)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.incomeByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {summary.incomeByCategory.map((category, index) => (
                      <div key={category.categoryId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: `hsl(${index * 360 / summary.incomeByCategory.length}, 70%, 50%)` }}
                          />
                          <span className="text-sm font-medium">{category.categoryName}</span>
                          <Badge variant="outline" className="text-xs">
                            {category.count} transações
                          </Badge>
                        </div>
                        <span className="font-semibold">{formatCurrency(category.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Nenhuma receita registada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.expensesByCategory.length > 0 ? (
                  <div className="space-y-3">
                    {summary.expensesByCategory.map((category, index) => (
                      <div key={category.categoryId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: `hsl(${index * 360 / summary.expensesByCategory.length}, 70%, 50%)` }}
                          />
                          <span className="text-sm font-medium">{category.categoryName}</span>
                          <Badge variant="outline" className="text-xs">
                            {category.count} transações
                          </Badge>
                        </div>
                        <span className="font-semibold">{formatCurrency(category.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Nenhuma despesa registada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Tendências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Gráficos de tendência serão implementados aqui
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default FinancialDashboard;