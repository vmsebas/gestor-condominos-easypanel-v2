/**
 * PDF Generator for Condominium Documents
 * Generates professional Portuguese legal documents
 * Uses jsPDF library for PDF creation
 */

import jsPDF from 'jspdf';
import { formatDatePortuguese, formatTimePortuguese, type TemplateData } from './communicationTemplates';

// Add PT font support if needed
// Note: jsPDF default supports Latin characters, but for special Portuguese characters
// we use 'helvetica' which has good PT support

/**
 * PDF Configuration Constants
 */
const PDF_CONFIG = {
  format: 'a4' as const,
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  lineHeight: 6,
  fontSize: {
    title: 16,
    subtitle: 14,
    heading: 12,
    body: 10,
    small: 8
  },
  colors: {
    primary: { r: 37, g: 99, b: 235 }, // Blue
    secondary: { r: 100, g: 116, b: 139 }, // Gray
    text: { r: 30, g: 30, b: 30 }, // Dark gray
    border: { r: 200, g: 200, b: 200 } // Light gray
  }
};

/**
 * Base PDF class with common utilities
 */
class BasePDFGenerator {
  protected doc: jsPDF;
  protected currentY: number;
  protected margins = PDF_CONFIG.margins;
  protected pageWidth = PDF_CONFIG.pageWidth;
  protected pageHeight = PDF_CONFIG.pageHeight;
  protected contentWidth: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: PDF_CONFIG.orientation,
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format
    });

    this.currentY = this.margins.top;
    this.contentWidth = this.pageWidth - this.margins.left - this.margins.right;
  }

  /**
   * Add header with building information
   */
  protected addHeader(buildingName: string, buildingAddress: string): void {
    const doc = this.doc;

    // Building name
    doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PDF_CONFIG.colors.primary.r, PDF_CONFIG.colors.primary.g, PDF_CONFIG.colors.primary.b);
    doc.text(buildingName, this.margins.left, this.currentY);

    this.currentY += 6;

    // Building address
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_CONFIG.colors.secondary.r, PDF_CONFIG.colors.secondary.g, PDF_CONFIG.colors.secondary.b);
    doc.text(buildingAddress, this.margins.left, this.currentY);

    this.currentY += 4;

    // Separator line
    doc.setDrawColor(PDF_CONFIG.colors.border.r, PDF_CONFIG.colors.border.g, PDF_CONFIG.colors.border.b);
    doc.setLineWidth(0.5);
    doc.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);

    this.currentY += 10;

    // Reset text color
    doc.setTextColor(PDF_CONFIG.colors.text.r, PDF_CONFIG.colors.text.g, PDF_CONFIG.colors.text.b);
  }

  /**
   * Add footer with page number and legal info
   */
  protected addFooter(pageNumber: number, totalPages: number, legalNote?: string): void {
    const doc = this.doc;
    const footerY = this.pageHeight - this.margins.bottom + 5;

    // Page number
    doc.setFontSize(PDF_CONFIG.fontSize.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(PDF_CONFIG.colors.secondary.r, PDF_CONFIG.colors.secondary.g, PDF_CONFIG.colors.secondary.b);
    const pageText = `Página ${pageNumber} de ${totalPages}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, this.pageWidth - this.margins.right - pageTextWidth, footerY);

    // Legal note if provided
    if (legalNote) {
      doc.setFontSize(PDF_CONFIG.fontSize.small);
      doc.text(legalNote, this.margins.left, footerY);
    }
  }

  /**
   * Add centered title
   */
  protected addTitle(title: string, fontSize: number = PDF_CONFIG.fontSize.title): void {
    const doc = this.doc;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    const titleWidth = doc.getTextWidth(title);
    const x = (this.pageWidth - titleWidth) / 2;

    doc.text(title, x, this.currentY);
    this.currentY += fontSize * 0.5;
  }

  /**
   * Add subtitle
   */
  protected addSubtitle(subtitle: string): void {
    const doc = this.doc;

    doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    doc.setFont('helvetica', 'bold');
    doc.text(subtitle, this.margins.left, this.currentY);
    this.currentY += 8;
  }

  /**
   * Add body text with word wrap
   */
  protected addText(text: string, fontSize: number = PDF_CONFIG.fontSize.body, bold: boolean = false): void {
    const doc = this.doc;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');

    const lines = doc.splitTextToSize(text, this.contentWidth);
    lines.forEach((line: string) => {
      this.checkPageBreak();
      doc.text(line, this.margins.left, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });
  }

  /**
   * Add spacing
   */
  protected addSpacing(mm: number = 5): void {
    this.currentY += mm;
  }

  /**
   * Check if page break is needed
   */
  protected checkPageBreak(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.margins.top;
    }
  }

  /**
   * Add box with content
   */
  protected addBox(content: string, backgroundColor?: { r: number; g: number; b: number }): void {
    const doc = this.doc;
    const padding = 5;
    const lines = doc.splitTextToSize(content, this.contentWidth - padding * 2);
    const boxHeight = lines.length * PDF_CONFIG.lineHeight + padding * 2;

    this.checkPageBreak(boxHeight + 10);

    // Draw background if provided
    if (backgroundColor) {
      doc.setFillColor(backgroundColor.r, backgroundColor.g, backgroundColor.b);
      doc.rect(this.margins.left, this.currentY, this.contentWidth, boxHeight, 'F');
    }

    // Draw border
    doc.setDrawColor(PDF_CONFIG.colors.border.r, PDF_CONFIG.colors.border.g, PDF_CONFIG.colors.border.b);
    doc.setLineWidth(0.5);
    doc.rect(this.margins.left, this.currentY, this.contentWidth, boxHeight);

    // Add text
    this.currentY += padding + 4;
    doc.setFontSize(PDF_CONFIG.fontSize.body);
    doc.setFont('helvetica', 'normal');
    lines.forEach((line: string) => {
      doc.text(line, this.margins.left + padding, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });

    this.currentY += padding;
  }

  /**
   * Generate and download PDF
   */
  public download(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Get PDF as blob
   */
  public getBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Get PDF as base64
   */
  public getBase64(): string {
    return this.doc.output('datauristring');
  }
}

/**
 * Convocatória PDF Generator
 */
export class ConvocatoriaPDFGenerator extends BasePDFGenerator {
  /**
   * Generate complete convocatória PDF
   */
  public generate(data: TemplateData): void {
    const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
    const assemblyTypeFull = `Assembleia ${assemblyType} de Condóminos`;

    // Header
    this.addHeader(data.building_name, data.building_address);

    // Title
    this.addTitle('CONVOCATÓRIA');
    this.addSpacing(3);
    this.addTitle(assemblyTypeFull.toUpperCase(), PDF_CONFIG.fontSize.subtitle);
    this.addSpacing(10);

    // Convocatória number if available
    if (data.convocatoria_number) {
      this.doc.setFontSize(PDF_CONFIG.fontSize.body);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Convocatória n.º ${data.convocatoria_number}`, this.margins.left, this.currentY);
      this.addSpacing(8);
    }

    // Legal reference
    this.addText(
      'Nos termos e para os efeitos do disposto nos artigos 1432.º e seguintes do Código Civil, ' +
      'convocam-se todos os condóminos do edifício acima identificado para a assembleia com a seguinte ordem de trabalhos:',
      PDF_CONFIG.fontSize.body
    );
    this.addSpacing(8);

    // Meeting details box
    const firstCallTime = data.first_call_time || data.meeting_time;
    const secondCallTime = data.second_call_time || 'meia hora depois';

    const meetingDetails = `DATA: ${data.meeting_date}\n\n` +
      `HORA (1ª Convocatória): ${firstCallTime}\n` +
      `(É necessário quórum de mais de 50% dos coeficientes)\n\n` +
      `HORA (2ª Convocatória): ${secondCallTime}\n` +
      `(É necessário quórum de mais de 25% dos coeficientes)\n\n` +
      `LOCAL: ${data.location}`;

    this.addBox(meetingDetails, { r: 245, g: 247, b: 250 });
    this.addSpacing(10);

    // Ordem do Dia
    this.addSubtitle('ORDEM DO DIA');
    this.addSpacing(3);

    if (data.agenda_items && data.agenda_items.length > 0) {
      data.agenda_items.forEach((item) => {
        this.checkPageBreak(15);

        // Item number and title
        this.doc.setFontSize(PDF_CONFIG.fontSize.body);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${item.item_number}. ${item.title}`, this.margins.left, this.currentY);
        this.currentY += PDF_CONFIG.lineHeight;

        // Item description if available
        if (item.description) {
          this.doc.setFont('helvetica', 'normal');
          const descLines = this.doc.splitTextToSize(item.description, this.contentWidth - 10);
          descLines.forEach((line: string) => {
            this.doc.text(line, this.margins.left + 5, this.currentY);
            this.currentY += PDF_CONFIG.lineHeight;
          });
        }

        this.addSpacing(5);
      });
    } else {
      this.addText('(Consultar convocatória ou administração)', PDF_CONFIG.fontSize.body);
    }

    this.addSpacing(10);

    // Important information box
    this.addSubtitle('INFORMAÇÕES IMPORTANTES');
    this.addSpacing(3);

    const importantInfo =
      '• Caso não possa comparecer, poderá fazer-se representar por qualquer pessoa, mediante procuração escrita (Art. 1433.º do Código Civil).\n\n' +
      '• A procuração deve ser apresentada no início da assembleia.\n\n' +
      '• A sua presença ou representação é muito importante para a boa gestão do condomínio.\n\n' +
      '• As deliberações são tomadas por maioria, salvo disposição legal em contrário.';

    this.addBox(importantInfo);
    this.addSpacing(15);

    // Signature section
    this.checkPageBreak(40);

    const date = new Date();
    const todayFormatted = formatDatePortuguese(date);

    this.addText(`${data.building_address}, ${todayFormatted}`, PDF_CONFIG.fontSize.body);
    this.addSpacing(15);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.sender_name || 'A Administração', this.margins.left, this.currentY);
    this.currentY += PDF_CONFIG.lineHeight;
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.sender_role || 'Administrador do Condomínio', this.margins.left, this.currentY);

    if (data.sender_email || data.sender_phone) {
      this.currentY += PDF_CONFIG.lineHeight * 2;
      if (data.sender_email) {
        this.doc.text(`Email: ${data.sender_email}`, this.margins.left, this.currentY);
        this.currentY += PDF_CONFIG.lineHeight;
      }
      if (data.sender_phone) {
        this.doc.text(`Telefone: ${data.sender_phone}`, this.margins.left, this.currentY);
      }
    }

    // Footer
    this.addFooter(1, 1, 'Documento gerado eletronicamente - Válido sem assinatura');
  }
}

/**
 * Acta PDF Generator
 */
export class ActaPDFGenerator extends BasePDFGenerator {
  /**
   * Generate complete acta PDF
   */
  public generate(data: any): void {
    const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';

    // Header
    this.addHeader(data.building_name, data.building_address);

    // Title
    this.addTitle(`ACTA N.º ${data.minute_number || 'XX'}`);
    this.addSpacing(3);
    this.addTitle(`ASSEMBLEIA ${assemblyType.toUpperCase()} DE CONDÓMINOS`, PDF_CONFIG.fontSize.subtitle);
    this.addSpacing(10);

    // Opening paragraph
    const meetingDate = data.meeting_date ? formatDatePortuguese(data.meeting_date) : 'data não especificada';
    const openingText = `Aos ${meetingDate}, pelas ${data.meeting_time || 'hora não especificada'}, em ${data.location || 'local não especificado'}, reuniram-se os condóminos do edifício "${data.building_name}", em Assembleia ${assemblyType}, devidamente convocados nos termos legais.`;

    this.addText(openingText, PDF_CONFIG.fontSize.body);
    this.addSpacing(8);

    // Quorum section
    this.addSubtitle('Verificação de Quórum');
    const quorum = data.quorum || {};
    const quorumText = `Verificou-se a presença de ${quorum.presentCount || 0} condóminos presentes` +
      (quorum.representedCount > 0 ? ` e ${quorum.representedCount} representados` : '') +
      `, que representam ${quorum.percentage || 0}% do capital social (${quorum.presentPermilage || 0}‰ de um total de ${quorum.totalPermilage || 0}‰).`;

    this.addText(quorumText, PDF_CONFIG.fontSize.body);

    const quorumValidation = quorum.isFirstCallValid
      ? '✓ Quórum válido para primeira convocatória (superior a 50% dos coeficientes).'
      : quorum.isSecondCallValid
      ? '✓ Quórum válido para segunda convocatória (superior a 25% dos coeficientes).'
      : '✗ Quórum insuficiente.';

    this.addText(quorumValidation, PDF_CONFIG.fontSize.body, true);
    this.addSpacing(8);

    // Mesa section
    this.addSubtitle('Mesa da Assembleia');
    this.addText(
      `Foi eleita a seguinte mesa: Presidente: ${data.president_name || 'A definir'} e Secretário: ${data.secretary_name || 'A definir'}.`,
      PDF_CONFIG.fontSize.body
    );
    this.addSpacing(8);

    // Agenda items and decisions
    this.addSubtitle('Ordem do Dia e Deliberações');
    const agendaItems = data.agenda_items || [];

    if (agendaItems.length > 0) {
      agendaItems.forEach((item: any) => {
        this.checkPageBreak(25);

        // Item title
        this.doc.setFontSize(PDF_CONFIG.fontSize.body);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`Ponto ${item.item_number}: ${item.title}`, this.margins.left, this.currentY);
        this.currentY += PDF_CONFIG.lineHeight;

        // Description
        if (item.description) {
          this.doc.setFont('helvetica', 'normal');
          this.addText(item.description, PDF_CONFIG.fontSize.small);
        }

        // Discussion
        if (item.discussion) {
          this.doc.setFont('helvetica', 'italic');
          this.addText(`Discussão: ${item.discussion}`, PDF_CONFIG.fontSize.small);
        }

        // Voting results
        this.doc.setFont('helvetica', 'normal');
        const votingText = `Votos a favor: ${item.votes_in_favor || 0} | Votos contra: ${item.votes_against || 0} | Abstenções: ${item.abstentions || 0}`;
        this.addText(votingText, PDF_CONFIG.fontSize.small);

        // Decision
        if (item.decision) {
          this.doc.setFont('helvetica', 'bold');
          this.addText(`Decisão: ${item.decision}`, PDF_CONFIG.fontSize.body);
        }

        this.addSpacing(6);
      });
    }

    // Closing
    this.addSpacing(10);
    this.addText(
      `Nada mais havendo a tratar, foi encerrada a sessão pelas ${data.closing_time || 'A definir'}, da qual se lavrou a presente acta que vai ser assinada pelo Presidente e Secretário da mesa.`,
      PDF_CONFIG.fontSize.body
    );
    this.addSpacing(20);

    // Signatures
    this.checkPageBreak(50);
    const signatureWidth = (this.contentWidth - 20) / 2;

    // President signature
    this.doc.line(this.margins.left, this.currentY, this.margins.left + signatureWidth, this.currentY);
    this.currentY += 5;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.president_name || 'Presidente da Mesa', this.margins.left, this.currentY);
    this.currentY += 4;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(PDF_CONFIG.fontSize.small);
    this.doc.text('Presidente da Mesa', this.margins.left, this.currentY);

    // Secretary signature (same line, right side)
    const secretaryX = this.margins.left + signatureWidth + 20;
    this.doc.line(secretaryX, this.currentY - 9, secretaryX + signatureWidth, this.currentY - 9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);
    this.doc.text(data.secretary_name || 'Secretário da Mesa', secretaryX, this.currentY - 4);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(PDF_CONFIG.fontSize.small);
    this.doc.text('Secretário da Mesa', secretaryX, this.currentY);

    // Footer
    this.addFooter(1, 1, 'Documento oficial - Assinado eletronicamente');
  }
}

/**
 * Quota (Receipt) PDF Generator
 */
export class QuotaPDFGenerator extends BasePDFGenerator {
  public generate(data: TemplateData): void {
    // Header
    this.addHeader(data.building_name, data.building_address);

    // Title
    this.addTitle('RECIBO DE QUOTA');
    this.addSpacing(3);
    this.addTitle(data.quota_month || 'MENSALIDADE', PDF_CONFIG.fontSize.subtitle);
    this.addSpacing(10);

    // Member information
    this.addSubtitle('Condómino');
    this.addText(`Nome: ${data.member_name}`, PDF_CONFIG.fontSize.body);
    if (data.member_apartment) {
      this.addText(`Fração: ${data.member_apartment}`, PDF_CONFIG.fontSize.body);
    }
    this.addSpacing(8);

    // Payment details
    this.addSubtitle('Detalhes do Pagamento');
    const amount = data.quota_amount ? `€${data.quota_amount.toFixed(2)}` : '[valor]';
    this.addText(`Valor: ${amount}`, PDF_CONFIG.fontSize.body, true);
    this.addText(`Vencimento: ${data.quota_due_date || '[data]'}`, PDF_CONFIG.fontSize.body);
    if (data.payment_reference) {
      this.addText(`Referência MB: ${data.payment_reference}`, PDF_CONFIG.fontSize.body);
    }
    this.addSpacing(10);

    // Bank details box
    this.addBox(
      'DADOS BANCÁRIOS\n\n' +
      'IBAN: PT50...\n' +
      `Titular: ${data.building_name}\n\n` +
      `Referência: ${data.member_apartment || '[fração]'}`
    );

    // Footer
    this.addFooter(1, 1, `Emitido em ${formatDatePortuguese(new Date())}`);
  }
}

/**
 * Export PDF Generator Functions
 */
export const generateConvocatoriaPDF = (data: TemplateData, download: boolean = true): Blob | void => {
  const generator = new ConvocatoriaPDFGenerator();
  generator.generate(data);

  if (download) {
    const filename = `Convocatoria_${data.building_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    generator.download(filename);
  } else {
    return generator.getBlob();
  }
};

export const generateActaPDF = (data: any, download: boolean = true): Blob | void => {
  const generator = new ActaPDFGenerator();
  generator.generate(data);

  if (download) {
    const filename = `Acta_${data.minute_number || 'XX'}_${data.building_name.replace(/\s+/g, '_')}.pdf`;
    generator.download(filename);
  } else {
    return generator.getBlob();
  }
};

export const generateQuotaPDF = (data: TemplateData, download: boolean = true): Blob | void => {
  const generator = new QuotaPDFGenerator();
  generator.generate(data);

  if (download) {
    const filename = `Quota_${data.member_name.replace(/\s+/g, '_')}_${data.quota_month?.replace(/\s+/g, '_') || 'Mensalidade'}.pdf`;
    generator.download(filename);
  } else {
    return generator.getBlob();
  }
};
