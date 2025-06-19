import { z } from 'zod';

// === VALIDACIONES COMUNES ===

// Email portugués
const emailSchema = z
  .string()
  .email('Email inválido')
  .optional()
  .or(z.literal(''));

// Teléfone português (9 dígitos)
const phoneSchema = z
  .string()
  .regex(/^(9[1236]|2\d)\d{7}$/, 'Número de telefone inválido (deve ter 9 dígitos)')
  .optional()
  .or(z.literal(''));

// IBAN português
const ibanSchema = z
  .string()
  .regex(/^PT50\d{21}$/, 'IBAN inválido (formato: PT50 seguido de 21 dígitos)')
  .optional()
  .or(z.literal(''));

// Código postal português
const postalCodeSchema = z
  .string()
  .regex(/^\d{4}-\d{3}$/, 'Código postal inválido (formato: 1234-567)')
  .optional()
  .or(z.literal(''));

// Número fiscal português
const fiscalNumberSchema = z
  .string()
  .regex(/^\d{9}$/, 'Número fiscal inválido (deve ter 9 dígitos)')
  .optional()
  .or(z.literal(''));

// Percentagem (0-100)
const percentageSchema = z
  .number()
  .min(0, 'Percentagem deve ser maior ou igual a 0')
  .max(100, 'Percentagem deve ser menor ou igual a 100');

// Montante monetário
const monetaryAmountSchema = z
  .number()
  .min(0, 'Montante deve ser maior ou igual a 0')
  .max(999999.99, 'Montante muito elevado');

// === ESQUEMAS DE ENTIDADES ===

// Esquema para Membro
export const memberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: emailSchema,
  phone: phoneSchema,
  fraction: z
    .string()
    .min(1, 'Fracção é obrigatória')
    .max(10, 'Fracção muito longa'),
  permillage: z
    .number()
    .min(0, 'Permilagem deve ser maior ou igual a 0')
    .max(1000, 'Permilagem inválida'),
  monthlyQuota: monetaryAmountSchema.optional(),
  isOwner: z.boolean().default(true),
  isResident: z.boolean().default(true),
  buildingId: z.string().uuid('ID do edifício inválido'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Esquema para Edifício
export const buildingSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, 'Nome do edifício deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  address: z
    .string()
    .min(5, 'Morada deve ter pelo menos 5 caracteres')
    .max(200, 'Morada muito longa'),
  city: z
    .string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(50, 'Nome da cidade muito longo')
    .default('Lisboa'),
  postalCode: postalCodeSchema,
  iban: ibanSchema,
  administratorName: z
    .string()
    .min(2, 'Nome do administrador muito curto')
    .max(100, 'Nome do administrador muito longo')
    .optional()
    .or(z.literal('')),
  administratorPhone: phoneSchema,
  administratorEmail: emailSchema,
  totalUnits: z
    .number()
    .int('Número de unidades deve ser um inteiro')
    .min(1, 'Deve ter pelo menos 1 unidade')
    .max(500, 'Número de unidades muito elevado')
    .optional(),
  fiscalNumber: fiscalNumberSchema,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Esquema para Transacção
export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  description: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição muito longa'),
  amount: z
    .number()
    .min(-999999.99, 'Montante muito baixo')
    .max(999999.99, 'Montante muito elevado'),
  transactionDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Data inválida'),
  categoryId: z.string().uuid('ID da categoria inválido'),
  buildingId: z.string().uuid('ID do edifício inválido'),
  memberId: z.string().uuid('ID do membro inválido').optional(),
  paymentMethod: z
    .enum(['cash', 'transfer', 'check', 'mb_way', 'card'])
    .default('transfer'),
  reference: z
    .string()
    .max(50, 'Referência muito longa')
    .optional()
    .or(z.literal('')),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Esquema para Categoria de Transacção
export const transactionCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, 'Nome da categoria deve ter pelo menos 2 caracteres')
    .max(50, 'Nome da categoria muito longo'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser receita ou despesa' })
  }),
  description: z
    .string()
    .max(200, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  buildingId: z.string().uuid('ID do edifício inválido').optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Esquema para Acta
export const minutesSchema = z.object({
  id: z.string().uuid().optional(),
  buildingId: z.string().uuid('ID do edifício inválido'),
  meetingDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Data inválida'),
  meetingType: z
    .enum(['ordinary', 'extraordinary', 'urgent'])
    .default('ordinary'),
  location: z
    .string()
    .min(3, 'Local deve ter pelo menos 3 caracteres')
    .max(100, 'Local muito longo'),
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida (formato: HH:MM)'),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida (formato: HH:MM)')
    .optional()
    .or(z.literal('')),
  presidentName: z
    .string()
    .min(2, 'Nome do presidente deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  secretaryName: z
    .string()
    .min(2, 'Nome do secretário deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  content: z.string().optional(),
  conclusions: z.string().optional(),
  isSigned: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Esquema para Convocatória
export const convocatoriaSchema = z.object({
  id: z.string().uuid().optional(),
  buildingId: z.string().uuid('ID do edifício inválido'),
  meetingType: z
    .enum(['ordinary', 'extraordinary', 'urgent'])
    .default('ordinary'),
  meetingDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Data inválida')
    .refine((date) => {
      const meetingDate = new Date(date);
      const now = new Date();
      return meetingDate > now;
    }, 'Data da reunião deve ser no futuro'),
  meetingTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida (formato: HH:MM)'),
  secondCallTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora inválida (formato: HH:MM)')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .min(3, 'Local deve ter pelo menos 3 caracteres')
    .max(100, 'Local muito longo'),
  presidentName: z
    .string()
    .min(2, 'Nome do presidente deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .optional()
    .or(z.literal('')),
  administratorName: z
    .string()
    .min(2, 'Nome do administrador deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .optional()
    .or(z.literal('')),
  status: z.enum(['draft', 'sent', 'cancelled']).default('draft'),
  content: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Esquema para Item de Agenda
export const agendaItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(100, 'Título muito longo'),
  description: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),
  orderNumber: z.number().int().positive().optional()
});

// === VALIDAÇÕES DE FORMULÁRIO ===

// Formulário de login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'Password deve ter pelo menos 6 caracteres')
    .max(50, 'Password muito longa')
});

// Formulário de mudança de password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password actual é obrigatória'),
  newPassword: z
    .string()
    .min(6, 'Nova password deve ter pelo menos 6 caracteres')
    .max(50, 'Password muito longa'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As passwords não coincidem',
  path: ['confirmPassword']
});

// === FUNÇÕES DE VALIDAÇÃO PERSONALIZADAS ===

// Validar IBAN português
export const validatePortugueseIBAN = (iban: string): boolean => {
  if (!iban) return true; // IBAN é opcional
  
  // Remover espaços e converter para maiúsculas
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Verificar formato português
  if (!/^PT50\d{21}$/.test(cleanIban)) {
    return false;
  }
  
  // Verificar dígitos de controlo (algoritmo mod-97)
  const rearrangedIban = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearrangedIban.replace(/[A-Z]/g, (char) => 
    (char.charCodeAt(0) - 55).toString()
  );
  
  const remainder = numericIban.split('').reduce((acc, digit) => {
    return (parseInt(acc + digit) % 97).toString();
  }, '');
  
  return parseInt(remainder) === 1;
};

// Validar número fiscal português
export const validatePortugueseFiscalNumber = (fiscalNumber: string): boolean => {
  if (!fiscalNumber) return true; // Número fiscal é opcional
  
  if (!/^\d{9}$/.test(fiscalNumber)) {
    return false;
  }
  
  const digits = fiscalNumber.split('').map(Number);
  const checkDigit = digits[8];
  
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }
  
  const remainder = sum % 11;
  const expectedCheckDigit = remainder < 2 ? 0 : 11 - remainder;
  
  return checkDigit === expectedCheckDigit;
};

// Validar fracção única no edifício
export const validateUniqueFraction = async (
  fraction: string,
  buildingId: string,
  excludeId?: string
): Promise<boolean> => {
  // Esta função será implementada quando tivermos acesso aos serviços
  // Por agora, retorna true
  return true;
};

// === MENSAGENS DE ERRO PERSONALIZADAS ===

export const errorMessages = {
  required: 'Este campo é obrigatório',
  email: 'Email inválido',
  phone: 'Número de telefone inválido',
  iban: 'IBAN inválido',
  postalCode: 'Código postal inválido (formato: 1234-567)',
  fiscalNumber: 'Número fiscal inválido',
  minLength: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  maxLength: (max: number) => `Deve ter no máximo ${max} caracteres`,
  min: (min: number) => `Deve ser maior ou igual a ${min}`,
  max: (max: number) => `Deve ser menor ou igual a ${max}`,
  futureDate: 'Data deve ser no futuro',
  pastDate: 'Data deve ser no passado',
  timeFormat: 'Hora inválida (formato: HH:MM)',
  dateFormat: 'Data inválida',
  uniqueFraction: 'Esta fracção já existe neste edifício',
  uniqueEmail: 'Este email já está em uso'
};

// === VALIDAÇÃO CONDICIONAL ===

// Schema para membro com validações condicionais
export const memberFormSchema = memberSchema.refine(
  (data) => {
    // Se é proprietário, permilagem é obrigatória
    if (data.isOwner && data.permillage <= 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Permilagem é obrigatória para proprietários',
    path: ['permillage']
  }
);

// Schema para convocatória com validação de hora segunda convocatória
export const convocatoriaFormSchema = convocatoriaSchema.refine(
  (data) => {
    if (data.secondCallTime && data.meetingTime) {
      const [meetingHour, meetingMinute] = data.meetingTime.split(':').map(Number);
      const [secondHour, secondMinute] = data.secondCallTime.split(':').map(Number);
      
      const meetingMinutes = meetingHour * 60 + meetingMinute;
      const secondMinutes = secondHour * 60 + secondMinute;
      
      // Segunda convocatória deve ser pelo menos 30 minutos depois
      return secondMinutes >= meetingMinutes + 30;
    }
    return true;
  },
  {
    message: 'Hora da segunda convocatória deve ser pelo menos 30 minutos após a primeira',
    path: ['secondCallTime']
  }
);

export default {
  memberSchema,
  buildingSchema,
  transactionSchema,
  transactionCategorySchema,
  minutesSchema,
  convocatoriaSchema,
  agendaItemSchema,
  loginSchema,
  changePasswordSchema,
  memberFormSchema,
  convocatoriaFormSchema,
  validatePortugueseIBAN,
  validatePortugueseFiscalNumber,
  validateUniqueFraction,
  errorMessages
};