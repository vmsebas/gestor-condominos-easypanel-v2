import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FinancialDashboard from '@/components/finance/displays/FinancialDashboard';
import TransactionManagementDialog from '@/components/transactions/TransactionManagementDialog';
import ArrearsOverview from '@/components/finance/ArrearsOverview';
import FinancialPeriodsTab from '@/components/finance/FinancialPeriodsTab';
import { useFinancialSummary, useTransactions } from '@/hooks/useNeonData';
import { Calculator, Plus, TrendingUp, Euro, PieChart, BarChart, FileText, CreditCard, Edit3, Eye, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const Financas: React.FC = () => {
  // State for transaction management
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionDialogMode, setTransactionDialogMode] = useState<'edit' | 'view'>('view');
  
  // Dados financeiros da base de dados local
  const { data: financialSummary, isLoading: financialLoading, error: financialError } = useFinancialSummary();
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions();
  
  // Transaction management handlers
  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionDialogMode('view');
    setTransactionDialogOpen(true);
  };
  
  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionDialogMode('edit');
    setTransactionDialogOpen(true);
  };

  // A implementar com dados reais da base de dados
  const financialData = {
    budget: financialSummary?.budget || 0,
    expenses: financialSummary?.expenses || 0,
    income: financialSummary?.income || 0,
    balance: financialSummary?.balance || 0,
    reserve: financialSummary?.reserve || 0,
    pendingPayments: 0,
    categories: []
  };

  // Helper function to safely parse amounts
  const safeParseAmount = (amount: string | number | undefined): number => {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') return parseFloat(amount) || 0;
    return 0;
  };
  
  // A implementar com dados reais da base de dados
  const recentTransactions = transactions && transactions.length > 0 ? 
    transactions.slice(0, 10).map((tx: any) => ({
      ...tx,
      id: tx.id,
      date: tx.transaction_date || tx.date,
      description: tx.description,
      category: tx.category || 'Geral',
      amount: safeParseAmount(tx.amount),
      type: safeParseAmount(tx.amount) > 0 ? 'income' : 'expense'
    })) : [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Indicador de ligação à base de dados */}
      {(financialLoading || transactionsLoading) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            ⏳ A carregar dados financeiros da base de dados local...
          </p>
        </div>
      )}
      
      {(financialError || transactionsError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">
            ⚠️ Erro ao carregar dados: {financialError?.message || transactionsError?.message}. A usar dados simulados.
          </p>
        </div>
      )}
      
      {financialSummary && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            ✅ Dados financeiros carregados da base de dados local
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finanças</h1>
          <p className="text-muted-foreground mt-1">
            Gestão económica e orçamental
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
          <Button size="lg" variant="workflow">
            <Plus className="h-5 w-5 mr-2" />
            Novo Registo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="periods" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="periods">Períodos</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Movimentos</TabsTrigger>
          <TabsTrigger value="arrears">Morosidade</TabsTrigger>
          <TabsTrigger value="budget">Orçamento</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="periods">
          <FinancialPeriodsTab />
        </TabsContent>

        <TabsContent value="dashboard">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Movimentos Recentes</CardTitle>
              <CardDescription>
                Últimas transações registadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>
                            {transaction.date ? format(new Date(transaction.date), 'PP', { locale: pt }) : 'Data não disponível'}
                          </span>
                          <span>•</span>
                          <span>{transaction.category}</span>
                          {transaction.member_id && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                Membro associado
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}€{Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        {!transaction.is_confirmed && (
                          <Badge variant="secondary" className="text-xs">
                            Pendente
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar/Gerir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arrears">
          <ArrearsOverview />
        </TabsContent>

        <TabsContent value="budget">
          <div className="text-center py-12">
            <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              Gestão de Orçamento
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Funcionalidade em desenvolvimento - Gestão completa de orçamentos anuais
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="text-center py-12">
            <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              Relatórios Financeiros
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Funcionalidade em desenvolvimento - Relatórios detalhados e exportações
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Transaction Management Dialog */}
      <TransactionManagementDialog
        isOpen={transactionDialogOpen}
        onClose={() => setTransactionDialogOpen(false)}
        transaction={selectedTransaction}
        mode={transactionDialogMode}
      />
    </div>
  );
};

export default Financas;