import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building } from '@/types/buildingTypes';
import { formatCurrency } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  X, 
  Building as BuildingIcon, 
  MapPin, 
  Users, 
  Euro,
  CreditCard,
  Settings,
  FileText
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface BuildingFormProps {
  building?: Building;
  onSubmit: (data: Partial<Building>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const buildingFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  address: z.string().min(1, 'Morada é obrigatória').max(200, 'Morada muito longa'),
  city: z.string().min(1, 'Cidade é obrigatória').max(50, 'Cidade muito longa'),
  postalCode: z.string().min(1, 'Código postal é obrigatório').regex(/^\d{4}-\d{3}$/, 'Formato: 1234-567'),
  totalUnits: z.number().min(1, 'Deve ter pelo menos 1 fração').max(1000, 'Máximo 1000 frações'),
  buildingYear: z.number().optional(),
  description: z.string().optional(),
  baseQuota: z.number().min(0, 'Quota deve ser positiva').max(10000, 'Quota muito elevada'),
  iban: z.string().optional().refine((val) => {
    if (!val) return true;
    // Validação básica de IBAN português
    return /^PT50\d{21}$/.test(val.replace(/\s/g, ''));
  }, 'IBAN inválido. Formato: PT50 0000 0000 0000 0000 0000 0'),
  administratorName: z.string().optional(),
  administratorEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  administratorPhone: z.string().optional(),
  hasElevator: z.boolean().default(false),
  hasGarage: z.boolean().default(false),
  hasGarden: z.boolean().default(false),
  hasPool: z.boolean().default(false),
  hasSecurity: z.boolean().default(false),
  emergencyContact: z.string().optional(),
  legalRepresentative: z.string().optional(),
  insuranceCompany: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  isFavorite: z.boolean().default(false)
});

type BuildingFormData = z.infer<typeof buildingFormSchema>;

const BuildingForm: React.FC<BuildingFormProps> = ({
  building,
  onSubmit,
  onCancel,
  className
}) => {
  const isEditing = !!building;

  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      name: building?.name || '',
      address: building?.address || '',
      city: building?.city || '',
      postalCode: building?.postalCode || '',
      totalUnits: building?.totalUnits || 1,
      buildingYear: building?.buildingYear || undefined,
      description: building?.description || '',
      baseQuota: building?.baseQuota || 50,
      iban: building?.iban || '',
      administratorName: building?.administratorName || '',
      administratorEmail: building?.administratorEmail || '',
      administratorPhone: building?.administratorPhone || '',
      hasElevator: building?.hasElevator || false,
      hasGarage: building?.hasGarage || false,
      hasGarden: building?.hasGarden || false,
      hasPool: building?.hasPool || false,
      hasSecurity: building?.hasSecurity || false,
      emergencyContact: building?.emergencyContact || '',
      legalRepresentative: building?.legalRepresentative || '',
      insuranceCompany: building?.insuranceCompany || '',
      insurancePolicyNumber: building?.insurancePolicyNumber || '',
      isFavorite: building?.isFavorite || false
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, watch } = form;

  const watchedValues = watch();

  const handleFormSubmit = async (data: BuildingFormData) => {
    try {
      await onSubmit({
        ...data,
        createdAt: building?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  // Calcular quota anual
  const getAnnualQuota = () => {
    return (watchedValues.baseQuota || 0) * 12;
  };

  // Validar e formatar IBAN
  const formatIban = (iban: string) => {
    const cleaned = iban.replace(/\s/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="financial">Configuração Financeira</TabsTrigger>
              <TabsTrigger value="management">Gestão</TabsTrigger>
              <TabsTrigger value="features">Características</TabsTrigger>
            </TabsList>

            {/* Informações Básicas */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BuildingIcon className="h-5 w-5" />
                    Dados do Edifício
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Edifício *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Condomínio das Flores, Edifício Central..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Nome identificativo do edifício
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Morada e Cidade */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Morada *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Rua, número, andar"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Postal *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="1234-567"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Lisboa, Porto, Coimbra..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Informações Adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalUnits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Frações *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min={1}
                              max={1000}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            Total de apartamentos/lojas no edifício
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buildingYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano de Construção</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min={1900}
                              max={new Date().getFullYear()}
                              placeholder="1990"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Descrição */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre o edifício..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Favorito */}
                  <FormField
                    control={form.control}
                    name="isFavorite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Marcar como favorito
                          </FormLabel>
                          <FormDescription>
                            Edifícios favoritos aparecem no topo da lista
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuração Financeira */}
            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Configuração Financeira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quota Base */}
                  <FormField
                    control={form.control}
                    name="baseQuota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quota Base Mensal *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min={0}
                            max={10000}
                            step={0.01}
                            placeholder="50.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Valor base mensal por fração. Quota anual: {formatCurrency(getAnnualQuota())}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* IBAN */}
                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN da Conta do Condomínio</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="PT50 0000 0000 0000 0000 0000 0"
                            {...field}
                            onChange={(e) => field.onChange(formatIban(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Conta bancária para recebimento de quotas e pagamentos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Resumo Financeiro */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quota Mensal:</p>
                      <p className="font-semibold">{formatCurrency(watchedValues.baseQuota || 0)}</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Receita Mensal Total:</p>
                      <p className="font-semibold">
                        {formatCurrency((watchedValues.baseQuota || 0) * (watchedValues.totalUnits || 1))}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Receita Anual Estimada:</p>
                      <p className="font-semibold">
                        {formatCurrency((watchedValues.baseQuota || 0) * (watchedValues.totalUnits || 1) * 12)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gestão */}
            <TabsContent value="management" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informações de Gestão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Administrador */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Administrador do Condomínio</h4>
                    
                    <FormField
                      control={form.control}
                      name="administratorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Administrador</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome da empresa ou pessoa"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="administratorEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="admin@exemplo.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="administratorPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+351 xxx xxx xxx"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Contactos de Emergência */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Contactos e Representação Legal</h4>
                    
                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contacto de Emergência</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome e telefone para emergências"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="legalRepresentative"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Representante Legal</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome do representante legal"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Seguros */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Informações de Seguro</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="insuranceCompany"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Companhia de Seguros</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome da seguradora"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="insurancePolicyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número da Apólice</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Número da apólice"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Características */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Características do Edifício
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="hasElevator"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Elevador</FormLabel>
                            <FormDescription>
                              Edifício possui elevador
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasGarage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Garagem</FormLabel>
                            <FormDescription>
                              Possui estacionamento/garagem
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasGarden"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Jardim/Espaços Verdes</FormLabel>
                            <FormDescription>
                              Possui jardim ou áreas verdes
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasPool"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Piscina</FormLabel>
                            <FormDescription>
                              Possui piscina comum
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasSecurity"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Segurança</FormLabel>
                            <FormDescription>
                              Possui porteiro ou segurança
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Resumo Final */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Resumo do Edifício</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome:</p>
                  <p className="font-medium">{watchedValues.name || 'Não definido'}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Localização:</p>
                  <p className="font-medium">
                    {watchedValues.city ? `${watchedValues.city}, ${watchedValues.postalCode}` : 'Não definida'}
                  </p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Frações:</p>
                  <p className="font-medium">{watchedValues.totalUnits || 0} unidades</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Quota Mensal:</p>
                  <p className="font-medium">{formatCurrency(watchedValues.baseQuota || 0)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-muted-foreground text-sm">Características:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {watchedValues.hasElevator && <span className="text-xs bg-muted px-2 py-1 rounded">Elevador</span>}
                  {watchedValues.hasGarage && <span className="text-xs bg-muted px-2 py-1 rounded">Garagem</span>}
                  {watchedValues.hasGarden && <span className="text-xs bg-muted px-2 py-1 rounded">Jardim</span>}
                  {watchedValues.hasPool && <span className="text-xs bg-muted px-2 py-1 rounded">Piscina</span>}
                  {watchedValues.hasSecurity && <span className="text-xs bg-muted px-2 py-1 rounded">Segurança</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" variant="white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Atualizar Edifício' : 'Criar Edifício'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BuildingForm;