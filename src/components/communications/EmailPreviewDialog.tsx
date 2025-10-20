/**
 * Email Preview Dialog
 * Shows formatted email before sending with options to copy or send
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Mail, Copy, CheckCircle, Download } from 'lucide-react';

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
  onSendConfirm,
  onDownloadPDF,
  onDownloadProcuracao
}) => {
  const [copied, setCopied] = useState(false);

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

  // Download as .txt file
  const downloadAsText = () => {
    const fullEmail = `Para: ${recipientEmail}\nAssunto: ${subject}\n\n${body}`;
    const blob = new Blob([fullEmail], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_${recipientName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Email exportado para ficheiro');
  };

  // Send via mailto:
  const sendViaMailto = () => {
    onSendConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview do Email</DialogTitle>
          <DialogDescription>
            Verifique o conteúdo antes de enviar para <strong>{recipientName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Email preview */}
        <div className="flex-1 overflow-hidden border rounded-lg bg-muted/20">
          <div className="p-4 border-b bg-background space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-muted-foreground">Para:</span>
              <span>{recipientEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-muted-foreground">Assunto:</span>
              <span className="font-medium">{subject}</span>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="p-6 bg-white dark:bg-gray-900">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {body}
              </pre>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-3">
          {/* Attachments section */}
          <div className="flex flex-col gap-2 w-full border-t pt-3">
            <p className="text-sm text-muted-foreground font-medium">
              Documentos para anexar manualmente:
            </p>
            <div className="flex gap-2 flex-wrap">
              {onDownloadPDF && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadPDF}
                  className="bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <Download className="mr-2 h-4 w-4 text-red-600" />
                  Convocatória (PDF)
                </Button>
              )}
              {onDownloadProcuracao && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadProcuracao}
                  className="bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Download className="mr-2 h-4 w-4 text-blue-600" />
                  Modelo de Procuração (PDF)
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Nota: mailto: não suporta anexos automáticos. Descarregue os PDFs e anexe-os manualmente no seu cliente de email.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full justify-between border-t pt-3">
            <div className="flex gap-2">
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
                    Copiar Texto
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAsText}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar .txt
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={sendViaMailto}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                Abrir no Email
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewDialog;
