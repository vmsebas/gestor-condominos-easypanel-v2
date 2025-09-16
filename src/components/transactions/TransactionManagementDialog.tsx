import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  User, 
  Calendar,
  Euro, 
  FileText,
  Save,
  X,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useMembers, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useNeonData';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

interface TransactionFormData {
  id?: string;
  amount: number;
  description: string;
  transaction_type: 'income' | 'expense';
  transaction_date: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  member_id?: string;
  is_confirmed: boolean;
  admin_notes?: string;
}

interface TransactionManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
  mode: 'edit' | 'view';
}

const TransactionManagementDialog: React.FC<TransactionManagementDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  mode
}) => {
  const { data: members } = useMembers();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [formData, setFormData] = useState<TransactionFormData>({
    amount: 0,
    description: '',
    transaction_type: 'income',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference_number: '',
    notes: '',
    member_id: '',
    is_confirmed: true,
    admin_notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  // Reset form when dialog opens/closes or transaction changes
  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({
        id: transaction.id,
        amount: Math.abs(parseFloat(transaction.amount || '0')),
        description: transaction.description || '',
        transaction_type: parseFloat(transaction.amount || '0') >= 0 ? 'income' : 'expense',
        transaction_date: transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().split('T')[0] : '',
        payment_method: transaction.payment_method || '',
        reference_number: transaction.reference_number || '',
        notes: transaction.notes || '',
        member_id: transaction.member_id || '',
        is_confirmed: transaction.is_confirmed !== false,
        admin_notes: transaction.admin_notes || ''
      });
      setIsEditing(mode === 'edit');
      setErrors({});
    }
  }, [isOpen, transaction, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que 0';
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Data é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      const transactionData = {
        ...formData,
        // Convert amount based on transaction type
        amount: formData.transaction_type === 'income' ? formData.amount : -formData.amount,
        member_id: formData.member_id || null,
        last_modified_by: 'Admin' // You might want to get this from user context
      };

      await updateTransactionMutation.mutateAsync({
        id: formData.id!,
        data: transactionData
      });
      
      toast.success('Transação atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
    }
  };

  const handleDelete = async () => {
    if (!transaction?.id) return;
    
    if (window.confirm('Tem certeza que deseja eliminar esta transação? Esta ação não pode ser desfeita.')) {
      try {
        await deleteTransactionMutation.mutateAsync(transaction.id);
        toast.success('Transação eliminada com sucesso!');
        onClose();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Erro ao eliminar transação');
      }
    }
  };

  const handleInputChange = (field: keyof TransactionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isLoading = updateTransactionMutation.isPending || deleteTransactionMutation.isPending;
  const assignedMember = Array.isArray(members) ? members.find(m => m.id === formData.member_id) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>
              {isEditing ? 'Editar Transação' : 'Detalhes da Transação'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os detalhes da transação ou altere o membro associado'
              : 'Visualize os detalhes da transação'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  {formData.is_confirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span>Estado da Transação</span>
                </span>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Badge variant={formData.is_confirmed ? 'default' : 'secondary'}>
                  {formData.is_confirmed ? 'Confirmada' : 'Pendente'}
                </Badge>
                <Badge variant={formData.transaction_type === 'income' ? 'default' : 'destructive'}>
                  {formData.transaction_type === 'income' ? 'Receita' : 'Despesa'}
                </Badge>
                {assignedMember && (
                  <Badge variant="outline">
                    <User className="h-3 w-3 mr-1" />
                    {assignedMember.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição da transação"
                    className={errors.description ? 'border-red-500' : ''}
                    disabled={!isEditing}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.amount ? 'border-red-500' : ''}
                    disabled={!isEditing}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_type">Tipo *</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value: 'income' | 'expense') => handleInputChange('transaction_type', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>Receita</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expense">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Despesa</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction_date">Data *</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                    className={errors.transaction_date ? 'border-red-500' : ''}
                    disabled={!isEditing}
                  />
                  {errors.transaction_date && (
                    <p className="text-sm text-red-500">{errors.transaction_date}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Member Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Membro Associado</span>
              </CardTitle>
              <CardDescription>
                Associe esta transação a um membro específico (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="member_id">Membro</Label>
                <Select
                  value={formData.member_id}
                  onValueChange={(value) => handleInputChange('member_id', value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar membro (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <span className="text-muted-foreground">Nenhum membro</span>
                    </SelectItem>
                    {Array.isArray(members?.data) ? members.data.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{member.name}</span>
                          <span className="text-muted-foreground">({member.apartment})</span>
                        </div>
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pagamento</Label>
                  <Input
                    id="payment_method"
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    placeholder="Transferência, Dinheiro, etc."
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_number">Número de Referência</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number}
                    onChange={(e) => handleInputChange('reference_number', e.target.value)}
                    placeholder="Referência bancária, etc."
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Informações adicionais sobre a transação..."
                  rows={3}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_notes">Notas Administrativas</Label>
                <Textarea
                  id="admin_notes"
                  value={formData.admin_notes}
                  onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                  placeholder="Notas internas para administração..."
                  rows={3}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading || !isEditing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              {isEditing && (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'A guardar...' : 'Guardar Alterações'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionManagementDialog;