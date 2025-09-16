// Constantes de la aplicación
module.exports = {
  // Paginación
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Archivos
  MAX_FILE_SIZE: 52428800, // 50MB
  ALLOWED_FILE_TYPES: {
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    all: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  
  // Tipos de transacciones
  TRANSACTION_TYPES: {
    INCOME: 'income',
    EXPENSE: 'expense'
  },
  
  // Estados de tareas
  TASK_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  
  // Tipos de asambleas
  ASSEMBLY_TYPES: {
    ORDINARY: 'ordinary',
    EXTRAORDINARY: 'extraordinary'
  },
  
  // Niveles de acceso de documentos
  DOCUMENT_ACCESS_LEVELS: {
    PUBLIC: 'public',
    MEMBERS_ONLY: 'members_only',
    ADMIN_ONLY: 'admin_only'
  },
  
  // Categorías de documentos
  DOCUMENT_CATEGORIES: {
    FINANCIAL: 'financial',
    LEGAL: 'legal',
    MAINTENANCE: 'maintenance',
    MEETINGS: 'meetings',
    INSURANCE: 'insurance',
    GENERAL: 'general'
  },
  
  // Mensajes de error comunes
  ERROR_MESSAGES: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_DATA: 'Invalid data provided',
    DATABASE_ERROR: 'Database operation failed',
    SERVER_ERROR: 'Internal server error'
  }
};