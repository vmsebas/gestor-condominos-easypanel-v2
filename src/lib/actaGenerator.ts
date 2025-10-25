/**
 * Acta (Meeting Minutes) Generator
 * Generates professional PDF documents for condominium assembly minutes
 * Based on Portuguese legal requirements (Código Civil Art. 1430º-1433º)
 */

import jsPDF from 'jspdf';
import { formatDatePortuguese } from './communicationTemplates';

export interface ActaData {
  // Basic Information
  minute_number: string;
  assembly_type: 'ordinary' | 'extraordinary';
  meeting_date: string;
  meeting_time?: string;
  start_time?: string;
  end_time?: string;
  location?: string;

  // Building Information
  building_name: string;
  building_address?: string;
  postal_code?: string;

  // Officials
  president_name?: string;
  secretary_name?: string;

  // Quorum
  attendees_count?: number;
  total_units_represented?: number;
  total_percentage_represented?: number;
  quorum_achieved?: boolean;
  quorum_percentage?: number;

  // Content
  agenda_items?: any[];
  attendees?: any[];
  voting_results?: any[];
  decisions?: any[];
  agreements_reached?: any[];
  conclusions?: string;

  // Signatures
  signed_date?: string;
  president_signature?: string;
  secretary_signature?: string;
}

/**
 * Generate complete Acta PDF
 */
export const generateActaCompletaPDF = (data: ActaData, download: boolean = true): Blob | void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 20;

  const assemblyTypeText = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  const meetingDateFormatted = formatDatePortuguese(data.meeting_date);

  // Helper functions
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  const addTitle = (text: string, fontSize: number = 14) => {
    checkPageBreak(15);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += fontSize / 2 + 5;
  };

  const addSectionTitle = (text: string) => {
    checkPageBreak(12);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, y);
    y += 8;
  };

  const addText = (text: string, fontSize: number = 10, indent: number = 0) => {
    checkPageBreak(8);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin + indent, y);
      y += 5;
    });
  };

  const addSpace = (space: number = 5) => {
    y += space;
  };

  // ============ HEADER ============
  doc.setFillColor(240, 240, 240);
  doc.rect(margin - 5, y - 5, contentWidth + 10, 25, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTA DA ASSEMBLEIA DE CONDÓMINOS', pageWidth / 2, y + 5, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Assembleia ${assemblyTypeText} #${data.minute_number}`, pageWidth / 2, y + 13, { align: 'center' });

  y += 30;

  // ============ SECTION I: BASIC DATA ============
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  addSectionTitle('I. DADOS DA ASSEMBLEIA');

  addText(`Edifício: ${data.building_name}`, 10);
  if (data.building_address) {
    addText(`Morada: ${data.building_address}`, 10);
  }
  addText(`Tipo: Assembleia ${assemblyTypeText} de Condóminos`, 10);
  addText(`Data: ${meetingDateFormatted}`, 10);

  if (data.start_time && data.end_time) {
    addText(`Horário: ${data.start_time} - ${data.end_time}`, 10);
  } else if (data.meeting_time) {
    addText(`Hora: ${data.meeting_time}`, 10);
  }

  if (data.location) {
    addText(`Local: ${data.location}`, 10);
  }

  addSpace(8);

  // ============ SECTION II: MESA ============
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  addSectionTitle('II. MESA DA ASSEMBLEIA');

  addText(`Presidente: ${data.president_name || '_____________________________'}`, 10);
  addText(`Secretário: ${data.secretary_name || '_____________________________'}`, 10);

  addSpace(8);

  // ============ SECTION III: QUORUM ============
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  addSectionTitle('III. VERIFICAÇÃO DE QUÓRUM');

  const totalAttendees = data.attendees_count || data.attendees?.length || 0;
  const quorumPercentage = data.quorum_percentage || data.total_percentage_represented || 0;
  const quorumAchieved = data.quorum_achieved ?? (quorumPercentage >= 50);

  addText(`Total de condóminos presentes/representados: ${totalAttendees}`, 10);
  addText(`Percentagem representada: ${quorumPercentage.toFixed(2)}%`, 10);

  if (quorumAchieved) {
    doc.setTextColor(0, 128, 0);
    addText(`✓ Quórum atingido - A assembleia pode deliberar validamente`, 10);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.setTextColor(255, 0, 0);
    addText(`✗ Quórum não atingido - Necessária segunda convocatória`, 10);
    doc.setTextColor(0, 0, 0);
  }

  addSpace(8);

  // ============ SECTION IV: ORDEM DO DIA ============
  if (data.agenda_items && data.agenda_items.length > 0) {
    checkPageBreak(20);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    addSectionTitle('IV. ORDEM DE TRABALHOS');

    data.agenda_items.forEach((item: any, index: number) => {
      checkPageBreak(15);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.item_number || index + 1}. ${item.title}`, margin, y);
      y += 6;

      if (item.description) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(item.description, contentWidth - 5);
        lines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + 5, y);
          y += 5;
        });
      }

      if (item.type) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        const typeText = item.type === 'votacion' ? 'Votação' : item.type === 'informativo' ? 'Informativo' : item.type;
        doc.text(`[${typeText}]`, margin + 5, y);
        y += 5;
      }

      y += 3;
    });

    addSpace(5);
  }

  // ============ SECTION V: PRESENÇAS ============
  if (data.attendees && data.attendees.length > 0) {
    checkPageBreak(20);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    addSectionTitle('V. LISTA DE PRESENÇAS');

    data.attendees.forEach((attendee: any, index: number) => {
      checkPageBreak(8);

      const name = attendee.member_name || attendee.name || `Condómino #${index + 1}`;
      const type = attendee.attendance_type || 'present';
      const typeText = type === 'present' ? 'Presente' :
                       type === 'represented' ? 'Representado' : 'Ausente';

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${name}`, margin, y);
      doc.setFont('helvetica', 'italic');
      doc.text(`[${typeText}]`, pageWidth - margin - 30, y, { align: 'right' });
      y += 5;
    });

    addSpace(5);
  }

  // ============ SECTION VI: VOTAÇÕES ============
  if (data.voting_results && data.voting_results.length > 0) {
    checkPageBreak(20);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    addSectionTitle('VI. RESULTADO DAS VOTAÇÕES');

    data.voting_results.forEach((vote: any, index: number) => {
      checkPageBreak(20);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const voteTitle = vote.title || vote.agenda_title || `Ponto ${index + 1}`;
      doc.text(`${index + 1}. ${voteTitle}`, margin, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      if (vote.in_favor !== undefined) {
        addText(`A favor: ${vote.in_favor} votos`, 10, 5);
      }
      if (vote.against !== undefined) {
        addText(`Contra: ${vote.against} votos`, 10, 5);
      }
      if (vote.abstentions !== undefined) {
        addText(`Abstenções: ${vote.abstentions}`, 10, 5);
      }

      if (vote.result || vote.status) {
        const result = vote.result || vote.status;
        const resultText = result === 'approved' || result === 'aprovado' ? 'APROVADO' :
                           result === 'rejected' || result === 'rejeitado' ? 'REJEITADO' : result;

        if (resultText === 'APROVADO') {
          doc.setTextColor(0, 128, 0);
        } else if (resultText === 'REJEITADO') {
          doc.setTextColor(255, 0, 0);
        }

        doc.setFont('helvetica', 'bold');
        addText(`Resultado: ${resultText}`, 10, 5);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }

      y += 3;
    });

    addSpace(5);
  }

  // ============ SECTION VII: CONCLUSIONS ============
  if (data.conclusions) {
    checkPageBreak(15);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    addSectionTitle('VII. CONCLUSÕES');
    addText(data.conclusions, 10);
    addSpace(8);
  }

  // ============ SIGNATURES ============
  checkPageBreak(40);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  addSectionTitle('VIII. ASSINATURAS');

  const signedDate = data.signed_date ? formatDatePortuguese(data.signed_date) : meetingDateFormatted;
  addText(`Lavrada e aprovada em ${signedDate}`, 10);

  addSpace(20);

  // President signature
  doc.line(margin, y, margin + 70, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('O Presidente da Mesa', margin, y);
  if (data.president_name) {
    y += 4;
    doc.text(data.president_name, margin, y);
  }

  // Secretary signature (on the right)
  doc.line(pageWidth - margin - 70, y - 25, pageWidth - margin, y - 25);
  doc.text('O Secretário da Mesa', pageWidth - margin - 70, y - 20);
  if (data.secretary_name) {
    doc.text(data.secretary_name, pageWidth - margin - 70, y - 16);
  }

  y += 10;

  // ============ FOOTER ============
  const footerY = pageHeight - 15;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Acta elaborada nos termos do Código Civil Português (Art. 1430º-1433º)', pageWidth / 2, footerY, { align: 'center' });
  doc.setFontSize(6);
  doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-PT')}`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
  }

  // Output
  if (download) {
    const fileName = `Acta_${assemblyTypeText}_${data.minute_number}_${data.meeting_date.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  } else {
    return doc.output('blob');
  }
};
