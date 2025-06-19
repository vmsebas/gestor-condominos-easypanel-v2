import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, ListTodo, Clock, AlertCircle } from 'lucide-react';
import TaskList from '@/components/tasks/TaskList';
import { getTasks, getTaskStats } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const Tarefas: React.FC = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  
  const { data: stats } = useQuery({
    queryKey: ['taskStats', buildingId],
    queryFn: () => getTaskStats(buildingId || ''),
    enabled: !!buildingId,
  });

  const taskStats = stats?.data || {
    pending_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    overdue_count: 0,
    total_count: 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CheckSquare className="h-8 w-8" />
          Tarefas
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as tarefas e ações do condomínio
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tarefas Pendentes
            </CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.pending_count}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Progresso
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.in_progress_count}</div>
            <p className="text-xs text-muted-foreground">
              Sendo executadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concluídas
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.completed_count}</div>
            <p className="text-xs text-muted-foreground">
              Finalizadas com sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atrasadas
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {taskStats.overdue_count}
            </div>
            <p className="text-xs text-muted-foreground">
              Prazo vencido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskList buildingId={buildingId} showFilters={true} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Tarefas;