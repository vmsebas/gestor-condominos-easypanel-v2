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
      setError('No se pudo identificar el edificio del usuario');
    }
  }, [user]);

  const fetchArrearsData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/arrears/summary?buildingId=${user?.building_id}&includeDetails=true`);
      if (response.data.success) {
        setArrearsData(response.data.data);
      } else {
        setError('Error al cargar datos de morosidad');
      }
    } catch (err) {
      console.error('Error fetching arrears data:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (daysOverdue: number, amount: number) => {
    if (daysOverdue > 90 || amount > 1000) {
      return <Badge variant="destructive">Alto Riesgo</Badge>;
    } else if (daysOverdue > 60 || amount > 500) {
      return <Badge variant="secondary">Riesgo Medio</Badge>;
    } else {
      return <Badge variant="outline">Riesgo Bajo</Badge>;
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
            <span className="ml-2">Cargando datos de morosidad...</span>
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
      {/* Resumen Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Miembros Morosos</p>
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
                <p className="text-sm text-muted-foreground">Total Adeudado</p>
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
                <p className="text-sm text-muted-foreground">Deuda Promedio</p>
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
                <p className="text-sm text-muted-foreground">Pagos Vencidos</p>
                <p className="text-2xl font-bold">{summary.total_arrears_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de Morosidad */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detalle de Morosidad</CardTitle>
              <CardDescription>
                Miembros con pagos pendientes ordenados por monto adeudado
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
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
                    ¡Excelente! No hay morosidad registrada
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos los pagos están al día
                  </p>
                </div>
              ) : (
                <>
                  {/* Indicador de Tasa de Cobro */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Tasa de Cobro</span>
                      <span className="text-sm font-medium">{collectionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={collectionRate} className="h-2" />
                  </div>

                  {/* Lista de Morosos */}
                  <div className="divide-y">
                    {memberDetails.map((member) => (
                      <div key={member.member_id} className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{member.member_name}</h4>
                              <Badge variant="outline">Unidad {member.unit_number}</Badge>
                              {getRiskBadge(member.max_days_overdue, member.total_debt)}
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Total Adeudado: </span>
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(member.total_debt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pagos Vencidos: </span>
                                <span className="font-semibold">{member.arrears_count}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Días de Atraso: </span>
                                <span className={`font-semibold ${getDaysColor(member.max_days_overdue)}`}>
                                  {member.max_days_overdue} días
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              Deuda más antigua: {new Date(member.oldest_due_date).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button size="sm" variant="outline">
                              Ver Detalle
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resumen de Fechas */}
                  {summary.oldest_debt_date && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          Deuda más antigua: {new Date(summary.oldest_debt_date).toLocaleDateString('es-ES')}
                        </span>
                        <span>
                          Deuda más reciente: {new Date(summary.newest_debt_date).toLocaleDateString('es-ES')}
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