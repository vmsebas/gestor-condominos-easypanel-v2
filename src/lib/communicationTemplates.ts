/**
 * Communication Templates - Professional Portuguese Templates
 * For emails, WhatsApp, and other communications with condominium members
 * Legal compliance: Lei n.º 8/2022, Código Civil Art. 1430.º and following
 */

export interface TemplateData {
  // Building information
  building_name: string;
  building_address: string;
  building_postal_code?: string;
  building_city?: string;

  // Member information
  member_name: string;
  member_apartment?: string;
  member_fraction?: string;

  // Meeting/Assembly information
  assembly_type: 'ordinary' | 'extraordinary';
  assembly_number?: number;
  meeting_date: string; // Format: "15 de julho de 2025"
  meeting_time: string; // Format: "14:30"
  first_call_time?: string;
  second_call_time?: string;
  location: string;

  // Agenda items
  agenda_items?: Array<{
    item_number: number;
    title: string;
    description?: string;
  }>;

  // Additional information
  convocatoria_number?: number;
  minute_number?: number;
  quota_amount?: number;
  quota_month?: string;
  quota_due_date?: string;
  payment_reference?: string;
  custom_message?: string;

  // Sender information
  sender_name?: string;
  sender_role?: string; // "Administrador", "Presidente da Mesa", etc.
  sender_email?: string;
  sender_phone?: string;
}

// ============================================================================
// CONVOCATÓRIA - EMAIL TEMPLATES
// ============================================================================

export const convocatoriaEmailSubject = (data: TemplateData): string => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  return `Convocatória - Assembleia ${assemblyType} de Condóminos - ${data.building_name}`;
};

export const convocatoriaEmailBody = (data: TemplateData): string => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  const assemblyTypeFull = data.assembly_type === 'ordinary'
    ? 'Assembleia Ordinária de Condóminos'
    : 'Assembleia Extraordinária de Condóminos';

  // Debug: Log agenda items
  console.log('📧 Agenda items in template:', data.agenda_items);
  console.log('📧 Agenda items count:', data.agenda_items?.length || 0);

  // Format agenda items - professional style with icons
  const agendaItemsText = data.agenda_items && data.agenda_items.length > 0
    ? data.agenda_items.map(item => {
        const description = item.description ? `\n   ${item.description}` : '';
        const voteIcon = item.type === 'votacion' ? '🗳️ ' : '📋 ';
        const voteInfo = item.type === 'votacion'
          ? ` (Votação - ${item.requiredMajority === 'simple' ? 'Maioria Simples' : 'Maioria Qualificada'})`
          : '';
        return `${voteIcon}${item.item_number}. ${item.title}${voteInfo}${description}`;
      }).join('\n\n')
    : '(Consultar documentação anexa)';

  console.log('📧 Agenda items formatted text:', agendaItemsText.substring(0, 100));

  // First and second call times
  const firstCallTime = data.first_call_time || data.meeting_time;
  const secondCallTime = data.second_call_time || 'meia hora depois';

  return `${data.building_name}
${data.building_address}

Exmo(a). Sr(a). ${data.member_name}
${data.member_apartment ? `Fração ${data.member_apartment}` : ''}


CONVOCATÓRIA N.º ${data.convocatoria_number || data.assembly_number || '[número]'}
${assemblyTypeFull}


Exmo(a). Condómino(a),

Nos termos do disposto no artigo 1432.º do Código Civil, venho por este meio convocar V. Exa. para a ${assemblyTypeFull} do condomínio supra identificado, a realizar-se:

📅 DATA: ${data.meeting_date}

⏰ HORA:
   • 1.ª Convocatória: ${firstCallTime} (quórum: maioria dos votos correspondentes ao valor total do prédio)
   • 2.ª Convocatória: ${secondCallTime} (quórum: condóminos presentes ou representados)

📍 LOCAL: ${data.location}


═══════════════════════════════════════════════════════════════

ORDEM DE TRABALHOS

${agendaItemsText}

═══════════════════════════════════════════════════════════════


INFORMAÇÕES IMPORTANTES:

👤 REPRESENTAÇÃO:
   Nos termos do artigo 1431.º, n.º 3 do Código Civil, poderá fazer-se representar
   por mandatário mediante procuração escrita, a entregar no início da assembleia.
   Modelo de procuração disponível em anexo.

📂 DOCUMENTAÇÃO:
   A documentação referente aos assuntos em ordem de trabalhos encontra-se
   disponível para consulta prévia, podendo ser solicitada à administração.

✉️ CONFIRMAÇÃO:
   Agradecemos confirmação da sua presença ou representação por email ou telefone.


Sem outro assunto de momento, apresento os meus melhores cumprimentos.


${data.sender_name || 'O(A) Administrador(a)'}
${data.sender_role || 'Administração do Condomínio'}
${data.sender_email ? `📧 ${data.sender_email}` : ''}
${data.sender_phone ? `📱 ${data.sender_phone}` : ''}


──────────────────────────────────────────────────────────────
Este email constitui convocatória oficial nos termos da Lei n.º 8/2022
e do artigo 1432.º do Código Civil.
──────────────────────────────────────────────────────────────`;
};

// ============================================================================
// CONVOCATÓRIA - WHATSAPP TEMPLATES
// ============================================================================

export const convocatoriaWhatsAppMessage = (data: TemplateData): string => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  const firstCallTime = data.first_call_time || data.meeting_time;

  return `Olá *${data.member_name}*,

📅 *Lembrete: Assembleia ${assemblyType}*

🗓️ Data: ${data.meeting_date}
⏰ Hora: ${firstCallTime}
📍 Local: ${data.location}

━━━━━━━━━━━━━━━━━━━━━

✉️ A convocatória oficial com toda a informação foi enviada por *email/correio registado* conforme a lei.

Este WhatsApp é apenas um lembrete informal, sem valor jurídico.

━━━━━━━━━━━━━━━━━━━━━

✅ Por favor confirme a sua presença.

${data.sender_name || 'A Administração'}
${data.building_name}`;
};

// ============================================================================
// ACTA - WHATSAPP TEMPLATES
// ============================================================================

export const actaWhatsAppMessage = (data: TemplateData): string => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';

  return `Olá *${data.member_name}*,

📄 *Acta da Assembleia ${assemblyType}*
${data.minute_number ? `Acta n.º ${data.minute_number}` : ''}

📅 Realizada em: ${data.meeting_date}

━━━━━━━━━━━━━━━━━━━━━

✉️ A acta completa em PDF foi enviada por *email* para consulta e arquivo.

⚖️ Prazo de impugnação: 3 meses (Art. 1435.º do Código Civil)

━━━━━━━━━━━━━━━━━━━━━

Para esclarecimentos, contacte a administração.

${data.sender_name || 'A Administração'}
${data.building_name}`;
};

// ============================================================================
// ACTA - EMAIL TEMPLATES
// ============================================================================

export const actaEmailSubject = (data: TemplateData): string => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';
  return `Acta ${data.minute_number ? `n.º ${data.minute_number}` : ''} - Assembleia ${assemblyType} - ${data.building_name}`;
};

export const actaEmailBody = (data: TemplateData): string => {
  const assemblyType = data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária';

  return `Exmo(a). Sr(a). ${data.member_name}${data.member_apartment ? `, Fração ${data.member_apartment}` : ''}

Nos termos do disposto no artigo 1434.º do Código Civil, serve o presente email para remeter a Acta ${data.minute_number ? `n.º ${data.minute_number}` : ''} da Assembleia ${assemblyType} de Condóminos do edifício "${data.building_name}", realizada no dia ${data.meeting_date}.

A acta contém:
• Registo de presenças e representações
• Verificação de quórum
• Deliberações tomadas sobre cada ponto da ordem do dia
• Resultados das votações
• Assinaturas do Presidente e Secretário da Mesa

Por favor, consulte o documento anexo em PDF para aceder à acta completa.

─────────────────────────────────────────────────────────────

PRAZO PARA IMPUGNAÇÃO

Nos termos do artigo 1435.º do Código Civil, as deliberações da assembleia podem ser impugnadas judicialmente no prazo de 3 meses a contar da data da assembleia, se houver violação da lei ou do regulamento do condomínio.

─────────────────────────────────────────────────────────────

Para qualquer esclarecimento, não hesite em contactar.

Com os melhores cumprimentos,

${data.sender_name || 'A Administração'}
${data.sender_role || 'Administrador do Condomínio'}

${data.sender_email ? `📧 ${data.sender_email}` : ''}
${data.sender_phone ? `📱 ${data.sender_phone}` : ''}

─────────────────────────────────────────────────────────────

Este email e documento anexo têm valor legal nos termos da Lei n.º 8/2022.`;
};

// ============================================================================
// QUOTA - EMAIL TEMPLATES
// ============================================================================

export const quotaEmailSubject = (data: TemplateData): string => {
  return `Recibo de Quota - ${data.quota_month || 'Mensalidade'} - ${data.building_name}`;
};

export const quotaEmailBody = (data: TemplateData): string => {
  const amount = data.quota_amount ? `€${data.quota_amount.toFixed(2)}` : '[valor]';

  return `Exmo(a). Sr(a). ${data.member_name}${data.member_apartment ? `, Fração ${data.member_apartment}` : ''}

Serve o presente email para remeter o recibo de quota referente a ${data.quota_month || '[mês/período]'} do condomínio "${data.building_name}".

─────────────────────────────────────────────────────────────

DETALHES DO PAGAMENTO

💰 Valor: ${amount}
📅 Vencimento: ${data.quota_due_date || '[data]'}
${data.payment_reference ? `🔢 Referência MB: ${data.payment_reference}` : ''}

─────────────────────────────────────────────────────────────

DADOS BANCÁRIOS

[Incluir aqui os dados bancários do condomínio]
IBAN: PT50...
Titular: ${data.building_name}

─────────────────────────────────────────────────────────────

IMPORTANTE

• Por favor, efetue o pagamento até à data de vencimento.
• Em caso de pagamento por transferência, use como referência: ${data.member_apartment || '[fração]'}
• Consulte o recibo completo em PDF anexo.
• Em caso de dúvidas ou dificuldades de pagamento, contacte a administração.

─────────────────────────────────────────────────────────────

Com os melhores cumprimentos,

${data.sender_name || 'A Administração'}
${data.sender_role || 'Administrador do Condomínio'}

${data.sender_email ? `📧 ${data.sender_email}` : ''}
${data.sender_phone ? `📱 ${data.sender_phone}` : ''}`;
};

// ============================================================================
// NOTA INFORMATIVA - EMAIL TEMPLATES
// ============================================================================

export const noteEmailSubject = (data: TemplateData): string => {
  return `Nota Informativa - ${data.building_name}`;
};

export const noteEmailBody = (data: TemplateData): string => {
  return `Exmo(a). Sr(a). ${data.member_name}${data.member_apartment ? `, Fração ${data.member_apartment}` : ''}

${data.custom_message || '[Conteúdo da nota informativa]'}

─────────────────────────────────────────────────────────────

Em caso de dúvidas, não hesite em contactar a administração.

Com os melhores cumprimentos,

${data.sender_name || 'A Administração'}
${data.sender_role || 'Administrador do Condomínio'}

${data.building_name}
${data.building_address}

${data.sender_email ? `📧 ${data.sender_email}` : ''}
${data.sender_phone ? `📱 ${data.sender_phone}` : ''}`;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format date to Portuguese long format
 * Example: "15 de julho de 2025"
 */
export const formatDatePortuguese = (date: Date | string): string => {
  try {
    // Handle ISO date strings (YYYY-MM-DD)
    if (typeof date === 'string') {
      // If it's ISO format without time (YYYY-MM-DD), append time to avoid timezone issues
      const dateStr = date.includes('T') ? date : `${date}T12:00:00`;
      const d = new Date(dateStr);

      if (isNaN(d.getTime())) {
        console.error('Invalid date string:', date);
        return date; // Return original string if invalid
      }

      return d.toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // Handle Date object
    const d = date as Date;
    if (isNaN(d.getTime())) {
      console.error('Invalid date object:', date);
      return String(date);
    }

    return d.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return String(date);
  }
};

/**
 * Format time to Portuguese format
 * Example: "14:30"
 */
export const formatTimePortuguese = (time: string | Date): string => {
  if (typeof time === 'string' && time.match(/^\d{2}:\d{2}/)) {
    return time;
  }
  const d = typeof time === 'string' ? new Date(time) : time;
  return d.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Generate WhatsApp Web URL with pre-filled message
 */
export const generateWhatsAppURL = (phoneNumber: string, message: string): string => {
  console.log('📱 Original phone number:', phoneNumber);

  // Remove all non-numeric characters (including +, spaces, dashes)
  let cleanPhone = phoneNumber.replace(/\D/g, '');
  console.log('📱 Cleaned phone number:', cleanPhone);

  // Ensure phone starts with country code (351 for Portugal)
  if (!cleanPhone.startsWith('351')) {
    // If it starts with 9 (Portuguese mobile), add 351
    if (cleanPhone.startsWith('9')) {
      cleanPhone = `351${cleanPhone}`;
    }
    // If it's very short, might be missing country code
    else if (cleanPhone.length === 9) {
      cleanPhone = `351${cleanPhone}`;
    }
  }

  console.log('📱 Final phone number for WhatsApp:', cleanPhone);

  // Validate phone number (should be 12 digits: 351 + 9 digits)
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    console.error('❌ Invalid phone number length:', cleanPhone.length);
    throw new Error(`Número de telefone inválido: ${phoneNumber}. Deve ter formato +351 9XX XXX XXX`);
  }

  // URL encode the message
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  console.log('📱 WhatsApp URL:', url.substring(0, 100) + '...');
  return url;
};

/**
 * Generate mailto: URL with pre-filled email
 * IMPORTANT: Uses %20 for spaces (RFC 6068 standard) instead of +
 * to ensure compatibility with Mac Mail and iOS Mail
 */
export const generateMailtoURL = (
  to: string,
  subject: string,
  body: string,
  cc?: string,
  bcc?: string
): string => {
  // RFC 6068: Spaces must be encoded as %20, not +
  // encodeURIComponent correctly uses %20 for spaces
  const encodeParam = (str: string): string => {
    return encodeURIComponent(str);
  };

  // Build query parameters manually to ensure proper encoding
  const params: string[] = [];
  params.push(`subject=${encodeParam(subject)}`);
  params.push(`body=${encodeParam(body)}`);
  if (cc) params.push(`cc=${encodeParam(cc)}`);
  if (bcc) params.push(`bcc=${encodeParam(bcc)}`);

  const queryString = params.join('&');

  console.log('📧 Mailto URL encoding:', {
    originalBodyLength: body.length,
    encodedLength: queryString.length,
    sample: queryString.substring(0, 150) + '...'
  });

  return `mailto:${to}?${queryString}`;
};

// ============================================================================
// TEMPLATE SELECTOR
// ============================================================================

export const getEmailTemplate = (
  type: 'convocatoria' | 'acta' | 'quota' | 'note',
  data: TemplateData
): { subject: string; body: string } => {
  switch (type) {
    case 'convocatoria':
      return {
        subject: convocatoriaEmailSubject(data),
        body: convocatoriaEmailBody(data)
      };
    case 'acta':
      return {
        subject: actaEmailSubject(data),
        body: actaEmailBody(data)
      };
    case 'quota':
      return {
        subject: quotaEmailSubject(data),
        body: quotaEmailBody(data)
      };
    case 'note':
      return {
        subject: noteEmailSubject(data),
        body: noteEmailBody(data)
      };
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
};

export const getWhatsAppTemplate = (
  type: 'convocatoria' | 'acta' | 'reminder' | 'note',
  data: TemplateData
): string => {
  switch (type) {
    case 'convocatoria':
      return convocatoriaWhatsAppMessage(data);
    case 'acta':
      return actaWhatsAppMessage(data);
    case 'reminder':
      return `*${data.building_name}*\n\n📢 Lembrete: ${data.custom_message || 'Mensagem'}`;
    case 'note':
      return `*${data.building_name}*\n\n${data.custom_message || 'Mensagem'}`;
    default:
      throw new Error(`Unknown WhatsApp template type: ${type}`);
  }
};
