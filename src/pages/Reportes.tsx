import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useBuildings, 
  useMembers, 
  useFinancialSummary, 
  useTransactions,
  useConvocatorias,
  useActas 
} from '@/hooks/useNeonData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  FileBarChart, 
  Download, 
  Calendar,
  Euro,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart as PieChartIcon,
  BarChart3,
  Printer
} from 'lucide-react';

const Reportes: React.FC = () => {
  const { data: buildings } = useBuildings();
  const { data: members } = useMembers();
  const { data: financialSummary } = useFinancialSummary();
  const { data: transactions } = useTransactions();
  const { data: convocatorias } = useConvocatorias();
  const { data: actas } = useActas();

  // A implementar com dados reais da base de dados
  const monthlyData: any[] = [];

  // A implementar com dados reais da base de dados
  const expenseCategories: any[] = [];

  // A implementar com dados reais da base de dados
  const occupancyData: any[] = [];

  // A implementar com dados reais da base de dados
  const kpis = {
    totalIncome: financialSummary?.income || 0,
    totalExpenses: financialSummary?.expenses || 0,
    totalBalance: financialSummary?.balance || 0,
    totalMembers: members?.length || 0,
    totalBuildings: buildings?.length || 0,
    totalConvocatorias: convocatorias?.length || 0,
    totalActas: actas?.length || 0,
    occupancyRate: 0,
    paymentRate: 0,
    averageDelay: 0
  };

  const generatePDFReport = () => {
    console.log('Generating PDF report...');
    // Implementar generación de PDF
  };

  const exportToExcel = () => {
    console.log('Exporting to Excel...');
    // Implementar exportación a Excel
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes y Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado de datos del condominio
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={generatePDFReport}>
            <Printer className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">€{kpis.totalIncome.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Receitas Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.paymentRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Cobrança</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.totalMembers}</p>
                <p className="text-sm text-muted-foreground">Total Proprietários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{kpis.occupancyRate}%</p>
                <p className="text-sm text-muted-foreground">Ocupação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes Principales */}
      <Tabs defaultValue="financeiro" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="ocupacao">Ocupação</TabsTrigger>
          <TabsTrigger value="actividade">Actividade</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        {/* Reporte Financeiro */}
        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Financeira Anual</CardTitle>
                <CardDescription>
                  Receitas, gastos e balanço mensal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`€${value}`, '']} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="ingresos" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Receitas"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="gastos" 
                      stackId="2"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="Gastos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Gastos</CardTitle>
                <CardDescription>
                  Categorias de gastos do ano atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Balance Mensual</CardTitle>
              <CardDescription>
                Diferença entre receitas e gastos por mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`€${value}`, 'Balance']} />
                  <Bar 
                    dataKey="balance" 
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte de Ocupação */}
        <TabsContent value="ocupacao" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ocupação por Edifício</CardTitle>
                <CardDescription>
                  Percentagem de apartamentos ocupados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="edificio" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="ocupados" 
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                      name="Ocupados (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Incumprimento</CardTitle>
                <CardDescription>
                  Análise de pagamentos e atrasos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Cobrança</span>
                  <Badge variant="secondary">{kpis.paymentRate}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Atraso Médio</span>
                  <Badge variant="outline">{kpis.averageDelay} dias</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pagamentos Pendentes</span>
                  <Badge variant="destructive">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pagamentos em Dia</span>
                  <Badge variant="default">{kpis.totalMembers - 3}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reporte de Actividade */}
        <TabsContent value="actividade" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Convocatórias</CardTitle>
                <CardDescription>
                  Total del año actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <FileBarChart className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{kpis.totalConvocatorias}</p>
                    <p className="text-sm text-muted-foreground">Enviadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actas</CardTitle>
                <CardDescription>
                  Reuniones documentadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{kpis.totalActas}</p>
                    <p className="text-sm text-muted-foreground">Completadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transações</CardTitle>
                <CardDescription>
                  Movimientos registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Euro className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{transactions?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Este ano</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reporte Comparativo */}
        <TabsContent value="comparativo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Anual</CardTitle>
              <CardDescription>
                Comparação com anos anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Dados comparativos disponíveis na próxima atualização</p>
                <p className="text-sm mt-2">Requer histórico de pelo menos 2 anos</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resumen Ejecutivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
          <CardDescription>
            Principais indicadores e recomendações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Pontos Fortes</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Alta taxa de cobrança ({kpis.paymentRate}%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Balanço positivo anual</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Boa ocupação ({kpis.occupancyRate}%)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Áreas de Melhoria</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Reduzir gastos de manutenção</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Melhorar tempo de cobrança</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Automatizar mais processos</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reportes;