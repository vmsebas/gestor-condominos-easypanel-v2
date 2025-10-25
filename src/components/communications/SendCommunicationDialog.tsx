/**
 * Send Communication Dialog
 * Component for sending emails and WhatsApp messages to condominium members
 * Integrates with communication templates and PDF generation
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Mail,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Loader2,
  Send,
  Package
} from 'lucide-react';
import {
  getEmailTemplate,
  getWhatsAppTemplate,
  generateMailtoURL,
  generateWhatsAppURL,
  formatDatePortuguese,
  formatTimePortuguese,
  type TemplateData
} from '@/lib/communicationTemplates';
import { generateConvocatoriaPDF } from '@/lib/pdfGenerator';
import { generateActaCompletaPDF } from '@/lib/actaGenerator';
import { generateBlankProcuracaoPDF } from '@/lib/procuracaoGenerator';
import CorreioCertificadoPanel from './CorreioCertificadoPanel';
import EmailPreviewDialog from './EmailPreviewDialog';

interface Member {
  id: string;
  name: string;
  apartment?: string;
  fraction?: string;
  email?: string;
  email_consent?: boolean;
  whatsapp_number?: string;
  whatsapp_consent?: boolean;
  preferred_communication?: 'email' | 'whatsapp' | 'both';
}

interface EmailPreviewData {
  member: Member;
  subject: string;
  body: string;
  mailtoURL: string;
}

interface SendCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communicationType: 'convocatoria' | 'acta' | 'quota' | 'note';
  buildingId: string;
  buildingName: string;
  buildingAddress: string;
  communicationData: any; // Convocatoria, Acta, or other data
  onSendComplete?: () => void;
}

const SendCommunicationDialog: React.FC<SendCommunicationDialogProps> = ({
  open,
  onOpenChange,
  communicationType,
  buildingId,
  buildingName,
  buildingAddress,
  communicationData,
  onSendComplete
}) => {
  const [members, setMembers] = useState<Member[]>([]);  // Always initialize as empty array
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [communicationStats, setCommunicationStats] = useState<Record<string, { email: boolean; whatsapp: boolean }>>({});
  const [emailPreview, setEmailPreview] = useState<EmailPreviewData | null>(null);

  // Load members on component mount
  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      // If no buildingId, use the hardcoded one or get all
      const queryParam = buildingId ? `?buildingId=${buildingId}` : '';
      const response = await fetch(`/api/members${queryParam}`);

      if (!response.ok) {
        console.error('Failed to load members:', response.status, response.statusText);
        // If unauthorized or error, use empty array
        setMembers([]);
        toast.error('Erro ao carregar condóminos');
        return;
      }

      const data = await response.json();

      // Handle different response formats
      let membersList: Member[] = [];
      if (Array.isArray(data)) {
        // Direct array
        membersList = data;
      } else if (data.data?.members && Array.isArray(data.data.members)) {
        // Format: { success: true, data: { members: [...], pagination: {...} } }
        membersList = data.data.members;
      } else if (data.data && Array.isArray(data.data)) {
        // Format: { data: [...] }
        membersList = data.data;
      } else if (data.success && Array.isArray(data.data)) {
        // Format: { success: true, data: [...] }
        membersList = data.data;
      } else {
        console.error('Unexpected response format:', data);
        membersList = [];
      }

      setMembers(membersList);

      // Auto-select all members with communication consent
      const autoSelect = new Set<string>();
      if (Array.isArray(membersList)) {
        membersList.forEach((member: Member) => {
          if (member.email_consent || member.whatsapp_consent) {
            autoSelect.add(member.id);
          }
        });
      }
      setSelectedMembers(autoSelect);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
      toast.error('Erro ao carregar lista de condóminos');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate PDF for the communication
  const generatePDF = (): Blob => {
    if (pdfBlob && pdfGenerated) {
      return pdfBlob;
    }

    const templateData: TemplateData = {
      building_name: buildingName,
      building_address: buildingAddress,
      member_name: '', // Will be filled per member
      assembly_type: communicationData.assembly_type || 'ordinary',
      meeting_date: communicationData.meeting_date
        ? formatDatePortuguese(communicationData.meeting_date)
        : '',
      meeting_time: communicationData.meeting_time || '',
      first_call_time: communicationData.first_call_time,
      second_call_time: communicationData.second_call_time,
      location: communicationData.location || '',
      agenda_items: communicationData.agenda_items || [],
      convocatoria_number: communicationData.convocatoria_number,
      minute_number: communicationData.minute_number,
      sender_name: 'A Administração',
      sender_role: 'Administrador do Condomínio',
      sender_email: 'admin@example.com',
      sender_phone: '+351 123 456 789'
    };

    let blob: Blob | void;

    if (communicationType === 'convocatoria') {
      blob = generateConvocatoriaPDF(templateData, false);
    } else if (communicationType === 'acta') {
      blob = generateActaCompletaPDF(communicationData, false);
    }

    if (blob) {
      setPdfBlob(blob);
      setPdfGenerated(true);
      return blob;
    }

    throw new Error('Failed to generate PDF');
  };

  // Send email to a member
  const sendEmail = async (member: Member) => {
    if (!member.email || !member.email_consent) {
      toast.error(`${member.name} não tem email ou consentimento`);
      return;
    }

    setSendingTo(member.id);

    try {
      console.log('📧 Preparing email for:', member.name);
      console.log('📧 Communication data:', communicationData);

      // Prepare meeting date - use 'date' field if meeting_date doesn't exist
      const meetingDateRaw = communicationData.meeting_date || communicationData.date;
      console.log('📅 Meeting date raw:', meetingDateRaw);

      // Prepare template data
      const templateData: TemplateData = {
        building_name: buildingName,
        building_address: buildingAddress,
        member_name: member.name,
        member_apartment: member.apartment,
        member_fraction: member.fraction,
        assembly_type: communicationData.assembly_type || 'ordinary',
        meeting_date: meetingDateRaw
          ? formatDatePortuguese(meetingDateRaw)
          : formatDatePortuguese(new Date()),
        meeting_time: communicationData.time || communicationData.meeting_time || '18:00',
        first_call_time: communicationData.first_call_time || communicationData.time || '18:00',
        second_call_time: communicationData.second_call_time || 'meia hora depois',
        location: communicationData.location || 'Local a definir',
        agenda_items: communicationData.agenda_items || [],
        convocatoria_number: communicationData.assembly_number || communicationData.convocatoria_number,
        minute_number: communicationData.minute_number,
        sender_name: 'A Administração',
        sender_role: 'Administrador do Condomínio'
      };

      console.log('📧 Template data prepared:', templateData);

      // Get email template
      const { subject, body } = getEmailTemplate(communicationType, templateData);
      console.log('📧 Email subject:', subject);
      console.log('📧 Email body length:', body.length);

      // Create mailto: link
      const mailtoURL = generateMailtoURL(member.email, subject, body);

      // Show preview dialog instead of opening directly
      setEmailPreview({
        member,
        subject,
        body,
        mailtoURL
      });

      console.log('✅ Email preview prepared for:', member.name);
    } catch (error) {
      console.error('Error preparing email:', error);
      toast.error(`Erro ao preparar email para ${member.name}`);
    } finally {
      setSendingTo(null);
    }
  };

  // Confirm and send email after preview
  const confirmSendEmail = async () => {
    if (!emailPreview) return;

    try {
      // Log communication in database
      await logCommunication({
        member_id: emailPreview.member.id,
        building_id: buildingId,
        communication_type: communicationType,
        channel: 'email',
        status: 'draft_created',
        subject: emailPreview.subject,
        body_preview: emailPreview.body.substring(0, 200),
        full_content: emailPreview.body,
        related_convocatoria_id: communicationType === 'convocatoria' ? communicationData.id : null,
        related_minute_id: communicationType === 'acta' ? communicationData.id : null
      });

      // Open email client
      window.open(emailPreview.mailtoURL, '_blank');
      console.log('✅ Email client opened successfully');

      // Update stats
      setCommunicationStats(prev => ({
        ...prev,
        [emailPreview.member.id]: { ...prev[emailPreview.member.id], email: true }
      }));

      toast.success(`Email aberto no cliente para ${emailPreview.member.name}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Erro ao abrir email para ${emailPreview.member.name}`);
    }
  };

  // Download convocatoria PDF
  const downloadConvocatoriaPDF = () => {
    try {
      generatePDF();
      toast.success('PDF da convocatória descarregado');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  // Download procuração template
  const downloadProcuracao = () => {
    if (!emailPreview) return;

    try {
      const meetingDate = communicationData.meeting_date || communicationData.date;
      const meetingTime = communicationData.time || communicationData.meeting_time || '18:00';

      generateBlankProcuracaoPDF(
        buildingName,
        buildingAddress,
        communicationData.assembly_type || 'ordinary',
        meetingDate,
        meetingTime,
        true
      );

      toast.success('Modelo de procuração descarregado');
    } catch (error) {
      console.error('Error generating procuração:', error);
      toast.error('Erro ao gerar procuração');
    }
  };

  // Send WhatsApp to a member
  const sendWhatsApp = async (member: Member) => {
    if (!member.whatsapp_number) {
      toast.error(`${member.name} não tem WhatsApp configurado`);
      return;
    }

    setSendingTo(member.id);

    try {
      console.log('📱 Preparing WhatsApp for:', member.name);
      console.log('📱 WhatsApp number:', member.whatsapp_number);
      console.log('📱 Communication data:', communicationData);

      // Prepare meeting date
      const meetingDateRaw = communicationData.meeting_date || communicationData.date;
      console.log('📅 Meeting date raw:', meetingDateRaw);

      // Prepare template data
      const templateData: TemplateData = {
        building_name: buildingName,
        building_address: buildingAddress,
        member_name: member.name,
        member_apartment: member.apartment,
        member_fraction: member.fraction,
        assembly_type: communicationData.assembly_type || 'ordinary',
        meeting_date: meetingDateRaw
          ? formatDatePortuguese(meetingDateRaw)
          : formatDatePortuguese(new Date()),
        meeting_time: communicationData.time || communicationData.meeting_time || '18:00',
        first_call_time: communicationData.first_call_time || communicationData.time || '18:00',
        second_call_time: communicationData.second_call_time || 'meia hora depois',
        location: communicationData.location || 'Local a definir',
        agenda_items: communicationData.agenda_items || [],
        convocatoria_number: communicationData.assembly_number || communicationData.convocatoria_number,
        minute_number: communicationData.minute_number,
        sender_name: 'A Administração',
        sender_role: 'Administrador do Condomínio'
      };

      console.log('📱 Template data prepared:', templateData);

      // Get WhatsApp template - map communicationType to template type
      let whatsappType: 'convocatoria' | 'acta' | 'note' = 'note';
      if (communicationType === 'convocatoria') {
        whatsappType = 'convocatoria';
      } else if (communicationType === 'acta') {
        whatsappType = 'acta';
      }

      const message = getWhatsAppTemplate(whatsappType, templateData);
      console.log('📱 WhatsApp message generated (length):', message.length);

      // Log communication in database
      await logCommunication({
        member_id: member.id,
        building_id: buildingId,
        communication_type: communicationType,
        channel: 'whatsapp',
        status: 'draft_created',
        subject: `WhatsApp - ${communicationType}`,
        body_preview: message.substring(0, 200),
        full_content: message,
        related_convocatoria_id: communicationType === 'convocatoria' ? communicationData.id : null,
        related_minute_id: communicationType === 'acta' ? communicationData.id : null
      });

      // Create WhatsApp Web URL
      const whatsappURL = generateWhatsAppURL(member.whatsapp_number, message);
      console.log('📱 WhatsApp URL generated:', whatsappURL);
      console.log('📱 Opening WhatsApp Web...');

      // Open WhatsApp Web
      window.open(whatsappURL, '_blank');
      console.log('✅ WhatsApp Web opened successfully');

      // Update stats
      setCommunicationStats(prev => ({
        ...prev,
        [member.id]: { ...prev[member.id], whatsapp: true }
      }));

      toast.success(`WhatsApp preparado para ${member.name}`);
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      toast.error(`Erro ao preparar WhatsApp para ${member.name}`);
    } finally {
      setSendingTo(null);
    }
  };

  // Log communication in database
  const logCommunication = async (data: any) => {
    try {
      const response = await fetch('/api/communications/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.error('Failed to log communication');
      }
    } catch (error) {
      console.error('Error logging communication:', error);
    }
  };

  // Send to all selected members
  const sendToAll = async (channel: 'email' | 'whatsapp') => {
    const memberArray = Array.isArray(members) ? members : [];
    const selectedMembersList = memberArray.filter(m => selectedMembers.has(m.id));
    const validMembers = selectedMembersList.filter(m => {
      if (channel === 'email') {
        return m.email && m.email_consent;
      } else {
        return m.whatsapp_number;
      }
    });

    if (validMembers.length === 0) {
      toast.error(`Nenhum condómino válido para envio por ${channel === 'email' ? 'email' : 'WhatsApp'}`);
      return;
    }

    toast.info(`A preparar ${channel === 'email' ? 'emails' : 'mensagens WhatsApp'} para ${validMembers.length} condóminos...`);

    for (const member of validMembers) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between sends
      if (channel === 'email') {
        await sendEmail(member);
      } else {
        await sendWhatsApp(member);
      }
    }

    toast.success(`Concluído! ${validMembers.length} ${channel === 'email' ? 'emails' : 'mensagens'} preparadas`);
    onSendComplete?.();
  };

  // Toggle member selection
  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const toggleAll = () => {
    const memberArray = Array.isArray(members) ? members : [];
    if (selectedMembers.size === memberArray.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(memberArray.map(m => m.id)));
    }
  };

  // Ensure members is always an array for rendering
  const membersList = Array.isArray(members) ? members : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Enviar {communicationType === 'convocatoria' ? 'Convocatória' : 'Comunicação'}</DialogTitle>
            <DialogDescription>
              Escolha o método de envio: digital (email/WhatsApp) ou correio certificado
            </DialogDescription>
          </DialogHeader>

        <Tabs defaultValue="digital" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="digital">
              <Mail className="mr-2 h-4 w-4" />
              Email / WhatsApp
            </TabsTrigger>
            <TabsTrigger value="certificado">
              <Package className="mr-2 h-4 w-4" />
              Correio Certificado
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Email/WhatsApp */}
          <TabsContent value="digital" className="space-y-4 mt-4">
          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
            >
              {selectedMembers.size === membersList.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => sendToAll('email')}
                disabled={selectedMembers.size === 0}
              >
                <Mail className="mr-2 h-4 w-4" />
                Enviar Emails ({selectedMembers.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendToAll('whatsapp')}
                disabled={selectedMembers.size === 0}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar WhatsApp ({selectedMembers.size})
              </Button>
            </div>
          </div>

          {/* Members list */}
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : membersList.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum condómino encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {membersList.map(member => {
                  const hasEmail = member.email && member.email_consent;
                  const hasWhatsApp = member.whatsapp_number;
                  const stats = communicationStats[member.id];

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          checked={selectedMembers.has(member.id)}
                          onCheckedChange={() => toggleMember(member.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          {member.apartment && (
                            <p className="text-sm text-muted-foreground">
                              Fração {member.apartment}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Email button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendEmail(member)}
                          disabled={!hasEmail || sendingTo === member.id}
                          title={hasEmail ? member.email : 'Sem email'}
                        >
                          {stats?.email ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Mail className={`h-4 w-4 ${hasEmail ? 'text-blue-600' : 'text-gray-400'}`} />
                          )}
                        </Button>

                        {/* WhatsApp button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendWhatsApp(member)}
                          disabled={!hasWhatsApp || sendingTo === member.id}
                          title={hasWhatsApp ? member.whatsapp_number : 'Sem WhatsApp'}
                        >
                          {stats?.whatsapp ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <MessageCircle className={`h-4 w-4 ${hasWhatsApp ? 'text-green-600' : 'text-gray-400'}`} />
                          )}
                        </Button>

                        {/* Status indicators */}
                        {!hasEmail && !hasWhatsApp && (
                          <Badge variant="outline" className="ml-2">
                            <XCircle className="h-3 w-3 mr-1" />
                            Sem contacto
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <div className="flex gap-4">
              <span>
                <Mail className="inline h-4 w-4 mr-1" />
                {membersList.filter(m => m.email && m.email_consent).length} com email
              </span>
              <span>
                <MessageCircle className="inline h-4 w-4 mr-1" />
                {membersList.filter(m => m.whatsapp_number).length} com WhatsApp
              </span>
            </div>
            <span>{selectedMembers.size} selecionados</span>
          </div>
          </TabsContent>

          {/* Tab 2: Correio Certificado */}
          <TabsContent value="certificado" className="mt-4">
            <CorreioCertificadoPanel
              members={membersList}
              selectedMembers={selectedMembers}
              buildingName={buildingName}
              buildingAddress={buildingAddress}
              onTrackingNumbersUpdate={(trackingNumbers) => {
                // Save tracking numbers to communication logs
                Object.entries(trackingNumbers).forEach(([memberId, trackingNumber]) => {
                  if (trackingNumber) {
                    logCommunication({
                      member_id: memberId,
                      building_id: buildingId,
                      communication_type: communicationType,
                      channel: 'certified_mail',
                      status: 'sent',
                      subject: `Correio Certificado - ${communicationType}`,
                      metadata: { tracking_number: trackingNumber },
                      related_convocatoria_id: communicationType === 'convocatoria' ? communicationData.id : null,
                      related_minute_id: communicationType === 'acta' ? communicationData.id : null
                    });
                  }
                });
              }}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Email Preview Dialog */}
    {emailPreview && (
      <EmailPreviewDialog
        open={!!emailPreview}
        onOpenChange={(open) => {
          if (!open) setEmailPreview(null);
        }}
        subject={emailPreview.subject}
        body={emailPreview.body}
        recipientEmail={emailPreview.member.email || ''}
        recipientName={emailPreview.member.name}
        recipientFraction={emailPreview.member.apartment || emailPreview.member.fraction}
        buildingName={buildingName}
        buildingAddress={buildingAddress}
        assemblyDate={communicationData.meeting_date || communicationData.date}
        assemblyType={communicationData.assembly_type}
        onSendConfirm={confirmSendEmail}
        onDownloadPDF={communicationType === 'convocatoria' || communicationType === 'acta' ? downloadConvocatoriaPDF : undefined}
        onDownloadProcuracao={communicationType === 'convocatoria' ? downloadProcuracao : undefined}
      />
    )}
    </>
  );
};

export default SendCommunicationDialog;
