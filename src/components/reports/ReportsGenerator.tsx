import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import reportsService from '@/utils/db/reportsService';
import { ReportConfig, GeneratedReport, ReportType, ReportFilter, ReportFormat } from '@/types/reportTypes';
import { formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText,
  Plus,
  Download,
  Play,
  Calendar,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

import LoadingSpinner, { ListSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import { DeleteConfirmDialog } from '@/components/common/ConfirmDialog';

interface ReportsGeneratorProps {
  className?: string;
}

const ReportsGenerator: React.FC<ReportsGeneratorProps> = ({ className }) => {
  const { currentBuilding } = useBuilding();
  
  const [configs, setConfigs] = useState<ReportConfig[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReportConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<ReportConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'financial_summary' as ReportType,
    isScheduled: false,
    schedule: {
      frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'Europe/Lisbon'
    },
    filters: {
      startDate: '',
      endDate: '',
      memberType: 'all' as 'owner' | 'resident' | 'all',
      includeInactive: false,
      categories: [] as string[]
    },
    format: ['pdf'] as ReportFormat[],
    recipients: [] as string[],
    isActive: true
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ReportType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (currentBuilding?.id) {
      loadData();
    }
  }, [currentBuilding?.id]);

  const loadData = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const [configsData, reportsData] = await Promise.all([
        reportsService.getReportConfigs(currentBuilding.id),
        reportsService.getReports(currentBuilding.id)
      ]);
      
      setConfigs(configsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openConfigEditor = (config?: ReportConfig) => {
    if (config) {
      setFormData({
        name: config.name,
        description: config.description || '',
        type: config.type,
        isScheduled: config.isScheduled,
        schedule: config.schedule || {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '09:00',
          timezone: 'Europe/Lisbon'
        },
        filters: {
          startDate: config.filters.startDate,
          endDate: config.filters.endDate,
          memberType: config.filters.memberType || 'all',
          includeInactive: config.filters.includeInactive || false,
          categories: config.filters.categories || []
        },
        format: config.format,
        recipients: config.recipients,
        isActive: config.isActive
      });
      setEditingConfig(config);
    } else {
      // Reset form for new config
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setFormData({
        name: '',
        description: '',
        type: 'financial_summary',
        isScheduled: false,
        schedule: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '09:00',
          timezone: 'Europe/Lisbon'
        },
        filters: {
          startDate: firstDayOfMonth.toISOString().split('T')[0],
          endDate: lastDayOfMonth.toISOString().split('T')[0],
          memberType: 'all',
          includeInactive: false,
          categories: []
        },
        format: ['pdf'],
        recipients: [],
        isActive: true
      });
      setEditingConfig(null);
    }
    setShowConfigEditor(true);
  };

  const handleSaveConfig = async () => {
    if (!currentBuilding?.id || !formData.name) return;

    try {
      setIsSaving(true);
      
      const configData: Omit<ReportConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        isScheduled: formData.isScheduled,
        schedule: formData.isScheduled ? formData.schedule : undefined,
        filters: {
          buildingId: currentBuilding.id,
          ...formData.filters
        },
        format: formData.format,
        recipients: formData.recipients,
        isActive: formData.isActive,
        metadata: {
          createdBy: 'Sistema',
          department: 'Administração'
        }
      };

      if (editingConfig) {
        await reportsService.updateReportConfig(editingConfig.id, configData);
      } else {
        await reportsService.createReportConfig(configData);
      }
      
      setShowConfigEditor(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateReport = async (type: ReportType, filters?: ReportFilter) => {
    if (!currentBuilding?.id) return;

    try {
      setIsGenerating(true);
      
      const reportFilters: ReportFilter = filters || {
        buildingId: currentBuilding.id,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      };

      await reportsService.generateReport(type, reportFilters);
      loadData();
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!deletingConfig) return;

    try {
      await reportsService.deleteReportConfig(deletingConfig.id);
      setDeletingConfig(null);
      loadData();
    } catch (error) {
      console.error('Erro ao eliminar configuração:', error);
    }
  };

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || config.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && config.isActive) ||
                         (statusFilter === 'inactive' && !config.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getReportTypeName = (type: ReportType): string => {
    const names = {
      financial_summary: 'Resumo Financeiro',
      payment_analysis: 'Análise de Pagamentos',
      arrears_report: 'Relatório de Morosidade',
      expense_breakdown: 'Breakdown de Despesas',
      cash_flow: 'Fluxo de Caixa',
      member_analysis: 'Análise de Membros',
      communication_stats: 'Estatísticas de Comunicação',
      maintenance_report: 'Relatório de Manutenção',
      occupancy_analysis: 'Análise de Ocupação',
      budget_variance: 'Variação Orçamental'
    };
    return names[type] || type;
  };

  const getReportTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'financial_summary':
      case 'payment_analysis':
      case 'cash_flow':
        return <DollarSign className="h-4 w-4" />;
      case 'member_analysis':
      case 'occupancy_analysis':
        return <Users className="h-4 w-4" />;
      case 'arrears_report':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ready: 'success',
      generating: 'warning',
      failed: 'destructive',
      expired: 'outline'
    } as const;
    
    const labels = {
      ready: 'Pronto',
      generating: 'Gerando',
      failed: 'Falhado',
      expired: 'Expirado'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const ConfigCard: React.FC<{ config: ReportConfig }> = ({ config }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-3">
              {getReportTypeIcon(config.type)}
              <h3 className="font-semibold">{config.name}</h3>
              <Badge variant={config.isActive ? 'success' : 'outline'}>
                {config.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
              {config.isScheduled && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Agendado
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">{getReportTypeName(config.type)}</p>
              {config.description && (
                <p className="text-sm text-muted-foreground">{config.description}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Formatos: {config.format.join(', ').toUpperCase()}</span>
              {config.isScheduled && (
                <span>Frequência: {config.schedule?.frequency}</span>
              )}
              <span>Atualizado: {formatDate(config.updatedAt)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => handleGenerateReport(config.type, config.filters)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <LoadingSpinner size="sm" variant="white" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Gerar
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openConfigEditor(config)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => openConfigEditor()}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeletingConfig(config)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportCard: React.FC<{ report: GeneratedReport }> = ({ report }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center space-x-2">
              {getReportTypeIcon(report.type)}
              <h3 className="font-semibold">{report.name}</h3>
              {getStatusBadge(report.status)}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {report.period.label} • {report.metadata.recordCount} registos
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Gerado: {formatDate(report.createdAt)}</span>
              <span>Formato: {report.format.toUpperCase()}</span>
              {report.fileSize && (
                <span>Tamanho: {(report.fileSize / 1024).toFixed(1)} KB</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {report.status === 'ready' && (
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar como PDF
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar como Excel
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!currentBuilding) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum edifício selecionado</h3>
            <p className="text-muted-foreground">
              Selecione um edifício para gerir relatórios.
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
                <FileText className="h-5 w-5" />
                Gerador de Relatórios
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Criar e gerir relatórios automáticos para {currentBuilding.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button onClick={() => openConfigEditor()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Configuração
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="configs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configs">Configurações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios Gerados</TabsTrigger>
          <TabsTrigger value="quick">Geração Rápida</TabsTrigger>
        </TabsList>

        {/* Configurações */}
        <TabsContent value="configs" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar configurações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="financial_summary">Resumo Financeiro</SelectItem>
                    <SelectItem value="payment_analysis">Análise de Pagamentos</SelectItem>
                    <SelectItem value="arrears_report">Relatório de Morosidade</SelectItem>
                    <SelectItem value="member_analysis">Análise de Membros</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Configurações */}
          {isLoading ? (
            <ListSkeleton count={3} />
          ) : filteredConfigs.length === 0 ? (
            <EmptyList
              icon={<FileText className="h-full w-full" />}
              title="Nenhuma configuração encontrada"
              description={searchTerm ? 
                `Nenhuma configuração corresponde à pesquisa "${searchTerm}"` : 
                'Crie a primeira configuração de relatório'
              }
              actionLabel="Nova Configuração"
              onAction={() => openConfigEditor()}
            />
          ) : (
            <div className="space-y-4">
              {filteredConfigs.map((config) => (
                <ConfigCard key={config.id} config={config} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Relatórios Gerados */}
        <TabsContent value="reports" className="space-y-6">
          {isLoading ? (
            <ListSkeleton count={5} />
          ) : reports.length === 0 ? (
            <EmptyList
              icon={<FileText className="h-full w-full" />}
              title="Nenhum relatório gerado"
              description="Os relatórios gerados aparecerão aqui"
            />
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Geração Rápida */}
        <TabsContent value="quick" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'financial_summary' as ReportType, title: 'Resumo Financeiro', description: 'Visão geral das finanças do período' },
              { type: 'payment_analysis' as ReportType, title: 'Análise de Pagamentos', description: 'Análise detalhada dos pagamentos' },
              { type: 'arrears_report' as ReportType, title: 'Relatório de Morosidade', description: 'Lista de membros em atraso' },
              { type: 'member_analysis' as ReportType, title: 'Análise de Membros', description: 'Estatísticas dos condóminos' },
              { type: 'communication_stats' as ReportType, title: 'Estatísticas de Comunicação', description: 'Performance das comunicações' },
              { type: 'expense_breakdown' as ReportType, title: 'Breakdown de Despesas', description: 'Análise detalhada de gastos' }
            ].map((item) => (
              <Card key={item.type} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {getReportTypeIcon(item.type)}
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <Button 
                      className="w-full" 
                      onClick={() => handleGenerateReport(item.type)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <LoadingSpinner size="sm" variant="white" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Gerar Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Editor de Configuração */}
      <Dialog open={showConfigEditor} onOpenChange={setShowConfigEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Editar Configuração' : 'Nova Configuração de Relatório'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome *</label>
                <Input
                  placeholder="Ex: Relatório Financeiro Mensal"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Relatório *</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ReportType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial_summary">Resumo Financeiro</SelectItem>
                    <SelectItem value="payment_analysis">Análise de Pagamentos</SelectItem>
                    <SelectItem value="arrears_report">Relatório de Morosidade</SelectItem>
                    <SelectItem value="expense_breakdown">Breakdown de Despesas</SelectItem>
                    <SelectItem value="member_analysis">Análise de Membros</SelectItem>
                    <SelectItem value="communication_stats">Estatísticas de Comunicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                placeholder="Descrição opcional do relatório"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={formData.filters.startDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    filters: { ...prev.filters, startDate: e.target.value }
                  }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={formData.filters.endDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    filters: { ...prev.filters, endDate: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Formatos de Exportação</label>
              <div className="flex space-x-4">
                {(['pdf', 'excel', 'csv'] as ReportFormat[]).map(format => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.format.includes(format)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, format: [...prev.format, format] }));
                        } else {
                          setFormData(prev => ({ ...prev, format: prev.format.filter(f => f !== format) }));
                        }
                      }}
                    />
                    <span className="capitalize">{format}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.isScheduled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isScheduled: !!checked }))}
              />
              <label className="text-sm font-medium">Agendar geração automática</label>
            </div>

            {formData.isScheduled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Frequência</label>
                  <Select
                    value={formData.schedule.frequency}
                    onValueChange={(value: any) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, frequency: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                      <SelectItem value="quarterly">Trimestralmente</SelectItem>
                      <SelectItem value="yearly">Anualmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Dia do Mês</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.schedule.dayOfMonth}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, dayOfMonth: parseInt(e.target.value) || 1 }
                    }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Hora</label>
                  <Input
                    type="time"
                    value={formData.schedule.time}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, time: e.target.value }
                    }))}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <label className="text-sm">Configuração ativa</label>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowConfigEditor(false)}>
                Cancelar
              </Button>
              
              <Button 
                onClick={handleSaveConfig}
                disabled={isSaving || !formData.name}
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" variant="white" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {editingConfig ? 'Atualizar' : 'Criar'} Configuração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Eliminação */}
      <DeleteConfirmDialog
        open={!!deletingConfig}
        onOpenChange={(open) => !open && setDeletingConfig(null)}
        itemName={`a configuração "${deletingConfig?.name}"`}
        onConfirm={handleDeleteConfig}
      />
    </div>
  );
};

export default ReportsGenerator;