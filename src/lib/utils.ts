import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilidades para fechas
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

// Utilidades para validaciones legales
export function calculateLegalDeadline(meetingDate: Date, minDays: number = 15): Date {
  const deadline = new Date(meetingDate);
  deadline.setDate(deadline.getDate() - minDays);
  return deadline;
}

export function validateQuorum(totalCoefficients: number, presentCoefficients: number, convocationType: 'first' | 'second'): boolean {
  const required = convocationType === 'first' ? 0.5 : 0.25;
  return (presentCoefficients / totalCoefficients) > required;
}

export function calculateMajority(votes: { favor: number; against: number; abstention: number }, type: 'simple' | 'qualified' | 'unanimous'): { passed: boolean; percentage: number } {
  const total = votes.favor + votes.against + votes.abstention;
  const favorPercentage = total > 0 ? votes.favor / total : 0;

  let passed = false;
  switch (type) {
    case 'simple':
      passed = votes.favor > votes.against;
      break;
    case 'qualified':
      passed = favorPercentage >= 0.67; // 2/3
      break;
    case 'unanimous':
      passed = votes.favor === total && votes.against === 0;
      break;
  }

  return { passed, percentage: favorPercentage * 100 };
}

// Utilidades para workflows
export function getWorkflowProgress(currentStep: number, totalSteps: number): number {
  return Math.round((currentStep / totalSteps) * 100);
}

export function validateStep(stepData: any, validationSchema?: any): { isValid: boolean; errors: string[] } {
  // Implementar validación básica
  if (!stepData) {
    return { isValid: false, errors: ['Datos requeridos'] };
  }
  
  // Aquí se integraría con Zod o similar
  return { isValid: true, errors: [] };
}

// Utilidades para archivos
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Utilidades para colores dinámicos
export function getTransactionTypeColor(type: 'income' | 'expense'): string {
  return type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    held: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400'
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
}

// Utilidades para exportación
export function downloadFile(data: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utilidades para notificaciones
export function showNotification(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
  // Implementación básica para notificaciones
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  
  // Aquí se integraría con un sistema de notificaciones como Sonner
}

// Utilidades para localStorage
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// Utilidades para debugging
export function debugLog(message: string, data?: any): void {
  if (import.meta.env.DEV) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

export function errorLog(message: string, error?: any): void {
  console.error(`[ERROR] ${message}`, error);
}

// Utilidades para performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}