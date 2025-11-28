import jsPDF from 'jspdf';

interface LetterData {
  buildingName: string;
  buildingAddress?: string;
  memberName: string;
  memberApartment: string;
  subject: string;
  content: string;
  date: string;
}

/**
 * Gera um PDF profissional para uma carta aos condóminos
 * Formato A4 com cabeçalho, corpo e rodapé
 */
export function generateLetterPDF(data: LetterData, download: boolean = true): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let y = margin;

  // Helper function para adicionar nova página se necessário
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper function para adicionar texto com quebra de linha
  const addText = (text: string, x: number, fontSize: number = 11, maxWidth?: number, lineHeight: number = 1.5) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth || contentWidth);
    const totalHeight = lines.length * fontSize * 0.35 * lineHeight;

    checkPageBreak(totalHeight + 5);

    lines.forEach((line: string) => {
      doc.text(line, x, y);
      y += fontSize * 0.35 * lineHeight;
    });

    return totalHeight;
  };

  // ==================== CABEÇALHO ====================
  // Nome do edifício (centro, negrito, grande)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  const buildingNameWidth = doc.getTextWidth(data.buildingName);
  doc.text(data.buildingName, (pageWidth - buildingNameWidth) / 2, y);
  y += 8;

  // Morada do edifício (centro, normal, pequeno)
  if (data.buildingAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const addressWidth = doc.getTextWidth(data.buildingAddress);
    doc.text(data.buildingAddress, (pageWidth - addressWidth) / 2, y);
    y += 7;
  }

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ==================== DATA ====================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const dateWidth = doc.getTextWidth(data.date);
  doc.text(data.date, pageWidth - margin - dateWidth, y);
  y += 15;

  // ==================== DESTINATÁRIO ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text('Exmo(a). Sr(a).',  margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(data.memberName, margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fração ${data.memberApartment}`, margin, y);
  y += 15;

  // ==================== ASSUNTO ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Assunto:', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const subjectLines = doc.splitTextToSize(data.subject, contentWidth - 10);
  subjectLines.forEach((line: string) => {
    checkPageBreak(10);
    doc.text(line, margin, y);
    y += 5;
  });
  y += 10;

  // ==================== CONTEÚDO ====================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);

  // Processar conteúdo parágrafo por parágrafo
  const paragraphs = data.content.split('\n\n');

  paragraphs.forEach((paragraph, index) => {
    if (!paragraph.trim()) return;

    const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);

    lines.forEach((line: string) => {
      checkPageBreak(10);
      doc.text(line, margin, y);
      y += 5.5;
    });

    // Espaço entre parágrafos
    if (index < paragraphs.length - 1) {
      y += 4;
    }
  });

  y += 20;

  // ==================== SAUDAÇÃO FINAL ====================
  checkPageBreak(20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Com os melhores cumprimentos,', margin, y);
  y += 20;

  // ==================== ASSINATURA ====================
  // Linha para assinatura
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, y, margin + 80, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Administração do Condomínio', margin, y);
  y += 4;
  doc.text(data.buildingName, margin, y);

  // ==================== RODAPÉ ====================
  // Linha decorativa no fundo de cada página
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linha
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Texto legal (centro)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    const legalText = 'Comunicação nos termos do Código Civil Português (Art. 1430.º)';
    const legalTextWidth = doc.getTextWidth(legalText);
    doc.text(legalText, (pageWidth - legalTextWidth) / 2, pageHeight - 10);

    // Data de geração (direita)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const generatedText = `Documento gerado em ${new Date().toLocaleDateString('pt-PT')}`;
    const generatedWidth = doc.getTextWidth(generatedText);
    doc.text(generatedText, pageWidth - margin - generatedWidth, pageHeight - 6);

    // Número da página (esquerda)
    doc.text(`Página ${i} de ${totalPages}`, margin, pageHeight - 6);
  }

  // ==================== DOWNLOAD/RETURN ====================
  if (download) {
    const fileName = `carta_${data.memberName.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }

  return doc.output('blob');
}

/**
 * Gera PDF para múltiplos destinatários (batch)
 * Retorna um array de blobs
 */
export async function generateLetterPDFBatch(
  baseData: Omit<LetterData, 'memberName' | 'memberApartment'>,
  recipients: Array<{ memberName: string; memberApartment: string }>
): Promise<Blob[]> {
  const pdfs: Blob[] = [];

  for (const recipient of recipients) {
    const letterData: LetterData = {
      ...baseData,
      memberName: recipient.memberName,
      memberApartment: recipient.memberApartment
    };

    const blob = generateLetterPDF(letterData, false);
    pdfs.push(blob);

    // Pequeno delay para não sobrecarregar o browser
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return pdfs;
}

/**
 * Gera um PDF combinado com todas as cartas (para impressão batch)
 */
export function generateCombinedLettersPDF(
  baseData: Omit<LetterData, 'memberName' | 'memberApartment'>,
  recipients: Array<{ memberName: string; memberApartment: string }>,
  download: boolean = true
): Blob {
  const doc = new jsPDF();

  recipients.forEach((recipient, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const letterData: LetterData = {
      ...baseData,
      memberName: recipient.memberName,
      memberApartment: recipient.memberApartment
    };

    // Gerar cada carta no documento combinado
    // Nota: Esta é uma versão simplificada - em produção seria melhor
    // chamar generateLetterPDF e combinar os PDFs
    const y = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(letterData.buildingName, 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Para: ${letterData.memberName} - Fração ${letterData.memberApartment}`, 20, y + 15);
    doc.text(`Assunto: ${letterData.subject}`, 20, y + 25);

    const contentLines = doc.splitTextToSize(letterData.content, 170);
    doc.text(contentLines, 20, y + 40);
  });

  if (download) {
    const fileName = `cartas_multiplas_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }

  return doc.output('blob');
}
