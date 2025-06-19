import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToPdfEnhanced } from '@/utils/pdfExportUtils';
import ConvocatoriaService, { ConvocatoriaData, ConvocatoriaRecipient } from '@/utils/db/convocatoriaService';
import ConvocatoriaPdfGenerator from '@/utils/convocatoriaPdfGenerator';
import PrintButton from '@/components/PrintButton';
import EmailConfiguration from '@/components/email/EmailConfiguration';
import { toast } from 'sonner';
import { 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Mail,
  FileText,
  Download,
  Eye,
  FileDown,
  Save
} from 'lucide-react';

interface EnvioConfirmacionStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface Recipient extends ConvocatoriaRecipient {
  apartmentNumber?: string;
  address?: string;
}

const EnvioConfirmacionStep: React.FC<EnvioConfirmacionStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [currentlySending, setCurrentlySending] = useState<string>('');
  const [convocatoriaId, setConvocatoriaId] = useState<string | null>(null);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);

  // Dados simulados de proprietários
  const mockRecipients: Recipient[] = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      address: 'Rua das Flores, 123, 1º A',
      apartmentNumber: '1A',
      status: 'pending'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      address: 'Rua das Flores, 123, 2º B',
      apartmentNumber: '2B',
      status: 'pending'
    },
    {
      id: '3',
      name: 'António Costa',
      email: 'antonio.costa@email.com',
      address: 'Rua das Flores, 123, 3º C',
      apartmentNumber: '3C',
      status: 'pending'
    },
    {
      id: '4',
      name: 'Ana Ferreira',
      email: 'ana.ferreira@email.com',
      address: 'Rua das Flores, 123, 4º D',
      apartmentNumber: '4D',
      status: 'pending'
    }
  ];

  useEffect(() => {
    const loadRecipients = async () => {
      if (recipients.length === 0 && data.buildingId) {
        try {
          const convocatoriaRecipients = await ConvocatoriaService.getConvocatoriaRecipients(data.buildingId);
          const adaptedRecipients = convocatoriaRecipients.map(r => ({
            ...r,
            apartmentNumber: r.apartment,
            address: `Apartamento ${r.apartment}`,
            id: r.member_id
          }));
          setRecipients(adaptedRecipients);
        } catch (error) {
          console.error('Error loading recipients:', error);
          // Fallback para dados simulados se não conseguir carregar membros reais
          setRecipients(mockRecipients);
        }
      }
    };
    
    loadRecipients();
  }, [data.buildingId]);

  const saveConvocatoria = async () => {
    if (hasBeenSaved) return;
    
    setIsSaving(true);
    try {
      // Preparar dados da convocatória
      const convocatoriaData: ConvocatoriaData = {
        building_id: data.buildingId || '1',
        meeting_type: data.meetingType === 'extraordinaria' ? 'extraordinary' : 'ordinary',
        meeting_date: data.meetingDate,
        meeting_time: data.meetingTime,
        meeting_location: data.meetingLocation,
        second_call_enabled: data.second_call_enabled || false,
        second_call_date: data.second_call_date,
        second_call_time: data.second_call_time,
        delivery_methods: data.deliveryMethods || [],
        agenda_items: data.agendaItems || [],
        attached_documents: data.attachedDocuments || [],
        administrator_name: data.administrator_name,
        secretary_name: data.secretary_name,
        legal_reference: data.legal_reference,
        status: 'draft'
      };

      const result = await ConvocatoriaService.createConvocatoria(convocatoriaData);
      
      if (result.success && result.convocatoriaId) {
        setConvocatoriaId(result.convocatoriaId);
        setHasBeenSaved(true);
        toast.success('Convocatória guardada com sucesso!');
        
        onUpdate({
          convocatoriaId: result.convocatoriaId,
          savedAt: new Date().toISOString()
        });
      } else {
        throw new Error(result.error || 'Erro ao guardar convocatória');
      }
    } catch (error) {
      console.error('Error saving convocatoria:', error);
      toast.error('Erro ao guardar convocatória: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const startSending = async () => {
    // Verificar se o email está configurado
    if (!isEmailConfigured) {
      toast.error('Configure o serviço de email primeiro na aba "Config Email"');
      return;
    }

    // Guardar primeiro se ainda não foi guardado
    if (!hasBeenSaved) {
      await saveConvocatoria();
      if (!convocatoriaId) {
        toast.error('Erro: Convocatória deve ser guardada antes do envio');
        return;
      }
    }

    setIsSending(true);
    setSendProgress(0);
    
    try {
      // Preparar dados da convocatória para envio
      const convocatoriaData: ConvocatoriaData = {
        building_id: data.buildingId || '1',
        meeting_type: data.meetingType === 'extraordinaria' ? 'extraordinary' : 'ordinary',
        meeting_date: data.meetingDate,
        meeting_time: data.meetingTime,
        meeting_location: data.meetingLocation,
        second_call_enabled: data.second_call_enabled || false,
        second_call_date: data.second_call_date,
        second_call_time: data.second_call_time,
        delivery_methods: data.deliveryMethods || [],
        agenda_items: data.agendaItems || [],
        attached_documents: data.attachedDocuments || [],
        administrator_name: data.administrator_name,
        secretary_name: data.secretary_name,
        legal_reference: data.legal_reference,
        status: 'sent'
      };

      // Enviar emails usando o serviço
      const result = await ConvocatoriaService.sendConvocatoriaEmails(
        convocatoriaId!,
        recipients,
        convocatoriaData,
        (progress, currentRecipient) => {
          setSendProgress(progress);
          setCurrentlySending(currentRecipient);
        }
      );

      if (result.success) {
        setRecipients(result.results);
        
        const sent = result.results.filter(r => r.status === 'sent' || r.status === 'delivered').length;
        const delivered = result.results.filter(r => r.status === 'delivered').length;
        const failed = result.results.filter(r => r.status === 'failed').length;
        
        onUpdate({
          sendResults: {
            method: data.deliveryMethods?.[0] || 'email',
            totalRecipients: result.results.length,
            sent,
            delivered,
            failed,
            completedAt: new Date().toISOString()
          }
        });

        toast.success(`Convocatória enviada! ${sent} de ${result.results.length} enviadas com sucesso.`);
      } else {
        throw new Error(result.error || 'Erro no envio');
      }
    } catch (error) {
      console.error('Error sending convocatoria:', error);
      toast.error('Erro no envio: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsSending(false);
      setCurrentlySending('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'sent':
        return <Badge variant="info">Enviada</Badge>;
      case 'delivered':
        return <Badge variant="success">Entregue</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'email':
        return 'Email';
      case 'certified-mail':
        return 'Correio Registado';
      case 'hand-delivery':
        return 'Entrega em Mão';
      default:
        return 'Não definido';
    }
  };

  const totalSent = recipients.filter(r => r.status === 'sent' || r.status === 'delivered').length;
  const totalDelivered = recipients.filter(r => r.status === 'delivered').length;
  const totalFailed = recipients.filter(r => r.status === 'failed').length;
  const allCompleted = recipients.every(r => r.status !== 'pending');

  // Função para exportar convocatória para PDF
  const handleExportToPDF = async () => {
    try {
      // Preparar dados para o PDF
      const pdfData = {
        buildingName: data.buildingName || 'Edifício',
        buildingAddress: data.buildingAddress || '',
        postalCode: data.postalCode || '',
        city: data.city || '',
        assemblyNumber: data.assemblyNumber || new Date().getFullYear().toString(),
        assemblyType: data.meetingType === 'extraordinaria' ? 'extraordinaria' : 'ordinaria',
        meetingDate: data.meetingDate,
        meetingTime: data.meetingTime,
        meetingLocation: data.meetingLocation,
        secondCallEnabled: data.second_call_enabled || false,
        secondCallDate: data.second_call_date,
        secondCallTime: data.second_call_time,
        administrator: data.administrator_name || 'Administrador',
        secretary: data.secretary_name,
        agendaItems: data.agendaItems || [],
        legalReference: data.legal_reference || 'Código Civil Português, artigos 1430.º e seguintes'
      };
      
      // Gerar e baixar PDF
      await ConvocatoriaPdfGenerator.generateAndDownload(pdfData);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Send className="h-6 w-6 text-blue-600" />
            <span>Envio e Confirmação</span>
          </CardTitle>
          <CardDescription>
            Envio massivo das convocatórias e rastreamento das entregas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{recipients.length}</p>
              <p className="text-sm text-muted-foreground">Total destinatários</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalSent}</p>
              <p className="text-sm text-muted-foreground">Enviadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{totalDelivered}</p>
              <p className="text-sm text-muted-foreground">Entregues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{totalFailed}</p>
              <p className="text-sm text-muted-foreground">Falharam</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do envio */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Envio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Método de Envio</label>
              <p className="text-lg">{getMethodName(data.deliveryMethod)}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Data da Reunião</label>
              <p className="text-lg">{new Date(data.meetingDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Local da Reunião</label>
              <p className="text-lg">{data.meetingLocation || 'Não definido'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Hora da Reunião</label>
              <p className="text-lg">{data.meetingTime || 'Não definida'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso do envio */}
      {isSending && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium">Enviando convocatórias...</p>
                <p className="text-sm text-muted-foreground">
                  A enviar para: {currentlySending}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso do envio</span>
                  <span>{Math.round(sendProgress)}%</span>
                </div>
                <Progress value={sendProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs com lista de destinatários e ações */}
      <Tabs defaultValue="email-config" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="email-config">Config Email</TabsTrigger>
          <TabsTrigger value="recipients">Destinatários</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
          <TabsTrigger value="email-preview">Email</TabsTrigger>
          <TabsTrigger value="pdf-preview">PDF</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="email-config">
          <EmailConfiguration onConfigured={setIsEmailConfigured} />
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Destinatários</CardTitle>
              <CardDescription>
                Status de envio para cada proprietário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        {getStatusIcon(recipient.status)}
                      </div>
                      <div>
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Apartamento {recipient.apartmentNumber} • {recipient.email}
                        </p>
                        {recipient.error && (
                          <p className="text-sm text-red-600">{recipient.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(recipient.status)}
                      {recipient.sentAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(recipient.sentAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização da Convocatória</CardTitle>
              <CardDescription>
                Como a convocatória será enviada aos proprietários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white dark:bg-slate-900 convocatoria-preview" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center border-b-2 border-blue-600 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">CONVOCATÓRIA</h1>
                    <h2 className="text-xl text-gray-700 dark:text-gray-300">
                      Assembleia {data.meetingType === 'extraordinaria' ? 'Extraordinária' : 'Ordinária'} de Condóminos
                    </h2>
                  </div>
                  
                  {/* Meeting Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1">
                      Informações da Reunião
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex border-b border-gray-100 dark:border-gray-800 pb-2">
                        <span className="font-medium w-20">Data:</span>
                        <span>{data.meetingDate ? new Date(data.meetingDate).toLocaleDateString('pt-PT', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Não definida'}</span>
                      </div>
                      <div className="flex border-b border-gray-100 dark:border-gray-800 pb-2">
                        <span className="font-medium w-20">Hora:</span>
                        <span>{data.meetingTime || 'Não definida'}</span>
                      </div>
                      <div className="flex border-b border-gray-100 dark:border-gray-800 pb-2 md:col-span-2">
                        <span className="font-medium w-20">Local:</span>
                        <span>{data.meetingLocation || 'Não definido'}</span>
                      </div>
                      {data.second_call_enabled && (
                        <div className="flex border-b border-gray-100 dark:border-gray-800 pb-2 md:col-span-2">
                          <span className="font-medium w-32">Segunda Convocatória:</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {data.second_call_date ? new Date(data.second_call_date).toLocaleDateString('pt-PT') : 'Mesmo dia'} às {data.second_call_time}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Agenda */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1">
                      Ordem do Dia
                    </h3>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border-l-4 border-blue-600">
                      {(data.agendaItems || []).length > 0 ? (
                        <ol className="list-decimal list-inside space-y-2">
                          {(data.agendaItems || []).map((item: any, index: number) => (
                            <li key={index} className="text-sm">
                              <strong>{item.title}</strong>
                              {item.description && (
                                <div className="ml-6 mt-1 text-gray-600 dark:text-gray-400">
                                  {item.description}
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400 italic">
                          Ordem do dia será definida durante o processo de criação.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Methods */}
                  {data.deliveryMethods && data.deliveryMethods.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1">
                        Métodos de Envio
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {data.deliveryMethods.map((method: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {method === 'burofax' ? 'Burofax' :
                             method === 'correo_certificado' ? 'Correio Certificado' :
                             method === 'email_certificado' ? 'Email Certificado' :
                             method === 'sms_certificado' ? 'SMS Certificado' :
                             method === 'notificacion_app' ? 'Notificação App' :
                             method === 'llamada_telefonica' ? 'Chamada Telefónica' :
                             method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Legal Notice */}
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      📋 Informação Legal
                    </h4>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <p>
                        <strong>Quórum (1ª Convocatória):</strong> Presença de condóminos que representem mais de metade do valor total do prédio.
                      </p>
                      {data.second_call_enabled && (
                        <p>
                          <strong>Quórum (2ª Convocatória):</strong> Qualquer número de condóminos presentes.
                        </p>
                      )}
                      <p className="mt-2">
                        <em>Base legal: Código Civil Português, artigos 1430.º e seguintes</em>
                      </p>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Documento gerado automaticamente pelo sistema Gestor Condominios
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Data de geração: {new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-preview">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização do Email</CardTitle>
              <CardDescription>
                Como o email será visualizado pelos destinatários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-muted-foreground">De: noreply@gestorcondominos.pt</p>
                  <p className="text-sm text-muted-foreground">Para: [email do destinatário]</p>
                  <p className="text-sm font-medium mt-2">
                    Assunto: Convocatória para Assembleia {data.meetingType === 'extraordinaria' ? 'Extraordinária' : 'Ordinária'} - {data.buildingName || 'Edifício'}
                  </p>
                </div>
                <div 
                  className="email-preview"
                  dangerouslySetInnerHTML={{ 
                    __html: ConvocatoriaService.generateConvocatoriaHTML({
                      building_id: data.buildingId || '1',
                      meeting_type: data.meetingType === 'extraordinaria' ? 'extraordinary' : 'ordinary',
                      meeting_date: data.meetingDate,
                      meeting_time: data.meetingTime,
                      meeting_location: data.meetingLocation,
                      second_call_enabled: data.second_call_enabled || false,
                      second_call_date: data.second_call_date,
                      second_call_time: data.second_call_time,
                      delivery_methods: data.deliveryMethods || [],
                      agenda_items: data.agendaItems || [],
                      attached_documents: data.attachedDocuments || [],
                      administrator_name: data.administrator_name,
                      secretary_name: data.secretary_name,
                      legal_reference: data.legal_reference,
                      status: 'draft'
                    })
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf-preview">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização do PDF</CardTitle>
              <CardDescription>
                Formato do PDF que será gerado para impressão ou arquivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-white p-8" style={{ minHeight: '600px' }}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: ConvocatoriaPdfGenerator.generateHTML({
                      buildingName: data.buildingName || 'Edifício',
                      buildingAddress: data.buildingAddress || '',
                      postalCode: data.postalCode || '',
                      city: data.city || '',
                      assemblyNumber: data.assemblyNumber || new Date().getFullYear().toString(),
                      assemblyType: data.meetingType === 'extraordinaria' ? 'extraordinaria' : 'ordinaria',
                      meetingDate: data.meetingDate,
                      meetingTime: data.meetingTime,
                      meetingLocation: data.meetingLocation,
                      secondCallEnabled: data.second_call_enabled || false,
                      secondCallDate: data.second_call_date,
                      secondCallTime: data.second_call_time,
                      administrator: data.administrator_name || 'Administrador',
                      secretary: data.secretary_name,
                      agendaItems: data.agendaItems || [],
                      legalReference: data.legal_reference || 'Código Civil Português, artigos 1430.º e seguintes'
                    })
                  }}
                />
              </div>
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="default" 
                  onClick={handleExportToPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF de Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Ações Disponíveis</CardTitle>
              <CardDescription>
                Gerir o envio e documentação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4"
                  onClick={handleExportToPDF}
                >
                  <div className="flex items-center space-x-3">
                    <FileDown className="h-6 w-6" />
                    <div className="text-left">
                      <p className="font-medium">Gerar PDF</p>
                      <p className="text-sm text-muted-foreground">Descarregar convocatória em PDF</p>
                    </div>
                  </div>
                </Button>
                
                <PrintButton 
                  contentSelector=".convocatoria-preview"
                  title="Imprimir Convocatória"
                  variant="outline"
                  className="h-auto p-4 flex-col items-start text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-left">
                      <p className="font-medium">Imprimir</p>
                      <p className="text-sm text-muted-foreground">Imprimir convocatória</p>
                    </div>
                  </div>
                </PrintButton>
                
                <Button variant="outline" className="h-auto p-4">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-6 w-6" />
                    <div className="text-left">
                      <p className="font-medium">Rastrear Entregas</p>
                      <p className="text-sm text-muted-foreground">Ver status de todas as entregas</p>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6" />
                    <div className="text-left">
                      <p className="font-medium">Reenviar Falhados</p>
                      <p className="text-sm text-muted-foreground">Reenviar para destinatários com falha</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações principais */}
      {!allCompleted && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center space-x-4">
                {!hasBeenSaved ? (
                  <div className="text-center space-y-4">
                    <Save className="h-12 w-12 text-green-600 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">Guardar Convocatória</h3>
                      <p className="text-muted-foreground">
                        Primeiro guarde a convocatória na base de dados
                      </p>
                    </div>
                    <Button 
                      onClick={saveConvocatoria} 
                      disabled={isSaving}
                      size="lg"
                      variant="outline"
                      className="min-w-40"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Convocatória'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <Send className="h-12 w-12 text-blue-600 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">Pronto para Enviar</h3>
                      <p className="text-muted-foreground">
                        Convocatória guardada! Clique para enviar para {recipients.length} destinatários
                      </p>
                    </div>
                    <Button 
                      onClick={startSending} 
                      disabled={isSending || !isEmailConfigured}
                      size="lg"
                      className="min-w-40"
                    >
                      {isSending ? 'Enviando...' : 'Iniciar Envio'}
                    </Button>
                    
                    {!isEmailConfigured && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        Configure o email na aba "Config Email" para habilitar o envio
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {hasBeenSaved && (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Convocatória guardada com sucesso!</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                    ID: {convocatoriaId} • Status: Pronta para envio
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado final */}
      {allCompleted && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Envio Concluído
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  {totalSent} de {recipients.length} convocatórias foram enviadas com sucesso.
                  {totalFailed > 0 && ` ${totalFailed} falharam e podem ser reenviadas.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de navegação */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!allCompleted}
        >
          Finalizar Workflow
        </Button>
      </div>
    </div>
  );
};

export default EnvioConfirmacionStep;