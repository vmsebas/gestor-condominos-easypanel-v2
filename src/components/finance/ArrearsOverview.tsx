import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Euro,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface ArrearsSummary {
  summary: {
    members_in_debt: number;
    total_arrears_count: number;
    total_amount: number;
    average_debt: number;
    oldest_debt_date: string;
    newest_debt_date: string;
  };
  memberDetails: Array<{
    member_id: string;
    member_name: string;
    unit_number: string;
    email: string;
    arrears_count: number;
    total_debt: number;
    oldest_due_date: string;
    max_days_overdue: number;
  }>;
}

const ArrearsOverview: React.FC = () => {
  const { user } = useAuth();
  const [arrearsData, setArrearsData] = useState<ArrearsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user?.building_id) {
      fetchArrearsData();
    } else {
      setLoading(false);
      setError('Não foi possível identificar o edifício do utilizador');
    }
  }, [user]);

  const fetchArrearsData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/arrears/summary?buildingId=${user?.building_id}&includeDetails=true`);
      if (response.data.success) {
        setArrearsData(response.data.data);
      } else {
        setError('Erro ao carregar dados de incumprimento');
      }
    } catch (err) {
      console.error('Error fetching arrears data:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (daysOverdue: number, amount: number) => {
    if (daysOverdue > 90 || amount > 1000) {
      return <Badge variant="destructive">Risco Elevado</Badge>;
    } else if (daysOverdue > 60 || amount > 500) {
      return <Badge variant="secondary">Risco Médio</Badge>;
    } else {
      return <Badge variant="outline">Risco Baixo</Badge>;
    }
  };

  const getDaysColor = (days: number) => {
    if (days > 90) return 'text-red-600';
    if (days > 60) return 'text-orange-600';
    if (days > 30) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">A carregar dados de incumprimento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!arrearsData) {
    return null;
  }

  const { summary, memberDetails } = arrearsData;
  const collectionRate = summary.total_arrears_count > 0 
    ? ((summary.total_arrears_count - summary.members_in_debt) / summary.total_arrears_count) * 100 
    : 100;

  return (
    <div className="space-y-6">
      {/* Resumo Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Condóminos em Incumprimento</p>
                <p className="text-2xl font-bold">{summary.members_in_debt}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total em Dívida</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.total_amount)}</p>
              </div>
              <Euro className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dívida Média</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.average_debt)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagamentos Vencidos</p>
                <p className="text-2xl font-bold">{summary.total_arrears_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhe de Incumprimento */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detalhe de Incumprimento</CardTitle>
              <CardDescription>
                Condóminos com pagamentos pendentes ordenados por valor em dívida
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
              <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        {showDetails && (
          <CardContent>
            <div className="space-y-4">
              {memberDetails.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-green-600">
                    Excelente! Não há incumprimento registado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos os pagamentos estão em dia
                  </p>
                </div>
              ) : (
                <>
                  {/* Indicador de Taxa de Cobrança */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Taxa de Cobrança</span>
                      <span className="text-sm font-medium">{collectionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={collectionRate} className="h-2" />
                  </div>

                  {/* Lista de Incumprimentos */}
                  <div className="divide-y">
                    {memberDetails.map((member) => (
                      <div key={member.member_id} className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{member.member_name}</h4>
                              <Badge variant="outline">Fração {member.unit_number}</Badge>
                              {getRiskBadge(member.max_days_overdue, member.total_debt)}
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Total em Dívida: </span>
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(member.total_debt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pagamentos Vencidos: </span>
                                <span className="font-semibold">{member.arrears_count}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Dias de Atraso: </span>
                                <span className={`font-semibold ${getDaysColor(member.max_days_overdue)}`}>
                                  {member.max_days_overdue} dias
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              Dívida mais antiga: {new Date(member.oldest_due_date).toLocaleDateString('pt-PT')}
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button size="sm" variant="outline">
                              Ver Detalhe
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumo de Datas */}
                  {summary.oldest_debt_date && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          Dívida mais antiga: {new Date(summary.oldest_debt_date).toLocaleDateString('pt-PT')}
                        </span>
                        <span>
                          Dívida mais recente: {new Date(summary.newest_debt_date).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ArrearsOverview;