import React, { useState } from 'react';
import { GeneratedDocument } from '@/types/documentTypes';
import { formatDate } from '@/utils/formatters';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Mail, 
  Print, 
  Share, 
  FileText,
  Code,
  Info,
  X
} from 'lucide-react';

interface DocumentPreviewProps {
  document: GeneratedDocument;
  onDownload?: () => void;
  onClose?: () => void;
  className?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onDownload,
  onClose,
  className
}) => {
  const [showRawHtml, setShowRawHtml] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      generated: 'success',
      processing: 'warning',
      failed: 'destructive'
    } as const;
    
    const labels = {
      generated: 'Gerado',
      processing: 'Processando',
      failed: 'Erro'
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      arrears_letter: 'Carta de Morosidade',
      quota_certificate: 'Certificado de Quotas',
      receipt: 'Recibo',
      minutes_pdf: 'Ata em PDF',
      assembly_notice: 'Convocatória',
      financial_report: 'Relatório Financeiro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${document.title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px;
              color: #000;
              background: #fff;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${document.content}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: `Documento: ${document.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Erro ao partilhar:', error);
      }
    } else {
      // Fallback: copiar link para clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-xl font-bold">{document.title}</h1>
            {getStatusBadge(document.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {getDocumentTypeLabel(document.type)} • Gerado em {formatDate(document.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Print className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          
          {document.metadata?.recipientEmail && (
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Partilhar
          </Button>
          
          {onDownload && (
            <Button onClick={onDownload} disabled={document.status !== 'generated'}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="metadata">Metadados</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
        </TabsList>

        {/* Preview do Documento */}
        <TabsContent value="preview">
          <Card>
            <CardContent className="p-0">
              <div 
                className="bg-white text-black p-8 rounded-lg shadow-inner min-h-[600px]"
                style={{ 
                  background: 'white',
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.6'
                }}
                dangerouslySetInnerHTML={{ __html: document.content }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadados */}
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID do Documento</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{document.id}</code>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p className="font-medium">{getDocumentTypeLabel(document.type)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    {getStatusBadge(document.status)}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Template ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{document.templateId}</code>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Geração</p>
                    <p className="font-medium">{formatDate(document.createdAt)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                    <p className="font-medium">{formatDate(document.updatedAt)}</p>
                  </div>
                  
                  {document.metadata?.recipient && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Destinatário</p>
                      <p className="font-medium">{document.metadata.recipient}</p>
                    </div>
                  )}
                  
                  {document.metadata?.recipientEmail && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email do Destinatário</p>
                      <p className="font-medium">{document.metadata.recipientEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {document.metadata?.variables && Object.keys(document.metadata.variables).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Variáveis Utilizadas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(document.metadata.variables).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                          <code className="text-sm font-mono">{key}</code>
                          <span className="text-sm truncate ml-2" title={String(value)}>
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {document.metadata?.generatedBy && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gerado por</p>
                    <p className="font-medium">{document.metadata.generatedBy}</p>
                  </div>
                </>
              )}

              {document.metadata?.sendMethod && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Método de Envio</p>
                  <Badge variant="outline">
                    {document.metadata.sendMethod === 'email' ? 'Email' :
                     document.metadata.sendMethod === 'print' ? 'Impressão' : 'Download'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HTML Source */}
        <TabsContent value="html">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Código HTML
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(document.content)}
                >
                  Copiar HTML
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{document.content}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informações de Rodapé */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Documento #{document.id.split('-').pop()}
            </div>
            <div>
              Tamanho do conteúdo: {(document.content.length / 1024).toFixed(1)} KB
            </div>
            <div>
              {document.pdfUrl ? 'PDF disponível' : 'PDF não gerado'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentPreview;