/**
 * Email Preview Dialog - IMPROVED UX
 * Shows formatted email before sending with clear visual hierarchy and better usability
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Mail,
  Copy,
  CheckCircle,
  Download,
  Building2,
  User,
  Calendar,
  FileText,
  ChevronDown
} from 'lucide-react';

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  recipientEmail: string;
  recipientName: string;
  recipientFraction?: string;
  buildingName?: string;
  buildingAddress?: string;
  assemblyDate?: string;
  assemblyType?: string;
  communicationType?: 'convocatoria' | 'acta' | 'quota' | 'note';
  onSendConfirm?: () => void;
  onDownloadPDF?: () => void;
  onDownloadProcuracao?: () => void;
}

const EmailPreviewDialog: React.FC<EmailPreviewDialogProps> = ({
  open,
  onOpenChange,
  subject,
  body,
  recipientEmail,
  recipientName,
  recipientFraction,
  buildingName,
  buildingAddress,
  assemblyDate,
  assemblyType,
  communicationType = 'convocatoria',
  onSendConfirm,
  onDownloadPDF,
  onDownloadProcuracao
}) => {
  const [copied, setCopied] = useState(false);

  // Get document name based on communication type
  const getDocumentName = () => {
    switch (communicationType) {
      case 'acta':
        return 'Acta da Assembleia';
      case 'convocatoria':
        return 'Convocatória';
      case 'quota':
        return 'Aviso de Quota';
      case 'note':
        return 'Nota Informativa';
      default:
        return 'Documento';
    }
  };

  // Copy email content to clipboard
  const copyToClipboard = async () => {
    const fullEmail = `Para: ${recipientEmail}\nAssunto: ${subject}\n\n${body}`;

    try {
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      toast.success('Email copiado para a área de transferência');

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Erro ao copiar email');
    }
  };

  // Send via mailto:
  const sendViaMailto = () => {
    onSendConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        {/* Header with context */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">Preview do Email</DialogTitle>
              <DialogDescription className="text-base">
                Verifique o conteúdo antes de enviar
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Badge>
          </div>

          {/* Context cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Recipient info */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Destinatário</p>
                <p className="font-semibold truncate">{recipientName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground truncate">{recipientEmail}</p>
                  {recipientFraction && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="secondary" className="text-xs">
                        Fração {recipientFraction}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Building/Assembly info */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="p-2 rounded-full bg-blue-500/10">
                {assemblyDate ? (
                  <Calendar className="h-4 w-4 text-blue-600" />
                ) : (
                  <Building2 className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {assemblyDate ? 'Assembleia' : 'Edifício'}
                </p>
                <p className="font-semibold truncate">
                  {buildingName || 'Sem nome'}
                </p>
                {assemblyDate && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">{assemblyDate}</p>
                    {assemblyType && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="secondary" className="text-xs">
                          {assemblyType === 'ordinary' ? 'Ordinária' : 'Extraordinária'}
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Email metadata */}
        <div className="px-6 py-3 bg-muted/20 border-y">
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold text-muted-foreground min-w-[70px]">Para:</span>
              <span className="text-sm flex-1">{recipientEmail}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold text-muted-foreground min-w-[70px]">Assunto:</span>
              <span className="text-sm font-medium flex-1">{subject}</span>
            </div>
          </div>
        </div>

        {/* Email body with clear scroll indicator */}
        <div className="flex-1 overflow-hidden px-6 pb-4 relative">
          <div className="h-full border rounded-lg overflow-hidden bg-background relative">
            <ScrollArea className="h-full">
              <div className="p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {body}
                </pre>
              </div>
            </ScrollArea>

            {/* Scroll indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none flex items-end justify-center pb-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1 animate-bounce">
                <ChevronDown className="h-3 w-3" />
                Scroll para ver mais
              </div>
            </div>
          </div>
        </div>

        {/* Attachments section */}
        {(onDownloadPDF || onDownloadProcuracao) && (
          <>
            <Separator />
            <div className="px-6 py-4 space-y-3 bg-muted/10">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Anexos para download</p>
                <Badge variant="outline" className="text-xs">
                  {[onDownloadPDF, onDownloadProcuracao].filter(Boolean).length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {onDownloadPDF && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownloadPDF}
                    className="justify-start h-auto py-3"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded bg-red-50 dark:bg-red-950">
                        <Download className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{getDocumentName()}</p>
                        <p className="text-xs text-muted-foreground">Documento PDF</p>
                      </div>
                    </div>
                  </Button>
                )}
                {onDownloadProcuracao && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownloadProcuracao}
                    className="justify-start h-auto py-3"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 rounded bg-blue-50 dark:bg-blue-950">
                        <Download className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">Modelo de Procuração</p>
                        <p className="text-xs text-muted-foreground">Documento PDF</p>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3">
                <div className="text-amber-600 dark:text-amber-500 mt-0.5">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>Nota:</strong> mailto: não suporta anexos automáticos. Faça download dos PDFs e anexe-os manualmente no seu cliente de email.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer actions */}
        <Separator />
        <DialogFooter className="px-6 py-4 bg-muted/5">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex-1 sm:flex-none"
              >
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                size="sm"
              >
                Cancelar
              </Button>
            </div>

            <Button
              onClick={sendViaMailto}
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              size="sm"
            >
              <Mail className="mr-2 h-4 w-4" />
              Abrir no Email
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewDialog;
