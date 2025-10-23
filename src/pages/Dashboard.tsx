import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { getMembers, getDashboardStats } from '@/lib/api';
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Calculator,
  Users,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  Calendar,
  Sparkles,
  Settings
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [useEnhancedView, setUseEnhancedView] = useState(true);

  // Se a vista melhorada estiver ativada, usar o novo dashboard
  if (useEnhancedView) {
    return (
      <div className="relative">
        {/* Alternador para mudar vista */}
        <motion.div
          className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center space-x-2">
            <Switch
              id="enhanced-view"
              checked={useEnhancedView}
              onCheckedChange={setUseEnhancedView}
            />
            <Label htmlFor="enhanced-view" className="text-sm flex items-center space-x-1">
              <Sparkles className="h-4 w-4" />
              <span>Vista Melhorada</span>
            </Label>
          </div>
        </motion.div>
        <EnhancedDashboard />
      </div>
    );
  }

  // Vista clásica (código original)
  // Dados da base de dados local - USANDO API LOCAL
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers(),
  });

  const members = membersResponse?.data || [];

  // Get first building ID for dashboard stats
  const buildingId = members?.[0]?.building_id;

  // Dashboard stats from API local
  const { data: dashboardStatsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats', buildingId],
    queryFn: () => getDashboardStats(buildingId || ''),
    enabled: !!buildingId,
  });

  const dashboardStats = dashboardStatsResponse?.data || null;
  const recentActivities: any[] = [];
  
  const stats = {
    totalOwners: dashboardStats?.totalOwners || members?.length || 0,
    nextMeeting: dashboardStats?.nextMeeting ?
      new Date(dashboardStats.nextMeeting.date).toLocaleDateString('pt-PT') :
      'Não agendada',
    budget: dashboardStats?.budget || 50000,
    expenses: dashboardStats?.expenses || 0,
    income: dashboardStats?.income || 0,
    balance: dashboardStats?.balance || 0,
    pendingPayments: dashboardStats?.pendingPayments || 0,
    completedTasks: dashboardStats?.completedTasks || 0
  };

  // Sugestões de fluxo de trabalho - a implementar dinamicamente
  const workflowSuggestions: any[] = [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'convocatoria':
        return <FileText className="h-4 w-4" />;
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

  const budgetUsage = stats.budget ? Math.round((stats.expenses / stats.budget) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel de Controlo</h1>
        <p className="text-muted-foreground mt-1">
          Vista geral do estado do condomínio
        </p>
        {!membersLoading && members.length > 0 && (
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            ✓ Ligado à API local - {members.length} condóminos carregados
          </div>
        )}
        {!membersLoading && members.length === 0 && (
          <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
            ⚠ Nenhum condómino encontrado
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{membersLoading ? '...' : stats.totalOwners}</p>
                <p className="text-sm text-muted-foreground">Proprietários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-lg font-bold">{stats.nextMeeting}</p>
                <p className="text-sm text-muted-foreground">Próxima assembleia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">€{stats.budget.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Orçamento anual</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
                <p className="text-sm text-muted-foreground">Tarefas concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Financeiro</CardTitle>
              <CardDescription>
                Acompanhamento do orçamento anual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Gastos do ano</span>
                  <span>€{stats.expenses.toLocaleString()} / €{stats.budget.toLocaleString()}</span>
                </div>
                <Progress value={budgetUsage} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{budgetUsage}% utilizado</span>
                  <span>€{(stats.budget - stats.expenses).toLocaleString()} restante</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Receitas</p>
                  <p className="text-lg font-bold text-green-600">€{stats.budget.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <TrendingUp className="h-6 w-6 text-red-600 mx-auto mb-2 rotate-180" />
                  <p className="text-sm font-medium">Despesas</p>
                  <p className="text-lg font-bold text-red-600">€{stats.expenses.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Acções Recomendadas</CardTitle>
              <CardDescription>
                Fluxos de trabalho guiados para gestão eficiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowSuggestions.map((suggestion) => {
                  const Icon = suggestion.icon;
                  return (
                    <div
                      key={suggestion.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${suggestion.color} bg-muted`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{suggestion.title}</h3>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={
                            suggestion.urgency === 'high' ? 'destructive' :
                            suggestion.urgency === 'medium' ? 'warning' : 'secondary'
                          }
                        >
                          {suggestion.urgency === 'high' ? 'Urgente' :
                           suggestion.urgency === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Iniciar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividade Recente</CardTitle>
              <CardDescription>
                Últimas acções no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acções Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Nova Convocatória
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <ScrollText className="h-4 w-4 mr-2" />
                Redigir Acta
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Registo de Despesa
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Adicionar Proprietário
              </Button>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>Alertas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {stats.pendingPayments} pagamentos pendentes
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300">
                    Rever incumprimento
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Assembleia ordinária próxima
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Preparar documentação
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;