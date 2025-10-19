import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useBuildings } from '@/hooks/useNeonData';
import { 
  Wrench, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Euro,
  Building2,
  Plus,
  Search,
  Filter,
  FileText,
  TrendingUp,
  Settings,
  Zap,
  Shield,
  Droplets,
  Thermometer,
  Camera,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const Manutencao: React.FC = () => {
  const { data: buildings } = useBuildings();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  // A implementar com dados reais da base de dados
  const maintenanceTasks: any[] = [];

  // A implementar com dados reais da base de dados
  const providers: any[] = [];

  // A implementar com dados reais da base de dados
  const predictiveAlerts: any[] = [];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'elevador':
        return <Building2 className="h-4 w-4" />;
      case 'canalizacao':
        return <Droplets className="h-4 w-4" />;
      case 'eletricidade':
        return <Zap className="h-4 w-4" />;
      case 'climatizacao':
        return <Thermometer className="h-4 w-4" />;
      case 'seguranca':
        return <Shield className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  // A implementar com dados reais da base de dados
  const stats = {
    totalTasks: maintenanceTasks.length,
    pendingTasks: maintenanceTasks.filter(t => t.status === 'pending').length,
    inProgressTasks: maintenanceTasks.filter(t => t.status === 'in_progress').length,
    completedTasks: maintenanceTasks.filter(t => t.status === 'completed').length,
    totalCost: maintenanceTasks.reduce((sum, task) => sum + task.estimatedCost, 0),
    averageProgress: maintenanceTasks.length > 0 ? Math.round(
      maintenanceTasks.reduce((sum, task) => sum + task.progress, 0) / maintenanceTasks.length
    ) : 0
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Manutenção</h1>
          <p className="text-muted-foreground mt-1">
            Sistema preditivo de manutenção e gestão de fornecedores
          </p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa de Manutenção</DialogTitle>
              <DialogDescription>
                Adicione uma nova tarefa de manutenção ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input id="title" placeholder="Ex: Inspeção do elevador" />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" placeholder="Descrição detalhada da tarefa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="building">Edifício</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar edifício" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings?.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elevador">Elevador</SelectItem>
                      <SelectItem value="canalizacao">Canalização</SelectItem>
                      <SelectItem value="eletricidade">Eletricidade</SelectItem>
                      <SelectItem value="climatizacao">Climatização</SelectItem>
                      <SelectItem value="seguranca">Segurança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cost">Custo Estimado (€)</Label>
                  <Input id="cost" type="number" placeholder="0" />
                </div>
              </div>
              <div>
                <Label>Data Prevista</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: pt }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Criar Tarefa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <p className="text-sm text-muted-foreground">Total Tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.averageProgress}%</p>
                <p className="text-sm text-muted-foreground">Progresso Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">€{stats.totalCost}</p>
                <p className="text-sm text-muted-foreground">Custo Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tarefas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="preditivo">Análise Preditiva</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
        </TabsList>

        {/* Tarefas de Manutenção */}
        <TabsContent value="tarefas" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tarefas..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>

          <div className="space-y-4">
            {maintenanceTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${getStatusColor(task.status)}`}>
                        {getCategoryIcon(task.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? 'Alta' : 
                             task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center space-x-1">
                            <Building2 className="h-3 w-3" />
                            <span>{task.building}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignedTo}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{task.dueDate}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Euro className="h-3 w-3" />
                            <span>€{task.estimatedCost}</span>
                          </span>
                        </div>
                        {task.status === 'in_progress' && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Gestão de Fornecedores */}
        <TabsContent value="fornecedores" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Fornecedores Registados</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Fornecedor
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{provider.name}</span>
                    <Badge variant="outline">{provider.category}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {provider.activeContracts} contratos ativos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{provider.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Avaliação:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">{provider.rating}</span>
                      <span className="text-xs text-muted-foreground">/ 5.0</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Contactar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Contratos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Análise Preditiva */}
        <TabsContent value="preditivo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Preditivos</CardTitle>
              <CardDescription>
                Sistema inteligente de previsão de manutenções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                    <div className={`p-2 rounded-full ${getUrgencyColor(alert.urgency)}`}>
                      {alert.type === 'preventiva' ?
                        <Clock className="h-4 w-4" /> :
                        alert.type === 'alerta' ?
                        <AlertTriangle className="h-4 w-4" /> :
                        <TrendingUp className="h-4 w-4" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{alert.title}</h3>
                        <Badge 
                          variant={alert.urgency === 'high' ? 'destructive' : 
                                  alert.urgency === 'medium' ? 'warning' : 'secondary'}
                        >
                          {alert.urgency === 'high' ? 'Urgente' :
                           alert.urgency === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Data estimada: {alert.estimatedDate}</span>
                        <span>Categoria: {alert.category}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Planear
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Eficiência Energética</CardTitle>
                <CardDescription>
                  Monitorização do consumo energético
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
                  <p className="text-muted-foreground">Dados disponíveis em breve</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Conecte sensores IoT para monitorização automática
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custos Preditivos</CardTitle>
                <CardDescription>
                  Previsão de gastos de manutenção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Este mês</span>
                    <span className="font-medium">€1,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Próximo mês</span>
                    <span className="font-medium">€850</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trimestre</span>
                    <span className="font-medium">€3,400</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Poupança estimada</span>
                      <span className="font-bold text-green-600">€420</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendário */}
        <TabsContent value="calendario" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Manutenções</CardTitle>
              <CardDescription>
                Vista mensal das tarefas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Calendário interativo em desenvolvimento</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Integração com Google Calendar e Outlook planeada
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manutencao;