/**
 * Motor de geração de cartas personalizadas
 * Processa templates HTML com variáveis dinâmicas
 */

interface Member {
  id: string;
  name: string;
  email?: string;
  fraction?: string;
  permillage?: number;
  phone?: string;
}

interface Building {
  id: string;
  name: string;
  address: string;
  city?: string;
  postalCode?: string;
  iban?: string;
  administrator?: string;
  adminPhone?: string;
  adminEmail?: string;
}

interface PaymentInfo {
  due: number;
  dueDate: string;
  period: string;
  originalDueDate?: string;
  newQuota?: number;
  monthlyQuota?: number;
  startDate?: string;
  iban?: string;
  operativeBudgetQuota?: number;
  reserveFundQuota?: number;
}

interface MeetingInfo {
  date: string;
  time: string;
  location: string;
  secondCallDate?: string;
  secondCallTime?: string;
}

interface AssemblyInfo {
  number: number;
  date: string;
  agenda: string;
}

/**
 * Substituir variáveis no template usando sintaxe {{variable}} e ${variable}
 */
const replaceVariables = (template: string, variables: Record<string, any>): string => {
  let result = template;
  
  // Função recursiva para aceder a propriedades aninhadas
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  };
  
  // Processar variáveis com sintaxe {{variable}} e {{object.property}}
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim();
    
    // Verificar se tem filtros (ex: {{date.today | year}})
    if (trimmedVar.includes('|')) {
      const [varPath, filter] = trimmedVar.split('|').map(s => s.trim());
      let value = getNestedValue(variables, varPath);
      
      // Aplicar filtros
      switch (filter) {
        case 'year':
          value = new Date(value).getFullYear();
          break;
        case 'date':
          value = new Date(value).toLocaleDateString('pt-PT');
          break;
        case 'currency':
          value = `${parseFloat(value).toFixed(2)}€`;
          break;
        default:
          // Sem filtro aplicado
          break;
      }
      
      return value;
    }
    
    const value = getNestedValue(variables, trimmedVar);
    return value !== undefined ? value : match;
  });
  
  // Processar variáveis com sintaxe ${variable} e ${object.property}
  result = result.replace(/\$\{([^}]+)\}/g, (match, variable) => {
    const trimmedVar = variable.trim();
    const value = getNestedValue(variables, trimmedVar);
    return value !== undefined ? value : match;
  });
  
  return result;
};

/**
 * Formatar data para português
 */
const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatar valor monetário
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

/**
 * Gerar conteúdo de carta personalizada
 */
export const generateLetterContent = async (
  templateContent: string,
  member: Member,
  building: Building,
  paymentInfo?: PaymentInfo,
  meetingInfo?: MeetingInfo,
  assemblyInfo?: AssemblyInfo
): Promise<string> => {
  try {
    // Preparar dados para substituição
    const today = new Date();
    
    const variables = {
      member: {
        name: member.name,
        fraction: member.fraction || 'N/A',
        permillage: member.permillage || 0,
        email: member.email || '',
        phone: member.phone || ''
      },
      building: {
        name: building.name,
        address: building.address,
        city: building.city || 'Lisboa',
        postalCode: building.postalCode || '',
        iban: building.iban || '',
        administrator: building.administrator || 'Administração',
        adminPhone: building.adminPhone || '',
        adminEmail: building.adminEmail || ''
      },
      date: {
        today: today.toISOString().split('T')[0],
        formatted: formatDate(today),
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      },
      payment: paymentInfo ? {
        due: formatCurrency(paymentInfo.due),
        dueDate: paymentInfo.dueDate,
        period: paymentInfo.period,
        originalDueDate: paymentInfo.originalDueDate || '',
        newQuota: paymentInfo.newQuota ? formatCurrency(paymentInfo.newQuota) : '',
        monthlyQuota: paymentInfo.monthlyQuota ? formatCurrency(paymentInfo.monthlyQuota) : '',
        startDate: paymentInfo.startDate || '',
        iban: paymentInfo.iban || building.iban || '',
        operativeBudgetQuota: paymentInfo.operativeBudgetQuota ? formatCurrency(paymentInfo.operativeBudgetQuota) : '',
        reserveFundQuota: paymentInfo.reserveFundQuota ? formatCurrency(paymentInfo.reserveFundQuota) : ''
      } : {},
      meeting: meetingInfo ? {
        date: formatDate(meetingInfo.date),
        time: meetingInfo.time,
        location: meetingInfo.location,
        secondCallDate: meetingInfo.secondCallDate ? formatDate(meetingInfo.secondCallDate) : '',
        secondCallTime: meetingInfo.secondCallTime || ''
      } : {},
      assembly: assemblyInfo ? {
        number: assemblyInfo.number,
        date: formatDate(assemblyInfo.date),
        agenda: assemblyInfo.agenda
      } : {}
    };
    
    // Substituir variáveis no template
    const processedContent = replaceVariables(templateContent, variables);
    
    return processedContent;
  } catch (error) {
    console.error('Erro ao gerar conteúdo da carta:', error);
    throw new Error('Falha na geração do conteúdo da carta');
  }
};

/**
 * Carregar template de ficheiro
 */
export const loadTemplate = async (templatePath: string): Promise<string> => {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Falha ao carregar template: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Erro ao carregar template:', error);
    throw new Error('Falha no carregamento do template');
  }
};

/**
 * Templates predefinidos
 */
export const TEMPLATES = {
  LATE_PAYMENT: '/src/templates/late_payment_letter.html',
  BUDGET_APPROVAL: '/src/templates/presupuesto_template.html',
  MEETING_NOTICE: '/src/templates/meeting_notice.html',
  GENERAL_NOTICE: '/src/templates/general_notice.html'
};

/**
 * Gerar múltiplas cartas para uma lista de membros
 */
export const generateMultipleLetters = async (
  templateContent: string,
  members: Member[],
  building: Building,
  paymentInfo?: PaymentInfo,
  meetingInfo?: MeetingInfo,
  assemblyInfo?: AssemblyInfo
): Promise<{ member: Member; content: string }[]> => {
  try {
    const results = await Promise.all(
      members.map(async (member) => {
        const content = await generateLetterContent(
          templateContent,
          member,
          building,
          paymentInfo,
          meetingInfo,
          assemblyInfo
        );
        return { member, content };
      })
    );
    
    return results;
  } catch (error) {
    console.error('Erro ao gerar múltiplas cartas:', error);
    throw new Error('Falha na geração de múltiplas cartas');
  }
};

export default {
  generateLetterContent,
  loadTemplate,
  generateMultipleLetters,
  TEMPLATES
};