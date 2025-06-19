import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ConvocatoriaData {
  // Datos del edificio
  buildingName: string;
  buildingAddress: string;
  postalCode: string;
  city: string;
  
  // Datos de la convocatoria
  assemblyNumber: string;
  assemblyType: 'ordinaria' | 'extraordinaria';
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  
  // Segunda convocatoria
  secondCallEnabled: boolean;
  secondCallDate?: string;
  secondCallTime?: string;
  
  // Responsables
  administrator: string;
  secretary?: string;
  
  // Agenda
  agendaItems: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    votingRequired: boolean;
  }>;
  
  // Legal
  legalReference?: string;
}

export class ConvocatoriaPdfGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private leftMargin: number = 20;
  private rightMargin: number = 20;
  private pageWidth: number = 210; // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private contentWidth: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    // Márgenes más pequeños para aprovechar mejor el espacio
    this.leftMargin = 15;
    this.rightMargin = 15;
    this.contentWidth = this.pageWidth - this.leftMargin - this.rightMargin;
  }

  generatePdf(data: ConvocatoriaData): jsPDF {
    // Configurar fuentes
    this.doc.setFont('times', 'normal');
    
    // Calcular tamaño de fuente adaptativo basado en contenido
    const fontSizes = this.calculateAdaptiveFontSizes(data);
    
    // Address header (top right)
    this.addAddressHeader(data, fontSizes);
    
    // Título principal
    this.addTitle(data, fontSizes);
    
    // Contenido principal
    this.addMainContent(data, fontSizes);
    
    // Footer con firma
    this.addSignature(data, fontSizes);
    
    return this.doc;
  }

  private calculateAdaptiveFontSizes(data: ConvocatoriaData) {
    // Calcular la "cantidad" de contenido
    const agendaItems = data.agendaItems || [];
    const agendaItemsLength = agendaItems.reduce((total, item) => total + item.title.length, 0);
    const hasSecondCall = data.secondCallEnabled;
    
    // Factor de contenido (0-1, donde 1 es mucho contenido)
    let contentFactor = 0;
    // Reducir el impacto del número de elementos en la agenda
    contentFactor += Math.min(agendaItems.length / 15, 0.4); // 0-15 items = 0-0.4
    // Reducir el impacto de la longitud del texto
    contentFactor += Math.min(agendaItemsLength / 800, 0.2); // longitud de texto
    contentFactor += hasSecondCall ? 0.1 : 0; // segunda convocatoria añade complejidad
    
    // Limitar entre 0 y 0.7 (no permitir reducción extrema)
    contentFactor = Math.min(contentFactor, 0.7);
    
    // Tamaños mínimos más altos para mantener legibilidad
    const minHeader = 10;     // Mínimo para encabezado
    const minTitleMain = 16;  // Mínimo para título principal
    const minTitleSub = 12;   // Mínimo para subtítulo
    const minContent = 10;    // Mínimo para contenido
    const minLegal = 9;       // Mínimo para texto legal
    const minSignature = 9;   // Mínimo para firma
    const minSpacing = 4;     // Mínimo espaciado
    
    // Calcular tamaños de fuente con límites mínimos (más contenido = fuentes más pequeñas, pero no demasiado)
    return {
      header: Math.max(minHeader, Math.round(11 - (contentFactor * 2))),
      titleMain: Math.max(minTitleMain, Math.round(18 - (contentFactor * 3))),  
      titleSub: Math.max(minTitleSub, Math.round(14 - (contentFactor * 2))),
      content: Math.max(minContent, Math.round(12 - (contentFactor * 2.5))),
      legal: Math.max(minLegal, Math.round(10 - (contentFactor * 1.5))),
      signature: Math.max(minSignature, Math.round(10 - (contentFactor * 1))),
      spacing: Math.max(minSpacing, Math.round(6 - (contentFactor * 2))) // Reducido el impacto negativo en el espaciado
    };
  }

  private addAddressHeader(data: ConvocatoriaData, fontSizes: any) {
    // Dirección del edificio en la esquina superior derecha
    this.doc.setFontSize(fontSizes.header);
    this.doc.setTextColor(0, 0, 0);
    
    const lines = [
      data.buildingName,
      `${data.buildingAddress}, ${data.postalCode} ${data.city}`
    ];
    
    const lineSpacing = Math.max(fontSizes.spacing - 2, 3);
    lines.forEach((line, index) => {
      this.doc.text(line, this.pageWidth - this.rightMargin, this.currentY + (index * lineSpacing), { align: 'right' });
    });
    
    this.currentY += fontSizes.spacing * 2.5;
  }

  private addTitle(data: ConvocatoriaData, fontSizes: any) {
    // Título principal adaptativo
    this.currentY += fontSizes.spacing;
    this.doc.setFontSize(fontSizes.titleMain);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('times', 'bold');
    this.doc.text('CONVOCATÓRIA', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += fontSizes.spacing;
    this.doc.setFontSize(fontSizes.titleSub);
    this.doc.setFont('times', 'normal');
    const assemblyText = `${data.assemblyNumber}ª ASSEMBLEIA GERAL ${data.assemblyType === 'ordinaria' ? 'ORDINÁRIA' : 'EXTRAORDINÁRIA'} DE CONDÓMINOS`;
    this.doc.text(assemblyText, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += fontSizes.spacing * 2;
  }

  private addMainContent(data: ConvocatoriaData, fontSizes: any) {
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(fontSizes.content);
    
    // Saludo
    this.doc.text('Exmº. Sr. Condómino,', this.leftMargin, this.currentY);
    this.currentY += fontSizes.spacing;
    
    // Primer párrafo adaptativo
    const legalRef = data.legalReference || 'Artigo 1432.º do Código Civil';
    const firstParagraph = `Nos termos do ${legalRef}, serve esta para convocar todos os condóminos para a Assembleia ${data.assemblyType === 'ordinaria' ? 'Ordinária' : 'Extraordinária'} de Condóminos do prédio sito na:`;
    const lines1 = this.doc.splitTextToSize(firstParagraph, this.contentWidth);
    lines1.forEach((line: string) => {
      this.doc.text(line, this.leftMargin, this.currentY);
      this.currentY += fontSizes.spacing - 1;
    });
    
    // Dirección del edificio (centrada y en negrita)
    this.currentY += fontSizes.spacing * 0.5;
    this.doc.setFont('times', 'bold');
    const address = `${data.buildingAddress}, ${data.postalCode} ${data.city}`;
    this.doc.text(address, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.doc.setFont('times', 'normal');
    this.currentY += fontSizes.spacing;
    
    // Información de la reunión (centrada, en negrita y azul)
    this.doc.setFont('times', 'bold');
    this.doc.setTextColor(0, 102, 204);
    const meetingDate = this.formatDateWithWeekday(data.meetingDate);
    const meetingTime = data.meetingTime.split(':')[0] + 'h' + data.meetingTime.split(':')[1];
    const meetingInfo = `A realizar-se no dia ${meetingDate}, pelas ${meetingTime} no ${data.meetingLocation}`;
    this.doc.text(meetingInfo, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('times', 'normal');
    this.currentY += fontSizes.spacing;
    
    // Segunda convocatoria (si aplica)
    if (data.secondCallEnabled && data.secondCallTime) {
      const secondCallTime = data.secondCallTime.split(':')[0] + 'h' + data.secondCallTime.split(':')[1];
      let secondCallText;
      
      if (!data.secondCallDate || data.secondCallDate === data.meetingDate) {
        secondCallText = `A assembleia terá início à hora marcada em primeira convocatória ou ${secondCallTime} em segunda convocatória.`;
      } else {
        const secondCallDate = this.formatDate(data.secondCallDate);
        secondCallText = `Em caso de falta de quórum, será realizada em segunda convocatória no dia ${secondCallDate} pelas ${secondCallTime}.`;
      }
      
      const lines2 = this.doc.splitTextToSize(secondCallText, this.contentWidth);
      lines2.forEach((line: string) => {
        this.doc.text(line, this.pageWidth / 2, this.currentY, { align: 'center' });
        this.currentY += fontSizes.spacing - 1;
      });
      this.currentY += fontSizes.spacing * 0.5;
    }
    
    // Orden del día
    this.currentY += fontSizes.spacing;
    this.doc.setFont('times', 'bold');
    this.doc.text('Ordem de Trabalhos para esta data:', this.leftMargin, this.currentY);
    this.doc.setFont('times', 'normal');
    this.currentY += fontSizes.spacing;
    
    // Items de la agenda adaptativos
    this.doc.setTextColor(0, 102, 204);
    const agendaItems = data.agendaItems || [];
    const itemSpacing = Math.max(fontSizes.spacing - 2, 3);
    agendaItems.forEach((item, index) => {
      // Número del item
      this.doc.setFont('times', 'bold');
      this.doc.text(`${index + 1}.`, this.leftMargin + 3, this.currentY);
      
      // Título del item adaptativo
      this.doc.setFont('times', 'normal');
      const itemLines = this.doc.splitTextToSize(item.title, this.contentWidth - 12);
      itemLines.forEach((line: string, lineIndex: number) => {
        if (lineIndex === 0) {
          // Primera línea, al lado del número
          this.doc.text(line, this.leftMargin + 12, this.currentY);
        } else {
          // Líneas siguientes, indentadas
          this.currentY += itemSpacing;
          this.doc.text(line, this.leftMargin + 12, this.currentY);
        }
      });
      this.currentY += itemSpacing;
    });
    this.doc.setTextColor(0, 0, 0);
    
    // Texto legal adaptativo
    this.currentY += fontSizes.spacing;
    this.doc.setFontSize(fontSizes.legal);
    
    const legalTexts = [
      'De acordo com o Regulamento do Condomínio deste edifício, está presente em Assembleia de Condóminos quem, sendo proprietário ou usufrutuário, mandatário ou representante legal dos mesmos, se encontrar presente à hora marcada para a reunião.',
      data.secondCallEnabled ? 
        `Não se verificando comparência de pelo menos metade do valor do prédio, a Assembleia funcionará em segunda convocatória, no mesmo local ${data.secondCallDate && data.secondCallDate !== data.meetingDate ? `e em data posterior` : "e data"}, ${data.secondCallTime ? `pelas ${data.secondCallTime.split(':')[0] + 'h' + data.secondCallTime.split(':')[1]}` : "meia hora depois"}, com qualquer número de condóminos.` :
        'Não se verificando comparência de pelo menos metade do valor do prédio, a Assembleia funcionará em segunda convocatória, no mesmo local e data, meia hora depois, com qualquer número de condóminos.',
      'Qualquer condómino pode fazer-se representar por procurador, bastando para tal apresentar procuração ou carta mandatária. Conforme determina o parágrafo 2 do artigo 1431° do Código Civil, o voto do condómino tem de corresponder à sua parte.'
    ];
    
    const legalSpacing = Math.max(fontSizes.spacing - 2, 3);
    legalTexts.forEach(text => {
      const lines = this.doc.splitTextToSize(text, this.contentWidth);
      lines.forEach((line: string) => {
        this.doc.text(line, this.leftMargin, this.currentY);
        this.currentY += legalSpacing;
      });
      this.currentY += legalSpacing * 0.5;
    });
  }
  
  private addSignature(data: ConvocatoriaData, fontSizes: any) {
    // Añadir fecha (alineada a la derecha)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(fontSizes.signature);
    
    // Formatting the date
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('pt-PT', dateOptions);
    
    const dateWidth = this.doc.getTextWidth(dateStr);
    this.doc.text(dateStr, this.pageWidth - this.rightMargin - dateWidth, 240);
    
    // Añadir "O Administrador"
    const adminText = 'O Administrador';
    const adminWidth = this.doc.getTextWidth(adminText);
    this.doc.text(adminText, this.pageWidth - this.rightMargin - (dateWidth / 2) - (adminWidth / 2), 250);
    
    // Añadir línea para firma
    const signatureWidth = 70; // mm
    const lineStart = this.pageWidth - this.rightMargin - signatureWidth;
    const lineEnd = this.pageWidth - this.rightMargin;
    this.doc.line(lineStart, 260, lineEnd, 260);
    
    // Añadir nombre del administrador DEBAJO de la línea (con espacio adecuado)
    const adminName = data.administrator || '';
    const adminNameWidth = this.doc.getTextWidth(adminName);
    this.doc.text(
      adminName,
      this.pageWidth - this.rightMargin - (signatureWidth / 2) - (adminNameWidth / 2),
      260 + 6 // Ahora debajo de la línea con espacio suficiente
    );
  }
  
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
  }
  
  private formatDateWithWeekday(dateString: string): string {
    const date = new Date(dateString);
    const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 
                     'quinta-feira', 'sexta-feira', 'sábado'];
    const dateFormatted = this.formatDate(dateString);
    return `${dateFormatted} (${weekdays[date.getDay()]})`;
  }

  private addBuildingInfo(data: ConvocatoriaData) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(50, 50, 50);
    
    // Box para información del edificio
    const boxY = this.currentY;
    const boxHeight = 30;
    
    // Fondo gris claro
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.leftMargin, boxY, this.contentWidth, boxHeight, 'F');
    
    // Borde
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.leftMargin, boxY, this.contentWidth, boxHeight, 'S');
    
    // Contenido
    this.currentY = boxY + 8;
    this.doc.text(data.buildingName.toUpperCase(), this.leftMargin + 5, this.currentY);
    
    this.currentY += 6;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(`${data.buildingAddress}`, this.leftMargin + 5, this.currentY);
    
    this.currentY += 5;
    this.doc.text(`${data.postalCode} ${data.city}`, this.leftMargin + 5, this.currentY);
    
    this.currentY = boxY + boxHeight + 10;
  }

  private addMeetingInfo(data: ConvocatoriaData) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('INFORMAÇÕES DA REUNIÃO', this.leftMargin, this.currentY);
    
    this.currentY += 2;
    this.doc.setDrawColor(0, 123, 255);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.leftMargin, this.currentY, this.leftMargin + 60, this.currentY);
    this.currentY += 8;
    
    // Tabla de información
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    
    const infoItems = [
      { label: 'Data:', value: this.formatDate(data.meetingDate) },
      { label: 'Hora:', value: data.meetingTime },
      { label: 'Local:', value: data.meetingLocation }
    ];
    
    infoItems.forEach(item => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.label, this.leftMargin, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.value, this.leftMargin + 30, this.currentY);
      this.currentY += 6;
    });
    
    // Segunda convocatória
    if (data.secondCallEnabled) {
      this.currentY += 4;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 0, 0);
      this.doc.text('SEGUNDA CONVOCATÓRIA:', this.leftMargin, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      
      const secondCallText = data.secondCallDate && data.secondCallDate !== data.meetingDate
        ? `${this.formatDate(data.secondCallDate)} às ${data.secondCallTime}`
        : `No mesmo dia às ${data.secondCallTime}`;
      
      this.doc.text(secondCallText, this.leftMargin + 50, this.currentY);
      this.currentY += 8;
    }
    
    // Administrador
    this.currentY += 4;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Administrador:', this.leftMargin, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.administrator, this.leftMargin + 30, this.currentY);
    
    this.currentY += 15;
  }

  private addAgenda(data: ConvocatoriaData) {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('ORDEM DO DIA', this.leftMargin, this.currentY);
    
    this.currentY += 2;
    this.doc.setDrawColor(0, 123, 255);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.leftMargin, this.currentY, this.leftMargin + 40, this.currentY);
    this.currentY += 8;
    
    // Box para agenda
    const agendaBoxY = this.currentY;
    const agendaItems = data.agendaItems || [];
    const estimatedHeight = agendaItems.length * 15 + 10;
    
    // Fondo azul muy claro
    this.doc.setFillColor(240, 248, 255);
    this.doc.rect(this.leftMargin, agendaBoxY, this.contentWidth, estimatedHeight, 'F');
    
    // Borde azul
    this.doc.setDrawColor(0, 123, 255);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.leftMargin, agendaBoxY, this.contentWidth, estimatedHeight, 'S');
    
    // Items da agenda
    this.currentY = agendaBoxY + 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text('Ordem de Trabalhos para esta data:', this.leftMargin, this.currentY);
    this.currentY += 10;
    
    agendaItems.forEach((item, index) => {
      // Formato del número con punto y espacio para mejor visualización
      const itemNumber = `${index + 1}. `;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(itemNumber, this.leftMargin + 5, this.currentY);
      
      // Determinar punto de inicio para el texto del elemento (después del número)
      const itemTextX = this.leftMargin + 5 + this.doc.getTextWidth(itemNumber);
      
      // Formato especial para texto de agenda (azul)
      this.doc.setTextColor(0, 102, 204); // Azul
      this.doc.setFont('helvetica', 'normal');
      
      // Dividir el texto si es muy largo
      const textWidth = this.contentWidth - 35; // Ancho disponible considerando márgenes e indentación
      const lines = this.doc.splitTextToSize(item.title, textWidth);
      
      // Añadir primera línea con indentación después del número
      this.doc.text(lines[0], itemTextX, this.currentY);
      
      // Añadir líneas adicionales con la misma indentación
      if (lines.length > 1) {
        for (let i = 1; i < lines.length; i++) {
          this.currentY += 4;
          this.doc.text(lines[i], itemTextX, this.currentY);
        }
      }
      
      // Restaurar color de texto y aumentar posición Y para el siguiente elemento
      this.doc.setTextColor(0, 0, 0); // Negro
      this.currentY += 8;
    });
    
    this.currentY = agendaBoxY + estimatedHeight + 10;
  }

  private addLegalInfo(data: ConvocatoriaData) {
    // Box de información legal
    const legalBoxY = this.currentY;
    const legalBoxHeight = 45;
    
    // Fondo amarillo claro
    this.doc.setFillColor(255, 251, 235);
    this.doc.rect(this.leftMargin, legalBoxY, this.contentWidth, legalBoxHeight, 'F');
    
    // Borde amarillo
    this.doc.setDrawColor(251, 191, 36);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.leftMargin, legalBoxY, this.contentWidth, legalBoxHeight, 'S');
    
    // Ícono de información
    this.doc.setFillColor(251, 191, 36);
    this.doc.circle(this.leftMargin + 8, legalBoxY + 8, 3, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('i', this.leftMargin + 8, legalBoxY + 9, { align: 'center' });
    
    // Título
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.text('INFORMAÇÃO LEGAL', this.leftMargin + 15, legalBoxY + 9);
    
    // Contenido
    this.currentY = legalBoxY + 16;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    
    const legalTexts = [
      'Quórum (1ª Convocatória): Presença de condóminos que representem mais de metade do valor total do prédio.',
      data.secondCallEnabled ? 
        `Não se verificando comparência de pelo menos metade do valor do prédio, a Assembleia funcionará em segunda convocatória, no mesmo local ${data.secondCallDate && data.secondCallDate !== data.meetingDate ? `e em data posterior` : "e data"}, ${data.secondCallTime ? `pelas ${data.secondCallTime.split(':')[0] + 'h' + data.secondCallTime.split(':')[1]}` : "meia hora depois"}, com qualquer número de condóminos.` :
        `Não se verificando comparência de pelo menos metade do valor do prédio, a Assembleia funcionará em segunda convocatória, no mesmo local e data, meia hora depois, com qualquer número de condóminos.`,
      'Qualquer condómino pode fazer-se representar por procurador, bastando para tal apresentar procuração ou carta mandatária. Conforme determina o parágrafo 2 do artigo 1431° do Código Civil, o voto do condómino tem de corresponder à sua parte.'
    ];
    
    const legalSpacing = Math.max(fontSizes.spacing - 2, 3);
    legalTexts.forEach(text => {
      const lines = this.doc.splitTextToSize(text, this.contentWidth);
      lines.forEach((line: string) => {
        this.doc.text(line, this.leftMargin, this.currentY);
        this.currentY += legalSpacing;
      });
      this.currentY += legalSpacing * 0.5;
    });
  }

  private addFooter(data: ConvocatoriaData) {
    // Posicionarse al final de la página
    this.currentY = this.pageHeight - 40;
    
    // Línea separadora
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.leftMargin, this.currentY, this.pageWidth - this.rightMargin, this.currentY);
    
    this.currentY += 5;
    
    // Firma del administrador
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text('O Administrador,', this.pageWidth - this.rightMargin - 50, this.currentY);
    
    this.currentY += 15;
    this.doc.line(
      this.pageWidth - this.rightMargin - 70, 
      this.currentY, 
      this.pageWidth - this.rightMargin, 
      this.currentY
    );
    
    this.currentY += 5;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.text(data.administrator, this.pageWidth - this.rightMargin - 35, this.currentY, { align: 'center' });
    
    // Información del documento
    this.currentY = this.pageHeight - 15;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(
      `Documento gerado automaticamente pelo sistema Gestor Condomínios em ${new Date().toLocaleDateString('pt-PT')}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
  }


  // Método estático para generar y descargar el PDF
  static async generateAndDownload(data: ConvocatoriaData, filename?: string) {
    // Generar el HTML y convertirlo a PDF para mejor adaptación
    const generator = new ConvocatoriaPdfGenerator();
    
    // Generar nombre de archivo con número de convocatoria y fecha
    const generateDefaultFilename = () => {
      const assemblyNumber = data.assemblyNumber || ''; 
      // Formatear la fecha para el nombre del archivo
      let dateStr = '';
      if (data.meetingDate) {
        try {
          const date = new Date(data.meetingDate);
          dateStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        } catch (e) {
          dateStr = new Date().toISOString().split('T')[0];
        }
      } else {
        dateStr = new Date().toISOString().split('T')[0];
      }
      
      return `convocatoria_${assemblyNumber}_${dateStr}_${data.buildingName.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    };
    
    // Usar una implementación mejorada basada en HTML para mejor adaptación a la página
    try {
      // Crear un contenedor temporal para el HTML
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.width = '210mm'; // Ancho A4
      tempElement.style.backgroundColor = '#ffffff';
      tempElement.innerHTML = ConvocatoriaPdfGenerator.generateHTML(data);
      document.body.appendChild(tempElement);
      
      // Configuración mejorada para html2canvas
      const canvas = await html2canvas(tempElement, {
        scale: 1.5, // Mayor escala para mejor calidad
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        // Ajustar dimensiones para que se adapte a A4
        width: tempElement.offsetWidth,
        height: tempElement.offsetHeight
      });
      
      // Crear el PDF con dimensiones A4
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Calcular proporciones para adaptarse a A4 manteniendo el ratio
      const imgWidth = 210 - 20; // A4 width menos margen
      const pageHeight = 297 - 20; // A4 height menos margen
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Ajustar escala si excede la altura de la página
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      if (imgHeight > pageHeight) {
        const scaleFactor = pageHeight / imgHeight;
        finalHeight = pageHeight;
        finalWidth = imgWidth * scaleFactor;
        // Centrar horizontalmente
        const horizontalOffset = (210 - finalWidth) / 2;
        pdf.addImage(imgData, 'JPEG', horizontalOffset, 10, finalWidth, finalHeight);
      } else {
        // Centrar horizontalmente y verticalmente si hay espacio
        const horizontalOffset = (210 - finalWidth) / 2;
        const verticalOffset = 10; // Mantener un margen superior fijo
        pdf.addImage(imgData, 'JPEG', horizontalOffset, verticalOffset, finalWidth, finalHeight);
      }
      
      // Eliminar el elemento temporal
      document.body.removeChild(tempElement);
      
      // Guardar el PDF con nombre que incluye número de convocatoria y fecha
      const defaultFilename = generateDefaultFilename();
      pdf.save(filename || defaultFilename);
      return pdf;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      // Si falla el método mejorado, usar el método tradicional como fallback
      const pdf = generator.generatePdf(data);
      const defaultFilename = generateDefaultFilename();
      pdf.save(filename || defaultFilename);
      return pdf;
    }
  }

  // Método para generar HTML alternativo (para preview)
  static generateHTML(data: ConvocatoriaData): string {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('pt-PT', options);
    };

    const formatDateWithWeekday = (dateString: string) => {
      const date = new Date(dateString);
      const dateFormatted = formatDate(dateString);
      const weekday = date.toLocaleDateString('pt-PT', { weekday: 'long' });
      return `${dateFormatted} (${weekday})`;
    };

    const formatTime = (time: string) => {
      const parts = time.split(':');
      return parts[0] + 'h' + parts[1];
    };

    const formattedAddress = `${data.buildingAddress}, ${data.postalCode} ${data.city}`;

    return `
      <!DOCTYPE html>
      <html lang="pt-PT">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { 
            size: A4; 
            margin: 25mm; 
          }
          body { 
            font-family: 'Times New Roman', Times, serif; 
            font-size: 12pt;
            line-height: 1.6; 
            color: #000; 
            max-width: 170mm; 
            margin: 0 auto; 
            padding: 0;
            background: white;
          }
          .address-header {
            text-align: right;
            font-size: 11pt;
            margin-bottom: 40px;
          }
          .address-header p {
            margin: 2px 0;
          }
          .title-section {
            text-align: center;
            margin-bottom: 40px;
          }
          .title-section h1 {
            font-size: 20pt;
            font-weight: bold;
            margin: 0 0 10px 0;
            letter-spacing: 1px;
          }
          .title-section h2 {
            font-size: 16pt;
            font-weight: normal;
            margin: 0;
          }
          .content {
            text-align: justify;
            text-justify: inter-word;
          }
          .greeting {
            margin-bottom: 20px;
          }
          .building-address {
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .meeting-info {
            font-weight: bold;
            text-align: center;
            color: #0066cc;
            margin: 20px 0;
          }
          .second-convocatoria {
            font-weight: normal;
            text-align: center;
            margin: 15px 0;
          }
          .agenda-section {
            margin: 30px 0;
          }
          .agenda-section h3 {
            font-weight: bold;
            margin-bottom: 15px;
          }
          .agenda-section ol {
            padding-left: 25px;
            margin: 0;
          }
          .agenda-section li {
            color: #0066cc;
            margin-bottom: 8px;
          }
          .legal-text {
            text-align: justify;
            margin: 25px 0;
          }
          .legal-text p {
            margin-bottom: 15px;
          }
          .signature-section {
            text-align: right;
            margin-top: 40px;
          }
          .date {
            margin-bottom: 15px;
          }
          .administrator-title {
            margin-bottom: 15px;
          }
          .signature-line {
            display: inline-block;
            width: 250px;
            border-bottom: 1px solid #000;
            text-align: center;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              font-size: 11pt;
            }
            .title-section h1 {
              font-size: 18pt;
            }
            .title-section h2 {
              font-size: 14pt;
            }
          }
        </style>
      </head>
      <body>
        <div class="address-header">
          <p>${data.buildingName}</p>
          <p>${formattedAddress}</p>
        </div>

        <div class="title-section">
          <h1>CONVOCATÓRIA</h1>
          <h2>${data.assemblyNumber}ª ASSEMBLEIA GERAL ${data.assemblyType === 'ordinaria' ? 'ORDINÁRIA' : 'EXTRAORDINÁRIA'} DE CONDÓMINOS</h2>
        </div>

        <div class="content">
          <p class="greeting">Exmº. Sr. Condómino,</p>
          
          <p>Nos termos do ${data.legalReference || 'artigo 1431º e seguintes do Código Civil'}, serve esta para convocar todos os condóminos para a Assembleia ${data.assemblyType === 'ordinaria' ? 'Ordinária' : 'Extraordinária'} de Condóminos do prédio sito na:</p>
          
          <p class="building-address">${formattedAddress}</p>
          
          <p class="meeting-info">
            A realizar-se no dia ${formatDateWithWeekday(data.meetingDate)}, pelas ${formatTime(data.meetingTime)} no ${data.meetingLocation}
          </p>
          
          ${data.secondCallEnabled ? `
            <p class="second-convocatoria">
              ${(!data.secondCallDate || data.secondCallDate === data.meetingDate) ? 
                `A assembleia terá início à hora marcada em primeira convocatória ou ${formatTime(data.secondCallTime)} em segunda convocatória.` :
                `A assembleia terá início à hora marcada em primeira convocatória. Em caso de falta de quórum, será realizada em segunda convocatória no dia ${formatDate(data.secondCallDate)} pelas ${formatTime(data.secondCallTime)}.`
              }
            </p>
          ` : ''}
          
          <div class="agenda-section">
            <h3>Ordem de Trabalhos para esta data:</h3>
            <ol>
              ${(data.agendaItems || []).map((item, index) => `
                <li value="${index + 1}">${item.title}</li>
              `).join('')}
            </ol>
          </div>
          
          <div class="legal-text">
            <p>De acordo com o Regulamento do Condomínio deste edifício, está presente em Assembleia de Condóminos quem, sendo proprietário ou usufrutuário, mandatário ou representante legal dos mesmos, se encontrar presente à hora marcada para a reunião.</p>
            
            <p>${data.secondCallEnabled ? 
              `Não se verificando comparência de pelo menos metade do valor do prédio, a Assembleia funcionará em segunda convocatória, no mesmo local ${data.secondCallDate && data.secondCallDate !== data.meetingDate ? `e em data posterior (${formatDate(data.secondCallDate)})` : "e data"}, ${data.secondCallTime ? `pelas ${formatTime(data.secondCallTime)}` : "meia hora depois"}, com qualquer número de condóminos.` :
              `Não se verificando comparência de pelo menos metade do valor do prédio, a Assembleia funcionará em segunda convocatória, no mesmo local e data, meia hora depois, com qualquer número de condóminos.`
            }</p>
            
            <p>Qualquer condómino pode fazer-se representar por procurador, bastando para tal apresentar procuração ou carta mandatária. Conforme determina o parágrafo 2 do artigo 1431° do Código Civil, o voto do condómino tem de corresponder à sua parte.</p>
          </div>
        </div>

        <div class="signature-section">
          <p class="date">${formatDate(new Date().toISOString())}</p>
          <p class="administrator-title">O Administrador</p>
          <p class="signature-line">${data.administrator}</p>
        </div>
      </body>
      </html>
    `;
  }
}

export default ConvocatoriaPdfGenerator;