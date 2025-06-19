import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import financeService from '@/utils/db/financeService';
import { FinancialPeriod } from '@/types/finance/financeTypes';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { useNotifications } from '@/components/common/NotificationProvider';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Check, 
  Clock,
  Euro,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EmptyList } from '@/components/common/EmptyState';
import NewPeriodForm from '../forms/NewPeriodForm';

interface PeriodSelectorProps {
  selectedPeriod?: string;
  onPeriodChange?: (periodId: string) => void;
  showManagement?: boolean;
  className?: string;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  showManagement = false,
  className
}) => {
  const { currentBuilding } = useBuilding();
  const { success, error } = useNotifications();
  
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPeriodDialog, setShowNewPeriodDialog] = useState(false);
  const [activatingPeriod, setActivatingPeriod] = useState<string | null>(null);

  // Carregar períodos
  useEffect(() => {
    if (currentBuilding?.id) {
      loadPeriods();
    }
  }, [currentBuilding?.id]);

  const loadPeriods = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const data = await financeService.getFinancialPeriods(currentBuilding.id);
      setPeriods(data);
      
      // Selecionar período ativo se não há um selecionado
      if (!selectedPeriod && data.length > 0) {
        const activePeriod = data.find(p => p.isActive) || data[0];
        onPeriodChange?.(activePeriod.id);
      }
    } catch (err) {
      console.error('Erro ao carregar períodos:', err);
      error('Erro ao carregar períodos financeiros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePeriod = async (periodData: Partial<FinancialPeriod>) => {
    try {
      // Implementar criação no serviço
      // const newPeriod = await financeService.createFinancialPeriod(periodData);
      
      const newPeriod: FinancialPeriod = {
        id: `period-${Date.now()}`,
        buildingId: currentBuilding!.id,
        year: periodData.year!,
        startDate: periodData.startDate!,
        endDate: periodData.endDate!,
        isActive: false,
        budgetAmount: periodData.budgetAmount!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setPeriods(prev => [...prev, newPeriod]);
      setShowNewPeriodDialog(false);
      success(`Período ${newPeriod.year} criado com sucesso`);
    } catch (err) {
      console.error('Erro ao criar período:', err);
      error('Erro ao criar período financeiro');
    }
  };

  const activatePeriod = async (periodId: string) => {
    try {
      setActivatingPeriod(periodId);
      
      // Implementar ativação no serviço
      // await financeService.activateFinancialPeriod(periodId);
      
      // Atualizar localmente
      setPeriods(prev => prev.map(p => ({
        ...p,
        isActive: p.id === periodId
      })));
      
      success('Período ativado com sucesso');
    } catch (err) {
      console.error('Erro ao ativar período:', err);
      error('Erro ao ativar período');
    } finally {
      setActivatingPeriod(null);
    }
  };

  const activePeriod = periods.find(p => p.isActive);
  const currentPeriod = periods.find(p => p.id === selectedPeriod);

  if (!currentBuilding) {
    return null;
  }

  if (showManagement) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Cabeçalho */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Períodos Financeiros
                  <Badge variant="secondary" className="ml-2">
                    {periods.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Gerir anos fiscais e orçamentos anuais
                </p>
              </div>
              
              <Button
                onClick={() => setShowNewPeriodDialog(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Período
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Lista de Períodos */}
        {isLoading ? (
          <LoadingSpinner />
        ) : periods.length === 0 ? (
          <EmptyList
            icon={<Calendar className="h-full w-full" />}
            title="Nenhum período financeiro"
            description="Comece por criar o primeiro período fiscal para organizar as finanças"
            actionLabel="Criar Período"
            onAction={() => setShowNewPeriodDialog(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {periods.map((period) => (
              <Card key={period.id} className={`${period.isActive ? 'border-primary' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{period.year}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </p>
                    </div>
                    
                    {period.isActive ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Orçamento:</span>
                      <span className="font-medium">{formatCurrency(period.budgetAmount)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${
                        period.isActive ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {period.isActive ? 'Em uso' : 'Aguardando'}
                      </span>
                    </div>
                  </div>
                  
                  {!period.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => activatePeriod(period.id)}
                      disabled={activatingPeriod === period.id}
                      className="w-full mt-4"
                    >
                      {activatingPeriod === period.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Ativar Período
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Novo Período */}
        <Dialog open={showNewPeriodDialog} onOpenChange={setShowNewPeriodDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Período Financeiro</DialogTitle>
            </DialogHeader>
            <NewPeriodForm
              onSubmit={handleCreatePeriod}
              onCancel={() => setShowNewPeriodDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Modo seletor simples
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Período:</span>
      </div>
      
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : periods.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Nenhum período criado</span>
        </div>
      ) : (
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.id} value={period.id}>
                <div className="flex items-center gap-2">
                  <span>{period.year}</span>
                  {period.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Ativo
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Informações do Período Atual */}
      {currentPeriod && (
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Euro className="h-3 w-3" />
            <span>Orçamento: {formatCurrency(currentPeriod.budgetAmount)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodSelector;