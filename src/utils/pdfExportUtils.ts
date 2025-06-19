import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exporta o conteúdo de um elemento HTML para um ficheiro PDF com melhor qualidade e gestão de estilos
 * @param elementId ID do elemento HTML que contém a ata
 * @param fileName Nome do ficheiro PDF a gerar
 */
export const exportToPdfEnhanced = async (elementId: string, fileName: string): Promise<void> => {
  try {
    // Obter o elemento a exportar
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento não encontrado: ${elementId}`);
    }

    console.log('A iniciar exportação melhorada para PDF...', {elementId});
    
    // Criar uma cópia do elemento para o manipular sem afetar a UI
    const tempElement = element.cloneNode(true) as HTMLElement;
    tempElement.id = 'temp-pdf-element';
    document.body.appendChild(tempElement);
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    tempElement.style.width = '800px';
    tempElement.style.backgroundColor = '#ffffff';
    
    // Limpar qualquer ID duplicado no clone para evitar conflitos
    const elementsWithIds = tempElement.querySelectorAll('[id]');
    elementsWithIds.forEach((el) => {
      const originalId = el.id;
      if (originalId !== 'temp-pdf-element') {
        el.id = `temp-${originalId}`;
      }
    });
    
    // Aplicar estilos para melhorar a visualização no PDF
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .a4-page-wrapper, .border, .shadow-lg {
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .a4-page-number, .page-break-marker, .add-page-break-button {
        display: none !important;
      }
      .a4-page {
        background-color: white !important;
        color: black !important;
      }
    `;
    tempElement.appendChild(styleElement);
    
    // Criar um novo documento PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Definir margens (em mm)
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 20;
    
    // Capturar todo o conteúdo com maior qualidade
    console.log('A iniciar captura com html2canvas...');
    const canvas = await html2canvas(tempElement, {
      scale: 1.5, // Escala reduzida para evitar problemas de memória
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0, // Sem timeout para imagens
      allowTaint: true, // Permitir imagens de outros domínios
      onclone: (clonedDoc) => {
        // Garantir que todos os elementos de estilo se aplicam corretamente no clone
        const clonedElement = clonedDoc.getElementById('temp-pdf-element');
        if (clonedElement) {
          // Aplicar estilos adicionais para melhorar a visualização
          clonedElement.querySelectorAll('.a4-page-wrapper').forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.boxShadow = 'none';
            htmlEl.style.border = 'none';
            htmlEl.style.margin = '0';
            htmlEl.style.padding = '0';
          });
          
          // Ocultar elementos que não devem aparecer no PDF
          clonedElement.querySelectorAll('.a4-page-number, .page-break-marker, .add-page-break-button').forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.display = 'none';
          });
        }
      }
    });
    
    // Converter o canvas para imagem com melhor qualidade
    console.log('A converter canvas para imagem...');
    const imgData = canvas.toDataURL('image/png', 0.95); // Usar PNG com alta qualidade para melhor compatibilidade
    const imgProps = pdf.getImageProperties(imgData);
    
    // Calcular dimensões para manter a proporção
    const pdfWidth = pdf.internal.pageSize.getWidth() - marginLeft - marginRight;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Dividir em páginas se necessário
    const pageHeight = pdf.internal.pageSize.getHeight() - marginTop - marginBottom;
    const totalPages = Math.ceil(pdfHeight / pageHeight);
    
    // Para cada página, adicionar a parte correspondente da imagem
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      // Calcular que parte da imagem mostrar nesta página
      const srcY = i * pageHeight * (imgProps.width / pdfWidth);
      const srcHeight = Math.min(
        pageHeight * (imgProps.width / pdfWidth),
        imgProps.height - srcY
      );
      
      // Adicionar a parte da imagem à página atual
      pdf.addImage(
        imgData,
        'JPEG',
        marginLeft,
        marginTop,
        pdfWidth,
        Math.min(pageHeight, (srcHeight * pdfWidth) / imgProps.width),
        undefined,
        'FAST' // Usar o algoritmo mais rápido para evitar problemas de memória
      );
      
      // Adicionar número de página
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Página ${i + 1} de ${totalPages}`,
        pdf.internal.pageSize.getWidth() - marginRight - 30,
        pdf.internal.pageSize.getHeight() - 10
      );
    }
    
    // Limpar o elemento temporário
    document.body.removeChild(tempElement);
    
    // Guardar o PDF
    pdf.save(`${fileName}.pdf`);
    console.log('PDF exportado corretamente');
  } catch (error) {
    // Capturar detalhes específicos do erro
    let errorMessage = 'Erro desconhecido durante a exportação para PDF';
    
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
      console.error('Erro ao exportar para PDF:', { 
        name: error.name, 
        message: error.message, 
        stack: error.stack 
      });
    } else {
      console.error('Erro não padrão ao exportar para PDF:', JSON.stringify(error, null, 2));
    }
    
    // Limpar recursos em caso de erro
    const tempElements = document.querySelectorAll('div[style*="position: absolute"][style*="left: -9999px"]');
    tempElements.forEach(el => {
      if (el.parentNode) {
        try {
          el.parentNode.removeChild(el);
        } catch (cleanupError) {
          console.warn('Erro ao limpar elemento temporário:', cleanupError);
        }
      }
    });
    
    // Mostrar alerta com detalhes do erro
    alert(`Erro ao exportar para PDF: ${errorMessage}`);
    
    // Propagar o erro para que possa ser gerido pelo componente
    throw new Error(errorMessage);
  }
};