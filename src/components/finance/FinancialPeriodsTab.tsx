import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, TrendingDown, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface MemberBalance {
  member_id: string;
  member_name: string;
  fraction: string;
  permilage: string;
  quota_expected_monthly: number;
  quota_expected_annual: number;
  quota_paid_total: number;
  balance: number;
  opening_balance: number;  // Crédito/deuda de anos anteriores
  balance_total_real: number;  // Balance total real (opening + balance 2025)
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  last_payment_date?: string;
}

interface PeriodSummary {
  period: {
    id: string;
    year: number;
    monthly_quota_150: number;
    monthly_quota_200: number;
    is_closed: boolean;
  };
  balances: MemberBalance[];
  totals: {
    expected_total: number;
    paid_total: number;
    balance_2025: number;  // Dívida solo de 2025
    opening_balance_total: number;  // Crédito total de anos anteriores
    balance_total_real: number;  // Balance total real
    members_count: number;
    paid_count: number;
    partial_count: number;
    unpaid_count: number;
  };
}

const FinancialPeriodsTab: React.FC = () => {
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPeriodSummary();
  }, [selectedYear]);

  const fetchPeriodSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get building_id (assuming first building)
      const buildingsRes = await fetch('/api/buildings');
      const buildingsData = await buildingsRes.json();

      if (!buildingsData.success || !buildingsData.data?.[0]?.id) {
        throw new Error('No se encontró ningún edificio');
      }

      const buildingId = buildingsData.data[0].id;

      // Fetch period summary
      const res = await fetch(`/api/financial-periods/${selectedYear}/summary?building_id=${buildingId}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar datos');
      }

      setSummary(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Al día</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'unpaid':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Erro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Não há dados disponíveis para o ano {selectedYear}
        </CardContent>
      </Card>
    );
  }

  const collectionRate = summary.totals.expected_total > 0
    ? (summary.totals.paid_total / summary.totals.expected_total) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Período:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border rounded-lg bg-background"
        >
          {[2021, 2022, 2023, 2024, 2025].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        {summary.period.is_closed && (
          <Badge variant="secondary">Período Fechado</Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Esperado</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(summary.totals.expected_total)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pago</CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(summary.totals.paid_total)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Balance Total Real</CardDescription>
            <CardTitle className={`text-2xl ${
              summary.totals.balance_total_real >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(summary.totals.balance_total_real)}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              2025: {formatCurrency(summary.totals.balance_2025)} |
              Anos ant.: {formatCurrency(summary.totals.opening_balance_total)}
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Taxa de Cobrança</CardDescription>
            <CardTitle className="text-2xl flex items-center">
              {collectionRate.toFixed(1)}%
              {collectionRate >= 80 ? (
                <TrendingUp className="h-5 w-5 text-green-500 ml-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 ml-2" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Estado dos Condóminos ({selectedYear})</CardTitle>
          <CardDescription>
            {summary.totals.members_count} condóminos •
            {' '}{summary.totals.paid_count} al día •
            {' '}{summary.totals.partial_count} parcial •
            {' '}{summary.totals.unpaid_count} pendentes
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Balances por Condómino</CardTitle>
          <CardDescription>
            Quotas mensais: {formatCurrency(summary.period.monthly_quota_150)} (150‰) • {formatCurrency(summary.period.monthly_quota_200)} (200‰)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Condómino</TableHead>
                <TableHead className="text-center">Fração</TableHead>
                <TableHead className="text-center">Permilagem</TableHead>
                <TableHead className="text-right">Quota Anual</TableHead>
                <TableHead className="text-right">Total Pago</TableHead>
                <TableHead className="text-right">Balance Total</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.balances.map((balance) => (
                <TableRow key={balance.member_id}>
                  <TableCell className="font-medium">{balance.member_name}</TableCell>
                  <TableCell className="text-center">{balance.fraction}</TableCell>
                  <TableCell className="text-center">{balance.permilage}‰</TableCell>
                  <TableCell className="text-right">{formatCurrency(balance.quota_expected_annual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(balance.quota_paid_total)}</TableCell>
                  <TableCell className={`text-right font-bold ${
                    balance.balance_total_real >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <div>{formatCurrency(balance.balance_total_real)}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      2025: {formatCurrency(balance.balance)} | Anos ant.: {formatCurrency(balance.opening_balance)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(balance.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {summary.balances.some(b => b.notes) && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Notas:</p>
              <ul className="text-sm space-y-1">
                {summary.balances.filter(b => b.notes).map((balance) => (
                  <li key={balance.member_id}>
                    <strong>{balance.member_name}:</strong> {balance.notes}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialPeriodsTab;
