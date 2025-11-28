import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Home,
  Euro,
  Building2,
  Hash,
  Users,
  FileText,
  Save,
  X,
  UserPlus,
  Edit3,
  Calculator,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MemberFormData {
  id?: string;
  building_id: string;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  fraction: string;
  votes: number;
  monthly_fee: number;
  annual_fee: number;
  permilage: number;
  nif: string;
  notes: string;
  is_active: boolean;
  // Secondary address fields
  secondary_address?: string;
  secondary_postal_code?: string;
  secondary_city?: string;
  secondary_country?: string;
}

interface MemberFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member?: any; // Member data for editing
  mode: 'create' | 'edit';
}

const MemberFormDialog: React.FC<MemberFormDialogProps> = ({
  isOpen,
  onClose,
  member,
  mode
}) => {
  const queryClient = useQueryClient();

  // Estado para cálculo automático
  const [feePerPermilage, setFeePerPermilage] = useState<number>(50); // €50 por 1‰ (default)
  const [syncAnnualFee, setSyncAnnualFee] = useState<boolean>(true);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const { data: buildingsResponse } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const response = await axios.get('/api/buildings');
      return response.data;
    },
  });

  const buildings = buildingsResponse?.data || [];

  // Query para obter total de permilagem do edifício
  const { data: membersResponse } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await axios.get('/api/members');
      return response.data;
    },
  });

  const currentBuildingMembers = membersResponse?.data?.filter(
    (m: any) => m.building_id === formData.building_id && m.id !== formData.id
  ) || [];

  const totalPermilage = currentBuildingMembers.reduce(
    (sum: number, m: any) => sum + parseFloat(m.permilage || 0),
    0
  );

  const availablePermilage = 1000 - totalPermilage;

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: any) => {
      const response = await axios.post('/api/members', memberData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await axios.put(`/api/members/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const [formData, setFormData] = useState<MemberFormData>({
    building_id: buildings?.[0]?.id || '',
    name: '',
    email: '',
    phone: '',
    apartment: '',
    fraction: '',
    votes: 100,
    monthly_fee: 0,
    annual_fee: 0,
    permilage: 100,
    nif: '',
    notes: '',
    is_active: true,
    // Secondary address defaults
    secondary_address: '',
    secondary_postal_code: '',
    secondary_city: '',
    secondary_country: 'Portugal'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or member changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && member) {
        const monthlyFee = parseFloat(member.monthly_fee || member.new_monthly_fee || '0');
        const annualFee = parseFloat(member.annual_fee || member.new_annual_fee || '0');

        setFormData({
          id: member.id,
          building_id: member.building_id || '',
          name: member.name || '',
          email: member.email || '',
          phone: member.phone || '',
          apartment: member.apartment || '',
          fraction: member.fraction || '',
          votes: member.votes || 100,
          monthly_fee: monthlyFee,
          annual_fee: annualFee,
          permilage: parseFloat(member.permilage || '100'),
          nif: member.nif || '',
          notes: member.notes || '',
          is_active: member.is_active !== false,
          // Secondary address from member data
          secondary_address: member.secondary_address || '',
          secondary_postal_code: member.secondary_postal_code || '',
          secondary_city: member.secondary_city || '',
          secondary_country: member.secondary_country || 'Portugal'
        });

        // Verificar se valores parecem calculados
        const suggestedMonthly = (parseFloat(member.permilage || '0') / 1000) * 50;
        setIsCalculated(Math.abs(monthlyFee - suggestedMonthly) < 0.01);
        setSyncAnnualFee(Math.abs(annualFee - (monthlyFee * 12)) < 0.01);
      } else {
        // Reset for create mode
        setFormData({
          building_id: buildings?.[0]?.id || '',
          name: '',
          email: '',
          phone: '',
          apartment: '',
          fraction: '',
          votes: 100,
          monthly_fee: 0,
          annual_fee: 0,
          permilage: 100,
          nif: '',
          notes: '',
          is_active: true,
          // Reset secondary address
          secondary_address: '',
          secondary_postal_code: '',
          secondary_city: '',
          secondary_country: 'Portugal'
        });
        setIsCalculated(false);
        setSyncAnnualFee(true);
      }
      setErrors({});
    }
  }, [isOpen, mode, member, buildings]);

  // Sincronizar quota anual quando quota mensal muda
  useEffect(() => {
    if (syncAnnualFee && formData.monthly_fee > 0) {
      setFormData(prev => ({
        ...prev,
        annual_fee: parseFloat((prev.monthly_fee * 12).toFixed(2))
      }));
    }
  }, [formData.monthly_fee, syncAnnualFee]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.building_id) {
      newErrors.building_id = 'Edifício é obrigatório';
    }

    if (!formData.apartment.trim()) {
      newErrors.apartment = 'Apartamento é obrigatório';
    }

    if (!formData.fraction.trim()) {
      newErrors.fraction = 'Fração é obrigatória';
    }

    if (formData.votes <= 0) {
      newErrors.votes = 'Votos deve ser maior que 0';
    }

    if (formData.permilage <= 0) {
      newErrors.permilage = 'Permilagem deve ser maior que 0';
    }

    // Validar se permilagem ultrapassa o total disponível
    if (formData.permilage > availablePermilage) {
      newErrors.permilage = `Permilagem disponível: ${availablePermilage.toFixed(3)}‰`;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter formato válido';
    }

    if (formData.nif && formData.nif.length !== 9) {
      newErrors.nif = 'NIF deve ter 9 dígitos';
    }

    // Avisar se quota anual não está sincronizada (mas não bloquear)
    if (formData.monthly_fee > 0 && formData.annual_fee > 0) {
      const expectedAnnual = formData.monthly_fee * 12;
      const diff = Math.abs(formData.annual_fee - expectedAnnual);
      if (diff > 0.1 && !syncAnnualFee) {
        // Apenas aviso, não erro
        console.warn('Quota anual não está sincronizada com mensal');
      }
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
      const memberData = {
        ...formData,
        // Ensure numeric fields are properly formatted
        votes: Number(formData.votes),
        monthly_fee: Number(formData.monthly_fee).toFixed(2),
        annual_fee: Number(formData.annual_fee).toFixed(2),
        permilage: Number(formData.permilage).toFixed(3),
        nif: formData.nif || null,
        // Também guardar em new_monthly_fee e new_annual_fee para compatibilidade
        new_monthly_fee: Number(formData.monthly_fee).toFixed(2),
        new_annual_fee: Number(formData.annual_fee).toFixed(2),
      };

      if (mode === 'create') {
        await createMemberMutation.mutateAsync(memberData);
        toast.success('Condómino criado com sucesso!');
      } else {
        await updateMemberMutation.mutateAsync({
          id: formData.id!,
          data: memberData
        });
        toast.success('Condómino atualizado com sucesso!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(mode === 'create' ? 'Erro ao criar condómino' : 'Erro ao atualizar condómino');
    }
  };

  const handleInputChange = (field: keyof MemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Se mudou manualmente monthly_fee ou annual_fee, marcar como não calculado
    if (field === 'monthly_fee' || field === 'annual_fee') {
      setIsCalculated(false);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Função para calcular quotas automaticamente
  const handleCalculateQuota = () => {
    const suggestedMonthly = (formData.permilage / 1000) * feePerPermilage;
    const suggestedAnnual = suggestedMonthly * 12;

    setFormData(prev => ({
      ...prev,
      monthly_fee: parseFloat(suggestedMonthly.toFixed(2)),
      annual_fee: parseFloat(suggestedAnnual.toFixed(2))
    }));

    setIsCalculated(true);
    setSyncAnnualFee(true);
    toast.success('Quotas calculadas automaticamente!');
  };

  const isLoading = createMemberMutation.isPending || updateMemberMutation.isPending;

  // Verificar se permilagem está perto do limite
  const permilageWarning = formData.permilage > (availablePermilage * 0.9);
  const permilageError = formData.permilage > availablePermilage;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {mode === 'create' ? (
              <UserPlus className="h-5 w-5" />
            ) : (
              <Edit3 className="h-5 w-5" />
            )}
            <span>
              {mode === 'create' ? 'Novo Condómino' : `Editar ${member?.name}`}
            </span>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Adicionar um novo condómino ao condomínio'
              : 'Atualizar as informações do condómino'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo do condómino"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="building_id">Edifício *</Label>
                  <Select
                    value={formData.building_id}
                    onValueChange={(value) => handleInputChange('building_id', value)}
                  >
                    <SelectTrigger className={errors.building_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecionar edifício" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings?.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>{building.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.building_id && (
                    <p className="text-sm text-red-500">{errors.building_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    value={formData.nif}
                    onChange={(e) => handleInputChange('nif', e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="123456789"
                    maxLength={9}
                    className={errors.nif ? 'border-red-500' : ''}
                  />
                  {errors.nif && (
                    <p className="text-sm text-red-500">{errors.nif}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                    />
                    <span>Condómino Ativo</span>
                  </Label>
                  {!formData.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Informações da Fração</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apartment">Apartamento *</Label>
                  <Input
                    id="apartment"
                    value={formData.apartment}
                    onChange={(e) => handleInputChange('apartment', e.target.value)}
                    placeholder="A, B, C, 1A, etc."
                    className={errors.apartment ? 'border-red-500' : ''}
                  />
                  {errors.apartment && (
                    <p className="text-sm text-red-500">{errors.apartment}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fraction">Fração *</Label>
                  <Input
                    id="fraction"
                    value={formData.fraction}
                    onChange={(e) => handleInputChange('fraction', e.target.value)}
                    placeholder="A, B, C, etc."
                    className={errors.fraction ? 'border-red-500' : ''}
                  />
                  {errors.fraction && (
                    <p className="text-sm text-red-500">{errors.fraction}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="votes">Votos *</Label>
                  <Input
                    id="votes"
                    type="number"
                    min="1"
                    value={formData.votes}
                    onChange={(e) => handleInputChange('votes', parseInt(e.target.value) || 0)}
                    placeholder="100"
                    className={errors.votes ? 'border-red-500' : ''}
                  />
                  {errors.votes && (
                    <p className="text-sm text-red-500">{errors.votes}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permilage" className="flex items-center justify-between">
                  <span>Permilagem (‰) *</span>
                  <span className="text-xs text-muted-foreground">
                    Total: {(totalPermilage + formData.permilage).toFixed(1)}/1000‰
                    {availablePermilage > 0 && ` (Disponível: ${availablePermilage.toFixed(1)}‰)`}
                  </span>
                </Label>
                <Input
                  id="permilage"
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={availablePermilage + (mode === 'edit' ? parseFloat(member?.permilage || '0') : 0)}
                  value={formData.permilage}
                  onChange={(e) => handleInputChange('permilage', parseFloat(e.target.value) || 0)}
                  placeholder="100.000"
                  className={errors.permilage ? 'border-red-500' : (permilageWarning ? 'border-yellow-500' : '')}
                />
                {errors.permilage && (
                  <p className="text-sm text-red-500">{errors.permilage}</p>
                )}
                {permilageWarning && !permilageError && (
                  <Alert variant="default" className="border-yellow-500">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm text-yellow-600">
                      A permilagem está próxima do máximo disponível
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-xs text-muted-foreground">
                  A permilagem determina a quota de participação nas despesas comuns
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information - MELHORADO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Euro className="h-4 w-4" />
                  <span>Informações Financeiras</span>
                </div>
                {isCalculated && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Calculado Automaticamente
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Quotas mensais e anuais do condómino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calculadora de Quota */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="feePerPermilage" className="text-sm font-medium">
                    Calculadora Automática
                  </Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleCalculateQuota}
                    className="h-8"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Quotas
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor="feePerPermilage" className="text-xs text-muted-foreground">
                      Valor por permilagem (€/‰)
                    </Label>
                    <Input
                      id="feePerPermilage"
                      type="number"
                      step="0.01"
                      min="0"
                      value={feePerPermilage}
                      onChange={(e) => setFeePerPermilage(parseFloat(e.target.value) || 50)}
                      className="mt-1 h-9"
                    />
                  </div>

                  <div className="text-center pt-5">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Permilagem
                    </Label>
                    <div className="mt-1 h-9 flex items-center justify-center bg-muted rounded-md px-3 font-medium">
                      {formData.permilage.toFixed(3)}‰
                    </div>
                  </div>

                  <div className="text-center pt-5">
                    <span className="text-lg font-bold text-muted-foreground">=</span>
                  </div>

                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      Quota Mensal Sugerida
                    </Label>
                    <div className="mt-1 h-9 flex items-center justify-center bg-primary/10 rounded-md px-3 font-bold text-primary">
                      €{((formData.permilage / 1000) * feePerPermilage).toFixed(2)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Clique em "Calcular Quotas" para aplicar automaticamente
                </p>
              </div>

              {/* Campos de Quota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_fee">
                    Quota Mensal (€) *
                  </Label>
                  <Input
                    id="monthly_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.monthly_fee}
                    onChange={(e) => handleInputChange('monthly_fee', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Quota a pagar mensalmente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual_fee" className="flex items-center justify-between">
                    <span>Quota Anual (€) *</span>
                    {syncAnnualFee && (
                      <Badge variant="secondary" className="text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sincronizada (×12)
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="annual_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.annual_fee}
                    onChange={(e) => {
                      handleInputChange('annual_fee', parseFloat(e.target.value) || 0);
                      setSyncAnnualFee(false); // Desativar sync se editado manualmente
                    }}
                    placeholder="0.00"
                    disabled={syncAnnualFee}
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sync-annual"
                      checked={syncAnnualFee}
                      onCheckedChange={setSyncAnnualFee}
                    />
                    <Label htmlFor="sync-annual" className="text-xs text-muted-foreground cursor-pointer">
                      Sincronizar quota anual (quota mensal × 12)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Resumo */}
              {formData.monthly_fee > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quota Mensal:</span>
                      <span className="font-semibold ml-2">€{formData.monthly_fee.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quota Anual:</span>
                      <span className="font-semibold ml-2">€{formData.annual_fee.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Por permilagem:</span>
                      <span className="font-medium ml-2">€{(formData.monthly_fee / (formData.permilage / 1000)).toFixed(2)}/‰</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">% do total:</span>
                      <span className="font-medium ml-2">{((formData.permilage / 1000) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Secondary Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Morada Alternativa</span>
              </CardTitle>
              <CardDescription>
                Morada de contacto se não residir no condomínio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secondary_address">Morada</Label>
                <Input
                  id="secondary_address"
                  value={formData.secondary_address}
                  onChange={(e) => handleInputChange('secondary_address', e.target.value)}
                  placeholder="Rua, número, andar..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="secondary_postal_code">Código Postal</Label>
                  <Input
                    id="secondary_postal_code"
                    value={formData.secondary_postal_code}
                    onChange={(e) => handleInputChange('secondary_postal_code', e.target.value)}
                    placeholder="1000-001"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_city">Cidade</Label>
                  <Input
                    id="secondary_city"
                    value={formData.secondary_city}
                    onChange={(e) => handleInputChange('secondary_city', e.target.value)}
                    placeholder="Lisboa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_country">País</Label>
                  <Input
                    id="secondary_country"
                    value={formData.secondary_country}
                    onChange={(e) => handleInputChange('secondary_country', e.target.value)}
                    placeholder="Portugal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Notas Adicionais</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Informações adicionais sobre o condómino..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'A guardar...' : (mode === 'create' ? 'Criar Condómino' : 'Guardar Alterações')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberFormDialog;
