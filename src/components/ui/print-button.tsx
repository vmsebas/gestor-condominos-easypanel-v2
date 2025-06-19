import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  onClick?: () => void;
  contentSelector?: string;
  title?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const PrintButton: React.FC<PrintButtonProps> = ({ 
  onClick, 
  contentSelector = '.print-container',
  title = 'Imprimir Documento',
  variant = 'outline',
  size = 'default',
  className
}) => {
  const handlePrint = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Encontrar o elemento do container de impressão
    const printContent = document.querySelector(contentSelector);
    
    if (!printContent) {
      console.error('Conteúdo de impressão não encontrado com o seletor:', contentSelector);
      return;
    }
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Não foi possível abrir a janela de impressão');
      alert('Por favor, permita janelas pop-up para imprimir');
      return;
    }
    
    // Clonar conteúdo para manipular sem afetar o original
    const contentClone = printContent.cloneNode(true) as HTMLElement;
    
    // Remover quaisquer elementos com classe no-print
    const noPrintElements = contentClone.querySelectorAll('.no-print');
    noPrintElements.forEach(element => element.remove());
    
    // Obter todas as imagens para pré-carregamento
    const images = contentClone.querySelectorAll('img');
    const imageUrls = Array.from(images).map(img => img.src);
    
    // Adicionar estilos necessários à nova janela
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            /* Reset e estilos base */
            * {
              box-sizing: border-box;
            }
            
            html, body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              margin: 0;
              padding: 0;
              color: black;
              background: white;
            }
            
            /* Configurações específicas para PDF */
            @page {
              size: A4;
              margin: 20mm 15mm;
            }
            
            /* Tipografia */
            h1, h2, h3 {
              font-weight: bold;
              margin-top: 1em;
              margin-bottom: 0.5em;
              page-break-after: avoid;
            }
            
            h1 { font-size: 18pt; }
            h2 { font-size: 16pt; }
            h3 { font-size: 14pt; }
            p, li { font-size: 11pt; }
            
            /* Tabelas */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
              page-break-inside: avoid;
            }
            
            table, th, td {
              border: 1px solid #ddd;
            }
            
            th, td {
              padding: 8px;
              text-align: left;
            }
            
            thead {
              display: table-header-group;
            }
            
            /* Quebras de página */
            .page-break-before { 
              page-break-before: always; 
            }
            
            .page-break-after { 
              page-break-after: always; 
            }
            
            /* Evitar quebras de página dentro destes elementos */
            ul, ol, li, tr, img, .keep-together {
              page-break-inside: avoid;
            }
            
            /* Links */
            a {
              color: black;
              text-decoration: none;
            }
            
            /* Assinaturas */
            .signature-line {
              border-top: 1px solid black;
              margin-top: 70px;
              padding-top: 5px;
              width: 250px;
              margin-left: auto;
              margin-right: auto;
            }
            
            .signature-name {
              font-size: 10pt;
              text-align: center;
            }
            
            .signatures-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-top: 40px;
            }
            
            /* Estilo da caixa de assinatura */
            .signature-box {
              page-break-inside: avoid;
              margin-bottom: 25px;
            }
            
            .signature-box .border-b {
              border-bottom: 1px solid #999;
              min-height: 30px;
              margin-bottom: 4px;
            }
            
            /* Imagens */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 1em auto;
            }
            
            /* Rodapé e numeração de páginas */
            footer {
              position: fixed;
              bottom: 10mm;
              width: 100%;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
            
            .page-number:after {
              content: counter(page);
            }
            
            .page-count:before {
              content: counter(pages);
            }
            
            .page-number-container {
              text-align: center;
              margin-top: 20px;
              font-size: 10pt;
            }
            
            /* Ajustes específicos para impressão */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
              
              a[href]:after {
                content: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-document">
            ${contentClone.innerHTML}
          </div>
          <footer>
            <div class="page-number-container">
              <span>Página <span class="page-number"></span> de <span class="page-count"></span></span>
            </div>
          </footer>
        </body>
      </html>
    `);
    
    // Função para aguardar o carregamento das imagens
    const preloadImages = (urls: string[]): Promise<void[]> => {
      const promises = urls.map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Resolver mesmo com erro para continuar
          img.src = url;
        });
      });
      return Promise.all(promises);
    };
    
    // Fechar documento para terminar a escrita
    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar o carregamento do conteúdo e imagens antes de imprimir
    preloadImages(imageUrls).then(() => {
      setTimeout(() => {
        printWindow.print();
        
        // Fechar a janela após impressão
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      }, 500);
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={className}
      aria-label="Imprimir documento"
    >
      <Printer className="h-4 w-4 mr-2" />
      Imprimir
    </Button>
  );
};

export default PrintButton;