import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { getTasks, completeTask, updateTask } from '@/lib/api';
import { toast } from 'sonner';
import TaskForm from './TaskForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Task {
  id: number;
  building_id: string;
  minute_id?: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_name?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  category?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  notes?: string;
  minute_title?: string;
  building_name?: string;
}

interface TaskListProps {
  buildingId?: string;
  minuteId?: string;
  showFilters?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ buildingId, minuteId, showFilters = true }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [buildingId, minuteId, statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (buildingId) params.buildingId = buildingId;
      if (minuteId) params.minuteId = minuteId;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      
      const response = await getTasks(params);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await completeTask(taskId.toString());
      toast.success('Tarefa marcada como concluída.');
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Não foi possível completar a tarefa.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, status: string) => {
    try {
      await updateTask(taskId.toString(), { status });
      toast.success('Status da tarefa atualizado.');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Não foi possível atualizar o status da tarefa.');
    }
  };

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    fetchTasks();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Progresso';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'completed' || status === 'cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="text-center py-4">Carregando tarefas...</div>;
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <Button onClick={() => setShowTaskForm(true)}>
              Nova Tarefa
            </Button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
            {!showFilters && (
              <Button 
                onClick={() => setShowTaskForm(true)} 
                className="mt-4"
                variant="outline"
              >
                Criar Primeira Tarefa
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className={task.status === 'completed' ? 'opacity-75' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {task.title}
                    </CardTitle>
                    {task.minute_title && (
                      <p className="text-sm text-muted-foreground">
                        Ata: {task.minute_title}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusBadgeVariant(task.status) as any}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(task.priority) as any}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  {task.assignee_name && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{task.assignee_name}</span>
                    </div>
                  )}

                  {task.due_date && (
                    <div className={`flex items-center gap-1 ${
                      isOverdue(task.due_date, task.status) ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(task.due_date), "d 'de' MMMM", { locale: pt })}
                      </span>
                      {isOverdue(task.due_date, task.status) && (
                        <AlertCircle className="h-3 w-3 ml-1" />
                      )}
                    </div>
                  )}

                  {task.completed_at && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>
                        Concluída em {format(new Date(task.completed_at), "d 'de' MMMM", { locale: pt })}
                      </span>
                    </div>
                  )}
                </div>

                {task.notes && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm">{task.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {task.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Iniciar
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluir
                      </Button>
                    </>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Concluir
                    </Button>
                  )}

                  {(task.status === 'pending' || task.status === 'in_progress') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTask(task);
                      setShowTaskForm(true);
                    }}
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showTaskForm && (
        <TaskForm
          buildingId={buildingId || ''}
          minuteId={minuteId}
          task={editingTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
          onSuccess={handleTaskCreated}
        />
      )}
    </div>
  );
};

export default TaskList;