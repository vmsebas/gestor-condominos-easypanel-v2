import React, { useState, useEffect } from 'react';
import { useBuilding } from '@/hooks/useBuilding';
import membersService from '@/utils/db/membersService';
import financeService from '@/utils/db/financeService';
import { DocumentTemplate, BulkDocumentRequest, DocumentType } from '@/types/documentTypes';
import { Member } from '@/types/memberTypes';
import { Arrear } from '@/types/finance/financeTypes';
import { formatCurrency, formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Users, 
  Filter, 
  Settings, 
  AlertTriangle,
  Mail,
  Download,
  Eye,
  X,
  CheckCircle
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';

interface BulkDocumentGeneratorProps {
  templates: DocumentTemplate[];
  onGenerate: (templateId: string, data: any) => Promise<any>;
  onClose: () => void;
  className?: string;
}

const BulkDocumentGenerator: React.FC<BulkDocumentGeneratorProps> = ({
  templates,
  onGenerate,
  onClose,
  className
}) => {
  const { currentBuilding } = useBuilding();
  
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Filtros
  const [memberTypeFilter, setMemberTypeFilter] = useState<'all' | 'owner' | 'resident'>('all');
  const [arrearsFilter, setArrearsFilter] = useState<boolean | null>(null);
  const [apartmentFilter, setApartmentFilter] = useState('');
  
  // Configurações de envio
  const [sendMethod, setSendMethod] = useState<'email' | 'download' | 'print'>('download');
  const [batchTitle, setBatchTitle] = useState('');

  // Carregar dados
  useEffect(() => {
    if (currentBuilding?.id) {
      loadData();
    }
  }, [currentBuilding?.id]);

  const loadData = async () => {
    if (!currentBuilding?.id) return;

    try {
      setIsLoading(true);
      const [membersData, arrearsData] = await Promise.all([
        membersService.getMembers(currentBuilding.id),
        financeService.getArrears(currentBuilding.id)
      ]);
      
      setMembers(membersData);
      setArrears(arrearsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar membros
  const filteredMembers = members.filter(member => {
    // Filtro por tipo
    if (memberTypeFilter !== 'all' && member.type !== memberTypeFilter) {
      return false;
    }
    
    // Filtro por morosidade
    if (arrearsFilter !== null) {
      const hasArrears = arrears.some(arrear => 
        arrear.memberId === member.id && arrear.status !== 'resolved'
      );
      if (arrearsFilter && !hasArrears) return false;
      if (!arrearsFilter && hasArrears) return false;
    }
    
    // Filtro por apartamento
    if (apartmentFilter && !member.apartment?.toLowerCase().includes(apartmentFilter.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedMembers(checked ? filteredMembers.map(m => m.id) : []);
  };

  const handleMemberToggle = (memberId: string, checked: boolean) => {
    setSelectedMembers(prev => 
      checked 
        ? [...prev, memberId]
        : prev.filter(id => id !== memberId)
    );
  };

  const generateDocuments = async () => {
    if (!selectedTemplate || selectedMembers.length === 0) return;

    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      
      const totalMembers = selectedMembers.length;
      let processedCount = 0;

      for (const memberId of selectedMembers) {
        const member = members.find(m => m.id === memberId);
        if (!member) continue;

        // Preparar variáveis específicas para cada tipo de documento
        const variables = await prepareVariables(selectedTemplate.type, member);
        
        try {
          await onGenerate(selectedTemplate.id, {
            variables,
            recipient: member.id,
            metadata: {
              title: `${selectedTemplate.name} - ${member.name}`,
              sendMethod,
              batchTitle
            }
          });
        } catch (error) {
          console.error(`Erro ao gerar documento para ${member.name}:`, error);
        }
        
        processedCount++;
        setGenerationProgress((processedCount / totalMembers) * 100);
        
        // Pequena pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      onClose();
    } catch (error) {
      console.error('Erro na geração em massa:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const prepareVariables = async (type: DocumentType, member: Member) => {
    const baseVariables = {
      memberName: member.name,
      apartmentNumber: member.apartment || 'N/A',
      memberEmail: member.email || '',
      memberPhone: member.phone || '',
      buildingName: currentBuilding?.name || '',
      buildingAddress: currentBuilding?.address || '',
      currentDate: formatDate(new Date().toISOString()),
      administratorName: currentBuilding?.administratorName || '',
      administratorContact: currentBuilding?.administratorEmail || currentBuilding?.administratorPhone || ''
    };

    switch (type) {
      case 'arrears_letter':
        const memberArrears = arrears.filter(a => 
          a.memberId === member.id && a.status !== 'resolved'
        );
        const totalArrears = memberArrears.reduce((sum, a) => sum + a.amount, 0);
        const oldestArrear = memberArrears.sort((a, b) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )[0];
        
        return {
          ...baseVariables,
          arrearAmount: formatCurrency(totalArrears),
          dueDate: oldestArrear ? formatDate(oldestArrear.dueDate) : '',
          arrearsCount: memberArrears.length,
          paymentInstructions: currentBuilding?.iban ? 
            `IBAN: ${currentBuilding.iban}` : 'Contacte a administração',
          legalConsequences: 'O não pagamento pode resultar em ações legais',
          contactInfo: currentBuilding?.administratorEmail || currentBuilding?.administratorPhone || ''
        };

      case 'quota_certificate':
        const hasArrearsForCertificate = arrears.some(a => 
          a.memberId === member.id && a.status !== 'resolved'
        );
        
        return {
          ...baseVariables,
          currentYear: new Date().getFullYear().toString(),
          quotaStatus: hasArrearsForCertificate ? 'Com pendências' : 'Em dia',
          monthlyQuota: formatCurrency(currentBuilding?.baseQuota || 0),
          issueDate: formatDate(new Date().toISOString()),
          validUntil: formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()),
          observations: hasArrearsForCertificate ? 'Existem quotas pendentes' : 'Situação regularizada'
        };

      case 'assembly_notice':
        return {
          ...baseVariables,
          meetingDate: '',
          meetingTime: '',
          location: '',
          agenda: '',
          meetingType: 'Assembleia Geral Ordinária',
          quorumInfo: 'Primeira convocação: maioria absoluta. Segunda convocação: qualquer número',
          legalNotes: 'Conforme disposto no Código Civil e Regulamento do Condomínio'
        };

      default:
        return baseVariables;
    }
  };

  const TemplateSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Selecionar Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.metadata.description || 'Sem descrição'}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {template.type}
                    </Badge>
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const MemberFilter = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Membros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Membro</label>
            <Select value={memberTypeFilter} onValueChange={(value: any) => setMemberTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="owner">Proprietários</SelectItem>
                <SelectItem value="resident">Inquilinos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Situação de Quotas</label>
            <Select 
              value={arrearsFilter === null ? 'all' : arrearsFilter ? 'with_arrears' : 'no_arrears'} 
              onValueChange={(value) => {
                if (value === 'all') setArrearsFilter(null);
                else if (value === 'with_arrears') setArrearsFilter(true);
                else setArrearsFilter(false);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_arrears">Com Dívidas</SelectItem>
                <SelectItem value="no_arrears">Sem Dívidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Apartamento</label>
            <Input
              placeholder="Filtrar por apartamento"
              value={apartmentFilter}
              onChange={(e) => setApartmentFilter(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{filteredMembers.length}</span> membros correspondem aos filtros
        </div>
      </CardContent>
    </Card>
  );

  const MemberSelection = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Destinatários
            <Badge variant="secondary">
              {selectedMembers.length} selecionados
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label className="text-sm">Selecionar todos</label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredMembers.map((member) => {
              const memberArrears = arrears.filter(a => 
                a.memberId === member.id && a.status !== 'resolved'
              );
              const hasArrears = memberArrears.length > 0;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={(checked) => handleMemberToggle(member.id, !!checked)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {member.apartment && (
                            <Badge variant="outline" className="text-xs">
                              {member.apartment}
                            </Badge>
                          )}
                          <Badge 
                            variant={member.type === 'owner' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {member.type === 'owner' ? 'Proprietário' : 'Inquilino'}
                          </Badge>
                          {hasArrears && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {memberArrears.length} dívida(s)
                            </Badge>
                          )}
                        </div>
                      </div>
                      {member.email && (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const GenerationSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Geração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Título do Lote</label>
          <Input
            placeholder="Ex: Cartas de Morosidade - Janeiro 2024"
            value={batchTitle}
            onChange={(e) => setBatchTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Método de Entrega</label>
          <Select value={sendMethod} onValueChange={(value: any) => setSendMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="download">Download</SelectItem>
              <SelectItem value="email">Envio por Email</SelectItem>
              <SelectItem value="print">Preparar para Impressão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Gerando Documentos</h3>
        <p className="text-muted-foreground mb-4">
          Processando {selectedMembers.length} documentos...
        </p>
        <div className="w-full bg-muted rounded-full h-2 mb-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${generationProgress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {Math.round(generationProgress)}% concluído
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs defaultValue="template" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="filter">Filtros</TabsTrigger>
          <TabsTrigger value="select">Seleção</TabsTrigger>
          <TabsTrigger value="generate">Gerar</TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <TemplateSelector />
        </TabsContent>

        <TabsContent value="filter">
          <MemberFilter />
        </TabsContent>

        <TabsContent value="select">
          <MemberSelection />
        </TabsContent>

        <TabsContent value="generate">
          <GenerationSettings />
          
          {/* Resumo */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Resumo da Geração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Template:</p>
                  <p className="font-medium">{selectedTemplate?.name || 'Nenhum selecionado'}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Destinatários:</p>
                  <p className="font-medium">{selectedMembers.length} membros</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground">Método:</p>
                  <p className="font-medium">
                    {sendMethod === 'download' ? 'Download' :
                     sendMethod === 'email' ? 'Email' : 'Impressão'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button 
          onClick={generateDocuments}
          disabled={!selectedTemplate || selectedMembers.length === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Gerar {selectedMembers.length} Documentos
        </Button>
      </div>
    </div>
  );
};

export default BulkDocumentGenerator;