import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {  Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { lettersAPI, membersAPI, type SentLetter, type LetterTemplate } from '@/services/api';

interface LetterCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  buildingName: string;
  onSuccess?: (letter: SentLetter) => void;
}

export default function LetterCreationDialog({
  open,
  onOpenChange,
  buildingId,
  buildingName,
  onSuccess
}: LetterCreationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sendMethod, setSendMethod] = useState<string>('email');

  // Data
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Load templates and members when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates();
      loadMembers();
    } else {
      // Reset form when dialog closes
      resetForm();
    }
  }, [open, buildingId]);

  // Load templates when member is selected
  useEffect(() => {
    if (selectedMember) {
      const member = members.find(m => m.id === selectedMember);
      if (member) {
        setRecipientName(member.name || '');
        setRecipientEmail(member.email || '');
      }
    }
  }, [selectedMember, members]);

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setSubject(template.subject || '');
        setContent(template.content || '');
      }
    }
  }, [selectedTemplate, templates]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await lettersAPI.getTemplates({
        building_id: buildingId,
        is_active: true
      });
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await membersAPI.getByBuilding(buildingId);
      setMembers(response || []);
    } catch (error: any) {
      console.error('Error loading members:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoadingMembers(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate('');
    setSelectedMember('');
    setRecipientName('');
    setRecipientEmail('');
    setSubject('');
    setContent('');
    setSendMethod('email');
  };

  const handleSubmit = async () => {
    // Validation
    if (!recipientName.trim()) {
      toast.error('Por favor, insira o nome do destinatário');
      return;
    }

    if (!subject.trim()) {
      toast.error('Por favor, insira o assunto');
      return;
    }

    if (!content.trim()) {
      toast.error('Por favor, insira o conteúdo da carta');
      return;
    }

    if (!sendMethod) {
      toast.error('Por favor, selecione o método de envio');
      return;
    }

    setLoading(true);
    try {
      const letterData = {
        building_id: buildingId,
        template_id: selectedTemplate || undefined,
        member_id: selectedMember || undefined,
        recipient_name: recipientName,
        recipient_email: recipientEmail || undefined,
        subject,
        content,
        send_method: sendMethod,
        sent_date: new Date().toISOString(),
        delivery_confirmation: false,
        legal_validity: sendMethod === 'correio_certificado'
      };

      const newLetter = await lettersAPI.createLetter(letterData);
      toast.success('Carta criada com sucesso!');

      if (onSuccess) {
        onSuccess(newLetter);
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating letter:', error);
      toast.error(error.response?.data?.error || 'Erro ao criar carta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Carta - {buildingName}
          </DialogTitle>
          <DialogDescription>
            Crie uma nova carta para enviar aos condóminos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template (opcional)
            </Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
              disabled={loadingTemplates}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Selecione um template ou escreva manualmente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="member" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Destinatário
            </Label>
            <Select
              value={selectedMember}
              onValueChange={setSelectedMember}
              disabled={loadingMembers}
            >
              <SelectTrigger id="member">
                <SelectValue placeholder="Selecione um membro ou insira manualmente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Inserir manualmente</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} {member.apartment ? `- ${member.apartment}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Recipient Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">
                Nome do Destinatário *
              </Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nome completo"
                disabled={selectedMember !== '' && selectedMember !== 'manual'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email (opcional)
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={selectedMember !== '' && selectedMember !== 'manual'}
              />
            </div>
          </div>

          {/* Send Method */}
          <div className="space-y-2">
            <Label htmlFor="sendMethod">
              Método de Envio *
            </Label>
            <Select
              value={sendMethod}
              onValueChange={setSendMethod}
            >
              <SelectTrigger id="sendMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="correio_certificado">Correio Certificado</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="printed">Impresso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Assunto *
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto da carta"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Conteúdo *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Conteúdo da carta..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A criar...
              </>
            ) : (
              'Criar Carta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
