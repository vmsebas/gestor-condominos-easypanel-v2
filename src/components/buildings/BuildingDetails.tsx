import React, { useState, useEffect } from 'react';
import { Building } from '@/types/buildingTypes';
import { formatCurrency, formatDate } from '@/utils/formatters';
import membersService from '@/utils/db/membersService';
import financeService from '@/utils/db/financeService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Building as BuildingIcon, 
  MapPin, 
  Users, 
  Euro,
  Calendar,
  Phone,
  Mail,
  Shield,
  Car,
  Trees,
  Waves,
  Elevator,
  Star,
  Edit,
  FileText,
  TrendingUp,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';

interface BuildingDetailsProps {
  building: Building;
  onClose?: () => void;
  onEdit?: () => void;
  className?: string;
}

interface BuildingStats {
  totalMembers: number;
  totalOwners: number;
  totalResidents: number;
  occupancyRate: number;
  monthlyRevenue: number;
  annualRevenue: number;
  averageQuotaPerMember: number;
}

const BuildingDetails: React.FC<BuildingDetailsProps> = ({
  building,
  onClose,
  onEdit,
  className
}) => {
  const [stats, setStats] = useState<BuildingStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Carregar estatísticas do edifício
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        
        // Carregar membros
        const members = await membersService.getMembers(building.id);
        const owners = members.filter(m => m.type === 'owner');
        const residents = members.filter(m => m.type === 'resident');
        
        // Calcular estatísticas
        const totalMembers = members.length;
        const totalOwners = owners.length;
        const totalResidents = residents.length;
        const occupancyRate = building.totalUnits > 0 ? (totalMembers / building.totalUnits) * 100 : 0;
        const monthlyRevenue = (building.baseQuota || 0) * (building.totalUnits || 0);
        const annualRevenue = monthlyRevenue * 12;
        const averageQuotaPerMember = totalMembers > 0 ? monthlyRevenue / totalMembers : 0;

        setStats({
          totalMembers,
          totalOwners,
          totalResidents,
          occupancyRate,
          monthlyRevenue,
          annualRevenue,
          averageQuotaPerMember
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [building.id, building.totalUnits, building.baseQuota]);

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'elevator': return <Elevator className="h-4 w-4" />;
      case 'garage': return <Car className="h-4 w-4" />;
      case 'garden': return <Trees className="h-4 w-4" />;
      case 'pool': return <Waves className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return null;
    }
  };

  const getFeatures = () => {
    const features = [];
    if (building.hasElevator) features.push({ key: 'elevator', label: 'Elevador' });
    if (building.hasGarage) features.push({ key: 'garage', label: 'Garagem' });
    if (building.hasGarden) features.push({ key: 'garden', label: 'Jardim' });
    if (building.hasPool) features.push({ key: 'pool', label: 'Piscina' });
    if (building.hasSecurity) features.push({ key: 'security', label: 'Segurança' });
    return features;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BuildingIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{building.name}</h1>
            {building.isFavorite && (
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{building.address}, {building.city}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="management">Gestão</TabsTrigger>
          <TabsTrigger value="technical">Dados Técnicos</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Estatísticas Principais */}
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <LoadingSpinner />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.totalMembers}</p>
                    <p className="text-sm text-muted-foreground">Membros</p>
                    <div className="flex justify-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {stats.totalOwners} proprietários
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {stats.totalResidents} inquilinos
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{building.totalUnits}</p>
                    <p className="text-sm text-muted-foreground">Frações</p>
                    <Badge variant="outline" className="text-xs mt-2">
                      {stats.occupancyRate.toFixed(1)}% ocupação
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Receita Mensal</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(stats.averageQuotaPerMember)} por membro
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{building.buildingYear || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Ano Construção</p>
                    {building.buildingYear && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date().getFullYear() - building.buildingYear} anos
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Edifício</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Morada Completa</p>
                    <p className="font-medium">{building.address}</p>
                    <p className="text-sm text-muted-foreground">{building.postalCode} {building.city}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Número de Frações</p>
                    <p className="font-medium">{building.totalUnits} unidades</p>
                  </div>
                  
                  {building.buildingYear && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ano de Construção</p>
                      <p className="font-medium">{building.buildingYear}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Características</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {getFeatures().length > 0 ? (
                        getFeatures().map((feature) => (
                          <Badge key={feature.key} variant="outline" className="flex items-center gap-1">
                            {getFeatureIcon(feature.key)}
                            {feature.label}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma característica especial</p>
                      )}
                    </div>
                  </div>
                  
                  {building.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-sm">{building.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quota Base Mensal</p>
                    <p className="text-2xl font-bold">{formatCurrency(building.baseQuota || 0)}</p>
                    <p className="text-sm text-muted-foreground">por fração</p>
                  </div>
                  
                  {stats && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Receita Mensal Total</p>
                        <p className="text-xl font-semibold text-green-600">
                          {formatCurrency(stats.monthlyRevenue)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Receita Anual Estimada</p>
                        <p className="text-xl font-semibold text-blue-600">
                          {formatCurrency(stats.annualRevenue)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-4">
                  {building.iban && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">IBAN do Condomínio</p>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {building.iban}
                        </code>
                      </div>
                    </div>
                  )}
                  
                  {building.insuranceCompany && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Seguradora</p>
                      <p className="font-medium">{building.insuranceCompany}</p>
                      {building.insurancePolicyNumber && (
                        <p className="text-sm text-muted-foreground">
                          Apólice: {building.insurancePolicyNumber}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas Financeiros */}
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Alertas e Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {!building.iban && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">IBAN não configurado</p>
                      <p className="text-muted-foreground">Configure o IBAN para facilitar os pagamentos</p>
                    </div>
                  </div>
                )}
                
                {!building.administratorEmail && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Contacto do administrador em falta</p>
                      <p className="text-muted-foreground">Adicione informações de contacto do administrador</p>
                    </div>
                  </div>
                )}
                
                {stats && stats.occupancyRate < 80 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Taxa de ocupação baixa</p>
                      <p className="text-muted-foreground">
                        Apenas {stats.occupancyRate.toFixed(1)}% das frações têm membros registados
                      </p>
                    </div>
                  </div>
                )}
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
            <CardContent>
              <div className="space-y-6">
                {/* Administrador */}
                {building.administratorName && (
                  <div>
                    <h4 className="font-medium mb-3">Administrador do Condomínio</h4>
                    <div className="space-y-2">
                      <p className="font-medium">{building.administratorName}</p>
                      
                      <div className="flex flex-col gap-1">
                        {building.administratorEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{building.administratorEmail}</span>
                          </div>
                        )}
                        
                        {building.administratorPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{building.administratorPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Contactos de Emergência */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {building.emergencyContact && (
                    <div>
                      <h4 className="font-medium mb-2">Contacto de Emergência</h4>
                      <p className="text-sm">{building.emergencyContact}</p>
                    </div>
                  )}
                  
                  {building.legalRepresentative && (
                    <div>
                      <h4 className="font-medium mb-2">Representante Legal</h4>
                      <p className="text-sm">{building.legalRepresentative}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados Técnicos */}
        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados Técnicos e Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID do Edifício</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{building.id}</code>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
                    <p className="text-sm">{formatDate(building.createdAt)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                    <p className="text-sm">{formatDate(building.updatedAt || building.createdAt)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Configuração</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>IBAN configurado:</span>
                        <Badge variant={building.iban ? "success" : "destructive"}>
                          {building.iban ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Administrador definido:</span>
                        <Badge variant={building.administratorName ? "success" : "destructive"}>
                          {building.administratorName ? "Sim" : "Não"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Seguro configurado:</span>
                        <Badge variant={building.insuranceCompany ? "success" : "destructive"}>
                          {building.insuranceCompany ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Fechar */}
      {onClose && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
};

export default BuildingDetails;