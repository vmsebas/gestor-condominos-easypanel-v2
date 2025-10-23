/**
 * Address Label Generator for Correio Certificado (Certified Mail)
 * Generates printable address labels for CTT Portugal certified mail
 */

import jsPDF from 'jspdf';

interface Member {
  id: string;
  name: string;
  apartment?: string;
  fraction?: string;
  address?: string;
  secondary_address?: string;
  secondary_postal_code?: string;
  secondary_city?: string;
  secondary_country?: string;
}

interface AddressLabelOptions {
  buildingName: string;
  buildingAddress: string;
  senderName?: string;
  senderAddress?: string;
}

/**
 * Generate address labels PDF for certified mail
 * Standard CTT format: 2 columns x 7 rows per A4 page
 */
export const generateAddressLabelsPDF = (
  members: Member[],
  options: AddressLabelOptions,
  download: boolean = true
): Blob | void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // A4 dimensions
  const pageWidth = 210;
  const pageHeight = 297;

  // Label dimensions (standard CTT format - 2 columns x 7 rows)
  const labelWidth = 99; // ~100mm width
  const labelHeight = 38; // ~38mm height
  const marginLeft = 5.5;
  const marginTop = 13;
  const columnGap = 5;
  const rowGap = 5;

  const labelsPerRow = 2;
  const labelsPerColumn = 7;
  const labelsPerPage = labelsPerRow * labelsPerColumn; // 14 labels per page

  let currentPage = 0;
  let labelIndex = 0;

  members.forEach((member, index) => {
    // Check if we need a new page
    if (index > 0 && index % labelsPerPage === 0) {
      doc.addPage();
      currentPage++;
    }

    // Calculate position
    const positionInPage = index % labelsPerPage;
    const row = Math.floor(positionInPage / labelsPerRow);
    const col = positionInPage % labelsPerRow;

    const x = marginLeft + col * (labelWidth + columnGap);
    const y = marginTop + row * (labelHeight + rowGap);

    // Draw label border (optional - comment out for production)
    // doc.setDrawColor(200, 200, 200);
    // doc.setLineWidth(0.1);
    // doc.rect(x, y, labelWidth, labelHeight);

    // Recipient (DESTINATÁRIO)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(member.name.toUpperCase(), x + 3, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Apartment/Fraction info
    if (member.apartment || member.fraction) {
      const apartmentInfo = member.fraction
        ? `Fração ${member.fraction}${member.apartment ? ` - ${member.apartment}` : ''}`
        : `Apartamento ${member.apartment}`;
      doc.text(apartmentInfo, x + 3, y + 13);
    }

    // Use secondary address if available, otherwise use building address
    const memberAddress = member.secondary_address || member.address || options.buildingAddress;
    const memberPostalCode = member.secondary_postal_code || '';
    const memberCity = member.secondary_city || '';
    const memberCountry = member.secondary_country || 'Portugal';

    // Address lines (wrap long addresses)
    const addressLines = doc.splitTextToSize(memberAddress, labelWidth - 6);
    let currentY = member.apartment || member.fraction ? y + 18 : y + 13;

    addressLines.slice(0, 2).forEach((line: string) => {
      doc.text(line, x + 3, currentY);
      currentY += 4;
    });

    // Postal code and city
    if (memberPostalCode && memberCity) {
      doc.text(`${memberPostalCode} ${memberCity}`, x + 3, currentY);
      currentY += 4;
    }

    // Country (if not Portugal)
    if (memberCountry && memberCountry !== 'Portugal') {
      doc.setFont('helvetica', 'bold');
      doc.text(memberCountry.toUpperCase(), x + 3, currentY);
    }

    // Sender info (REMETENTE) - small at bottom
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const senderY = y + labelHeight - 8;
    doc.text('Remetente:', x + 3, senderY);
    doc.text(options.senderName || options.buildingName, x + 3, senderY + 3);
    const senderAddressShort = options.senderAddress || options.buildingAddress;
    const senderLines = doc.splitTextToSize(senderAddressShort, labelWidth - 6);
    if (senderLines[0]) {
      doc.text(senderLines[0], x + 3, senderY + 6);
    }

    // CTT logo area placeholder (top right)
    doc.setFontSize(6);
    doc.text('CORREIO', x + labelWidth - 18, y + 5);
    doc.text('CERTIFICADO', x + labelWidth - 18, y + 8);

    labelIndex++;
  });

  if (download) {
    const filename = `Etiquetas_Correio_Certificado_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } else {
    return doc.output('blob');
  }
};

/**
 * Generate a control sheet for certified mail tracking
 * Lists all members with spaces for tracking numbers
 */
export const generateCertifiedMailControlSheet = (
  members: Member[],
  options: AddressLabelOptions,
  download: boolean = true
): Blob | void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const marginLeft = 15;
  const marginTop = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - marginLeft * 2;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTROLO DE ENVIOS - CORREIO CERTIFICADO', marginLeft, marginTop);

  // Building info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Edifício: ${options.buildingName}`, marginLeft, marginTop + 8);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, marginLeft, marginTop + 13);

  // Table header
  const tableTop = marginTop + 25;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  // Draw table header background
  doc.setFillColor(220, 220, 220);
  doc.rect(marginLeft, tableTop, contentWidth, 8, 'F');

  // Header text
  doc.text('#', marginLeft + 2, tableTop + 5);
  doc.text('Nome do Condómino', marginLeft + 10, tableTop + 5);
  doc.text('Fração', marginLeft + 80, tableTop + 5);
  doc.text('Nº Certificado CTT', marginLeft + 105, tableTop + 5);
  doc.text('Entregue', marginLeft + 160, tableTop + 5);

  // Table rows
  doc.setFont('helvetica', 'normal');
  let currentY = tableTop + 8;

  members.forEach((member, index) => {
    // Check if we need a new page
    if (currentY > 270) {
      doc.addPage();
      currentY = marginTop;

      // Repeat header on new page
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(220, 220, 220);
      doc.rect(marginLeft, currentY, contentWidth, 8, 'F');
      doc.text('#', marginLeft + 2, currentY + 5);
      doc.text('Nome do Condómino', marginLeft + 10, currentY + 5);
      doc.text('Fração', marginLeft + 80, currentY + 5);
      doc.text('Nº Certificado CTT', marginLeft + 105, currentY + 5);
      doc.text('Entregue', marginLeft + 160, currentY + 5);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
    }

    // Row background (alternate colors)
    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(marginLeft, currentY, contentWidth, 10, 'F');
    }

    // Row data
    doc.setFontSize(8);
    doc.text(String(index + 1), marginLeft + 2, currentY + 6);

    // Truncate long names
    const nameText = member.name.length > 35 ? member.name.substring(0, 32) + '...' : member.name;
    doc.text(nameText, marginLeft + 10, currentY + 6);

    const fractionText = member.fraction || member.apartment || '-';
    doc.text(fractionText, marginLeft + 80, currentY + 6);

    // Empty space for tracking number (to fill manually)
    doc.setDrawColor(200, 200, 200);
    doc.line(marginLeft + 105, currentY + 7, marginLeft + 155, currentY + 7);

    // Checkbox for delivery confirmation
    doc.rect(marginLeft + 163, currentY + 2, 5, 5);

    currentY += 10;
  });

  // Footer with instructions
  currentY += 10;
  if (currentY > 260) {
    doc.addPage();
    currentY = marginTop;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Instruções:', marginLeft, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('1. Imprimir este controlo e as etiquetas de endereço', marginLeft + 5, currentY);
  currentY += 5;
  doc.text('2. Enviar por Correio Certificado nos CTT', marginLeft + 5, currentY);
  currentY += 5;
  doc.text('3. Registar os números de certificado recebidos no sistema', marginLeft + 5, currentY);
  currentY += 5;
  doc.text('4. Marcar quando confirmada a entrega (tracking CTT)', marginLeft + 5, currentY);

  if (download) {
    const filename = `Controlo_Correio_Certificado_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } else {
    return doc.output('blob');
  }
};

/**
 * Calculate estimated cost for certified mail
 * Based on CTT Portugal 2025 rates
 */
export const calculateCertifiedMailCost = (numMembers: number): { total: number; perUnit: number } => {
  // CTT Correio Certificado Nacional rates (approximate 2025)
  const baseCost = 3.50; // Base certified mail cost
  const registeredCost = 1.20; // Registered/tracking cost
  const perUnitCost = baseCost + registeredCost; // ~4.70 EUR per letter

  return {
    perUnit: perUnitCost,
    total: perUnitCost * numMembers
  };
};
