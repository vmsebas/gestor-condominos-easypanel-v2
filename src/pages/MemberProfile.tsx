import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Home, 
  Mail, 
  Phone, 
  Euro, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download,
  Eye,
  Send,
  CreditCard,
  Building2,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  MoreHorizontal,
  Loader2,
  Edit3,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
import { 
  useMemberProfile,
  useBuildings,
  useDeleteMember
} from '@/hooks/useNeonData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import MemberFormDialog from '@/components/members/MemberFormDialog';
import { toast } from 'sonner';

interface Transaction {
  id: number;
  amount: string | number; // Can come as string from API
  description: string;
  transaction_type: 'income' | 'expense';
  transaction_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  member_id?: string;
}

interface Document {
  id: number;
  name: string;
  original_name: string;
  file_path: string;
  file_size_formatted?: string;
  file_size?: number;
  file_extension: string;
  category: string;
  description?: string;
  uploaded_at: string;
  uploaded_by: string;
  is_confidential: boolean;
  member_id?: string;
}

interface Letter {
  id: number;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  content: string;
  sent_at: string;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  member_id?: string;
}

const MemberProfile: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const deleteMemberMutation = useDeleteMember();
  
  const handleEditMember = () => {
    setMemberFormOpen(true);
  };
  
  const handleDeleteMember = () => {
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteMember = async () => {
    if (!member) return;
    
    try {
      await deleteMemberMutation.mutateAsync(member.id);
      toast.success('Membro eliminado com sucesso!');
      navigate('/miembros');
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Erro ao eliminar membro');
    }
  };

  // Fetch member profile data (includes all related data)
  const { data: profileData, isLoading: profileLoading, error: profileError } = useMemberProfile(memberId || '');
  
  // Fetch buildings for building info
  const { data: buildings } = useBuildings();
  
  // Extract data from profile
  const member = profileData?.member;
  const memberTransactions = profileData?.transactions || [];
  const memberDocuments = profileData?.documents || [];
  const financialSummary = profileData?.financialSummary;
  const statistics = profileData?.statistics;
  
  const building = buildings?.find(b => b.id === member?.building_id);

  // For now, we'll use empty arrays for letters since they're not in the profile endpoint yet
  const memberLetters: Letter[] = [];

  // Helper function to safely parse amounts
  const safeParseAmount = (amount: string | number | undefined): number => {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') return parseFloat(amount) || 0;
    return 0;
  };

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Data não disponível';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return format(date, 'PP', { locale: pt });
    } catch {
      return 'Erro na data';
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">A carregar perfil do membro...</span>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Erro ao carregar perfil
          </h2>
          <p className="text-muted-foreground mb-4">{profileError.message}</p>
          <Button onClick={() => navigate('/miembros')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Membros
          </Button>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">
            Membro não encontrado
          </h2>
          <Button onClick={() => navigate('/miembros')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Membros
          </Button>
        </div>
      </div>
    );
  }

  // Use financial summary from API or calculate if not available
  const totalPaid = financialSummary?.totalPaid || 0;
  const totalDue = financialSummary?.totalDue || 0;
  const currentBalance = financialSummary?.currentBalance || 0;
  const monthlyFee = financialSummary?.monthlyFee || 0;
  const annualFee = financialSummary?.annualFee || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/miembros')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{member.name}</h1>
          <p className="text-muted-foreground">
            Perfil completo do membro
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleEditMember}>
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDeleteMember}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </motion.div>

      {/* Member Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{member.apartment}</p>
                <p className="text-xs text-muted-foreground">Apartamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{member.votes}</p>
                <p className="text-xs text-muted-foreground">Votos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Euro className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">€{monthlyFee.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Quota Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              {currentBalance >= 0 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{Math.abs(currentBalance).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentBalance >= 0 ? 'Saldo Positivo' : 'Em Dívida'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="financial">Finanças</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="communications">Comunicações</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Informação Rápida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fracção:</span>
                  <Badge variant="outline">{member.fraction}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Edifício:</span>
                  <span>{building?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quota Anual:</span>
                  <span>€{annualFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membro desde:</span>
                  <span>{member?.created_at ? safeFormatDate(member.created_at) : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pago:</span>
                  <span className="text-green-600 font-medium">€{totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Devido:</span>
                  <span className="text-orange-600 font-medium">€{totalDue.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Saldo Atual:</span>
                  <span className={`font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{currentBalance.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recent Transactions */}
                {memberTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {transaction.transaction_type === 'income' ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {safeFormatDate(transaction.transaction_date)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-medium ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}€{safeParseAmount(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                {/* Recent Documents */}
                {memberDocuments.slice(0, 2).map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(document.uploaded_at), 'PP', { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{document.category}</Badge>
                  </div>
                ))}

                {memberTransactions.length === 0 && memberDocuments.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma atividade recente encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informação detalhada do membro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <p className="text-lg">{member.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p>{member.email || 'Não fornecido'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p>{member.phone || 'Não fornecido'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Apartamento</label>
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <p>{member.apartment}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fracção</label>
                    <p>{member.fraction}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Votos</label>
                    <p>{member.votes}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Edifício</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p>{building?.name}</p>
                </div>
                {building?.address && (
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {building.address}, {building.postal_code} {building.city}
                    </p>
                  </div>
                )}
              </div>

              {/* Secondary Address */}
              {(member.secondary_address || member.secondary_city) && (
                <>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Endereço Alternativo</label>
                    {member.secondary_address && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <p>{member.secondary_address}</p>
                      </div>
                    )}
                    {(member.secondary_postal_code || member.secondary_city) && (
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {member.secondary_postal_code && `${member.secondary_postal_code} `}
                          {member.secondary_city}
                          {member.secondary_country && member.secondary_country !== 'Portugal' && `, ${member.secondary_country}`}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Conta criada</label>
                  <p>{member?.created_at ? format(new Date(member.created_at), 'PPpp', { locale: pt }) : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última atualização</label>
                  <p>{member?.updated_at ? format(new Date(member.updated_at), 'PPpp', { locale: pt }) : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Summary Cards */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">€{totalPaid.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Pago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold text-orange-600">€{totalDue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Devido</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      €{currentBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo Atual</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Todas as transações relacionadas com este membro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberTransactions && memberTransactions.length > 0 ? (
                <div className="space-y-4">
                  {memberTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {transaction.transaction_type === 'income' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{format(new Date(transaction.transaction_date), 'PP', { locale: pt })}</span>
                            {transaction.payment_method && (
                              <Badge variant="outline">{transaction.payment_method}</Badge>
                            )}
                            {transaction.reference_number && (
                              <span>Ref: {transaction.reference_number}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.transaction_type === 'income' ? '+' : '-'}€{safeParseAmount(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhuma transação encontrada
                  </h3>
                  <p className="text-muted-foreground">
                    Este membro ainda não tem transações registadas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Relacionados</CardTitle>
              <CardDescription>
                Documentos associados a este membro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberDocuments && memberDocuments.length > 0 ? (
                <div className="space-y-4">
                  {memberDocuments.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{document.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{format(new Date(document.uploaded_at), 'PP', { locale: pt })}</span>
                            <Badge variant="outline">{document.category}</Badge>
                            <span>{document.file_size_formatted || formatFileSize(document.file_size || 0)}</span>
                            {document.is_confidential && (
                              <Badge variant="destructive">Confidencial</Badge>
                            )}
                          </div>
                          {document.description && (
                            <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`${document.file_path}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${document.file_path}`;
                            link.download = document.original_name;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhum documento encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    Este membro ainda não tem documentos associados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comunicações</CardTitle>
              <CardDescription>
                Cartas e emails enviados para este membro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberLetters.length > 0 ? (
                <div className="space-y-4">
                  {memberLetters.map((letter) => (
                    <div key={letter.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-5 w-5 text-blue-500" />
                          <p className="font-medium">{letter.subject}</p>
                        </div>
                        <Badge 
                          variant={
                            letter.delivery_status === 'delivered' ? 'default' :
                            letter.delivery_status === 'sent' ? 'secondary' :
                            letter.delivery_status === 'failed' ? 'destructive' : 'outline'
                          }
                        >
                          {letter.delivery_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <p>Para: {letter.recipient_name} ({letter.recipient_email})</p>
                        <p>Enviado em: {format(new Date(letter.sent_at), 'PPpp', { locale: pt })}</p>
                      </div>
                      <p className="text-sm bg-muted p-3 rounded">
                        {letter.content.substring(0, 200)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Send className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhuma comunicação encontrada
                  </h3>
                  <p className="text-muted-foreground">
                    Este membro ainda não recebeu comunicações registadas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
              <CardDescription>
                Todas as atividades relacionadas com este membro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Combine and sort all activities by date */}
              {(() => {
                const allActivities = [
                  ...memberTransactions.map(tx => ({
                    type: 'transaction',
                    date: tx.transaction_date,
                    data: tx
                  })),
                  ...memberDocuments.map(doc => ({
                    type: 'document',
                    date: doc.uploaded_at,
                    data: doc
                  })),
                  ...memberLetters.map(letter => ({
                    type: 'letter',
                    date: letter.sent_at,
                    data: letter
                  }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return allActivities.length > 0 ? (
                  <div className="space-y-6">
                    {allActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {activity.type === 'transaction' && <CreditCard className="h-4 w-4 text-primary" />}
                          {activity.type === 'document' && <FileText className="h-4 w-4 text-primary" />}
                          {activity.type === 'letter' && <Mail className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {activity.type === 'transaction' && `Transação: ${activity.data.description}`}
                              {activity.type === 'document' && `Documento: ${activity.data.name}`}
                              {activity.type === 'letter' && `Email: ${activity.data.subject}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.date), 'PP', { locale: pt })}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.type === 'transaction' && 
                              `${activity.data.transaction_type === 'income' ? 'Recebimento' : 'Pagamento'} de €${safeParseAmount(activity.data.amount).toFixed(2)}`
                            }
                            {activity.type === 'document' && 
                              `Documento ${activity.data.category} carregado (${activity.data.file_size_formatted || formatFileSize(activity.data.file_size || 0)})`
                            }
                            {activity.type === 'letter' && 
                              `Email enviado para ${activity.data.recipient_email}`
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      Nenhuma atividade registada
                    </h3>
                    <p className="text-muted-foreground">
                      Este membro ainda não tem atividade registada no sistema
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Member Form Dialog */}
      <MemberFormDialog
        isOpen={memberFormOpen}
        onClose={() => setMemberFormOpen(false)}
        member={member}
        mode="edit"
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar o membro <strong>{member?.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A eliminar...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MemberProfile;