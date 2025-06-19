import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Opções para a exportação PDF
 */
interface PDFExportOptions {
  filename?: string;
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

/**
 * Exportar conteúdo HTML para PDF
 */
export const exportHTMLToPDF = async (
  contentHtml: string,
  options: PDFExportOptions = {}
): Promise<Blob> => {
  try {
    // Criar um elemento temporário para renderizar o HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = contentHtml;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = '#ffffff';
    document.body.appendChild(tempContainer);
    
    // Opções por defeito
    const defaultOptions: PDFExportOptions = {
      filename: 'carta.pdf',
      pageSize: 'a4',
      orientation: 'portrait',
      margins: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    };
    
    // Misturar opções por defeito com as fornecidas
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      margins: {
        ...defaultOptions.margins,
        ...options.margins
      }
    };
    
    // Criar o canvas a partir do HTML
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // Maior escala para melhor qualidade
      useCORS: true, // Permitir imagens de outros domínios
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // Eliminar o elemento temporário
    document.body.removeChild(tempContainer);
    
    // Determinar o tamanho da página
    const pageWidth = mergedOptions.orientation === 'portrait' ? 210 : 297;
    const pageHeight = mergedOptions.orientation === 'portrait' ? 297 : 210;
    
    // Criar o documento PDF
    const pdf = new jsPDF({
      orientation: mergedOptions.orientation,
      unit: 'mm',
      format: mergedOptions.pageSize
    });
    
    // Calcular dimensões de imagem mantendo a proporção
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - (mergedOptions.margins?.left || 0) - (mergedOptions.margins?.right || 0);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Gerir documentos longos que podem precisar de múltiplas páginas
    let heightLeft = imgHeight;
    let position = 0;
    
    // Adicionar primeira página
    pdf.addImage(
      imgData,
      'PNG',
      mergedOptions.margins?.left || 0,
      mergedOptions.margins?.top || 0,
      imgWidth,
      imgHeight
    );
    
    // Se o conteúdo é mais alto que a página, adicionar páginas adicionais
    heightLeft -= pageHeight - (mergedOptions.margins?.top || 0) - (mergedOptions.margins?.bottom || 0);
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      
      // Adicionar nova página
      pdf.addPage();
      
      // Adicionar o resto da imagem na nova página
      pdf.addImage(
        imgData,
        'PNG',
        mergedOptions.margins?.left || 0,
        (mergedOptions.margins?.top || 0) + position,
        imgWidth,
        imgHeight
      );
      
      heightLeft -= pageHeight - (mergedOptions.margins?.top || 0) - (mergedOptions.margins?.bottom || 0);
    }
    
    // Converter o PDF para Blob
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw error;
  }
};

/**
 * Exportar múltiplos conteúdos HTML para um único PDF
 */
export const exportMultipleHTMLToPDF = async (
  contentsHtml: string[],
  options: PDFExportOptions = {}
): Promise<Blob> => {
  try {
    // Opções por defeito
    const defaultOptions: PDFExportOptions = {
      filename: 'cartas.pdf',
      pageSize: 'a4',
      orientation: 'portrait',
      margins: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    };
    
    // Misturar opções por defeito com as fornecidas
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      margins: {
        ...defaultOptions.margins,
        ...options.margins
      }
    };
    
    // Determinar o tamanho da página
    const pageWidth = mergedOptions.orientation === 'portrait' ? 210 : 297;
    
    // Criar o documento PDF
    const pdf = new jsPDF({
      orientation: mergedOptions.orientation,
      unit: 'mm',
      format: mergedOptions.pageSize
    });
    
    // Processar cada HTML e adicioná-lo ao PDF
    for (let i = 0; i < contentsHtml.length; i++) {
      // Se não é a primeira carta, adicionar uma nova página
      if (i > 0) {
        pdf.addPage();
      }
      
      // Criar um elemento temporário para renderizar o HTML
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = contentsHtml[i];
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempContainer);
      
      // Criar o canvas a partir do HTML
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // Maior escala para melhor qualidade
        useCORS: true, // Permitir imagens de outros domínios
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Eliminar o elemento temporário
      document.body.removeChild(tempContainer);
      
      // Calcular dimensões de imagem mantendo a proporção
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - (mergedOptions.margins?.left || 0) - (mergedOptions.margins?.right || 0);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Adicionar imagem ao PDF na página atual
      pdf.addImage(
        imgData,
        'PNG',
        mergedOptions.margins?.left || 0,
        mergedOptions.margins?.top || 0,
        imgWidth,
        imgHeight
      );
    }
    
    // Converter o PDF para Blob
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } catch (error) {
    console.error('Erro ao exportar múltiplos HTML para PDF:', error);
    throw error;
  }
};

/**
 * Guardar um Blob como ficheiro
 */
export const saveBlob = (blob: Blob, filename: string): void => {
  // Criar URL para o blob
  const url = window.URL.createObjectURL(blob);
  
  // Criar ligação para descarregar
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Simular clique para descarregar
  document.body.appendChild(link);
  link.click();
  
  // Limpar
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

export default {
  exportHTMLToPDF,
  exportMultipleHTMLToPDF,
  saveBlob
};