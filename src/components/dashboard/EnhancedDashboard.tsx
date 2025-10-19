import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMembers, useFinancialSummary, useDatabaseConnection, useDashboardStats, useDashboardActivities, useDocumentStats } from '@/hooks/useNeonDataWithAuth';
import { useUserBuildingId } from '@/hooks/useUserBuildingId';
import { 
  LayoutDashboard, 
  FileText, 
  ScrollText, 
  Calculator, 
  Users, 
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  Calendar,
  Upload,
  Download,
  FolderOpen,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';

// Componente de métrica animada
const AnimatedMetric = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  trend, 
  loading = false 
}: {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Icon className="h-6 w-6" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {loading ? '...' : value}
                </motion.p>
              </div>
            </div>
            {trend && (
              <div className={`flex items-center space-x-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </CardContent>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        />
      </Card>
    </motion.div>
  );
};

// Componente de actividad reciente mejorado
const ActivityFeed = ({ activities }: { activities: any[] }) => {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <motion.div 
              className={`p-2 rounded-full ${getActivityColor(activity.status)}`}
              whileHover={{ scale: 1.1 }}
            >
              {getActivityIcon(activity.type)}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {activity.status}
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Componente de gráfico de progreso circular
const CircularProgress = ({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3b82f6' 
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{value}%</span>
      </div>
    </div>
  );
};

// Widget de documentos
const DocumentsWidget = ({ buildingId, documentStats, isLoading }: { buildingId?: string; documentStats?: any; isLoading?: boolean }) => {
  const [timeRange, setTimeRange] = useState('month');
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  // Category colors mapping
  const getCategoryColor = (categoryName: string): string => {
    const colors: Record<string, string> = {
      'general': '#3b82f6',
      'insurance': '#10b981',
      'legal': '#f59e0b',
      'financial': '#ef4444',
      'maintenance': '#8b5cf6',
      'meeting': '#06b6d4',
      'contract': '#84cc16'
    };
    return colors[categoryName] || '#6b7280';
  };
  
  // Transform server response to expected format
  const stats = documentStats ? {
    total: documentStats.total_documents || 0,
    recent: documentStats.recent_uploads || 0,
    categories: (documentStats.by_category || []).map((cat: any) => ({
      name: cat.category,
      count: parseInt(cat.count) || 0,
      color: getCategoryColor(cat.category)
    })),
    size: formatFileSize(documentStats.total_size || 0)
  } : {
    total: 0,
    recent: 0,
    categories: [],
    size: '0 B'
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Documentos</span>
          </CardTitle>
          <CardDescription>Gestão de ficheiros digitais</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="year">Ano</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <motion.p 
                className="text-2xl font-bold text-blue-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.4 }}
              >
                {stats.total}
              </motion.p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <motion.p 
                className="text-2xl font-bold text-green-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
              >
                {stats.recent}
              </motion.p>
              <p className="text-xs text-muted-foreground">Recentes</p>
            </div>
            <div className="text-center">
              <motion.p 
                className="text-2xl font-bold text-purple-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
              >
                {stats.size}
              </motion.p>
              <p className="text-xs text-muted-foreground">Tamanho</p>
            </div>
          </div>

          {/* Categorías */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Por categoria</h4>
            {stats?.categories && Array.isArray(stats.categories) && stats.categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
                <Badge variant="secondary">{category.count}</Badge>
              </motion.div>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="flex space-x-2">
            <Button size="sm" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Subir
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <FolderOpen className="h-4 w-4 mr-2" />
              Ver tudo
            </Button>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

const EnhancedDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [refreshing, setRefreshing] = useState(false);
  
  // Datos reales de la base de datos
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: financialSummary, isLoading: financialLoading } = useFinancialSummary();
  // const { data: dbConnection } = useDatabaseConnection(); // Disabled temporarily to prevent infinite loop

  // Get building ID from user context (hardcoded for now)
  const buildingId = useUserBuildingId();

  // New dashboard hooks for real data
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats(buildingId);
  const { data: recentActivities = [], isLoading: activitiesLoading } = useDashboardActivities(buildingId, 10);
  const { data: documentStats, isLoading: documentStatsLoading } = useDocumentStats(buildingId);

  const stats = useMemo(() => ({
    totalOwners: dashboardStats?.totalOwners || members?.length || 0,
    nextMeeting: dashboardStats?.nextMeeting,
    budget: dashboardStats?.budget || 50000,
    expenses: dashboardStats?.expenses || financialSummary?.expenses || 0,
    income: dashboardStats?.income || financialSummary?.income || 0,
    balance: dashboardStats?.balance || financialSummary?.balance || 0,
    pendingPayments: dashboardStats?.pendingPayments || 0,
    completedTasks: dashboardStats?.completedTasks || 0,
    occupancyRate: dashboardStats?.occupancyRate || 0,
    maintenanceScore: dashboardStats?.maintenanceScore || 95
  }), [dashboardStats, members, financialSummary]);

  const budgetUsage = stats.budget ? Math.round((stats.expenses / stats.budget) * 100) : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular recarga de datos
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header mejorado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard v2.1
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Vista completa del condominio</span>
          </p>
          {/* Database connection status disabled to prevent infinite loop
          {dbConnection && (
            <motion.div
              className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Shield className="h-3 w-3" />
              <span>Base de datos conectada: {dbConnection.tables?.length || 0} tablas</span>
            </motion.div>
          )}
          */}
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </motion.div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <AnimatedMetric
          title="Proprietários"
          value={stats.totalOwners}
          icon={Users}
          color="blue"
          trend={{ value: 5, positive: true }}
          loading={membersLoading}
        />
        <AnimatedMetric
          title="Ocupação"
          value={`${stats.occupancyRate}%`}
          icon={Building2}
          color="green"
          trend={{ value: 2, positive: true }}
        />
        <AnimatedMetric
          title="Balance"
          value={`€${stats.balance.toLocaleString()}`}
          icon={Euro}
          color="purple"
          trend={{ value: 12, positive: true }}
          loading={financialLoading}
        />
        <AnimatedMetric
          title="Manutenção"
          value={`${stats.maintenanceScore}%`}
          icon={Zap}
          color="orange"
          trend={{ value: 3, positive: true }}
        />
      </div>

      {/* Contenido principal con tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Panel principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Estado financiero con gráfico circular */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Estado Financeiro</span>
                  </CardTitle>
                  <CardDescription>
                    Distribuição do orçamento anual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Orçamento utilizado</p>
                        <p className="text-3xl font-bold">€{stats.expenses.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">de €{stats.budget.toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Receitas</span>
                          <span className="text-green-600">€{stats.income.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Despesas</span>
                          <span className="text-red-600">€{stats.expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Balance</span>
                          <span className="text-blue-600">€{stats.balance.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <CircularProgress value={budgetUsage} color="#3b82f6" />
                  </div>
                </CardContent>
              </Card>

              {/* Tareas pendientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Acções Pendentes</CardTitle>
                  <CardDescription>
                    Tarefas importantes que requerem atenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: 'Preparar convocatória assembleia ordinária', priority: 'high', due: '2 dias' },
                      { title: 'Rever orçamentos de manutenção', priority: 'medium', due: '1 semana' },
                      { title: 'Actualizar apólice de seguros', priority: 'low', due: '2 semanas' }
                    ].map((task, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">Vence em {task.due}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {task.priority === 'high' ? 'Urgente' :
                           task.priority === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actividad reciente mejorada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Actividade Recente</span>
                    </span>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed activities={recentActivities.slice(0, 4)} />
                </CardContent>
              </Card>

              {/* Widget de documentos */}
              <DocumentsWidget buildingId={buildingId} documentStats={documentStats} isLoading={documentStatsLoading} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Vista Financeira Detalhada</h3>
            <p className="text-muted-foreground">Brevemente: gráficos avançados e análise financeira</p>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Gestão de Documentos</h3>
            <p className="text-muted-foreground">Brevemente: interface completa de gestão documental</p>
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="text-center py-12">
            <Zap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Painel de Manutenção</h3>
            <p className="text-muted-foreground">Brevemente: sistema completo de gestão de manutenção</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Funciones auxiliares
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'document':
      return <FileText className="h-4 w-4" />;
    case 'convocatoria':
      return <ScrollText className="h-4 w-4" />;
    case 'payment':
      return <Euro className="h-4 w-4" />;
    case 'maintenance':
      return <Building2 className="h-4 w-4" />;
    case 'alert':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'info':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
  }
};

export default EnhancedDashboard;