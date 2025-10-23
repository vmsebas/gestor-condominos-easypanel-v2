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
  Edit3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

interface MemberFormData {
  id?: string;
  building_id: string;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  fraction: string;
  votes: number;
  new_monthly_fee: number;
  new_annual_fee: number;
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

  // Hardcoded building ID (should come from context in production)
  const BUILDING_ID = 'fb0d83d3-fe04-47cb-ba48-f95538a2a7fc';

  const { data: buildingsResponse } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const response = await axios.get('/api/buildings');
      return response.data;
    },
  });

  const buildings = buildingsResponse?.data || [];

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
    building_id: BUILDING_ID,
    name: '',
    email: '',
    phone: '',
    apartment: '',
    fraction: '',
    votes: 1,
    new_monthly_fee: 0,
    new_annual_fee: 0,
    permilage: 166.7,
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
        setFormData({
          id: member.id,
          building_id: member.building_id || '',
          name: member.name || '',
          email: member.email || '',
          phone: member.phone || '',
          apartment: member.apartment || '',
          fraction: member.fraction || '',
          votes: member.votes || 100,
          new_monthly_fee: parseFloat(member.new_monthly_fee || '0'),
          new_annual_fee: parseFloat(member.new_annual_fee || '0'),
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
          new_monthly_fee: 0,
          new_annual_fee: 0,
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
      }
      setErrors({});
    }
  }, [isOpen, mode, member, buildings]);

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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter formato válido';
    }

    if (formData.nif && formData.nif.length !== 9) {
      newErrors.nif = 'NIF deve ter 9 dígitos';
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
        new_monthly_fee: Number(formData.new_monthly_fee).toFixed(2),
        new_annual_fee: Number(formData.new_annual_fee).toFixed(2),
        permilage: Number(formData.permilage).toFixed(3),
        nif: formData.nif || null
      };

      if (mode === 'create') {
        await createMemberMutation.mutateAsync(memberData);
        toast.success('Membro criado com sucesso!');
      } else {
        await updateMemberMutation.mutateAsync({
          id: formData.id!,
          data: memberData
        });
        toast.success('Membro atualizado com sucesso!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(mode === 'create' ? 'Erro ao criar membro' : 'Erro ao atualizar membro');
    }
  };

  const handleInputChange = (field: keyof MemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isLoading = createMemberMutation.isPending || updateMemberMutation.isPending;

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
              {mode === 'create' ? 'Novo Membro' : `Editar ${member?.name}`}
            </span>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Adicionar um novo membro ao condomínio'
              : 'Atualizar as informações do membro'
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
                    placeholder="Nome completo do membro"
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
                    <span>Membro Ativo</span>
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
                <span>Informações da Propriedade</span>
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
                <Label htmlFor="permilage">Permilagem (‰) *</Label>
                <Input
                  id="permilage"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.permilage}
                  onChange={(e) => handleInputChange('permilage', parseFloat(e.target.value) || 0)}
                  placeholder="100.000"
                  className={errors.permilage ? 'border-red-500' : ''}
                />
                {errors.permilage && (
                  <p className="text-sm text-red-500">{errors.permilage}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Permilagem determina a quota de participação nas despesas comuns
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Euro className="h-4 w-4" />
                <span>Informações Financeiras</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_monthly_fee">Quota Mensal (€)</Label>
                  <Input
                    id="new_monthly_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_monthly_fee}
                    onChange={(e) => handleInputChange('new_monthly_fee', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_annual_fee">Quota Anual (€)</Label>
                  <Input
                    id="new_annual_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_annual_fee}
                    onChange={(e) => handleInputChange('new_annual_fee', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Cálculo automático baseado na permilagem:
                </span>
                <div className="text-right">
                  <p className="text-sm">
                    Quota mensal sugerida: €{((formData.permilage / 1000) * 50).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Baseado em €50 por 1‰)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Endereço Alternativo</span>
              </CardTitle>
              <CardDescription>
                Endereço de contacto se não reside no condomínio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secondary_address">Endereço</Label>
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
                  placeholder="Informações adicionais sobre o membro..."
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
            {isLoading ? 'A guardar...' : (mode === 'create' ? 'Criar Membro' : 'Guardar Alterações')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberFormDialog;