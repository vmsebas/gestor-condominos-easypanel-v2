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
    top: 15,
    right: 15,
    bottom: 15,
    left: 15
  },
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  lineHeight: 4.5,
  fontSize: {
    title: 16,
    subtitle: 12,
    heading: 11,
    body: 9,
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
   * Professional A4 format according to Portuguese law (Art. 1432º CC)
   */
  public generate(data: TemplateData): void {
    const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
    const assemblyNumber = data.convocatoria_number || '';

    // === PROFESSIONAL HEADER WITH BACKGROUND ===
    this.doc.setFillColor(245, 245, 245); // Light gray background
    this.doc.rect(this.margins.left - 5, this.currentY - 3, this.contentWidth + 10, 16, 'F');

    this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(PDF_CONFIG.colors.primary.r, PDF_CONFIG.colors.primary.g, PDF_CONFIG.colors.primary.b);
    this.doc.text(data.building_name || 'Condomínio', this.margins.left, this.currentY + 3);

    this.currentY += 7;
    this.doc.setFontSize(PDF_CONFIG.fontSize.small);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(PDF_CONFIG.colors.secondary.r, PDF_CONFIG.colors.secondary.g, PDF_CONFIG.colors.secondary.b);
    this.doc.text(data.building_address || '', this.margins.left, this.currentY + 3);

    this.currentY += 9;
    this.doc.setTextColor(PDF_CONFIG.colors.text.r, PDF_CONFIG.colors.text.g, PDF_CONFIG.colors.text.b);
    this.addSpacing(4);

    // === TITLE - CONVOCATÓRIA ===
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 50, 150); // Professional blue
    const titleWidth = this.doc.getTextWidth('CONVOCATÓRIA');
    this.doc.text('CONVOCATÓRIA', (this.pageWidth - titleWidth) / 2, this.currentY);
    this.addSpacing(5);

    // Subtitle with assembly type and number
    const subtitle = `${assemblyNumber}ª Assembleia Geral ${assemblyType} de Condóminos`;
    this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(PDF_CONFIG.colors.secondary.r, PDF_CONFIG.colors.secondary.g, PDF_CONFIG.colors.secondary.b);
    const subtitleWidth = this.doc.getTextWidth(subtitle);
    this.doc.text(subtitle, (this.pageWidth - subtitleWidth) / 2, this.currentY);
    this.addSpacing(8);

    // Reset to normal
    this.doc.setTextColor(PDF_CONFIG.colors.text.r, PDF_CONFIG.colors.text.g, PDF_CONFIG.colors.text.b);

    // === GREETING ===
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Exmos. Senhores Condóminos,', this.margins.left, this.currentY);
    this.addSpacing(6);

    // === LEGAL REFERENCE ===
    const legalText = `Nos termos do artigo 1432.º do Código Civil e do regime de propriedade horizontal, fica V. Exa. convocado(a) para participar na ${assemblyNumber}ª Assembleia Geral ${assemblyType} de Condóminos, que se realizará nas seguintes condições:`;
    const legalLines = this.doc.splitTextToSize(legalText, this.contentWidth);
    legalLines.forEach((line: string) => {
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });
    this.addSpacing(6);

    // === MEETING DETAILS BOX ===
    // Separator line
    this.doc.setDrawColor(PDF_CONFIG.colors.border.r, PDF_CONFIG.colors.border.g, PDF_CONFIG.colors.border.b);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
    this.addSpacing(4);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(PDF_CONFIG.fontSize.heading);
    this.doc.text('DATA E HORA DA ASSEMBLEIA', this.margins.left, this.currentY);
    this.addSpacing(5);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);
    const firstCallTime = data.first_call_time || data.meeting_time;
    const secondCallTime = data.second_call_time || '18h30';

    this.doc.text(`• 1ª Convocatória: ${data.meeting_date} às ${firstCallTime}`, this.margins.left + 5, this.currentY);
    this.addSpacing(4);
    this.doc.text(`• 2ª Convocatória: mesma data, às ${secondCallTime}`, this.margins.left + 5, this.currentY);
    this.addSpacing(5);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(PDF_CONFIG.fontSize.heading);
    this.doc.text('LOCAL DA REUNIÃO', this.margins.left, this.currentY);
    this.addSpacing(4);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);
    this.doc.text(data.location || 'Hall do Prédio', this.margins.left + 5, this.currentY);
    this.addSpacing(4);

    // Separator line
    this.doc.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
    this.addSpacing(6);

    // === ORDEM DE TRABALHOS ===
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(PDF_CONFIG.fontSize.heading);
    this.doc.text('ORDEM DE TRABALHOS', this.margins.left, this.currentY);
    this.addSpacing(5);

    if (data.agenda_items && data.agenda_items.length > 0) {
      this.doc.setFontSize(PDF_CONFIG.fontSize.body);
      data.agenda_items.forEach((item) => {
        this.doc.setFont('helvetica', 'bold');
        const itemText = `${item.item_number}. ${item.title}`;
        this.doc.text(itemText, this.margins.left, this.currentY);
        this.currentY += PDF_CONFIG.lineHeight;

        if (item.description) {
          this.doc.setFont('helvetica', 'normal');
          const descLines = this.doc.splitTextToSize(`   ${item.description}`, this.contentWidth - 5);
          descLines.forEach((line: string) => {
            this.doc.text(line, this.margins.left, this.currentY);
            this.currentY += PDF_CONFIG.lineHeight;
          });
        }
        this.addSpacing(2);
      });
    }
    this.addSpacing(6);

    // === QUÓRUM E MAIORIAS ===
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(PDF_CONFIG.fontSize.heading);
    this.doc.text('QUÓRUM E MAIORIAS', this.margins.left, this.currentY);
    this.addSpacing(4);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);
    const quorumText = `Em 1ª convocatória, é necessária a presença ou representação de condóminos que representem maioria do valor total do prédio. Na falta de quórum, realizar-se-á a 2ª convocatória, onde a assembleia deliberará com os condóminos presentes ou representados, desde que representem, no mínimo, um quarto (25%) do valor total do prédio, conforme Art. 1432.º, n.º 4 do Código Civil.`;
    const quorumLines = this.doc.splitTextToSize(quorumText, this.contentWidth);
    quorumLines.forEach((line: string) => {
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });
    this.addSpacing(6);

    // === NOTAS IMPORTANTES ===
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(PDF_CONFIG.fontSize.heading);
    this.doc.text('NOTAS IMPORTANTES', this.margins.left, this.currentY);
    this.addSpacing(4);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);

    const note1 = '• Os condóminos podem fazer-se representar por mandatário mediante procuração escrita (Art. 1431.º, n.º 3 do Código Civil).';
    const note1Lines = this.doc.splitTextToSize(note1, this.contentWidth);
    note1Lines.forEach((line: string) => {
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });
    this.addSpacing(3);

    const note2 = '• A presente convocatória é emitida em cumprimento do Art. 1432.º do Código Civil e do regime de propriedade horizontal.';
    const note2Lines = this.doc.splitTextToSize(note2, this.contentWidth);
    note2Lines.forEach((line: string) => {
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });
    this.addSpacing(3);

    const note3 = '• A participação de todos os condóminos é fundamental para a gestão do nosso património comum.';
    const note3Lines = this.doc.splitTextToSize(note3, this.contentWidth);
    note3Lines.forEach((line: string) => {
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });
    this.addSpacing(8);

    // Date and sender
    const date = new Date();
    const todayFormatted = formatDatePortuguese(date);
    const city = data.building_city || data.building_address?.split(',')[0] || 'Lisboa';

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);
    this.doc.text(`${city}, ${todayFormatted}`, this.margins.left, this.currentY);
    this.addSpacing(10);

    // Signature line (informative only - Art. 1432º CC does not require signature on convocatoria)
    this.doc.text('_________________________________________', this.margins.left + 20, this.currentY);
    this.addSpacing(4);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(PDF_CONFIG.fontSize.small);
    const senderName = data.sender_name || 'O Administrador';
    const senderNameWidth = this.doc.getTextWidth(senderName);
    this.doc.text(senderName, this.margins.left + 60 - (senderNameWidth / 2), this.currentY);
    this.addSpacing(3);
    const roleText = 'Administrador do Condomínio';
    const roleWidth = this.doc.getTextWidth(roleText);
    this.doc.text(roleText, this.margins.left + 60 - (roleWidth / 2), this.currentY);
    this.addSpacing(10);

    // === FOOTER - LEGAL INFORMATION ===
    // Separator line
    this.doc.setDrawColor(PDF_CONFIG.colors.border.r, PDF_CONFIG.colors.border.g, PDF_CONFIG.colors.border.b);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
    this.addSpacing(3);

    // Legal footer
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(PDF_CONFIG.colors.secondary.r, PDF_CONFIG.colors.secondary.g, PDF_CONFIG.colors.secondary.b);

    const footerLine1 = 'Convocatória elaborada em conformidade com o Art. 1432º do Código Civil Português e do Regime de Propriedade Horizontal.';
    const footerLine1Width = this.doc.getTextWidth(footerLine1);
    this.doc.text(footerLine1, (this.pageWidth - footerLine1Width) / 2, this.currentY);
    this.addSpacing(3);

    const footerLine2 = 'Este documento não necessita de reconhecimento notarial (Art. 1432º, n.º 1 do CC).';
    const footerLine2Width = this.doc.getTextWidth(footerLine2);
    this.doc.text(footerLine2, (this.pageWidth - footerLine2Width) / 2, this.currentY);
    this.addSpacing(4);

    // Generation date
    this.doc.setFontSize(6.5);
    const genDate = `Documento gerado em ${formatDatePortuguese(new Date())}`;
    const genDateWidth = this.doc.getTextWidth(genDate);
    this.doc.text(genDate, (this.pageWidth - genDateWidth) / 2, this.currentY);
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
