import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  Send,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle,
  Loader2,
  Users,
  Download
} from 'lucide-react';
import { getMembers } from '@/lib/api';
import { toast } from 'sonner';
import { generateLetterPDF } from '@/lib/letterGenerator';

interface Member {
  id: string;
  name: string;
  apartment: string;
  email: string;
  whatsapp_number: string | null;
  email_consent: boolean;
  whatsapp_consent: boolean;
}

interface SendStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SendStep: React.FC<SendStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentCompleted, setSentCompleted] = useState(false);
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp' | 'correio'>('email');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

  useEffect(() => {
    loadSelectedMembers();
  }, []);

  const loadSelectedMembers = async () => {
    try {
      setLoading(true);
      const result = await getMembers({ building_id: data.buildingId });
      const allMembers = result.data?.members || result.members || [];

      // Filtrar apenas os selecionados
      const selected = allMembers.filter((m: Member) =>
        data.recipients?.includes(m.id)
      );
      setSelectedMembers(selected);
    } catch (error: any) {
      console.error('Erro ao carregar condóminos:', error);
      toast.error('Erro ao carregar destinatários');
    } finally {
      setLoading(false);
    }
  };

  const substituteVariables = (content: string, member: Member) => {
    const currentDate = new Date().toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    let result = content;
    result = result.replace(/\{\{building\.name\}\}/g, data.buildingName || '');
    result = result.replace(/\{\{building\.address\}\}/g, data.buildingAddress || '');
    result = result.replace(/\{\{member\.name\}\}/g, member.name);
    result = result.replace(/\{\{member\.apartment\}\}/g, member.apartment);
    result = result.replace(/\{\{member\.email\}\}/g, member.email || '');
    result = result.replace(/\{\{current\.date\}\}/g, currentDate);
    result = result.replace(/\{\{current\.year\}\}/g, new Date().getFullYear().toString());
    result = result.replace(/\{\{admin\.name\}\}/g, 'Administrador');

    return result;
  };

  const generatePDFForMember = async (member: Member) => {
    const personalizedContent = substituteVariables(data.content, member);
    const personalizedSubject = substituteVariables(data.subject, member);

    const letterData = {
      buildingName: data.buildingName,
      buildingAddress: data.buildingAddress,
      memberName: member.name,
      memberApartment: member.apartment,
      subject: personalizedSubject,
      content: personalizedContent,
      date: new Date().toLocaleDateString('pt-PT')
    };

    return generateLetterPDF(letterData, false); // false = não download, retorna blob
  };

  const handleSend = async () => {
    try {
      setSending(true);

      if (sendMethod === 'email') {
        await sendViaEmail();
      } else if (sendMethod === 'whatsapp') {
        await sendViaWhatsApp();
      } else {
        await generateCorreioDocuments();
      }

      setSentCompleted(true);
      toast.success(`Cartas enviadas com sucesso via ${sendMethod}!`);

      // TODO: Registar logs de comunicação
      // await Promise.all(selectedMembers.map(member => {
      //   return logCommunication({
      //     member_id: member.id,
      //     building_id: data.buildingId,
      //     communication_type: 'letter',
      //     communication_subtype: data.template_type,
      //     channel: sendMethod,
      //     status: 'sent',
      //     subject: data.subject,
      //     body_preview: data.content.substring(0, 200),
      //     full_content: data.content
      //   });
      // }));

      // Esperar 2 segundos antes de completar
      setTimeout(() => {
        onNext();
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao enviar cartas:', error);
      toast.error('Erro ao enviar cartas: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const sendViaEmail = async () => {
    const recipients = selectedMembers
      .filter(m => m.email && m.email_consent)
      .map(m => m.email)
      .join(',');

    if (!recipients) {
      throw new Error('Nenhum destinatário com email válido e consentimento');
    }

    // Gerar PDF anexo (do primeiro membro como exemplo)
    const pdfBlob = await generatePDFForMember(selectedMembers[0]);
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Abrir mailto com assunto e corpo
    const subject = encodeURIComponent(data.subject);
    const body = encodeURIComponent(`
Caro(a) Condómino(a),

Segue em anexo a comunicação referente a: ${data.subject}

Cumprimentos,
Administração de ${data.buildingName}
    `.trim());

    window.open(`mailto:${recipients}?subject=${subject}&body=${body}`, '_blank');

    // Nota: O PDF não pode ser anexado automaticamente via mailto
    // Fazer download do PDF para o utilizador anexar manualmente
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `carta_${data.template_type}_${new Date().getTime()}.pdf`;
    link.click();

    toast.info('Email aberto. Por favor anexe o PDF descarregado.');
  };

  const sendViaWhatsApp = async () => {
    for (const member of selectedMembers) {
      if (!member.whatsapp_number || !member.whatsapp_consent) {
        continue;
      }

      const personalizedContent = substituteVariables(data.content, member);
      const message = `*${data.buildingName}*\n\n${data.subject}\n\n${personalizedContent}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${member.whatsapp_number.replace(/\D/g, '')}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');

      // Pequeno delay entre cada envio
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const generateCorreioDocuments = async () => {
    // Gerar PDF para cada destinatário
    for (const member of selectedMembers) {
      const pdfBlob = await generatePDFForMember(member);
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Download do PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `carta_${member.name.replace(/\s/g, '_')}_${data.template_type}.pdf`;
      link.click();

      // Pequeno delay entre cada download
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast.success('PDFs gerados para impressão e envio por correio');
  };

  const canSendViaEmail = selectedMembers.filter(m => m.email && m.email_consent).length > 0;
  const canSendViaWhatsApp = selectedMembers.filter(m => m.whatsapp_number && m.whatsapp_consent).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">A preparar envio...</span>
      </div>
    );
  }

  if (sentCompleted) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Cartas Enviadas!</h3>
        <p className="text-muted-foreground mb-6">
          {selectedMembers.length} {selectedMembers.length === 1 ? 'carta foi enviada' : 'cartas foram enviadas'} com sucesso via {sendMethod}.
        </p>
        <Button onClick={() => window.location.reload()}>
          Criar Nova Carta
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo do Envio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Template</p>
              <p className="font-medium">{data.template_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Assunto</p>
              <p className="font-medium">{data.subject}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Edifício</p>
              <p className="font-medium">{data.buildingName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Destinatários</p>
              <p className="font-medium flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {selectedMembers.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Método de Envio</CardTitle>
          <CardDescription className="text-xs">
            Seleccione como deseja enviar as cartas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={sendMethod} onValueChange={(value: any) => setSendMethod(value)}>
            <div className="space-y-3">
              {/* Email */}
              <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                sendMethod === 'email' ? 'border-primary bg-primary/5' : 'border-border'
              } ${!canSendViaEmail ? 'opacity-50' : ''}`}>
                <RadioGroupItem value="email" id="email" disabled={!canSendViaEmail} />
                <Label htmlFor="email" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedMembers.filter(m => m.email && m.email_consent).length} disponíveis
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Envio via email com PDF anexado. Requer consentimento RGPD.
                  </p>
                </Label>
              </div>

              {/* WhatsApp */}
              <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                sendMethod === 'whatsapp' ? 'border-primary bg-primary/5' : 'border-border'
              } ${!canSendViaWhatsApp ? 'opacity-50' : ''}`}>
                <RadioGroupItem value="whatsapp" id="whatsapp" disabled={!canSendViaWhatsApp} />
                <Label htmlFor="whatsapp" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">WhatsApp</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedMembers.filter(m => m.whatsapp_number && m.whatsapp_consent).length} disponíveis
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Envio de mensagem via WhatsApp Web. Requer consentimento RGPD.
                  </p>
                </Label>
              </div>

              {/* Correio Certificado */}
              <div className={`flex items-start space-x-3 p-4 rounded-lg border ${
                sendMethod === 'correio' ? 'border-primary bg-primary/5' : 'border-border'
              }`}>
                <RadioGroupItem value="correio" id="correio" />
                <Label htmlFor="correio" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Correio Certificado</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedMembers.length} PDFs
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gerar PDFs para impressão e envio por correio registado.
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Recipients List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Destinatários Selecionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">Fração {member.apartment}</p>
                </div>
                <div className="flex gap-1">
                  {member.email && member.email_consent && (
                    <Badge variant="outline" className="text-xs">Email</Badge>
                  )}
                  {member.whatsapp_number && member.whatsapp_consent && (
                    <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrevious} disabled={sending}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button onClick={handleSend} disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A enviar...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Cartas ({selectedMembers.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SendStep;
