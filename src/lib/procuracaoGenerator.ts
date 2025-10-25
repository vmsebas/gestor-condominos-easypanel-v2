/**
 * Procuração (Power of Attorney) Generator
 * Generates legal proxy documents for condominium assemblies
 * Based on Portuguese Civil Code Art. 1433.º
 */

import jsPDF from 'jspdf';
import { formatDatePortuguese } from './communicationTemplates';

export interface ProcuracaoData {
  // Outorgante (Person granting the power)
  memberName: string;
  memberNIF?: string;
  memberAddress?: string;
  memberFraction: string;

  // Procurador (Attorney-in-fact)
  attorneyName?: string;
  attorneyNIF?: string;
  attorneyAddress?: string;

  // Assembly details
  buildingName: string;
  buildingAddress: string;
  assemblyType: 'ordinary' | 'extraordinary';
  assemblyDate: string;
  assemblyTime: string;

  // Location
  issueLocation?: string;
  issueDate?: string;
}

/**
 * Generate procuração PDF
 * Creates a legal proxy document in Portuguese format
 */
export const generateProcuracaoPDF = (data: ProcuracaoData, download: boolean = true): Blob | void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 30;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 11, align: 'left' | 'center' | 'right' = 'left', bold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');

    if (align === 'center') {
      doc.text(text, pageWidth / 2, y, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, pageWidth - margin, y, { align: 'right' });
    } else {
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += (lines.length - 1) * 6;
    }
    y += fontSize / 2 + 2;
  };

  const addSpace = (space: number = 8) => {
    y += space;
  };

  // Title
  addText('PROCURAÇÃO', 16, 'center', true);
  addSpace(5);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Artigo 1431.º, n.º 3, do Código Civil)', pageWidth / 2, y, { align: 'center' });
  y += 10;
  addSpace(5);

  // Body
  const assemblyTypeText = data.assemblyType === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  const assemblyDateFormatted = formatDatePortuguese(data.assemblyDate);

  addText(`Eu, ${data.memberName}${data.memberNIF ? `, portador(a) do NIF ${data.memberNIF}` : ''}${data.memberAddress ? `, residente em ${data.memberAddress}` : ''}, na qualidade de condómino(a) do edifício "${data.buildingName}", sito em ${data.buildingAddress}, proprietário(a) da fração ${data.memberFraction},`);

  addSpace(8);

  // Blank space for attorney details if not provided
  if (!data.attorneyName) {
    addText('NOMEIO COMO MEU(MINHA) PROCURADOR(A):', 11, 'left', true);
    addSpace(5);

    addText('Nome: ____________________________________________________________', 11);
    addSpace(5);
    addText('NIF: ______________________________________________________________', 11);
    addSpace(5);
    addText('Morada: __________________________________________________________', 11);
    addSpace(5);
    addText('_____________________________________________________________________', 11);
    addSpace(10);
  } else {
    addText(`NOMEIO COMO MEU(MINHA) PROCURADOR(A) ${data.attorneyName}${data.attorneyNIF ? `, portador(a) do NIF ${data.attorneyNIF}` : ''}${data.attorneyAddress ? `, residente em ${data.attorneyAddress}` : ''},`);
    addSpace(8);
  }

  addText(`para me representar na Assembleia ${assemblyTypeText} de Condóminos do edifício acima identificado, que terá lugar no dia ${assemblyDateFormatted}, pelas ${data.assemblyTime},`, 11);

  addSpace(8);

  addText('conferindo-lhe os mais amplos poderes para:', 11, 'left', true);
  addSpace(5);

  const powers = [
    'Participar em todas as discussões e deliberações da assembleia;',
    'Exercer o direito de voto em meu nome sobre todos os assuntos constantes da ordem de trabalhos;',
    'Assinar a lista de presenças e quaisquer documentos relacionados com a assembleia;',
    'Requerer esclarecimentos e apresentar propostas;',
    'Praticar todos os atos necessários ao bom e fiel cumprimento deste mandato.'
  ];

  powers.forEach((power, index) => {
    addText(`${index + 1}. ${power}`, 10);
    addSpace(4);
  });

  addSpace(10);

  addText('A presente procuração é válida exclusivamente para a assembleia acima identificada.', 11);

  addSpace(15);

  // Signature section
  const issueLocation = data.issueLocation || '_____________________';
  const issueDate = data.issueDate ? formatDatePortuguese(data.issueDate) : '_____ de ________________ de __________';

  addText(`${issueLocation}, ${issueDate}`, 11, 'right');

  addSpace(25);

  addText('_________________________________________', 11, 'right');
  addText('(Assinatura do Outorgante)', 9, 'right');

  addSpace(15);

  // Footer - Legal notice
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const footerY = pageHeight - 20;
  doc.text('Nos termos do artigo 1431.º, n.º 3, do Código Civil, os condóminos podem fazer-se representar', pageWidth / 2, footerY, { align: 'center' });
  doc.text('por mandatário, bastando, para o efeito, procuração escrita.', pageWidth / 2, footerY + 4, { align: 'center' });
  doc.setFontSize(7);
  doc.text('Este documento não necessita de reconhecimento de assinatura.', pageWidth / 2, footerY + 10, { align: 'center' });

  // Output
  if (download) {
    const fileName = `Procuracao_${data.memberName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } else {
    return doc.output('blob');
  }
};

/**
 * Generate blank procuração template (without member details)
 * Useful for printing and filling by hand
 */
export const generateBlankProcuracaoPDF = (
  buildingName: string,
  buildingAddress: string,
  assemblyType: 'ordinary' | 'extraordinary',
  assemblyDate: string,
  assemblyTime: string,
  download: boolean = true
): Blob | void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 25;

  const assemblyTypeText = assemblyType === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  const assemblyDateFormatted = formatDatePortuguese(assemblyDate);

  // Title with border
  doc.setFillColor(245, 245, 245);
  doc.rect(margin - 5, y - 5, contentWidth + 10, 20, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCURAÇÃO', pageWidth / 2, y + 5, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Para Representação em Assembleia de Condóminos', pageWidth / 2, y + 12, { align: 'center' });
  y += 28;

  // Legal reference
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('(Ao abrigo do artigo 1431.º, n.º 3, do Código Civil Português)', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Outorgante section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('I. OUTORGANTE (Condómino)', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Name field
  doc.text('Nome completo:', margin, y);
  doc.line(margin + 30, y, pageWidth - margin, y);
  y += 7;

  // NIF field
  doc.text('NIF:', margin, y);
  doc.line(margin + 30, y, pageWidth - margin, y);
  y += 7;

  // Address fields
  doc.text('Morada:', margin, y);
  doc.line(margin + 30, y, pageWidth - margin, y);
  y += 7;
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Fraction and permilage
  doc.text('Fração:', margin, y);
  doc.line(margin + 30, y, margin + 90, y);
  doc.text('Permilagem:', margin + 100, y);
  doc.line(margin + 130, y, pageWidth - margin, y);
  y += 10;

  // Procurador section
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('II. PROCURADOR (Representante Nomeado)', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Nome completo:', margin, y);
  doc.line(margin + 30, y, pageWidth - margin, y);
  y += 7;

  doc.text('NIF:', margin, y);
  doc.line(margin + 30, y, pageWidth - margin, y);
  y += 7;

  doc.text('Morada:', margin, y);
  doc.line(margin + 30, y, pageWidth - margin, y);
  y += 7;
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Assembly details section
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('III. ASSEMBLEIA DE CONDÓMINOS', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Edifício: ${buildingName}`, margin, y);
  y += 6;
  doc.text(`Morada: ${buildingAddress}`, margin, y);
  y += 6;
  doc.text(`Tipo: Assembleia ${assemblyTypeText} de Condóminos`, margin, y);
  y += 6;
  doc.text(`Data: ${assemblyDateFormatted}`, margin, y);
  doc.text(`Hora: ${assemblyTime}`, margin + 100, y);
  y += 10;

  // Powers section
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('IV. PODERES CONFERIDOS', margin, y);
  y += 8;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');

  const introText = 'Pelo presente instrumento, nomeio e constituo como meu(minha) procurador(a) a pessoa acima identificada, conferindo-lhe os mais amplos poderes para me representar na assembleia acima referida, nomeadamente para:';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  introLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 5;
  });
  y += 3;

  const powers = [
    'Assinar a lista de presenças em meu nome;',
    'Participar em todas as discussões e deliberações da assembleia;',
    'Exercer o direito de voto sobre todos os assuntos constantes da ordem de trabalhos;',
    'Requerer esclarecimentos e apresentar propostas;',
    'Assinar a ata da assembleia e quaisquer outros documentos necessários;',
    'Praticar todos os atos necessários ao bom e fiel cumprimento deste mandato.'
  ];

  powers.forEach((power, index) => {
    const powerText = `${index + 1}. ${power}`;
    const lines = doc.splitTextToSize(powerText, contentWidth - 5);
    lines.forEach((line: string) => {
      doc.text(line, margin + 3, y);
      y += 4.5;
    });
  });
  y += 5;

  // Validity clause
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const validityText = 'A presente procuração é válida exclusivamente para a assembleia acima identificada.';
  doc.text(validityText, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Signature section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const signatureY = pageHeight - 45;
  doc.text('_________________________________, ______ de __________________ de __________', margin, signatureY);

  doc.text('(Local)', margin + 5, signatureY + 4);
  doc.text('(Data)', margin + 75, signatureY + 4);

  doc.line(pageWidth / 2 - 30, signatureY + 15, pageWidth / 2 + 30, signatureY + 15);
  doc.setFontSize(9);
  doc.text('(Assinatura do Outorgante/Condómino)', pageWidth / 2, signatureY + 19, { align: 'center' });

  // Footer - Legal notices
  const footerY = pageHeight - 20;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Nos termos do artigo 1431.º, n.º 3, do Código Civil, os condóminos podem fazer-se representar por mandatário,', pageWidth / 2, footerY, { align: 'center' });
  doc.text('bastando, para o efeito, procuração escrita. Este documento não necessita de reconhecimento notarial.', pageWidth / 2, footerY + 4, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Documento gerado em ' + new Date().toLocaleDateString('pt-PT'), pageWidth / 2, footerY + 9, { align: 'center' });

  // Output
  if (download) {
    const fileName = `Procuracao_${assemblyTypeText}_${assemblyDate.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  } else {
    return doc.output('blob');
  }
};
