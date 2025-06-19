/**
 * Utilidades de cálculo para gestão de condomínios
 */

// === CÁLCULOS DE CUOTAS ===

/**
 * Calcular cuota mensal baseada na permilagem
 */
export const calculateMonthlyQuota = (
  totalBudget: number,
  permillage: number,
  months: number = 12
): number => {
  if (totalBudget <= 0 || permillage <= 0 || months <= 0) return 0;
  
  const yearlyQuota = (totalBudget * permillage) / 1000;
  return Math.round((yearlyQuota / months) * 100) / 100;
};

/**
 * Calcular cuota anual baseada na permilagem
 */
export const calculateAnnualQuota = (
  totalBudget: number,
  permillage: number
): number => {
  if (totalBudget <= 0 || permillage <= 0) return 0;
  
  return Math.round(((totalBudget * permillage) / 1000) * 100) / 100;
};

/**
 * Calcular distribuição de cuotas por tipo de fundo
 */
export const calculateQuotaDistribution = (
  totalQuota: number,
  operativeBudgetPercentage: number = 70,
  reserveFundPercentage: number = 30
): {
  operativeBudget: number;
  reserveFund: number;
  total: number;
} => {
  if (totalQuota <= 0) {
    return { operativeBudget: 0, reserveFund: 0, total: 0 };
  }
  
  // Garantir que as percentagens somam 100%
  const totalPercentage = operativeBudgetPercentage + reserveFundPercentage;
  const adjustedOperative = (operativeBudgetPercentage / totalPercentage) * 100;
  const adjustedReserve = (reserveFundPercentage / totalPercentage) * 100;
  
  const operativeBudget = Math.round((totalQuota * adjustedOperative / 100) * 100) / 100;
  const reserveFund = Math.round((totalQuota * adjustedReserve / 100) * 100) / 100;
  
  return {
    operativeBudget,
    reserveFund,
    total: operativeBudget + reserveFund
  };
};

// === CÁLCULOS DE MOROSIDADE ===

/**
 * Calcular juros de mora
 */
export const calculateLateInterest = (
  principalAmount: number,
  annualInterestRate: number,
  daysLate: number
): number => {
  if (principalAmount <= 0 || annualInterestRate <= 0 || daysLate <= 0) return 0;
  
  const dailyRate = annualInterestRate / 365 / 100;
  const interest = principalAmount * dailyRate * daysLate;
  
  return Math.round(interest * 100) / 100;
};

/**
 * Calcular total em dívida incluindo juros
 */
export const calculateTotalDebt = (
  principalAmount: number,
  interestAmount: number,
  fees: number = 0
): number => {
  const total = (principalAmount || 0) + (interestAmount || 0) + (fees || 0);
  return Math.round(total * 100) / 100;
};

/**
 * Calcular dias em atraso
 */
export const calculateDaysLate = (dueDate: string | Date): number => {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  
  // Só contar como atraso se a data já passou
  if (due > now) return 0;
  
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * Calcular multa por atraso (percentagem fixa)
 */
export const calculateLateFee = (
  principalAmount: number,
  feePercentage: number = 5
): number => {
  if (principalAmount <= 0 || feePercentage <= 0) return 0;
  
  const fee = (principalAmount * feePercentage) / 100;
  return Math.round(fee * 100) / 100;
};

// === CÁLCULOS FINANCEIROS ===

/**
 * Calcular saldo mensal
 */
export const calculateMonthlyBalance = (
  income: number,
  expenses: number
): {
  balance: number;
  isPositive: boolean;
  percentage: number;
} => {
  const balance = (income || 0) - (expenses || 0);
  const isPositive = balance >= 0;
  
  // Calcular percentagem de gastos vs receitas
  let percentage = 0;
  if (income > 0) {
    percentage = Math.round((expenses / income) * 100);
  }
  
  return {
    balance: Math.round(balance * 100) / 100,
    isPositive,
    percentage
  };
};

/**
 * Calcular execução orçamental
 */
export const calculateBudgetExecution = (
  budgetAmount: number,
  actualAmount: number
): {
  variance: number;
  percentage: number;
  status: 'under' | 'over' | 'on_track';
} => {
  if (budgetAmount <= 0) {
    return { variance: 0, percentage: 0, status: 'on_track' };
  }
  
  const variance = actualAmount - budgetAmount;
  const percentage = Math.round((actualAmount / budgetAmount) * 100);
  
  let status: 'under' | 'over' | 'on_track' = 'on_track';
  if (percentage < 90) status = 'under';
  else if (percentage > 110) status = 'over';
  
  return {
    variance: Math.round(variance * 100) / 100,
    percentage,
    status
  };
};

/**
 * Calcular taxa de cobrança
 */
export const calculateCollectionRate = (
  totalDue: number,
  totalCollected: number
): {
  rate: number;
  pending: number;
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
} => {
  if (totalDue <= 0) {
    return { rate: 100, pending: 0, efficiency: 'excellent' };
  }
  
  const rate = Math.round((totalCollected / totalDue) * 100);
  const pending = Math.max(0, totalDue - totalCollected);
  
  let efficiency: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
  if (rate >= 95) efficiency = 'excellent';
  else if (rate >= 85) efficiency = 'good';
  else if (rate >= 70) efficiency = 'fair';
  
  return {
    rate,
    pending: Math.round(pending * 100) / 100,
    efficiency
  };
};

// === CÁLCULOS DE PREVISÃO ===

/**
 * Calcular previsão de receitas anuais
 */
export const calculateAnnualRevenueForecast = (
  monthlyQuotas: number[],
  collectionRate: number = 95
): {
  grossRevenue: number;
  netRevenue: number;
  expectedLosses: number;
} => {
  if (!monthlyQuotas || monthlyQuotas.length === 0) {
    return { grossRevenue: 0, netRevenue: 0, expectedLosses: 0 };
  }
  
  const grossRevenue = monthlyQuotas.reduce((sum, quota) => sum + (quota || 0), 0);
  const collectionRateDecimal = Math.min(100, Math.max(0, collectionRate)) / 100;
  const netRevenue = grossRevenue * collectionRateDecimal;
  const expectedLosses = grossRevenue - netRevenue;
  
  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    expectedLosses: Math.round(expectedLosses * 100) / 100
  };
};

/**
 * Calcular necessidades de reservas
 */
export const calculateReserveRequirements = (
  annualBudget: number,
  reserveTargetMonths: number = 6
): {
  currentRequired: number;
  recommendedMinimum: number;
  recommendedOptimal: number;
} => {
  if (annualBudget <= 0) {
    return { currentRequired: 0, recommendedMinimum: 0, recommendedOptimal: 0 };
  }
  
  const monthlyBudget = annualBudget / 12;
  const currentRequired = monthlyBudget * reserveTargetMonths;
  const recommendedMinimum = monthlyBudget * 3; // Mínimo 3 meses
  const recommendedOptimal = monthlyBudget * 12; // Óptimo 12 meses
  
  return {
    currentRequired: Math.round(currentRequired * 100) / 100,
    recommendedMinimum: Math.round(recommendedMinimum * 100) / 100,
    recommendedOptimal: Math.round(recommendedOptimal * 100) / 100
  };
};

// === CÁLCULOS DE PARTICIPAÇÃO ===

/**
 * Calcular quórum necessário
 */
export const calculateQuorum = (
  totalMembers: number,
  meetingType: 'ordinary' | 'extraordinary' = 'ordinary'
): {
  required: number;
  percentage: number;
} => {
  if (totalMembers <= 0) {
    return { required: 0, percentage: 0 };
  }
  
  // Quórum legal em Portugal:
  // Assembleia ordinária: maioria simples (50% + 1)
  // Assembleia extraordinária: 2/3
  const percentage = meetingType === 'extraordinary' ? 66.67 : 50.01;
  const required = Math.ceil((totalMembers * percentage) / 100);
  
  return {
    required,
    percentage: Math.round(percentage * 100) / 100
  };
};

/**
 * Calcular resultado de votação
 */
export const calculateVotingResult = (
  votesFavor: number,
  votesAgainst: number,
  votesAbstention: number,
  totalEligible: number
): {
  total: number;
  favorPercentage: number;
  againstPercentage: number;
  abstentionPercentage: number;
  participationRate: number;
  result: 'approved' | 'rejected' | 'insufficient_quorum';
} => {
  const total = votesFavor + votesAgainst + votesAbstention;
  const participationRate = totalEligible > 0 ? (total / totalEligible) * 100 : 0;
  
  let favorPercentage = 0;
  let againstPercentage = 0;
  let abstentionPercentage = 0;
  
  if (total > 0) {
    favorPercentage = (votesFavor / total) * 100;
    againstPercentage = (votesAgainst / total) * 100;
    abstentionPercentage = (votesAbstention / total) * 100;
  }
  
  // Determinar resultado (maioria simples dos votos válidos)
  let result: 'approved' | 'rejected' | 'insufficient_quorum' = 'insufficient_quorum';
  
  if (participationRate >= 50) { // Quórum mínimo
    const validVotes = votesFavor + votesAgainst;
    if (validVotes > 0) {
      result = votesFavor > votesAgainst ? 'approved' : 'rejected';
    }
  }
  
  return {
    total,
    favorPercentage: Math.round(favorPercentage * 100) / 100,
    againstPercentage: Math.round(againstPercentage * 100) / 100,
    abstentionPercentage: Math.round(abstentionPercentage * 100) / 100,
    participationRate: Math.round(participationRate * 100) / 100,
    result
  };
};

// === CÁLCULOS DE ANÁLISE ===

/**
 * Calcular tendência (crescimento/decrescimento)
 */
export const calculateTrend = (
  currentValue: number,
  previousValue: number
): {
  change: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
} => {
  if (previousValue === 0) {
    return {
      change: currentValue,
      percentage: currentValue > 0 ? 100 : 0,
      trend: currentValue > 0 ? 'up' : currentValue < 0 ? 'down' : 'stable'
    };
  }
  
  const change = currentValue - previousValue;
  const percentage = (change / Math.abs(previousValue)) * 100;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(percentage) > 5) { // Considerável variação > 5%
    trend = change > 0 ? 'up' : 'down';
  }
  
  return {
    change: Math.round(change * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    trend
  };
};

/**
 * Calcular média móvel
 */
export const calculateMovingAverage = (
  values: number[],
  periods: number = 3
): number[] => {
  if (!values || values.length < periods) return values || [];
  
  const movingAverages: number[] = [];
  
  for (let i = periods - 1; i < values.length; i++) {
    const sum = values.slice(i - periods + 1, i + 1).reduce((acc, val) => acc + val, 0);
    const average = sum / periods;
    movingAverages.push(Math.round(average * 100) / 100);
  }
  
  return movingAverages;
};

// === FUNÇÕES AUXILIARES ===

/**
 * Arredondar para centavos
 */
export const roundToCents = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Converter percentagem para decimal
 */
export const percentageToDecimal = (percentage: number): number => {
  return percentage / 100;
};

/**
 * Converter decimal para percentagem
 */
export const decimalToPercentage = (decimal: number): number => {
  return decimal * 100;
};

export default {
  calculateMonthlyQuota,
  calculateAnnualQuota,
  calculateQuotaDistribution,
  calculateLateInterest,
  calculateTotalDebt,
  calculateDaysLate,
  calculateLateFee,
  calculateMonthlyBalance,
  calculateBudgetExecution,
  calculateCollectionRate,
  calculateAnnualRevenueForecast,
  calculateReserveRequirements,
  calculateQuorum,
  calculateVotingResult,
  calculateTrend,
  calculateMovingAverage,
  roundToCents,
  percentageToDecimal,
  decimalToPercentage
};