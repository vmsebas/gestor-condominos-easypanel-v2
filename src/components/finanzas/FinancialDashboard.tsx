import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Euro, PieChart, AlertTriangle, CheckCircle } from 'lucide-react';

interface FinancialData {
  budget: number;
  expenses: number;
  income: number;
  reserve: number;
  pendingPayments: number;
  categories: Array<{
    name: string;
    amount: number;
    budget: number;
    percentage: number;
  }>;
}

interface FinancialDashboardProps {
  data: FinancialData;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ data }) => {
  const budgetUsage = (data.expenses / data.budget) * 100;
  const remainingBudget = data.budget - data.expenses;
  const netBalance = data.income - data.expenses;
  const reservePercentage = (data.reserve / data.budget) * 100;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">€{data.budget.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Presupuesto anual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">€{data.expenses.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Gastos del año</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">€{data.income.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Ingresos del año</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <PieChart className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">€{data.reserve.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Fondo de reserva</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budget Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Ejecución del Presupuesto</CardTitle>
            <CardDescription>
              Seguimiento del gasto anual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Presupuesto utilizado</span>
                <span>{budgetUsage.toFixed(1)}%</span>
              </div>
              <Progress value={budgetUsage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>€{data.expenses.toLocaleString()} gastados</span>
                <span>€{remainingBudget.toLocaleString()} restantes</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              budgetUsage > 90 
                ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                : budgetUsage > 75 
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800'
                : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
            }`}>
              <div className="flex items-center space-x-2">
                {budgetUsage > 90 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <p className="text-sm font-medium">
                  {budgetUsage > 90 
                    ? 'Presupuesto casi agotado'
                    : budgetUsage > 75 
                    ? 'Seguimiento recomendado'
                    : 'Ejecución dentro de parámetros'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reserve Fund */}
        <Card>
          <CardHeader>
            <CardTitle>Fondo de Reserva</CardTitle>
            <CardDescription>
              Reserva legal mínima del 5%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fondo actual</span>
                <span>{reservePercentage.toFixed(1)}% del presupuesto</span>
              </div>
              <Progress value={Math.min(reservePercentage, 100)} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>€{data.reserve.toLocaleString()}</span>
                <span>Mínimo legal: €{(data.budget * 0.05).toLocaleString()}</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              reservePercentage >= 5
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {reservePercentage >= 5 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <p className="text-sm font-medium">
                  {reservePercentage >= 5 
                    ? 'Cumple el mínimo legal del 5%'
                    : 'Por debajo del mínimo legal requerido'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>
            Desglose de gastos principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.categories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      €{category.amount.toLocaleString()} / €{category.budget.toLocaleString()}
                    </span>
                    <Badge variant={
                      category.percentage > 100 ? 'destructive' :
                      category.percentage > 90 ? 'warning' : 'secondary'
                    }>
                      {category.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={Math.min(category.percentage, 100)} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Financiero</CardTitle>
          <CardDescription>
            Resumen de la situación económica actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Ingresos</p>
              <p className="text-xl font-bold text-blue-600">€{data.income.toLocaleString()}</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Gastos</p>
              <p className="text-xl font-bold text-red-600">€{data.expenses.toLocaleString()}</p>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              netBalance >= 0 
                ? 'bg-green-50 dark:bg-green-950/20'
                : 'bg-yellow-50 dark:bg-yellow-950/20'
            }`}>
              <Euro className={`h-8 w-8 mx-auto mb-2 ${
                netBalance >= 0 ? 'text-green-600' : 'text-yellow-600'
              }`} />
              <p className={`text-sm font-medium ${
                netBalance >= 0 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                Balance Neto
              </p>
              <p className={`text-xl font-bold ${
                netBalance >= 0 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                €{netBalance.toLocaleString()}
              </p>
            </div>
          </div>
          
          {data.pendingPayments > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  {data.pendingPayments} propietarios con pagos pendientes
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;