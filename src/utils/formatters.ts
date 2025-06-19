import { format, parseISO, isValid } from 'date-fns';
import { pt } from 'date-fns/locale';

// === FORMATAÇÃO DE MOEDA ===

/**
 * Formatar valor para moeda portuguesa (EUR)
 */
export const formatCurrency = (
  amount: number | string,
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return showSymbol ? '0,00 €' : '0,00';
  }

  const formatter = new Intl.NumberFormat('pt-PT', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits,
    maximumFractionDigits
  });

  return formatter.format(numericAmount);
};

/**
 * Formatar valor para moeda compacta (K, M)
 */
export const formatCurrencyCompact = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '0 €';
  
  const absAmount = Math.abs(numericAmount);
  const sign = numericAmount < 0 ? '-' : '';
  
  if (absAmount >= 1000000) {
    return `${sign}${(absAmount / 1000000).toFixed(1)}M €`;
  } else if (absAmount >= 1000) {
    return `${sign}${(absAmount / 1000).toFixed(1)}K €`;
  } else {
    return formatCurrency(numericAmount);
  }
};

// === FORMATAÇÃO DE DATAS ===

/**
 * Formatar data para formato português
 */
export const formatDate = (
  date: string | Date,
  formatString: string = 'dd/MM/yyyy'
): string => {
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Tentar parser ISO primeiro, depois formato português
      dateObj = parseISO(date);
      if (!isValid(dateObj)) {
        // Tentar formato dd/MM/yyyy
        const [day, month, year] = date.split('/');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Data inválida';
    }
    
    return format(dateObj, formatString, { locale: pt });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

/**
 * Formatar data para texto legível
 */
export const formatDateText = (date: string | Date): string => {
  return formatDate(date, "d 'de' MMMM 'de' yyyy");
};

/**
 * Formatar data e hora
 */
export const formatDateTime = (
  date: string | Date,
  time?: string
): string => {
  const formattedDate = formatDate(date);
  
  if (time) {
    return `${formattedDate} às ${time}`;
  }
  
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formatar data relativa (hoje, ontem, etc.)
 */
export const formatDateRelative = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays === -1) return 'Amanhã';
    if (diffInDays > 0 && diffInDays <= 7) return `Há ${diffInDays} dias`;
    if (diffInDays < 0 && diffInDays >= -7) return `Em ${Math.abs(diffInDays)} dias`;
    
    return formatDate(dateObj);
  } catch (error) {
    return formatDate(date);
  }
};

// === FORMATAÇÃO DE NÚMEROS ===

/**
 * Formatar percentagem
 */
export const formatPercentage = (
  value: number | string,
  decimals: number = 1
): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return '0%';
  
  return new Intl.NumberFormat('pt-PT', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue / 100);
};

/**
 * Formatar número com separadores de milhares
 */
export const formatNumber = (
  value: number | string,
  decimals: number = 0
): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return '0';
  
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue);
};

/**
 * Formatar permilagem
 */
export const formatPermillage = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return '0‰';
  
  return `${formatNumber(numericValue, 1)}‰`;
};

// === FORMATAÇÃO DE CONTACTOS ===

/**
 * Formatar número de telefone português
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remover espaços e caracteres especiais
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Formato português: 9XX XXX XXX
  if (cleanPhone.length === 9) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  
  // Se não for formato padrão, retornar como está
  return phone;
};

/**
 * Formatar email (truncar se muito longo)
 */
export const formatEmail = (email: string, maxLength: number = 30): string => {
  if (!email) return '';
  
  if (email.length <= maxLength) return email;
  
  const [localPart, domain] = email.split('@');
  const truncatedLocal = localPart.slice(0, maxLength - domain.length - 4) + '...';
  
  return `${truncatedLocal}@${domain}`;
};

// === FORMATAÇÃO DE CÓDIGOS ===

/**
 * Formatar IBAN português
 */
export const formatIBAN = (iban: string): string => {
  if (!iban) return '';
  
  // Remover espaços e converter para maiúsculas
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Formato português: PT50 0000 0000 0000 0000 0000 0
  if (cleanIban.length === 25 && cleanIban.startsWith('PT')) {
    return cleanIban.replace(/(.{4})/g, '$1 ').trim();
  }
  
  return iban;
};

/**
 * Formatar código postal português
 */
export const formatPostalCode = (postalCode: string): string => {
  if (!postalCode) return '';
  
  // Remover caracteres especiais
  const cleanCode = postalCode.replace(/\D/g, '');
  
  // Formato português: XXXX-XXX
  if (cleanCode.length === 7) {
    return `${cleanCode.slice(0, 4)}-${cleanCode.slice(4)}`;
  }
  
  return postalCode;
};

/**
 * Formatar número fiscal português
 */
export const formatFiscalNumber = (fiscalNumber: string): string => {
  if (!fiscalNumber) return '';
  
  // Remover caracteres especiais
  const cleanNumber = fiscalNumber.replace(/\D/g, '');
  
  // Formato português: XXX XXX XXX
  if (cleanNumber.length === 9) {
    return `${cleanNumber.slice(0, 3)} ${cleanNumber.slice(3, 6)} ${cleanNumber.slice(6)}`;
  }
  
  return fiscalNumber;
};

// === FORMATAÇÃO DE ESTADOS ===

/**
 * Formatar estado com cor
 */
export const formatStatus = (
  status: string,
  translations: Record<string, string> = {}
): { text: string; variant: string } => {
  const statusMap: Record<string, { text: string; variant: string }> = {
    // Estados gerais
    active: { text: 'Ativo', variant: 'success' },
    inactive: { text: 'Inativo', variant: 'secondary' },
    pending: { text: 'Pendente', variant: 'warning' },
    completed: { text: 'Concluído', variant: 'success' },
    cancelled: { text: 'Cancelado', variant: 'destructive' },
    
    // Estados de pagamento
    paid: { text: 'Pago', variant: 'success' },
    unpaid: { text: 'Por pagar', variant: 'destructive' },
    partial: { text: 'Pago parcialmente', variant: 'warning' },
    overdue: { text: 'Em atraso', variant: 'destructive' },
    
    // Estados de convocatória
    draft: { text: 'Rascunho', variant: 'secondary' },
    sent: { text: 'Enviada', variant: 'success' },
    
    // Estados de ata
    unsigned: { text: 'Por assinar', variant: 'warning' },
    signed: { text: 'Assinada', variant: 'success' },
    
    // Estados de reunião
    ordinary: { text: 'Ordinária', variant: 'default' },
    extraordinary: { text: 'Extraordinária', variant: 'warning' },
    urgent: { text: 'Urgente', variant: 'destructive' },
    
    // Estados de transação
    income: { text: 'Receita', variant: 'success' },
    expense: { text: 'Despesa', variant: 'destructive' },
    
    // Estados de presença
    present: { text: 'Presente', variant: 'success' },
    absent: { text: 'Ausente', variant: 'destructive' },
    represented: { text: 'Representado', variant: 'warning' }
  };
  
  // Usar tradução personalizada se fornecida
  const translation = translations[status];
  if (translation) {
    return { text: translation, variant: statusMap[status]?.variant || 'default' };
  }
  
  return statusMap[status] || { text: status, variant: 'default' };
};

// === FORMATAÇÃO DE LISTAS ===

/**
 * Formatar lista de nomes
 */
export const formatNameList = (
  names: string[],
  maxItems: number = 3
): string => {
  if (!names || names.length === 0) return '';
  
  if (names.length <= maxItems) {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} e ${names[1]}`;
    
    const lastItem = names[names.length - 1];
    const otherItems = names.slice(0, -1).join(', ');
    return `${otherItems} e ${lastItem}`;
  }
  
  const visibleNames = names.slice(0, maxItems - 1);
  const remainingCount = names.length - (maxItems - 1);
  
  return `${visibleNames.join(', ')} e mais ${remainingCount}`;
};

// === FORMATAÇÃO DE TAMANHOS ===

/**
 * Formatar tamanho de ficheiro
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// === FORMATAÇÃO PARA EXPORTAÇÃO ===

/**
 * Formatar data para nome de ficheiro
 */
export const formatDateForFilename = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Formatar data e hora para nome de ficheiro
 */
export const formatDateTimeForFilename = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd_HH-mm');
};

// === FUNÇÕES DE PARSE (INVERSO) ===

/**
 * Parse de moeda para número
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remover símbolos de moeda e espaços
  const cleanString = currencyString
    .replace(/[€\s]/g, '')
    .replace(',', '.');
  
  const result = parseFloat(cleanString);
  return isNaN(result) ? 0 : result;
};

/**
 * Parse de percentagem para número
 */
export const parsePercentage = (percentageString: string): number => {
  if (!percentageString) return 0;
  
  const cleanString = percentageString.replace('%', '');
  const result = parseFloat(cleanString);
  return isNaN(result) ? 0 : result;
};

export default {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateText,
  formatDateTime,
  formatDateRelative,
  formatPercentage,
  formatNumber,
  formatPermillage,
  formatPhoneNumber,
  formatEmail,
  formatIBAN,
  formatPostalCode,
  formatFiscalNumber,
  formatStatus,
  formatNameList,
  formatFileSize,
  formatDateForFilename,
  formatDateTimeForFilename,
  parseCurrency,
  parsePercentage
};