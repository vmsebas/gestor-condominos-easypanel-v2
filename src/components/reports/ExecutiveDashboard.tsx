import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import reportsService from '@/services/api/reports';
import { FinancialAnalytics, MemberAnalytics, CommunicationAnalytics, KPIData } from '@/types/reportTypes';
import { formatCurrency, formatDate } from '@/utils/formatters';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign, 
  Users, 
  Mail, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Eye,
  Target,
  Zap
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ExecutiveDashboardProps {
  className?: string;
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  
  const [financialData, setFinancialData] = useState<FinancialAnalytics | null>(null);
  const [memberData, setMemberData] = useState<MemberAnalytics | null>(null);
  const [communicationData, setCommunicationData] = useState<CommunicationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (currentBuilding?.id) {
      loadDashboardData();
    }
  }, [currentBuilding?.id, dateRange]);

  const loadDashboardData = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = getStartDate(dateRange);

      const [financial, member, communication] = await Promise.all([
        reportsAPI.getFinancialAnalytics(currentBuilding.id, startDate, endDate),
        reportsAPI.getMemberAnalytics(currentBuilding.id),
        reportsAPI.getCommunicationAnalytics(currentBuilding.id)
      ]);

      setFinancialData(financial);
      setMemberData(member);
      setCommunicationData(communication);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const getStartDate = (range: string): string => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const KPICard: React.FC<{ 
    title: string; 
    value: string; 
    change?: number;
    changeLabel?: string;
    trend?: 'up' | 'down' | 'stable';
    icon: React.ReactNode;
    color?: string;
  }> = ({ title, value, change, changeLabel, trend, icon, color = 'blue' }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                {trend && getTrendIcon(trend)}
                <span className={`text-sm ${getChangeColor(change)}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const COLORS = ['#22c55e', '#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899'];

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para ver o dashboard executivo.
            </p>
          </div>
        </CardContent>
      </Card>
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
                Dashboard Executivo
                <Badge variant="secondary" className="ml-2">
                  Live
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Visão geral em tempo real - {currentBuilding.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <LoadingSpinner />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="communications">Comunicações</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {financialData && (
                <>
                  <KPICard
                    title="Receitas Totais"
                    value={formatCurrency(financialData.revenue.total)}
                    change={financialData.revenue.growth}
                    trend={financialData.revenue.growth > 0 ? 'up' : 'down'}
                    icon={<DollarSign className="h-6 w-6 text-green-600" />}
                    color="green"
                  />
                  
                  <KPICard
                    title="Resultado Líquido"
                    value={formatCurrency(financialData.cashFlow.netFlow)}
                    change={15.2}
                    trend="up"
                    icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
                    color="blue"
                  />
                  
                  <KPICard
                    title="Taxa de Cobrança"
                    value={`${financialData.efficiency.collectionRate.toFixed(1)}%`}
                    change={2.3}
                    trend="up"
                    icon={<Target className="h-6 w-6 text-purple-600" />}
                    color="purple"
                  />
                </>
              )}
              
              {memberData && (
                <KPICard
                  title="Total de Membros"
                  value={memberData.demographics.total.toString()}
                  change={1.2}
                  trend="up"
                  icon={<Users className="h-6 w-6 text-orange-600" />}
                  color="orange"
                />
              )}
            </div>

            {/* Alertas e Avisos */}
            {financialData && financialData.arrears.total > 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        Atenção: Morosidade Elevada
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-200">
                        {formatCurrency(financialData.arrears.total)} em dívida de {financialData.arrears.count} membros
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evolução Financeira */}
              {financialData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Evolução Financeira</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={financialData.revenue.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `€${value / 1000}k`} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receitas']} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#22c55e" 
                          fill="#22c55e" 
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Distribuição de Despesas */}
              {financialData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribuição de Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={Object.entries(financialData.expenses.byCategory).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {Object.keys(financialData.expenses.byCategory).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Financeiro */}
          <TabsContent value="financial" className="space-y-6">
            {financialData && (
              <>
                {/* KPIs Financeiros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard
                    title="Receitas"
                    value={formatCurrency(financialData.revenue.total)}
                    change={financialData.revenue.growth}
                    trend={financialData.revenue.growth > 0 ? 'up' : 'down'}
                    icon={<DollarSign className="h-6 w-6 text-green-600" />}
                  />
                  
                  <KPICard
                    title="Despesas"
                    value={formatCurrency(financialData.expenses.total)}
                    change={financialData.expenses.variance}
                    trend={financialData.expenses.variance < 0 ? 'up' : 'down'}
                    icon={<TrendingDown className="h-6 w-6 text-red-600" />}
                  />
                  
                  <KPICard
                    title="Saldo Atual"
                    value={formatCurrency(financialData.cashFlow.closing)}
                    change={12.5}
                    trend="up"
                    icon={<Zap className="h-6 w-6 text-blue-600" />}
                  />
                  
                  <KPICard
                    title="Morosidade"
                    value={formatCurrency(financialData.arrears.total)}
                    change={-8.3}
                    trend="down"
                    icon={<AlertTriangle className="h-6 w-6 text-orange-600" />}
                  />
                </div>

                {/* Gráficos Financeiros */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fluxo de Caixa Projetado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={financialData.cashFlow.projectedFlow}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `€${value / 1000}k`} />
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Saldo']} />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução da Morosidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={financialData.arrears.trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `€${value / 1000}k`} />
                          <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Morosidade']} />
                          <Bar dataKey="amount" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Membros */}
          <TabsContent value="members" className="space-y-6">
            {memberData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard
                    title="Total Membros"
                    value={memberData.demographics.total.toString()}
                    icon={<Users className="h-6 w-6 text-blue-600" />}
                  />
                  
                  <KPICard
                    title="Taxa Ocupação"
                    value={`${memberData.demographics.averageOccupancy.toFixed(1)}%`}
                    change={2.1}
                    trend="up"
                    icon={<Target className="h-6 w-6 text-green-600" />}
                  />
                  
                  <KPICard
                    title="Quota Média"
                    value={formatCurrency(memberData.financial.averageQuota)}
                    icon={<DollarSign className="h-6 w-6 text-purple-600" />}
                  />
                  
                  <KPICard
                    title="Satisfação"
                    value={`${memberData.satisfaction.overall.toFixed(1)}/10`}
                    change={5.2}
                    trend="up"
                    icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={Object.entries(memberData.demographics.byType).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {Object.keys(memberData.demographics.byType).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tendência de Satisfação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={memberData.satisfaction.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#22c55e" 
                            strokeWidth={2}
                            dot={{ fill: '#22c55e' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Comunicações */}
          <TabsContent value="communications" className="space-y-6">
            {communicationData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard
                    title="Mensagens Enviadas"
                    value={communicationData.volume.total.toString()}
                    icon={<Mail className="h-6 w-6 text-blue-600" />}
                  />
                  
                  <KPICard
                    title="Taxa de Entrega"
                    value={`${communicationData.performance.deliveryRate.toFixed(1)}%`}
                    change={1.2}
                    trend="up"
                    icon={<Target className="h-6 w-6 text-green-600" />}
                  />
                  
                  <KPICard
                    title="Taxa de Abertura"
                    value={`${communicationData.performance.openRate.toFixed(1)}%`}
                    change={3.5}
                    trend="up"
                    icon={<Eye className="h-6 w-6 text-purple-600" />}
                  />
                  
                  <KPICard
                    title="Custo Total"
                    value={formatCurrency(communicationData.costs.total)}
                    icon={<DollarSign className="h-6 w-6 text-orange-600" />}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Volume Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={communicationData.volume.monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Canal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={Object.entries(communicationData.volume.byType).map(([name, value]) => ({ name, value }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {Object.keys(communicationData.volume.byType).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ExecutiveDashboard;