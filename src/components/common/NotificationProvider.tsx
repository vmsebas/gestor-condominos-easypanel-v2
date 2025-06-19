import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

// Provider para o sistema de notificações
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
          },
        }}
        icons={{
          success: <CheckCircle className="h-4 w-4" />,
          error: <AlertCircle className="h-4 w-4" />,
          warning: <AlertTriangle className="h-4 w-4" />,
          info: <Info className="h-4 w-4" />,
          loading: <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />,
        }}
      />
    </>
  );
};

// Hook para notificações tipadas
export const useNotifications = () => {
  const success = (message: string, options?: {
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
  }) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  };

  const error = (message: string, options?: {
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
  }) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000, // Erros ficam mais tempo
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  };

  const warning = (message: string, options?: {
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
  }) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  };

  const info = (message: string, options?: {
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
    duration?: number;
  }) => {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  };

  const loading = (message: string, options?: {
    description?: string;
  }) => {
    return toast.loading(message, {
      description: options?.description,
    });
  };

  const promise = <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
      description?: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      description: options.description,
    });
  };

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    dismissAll,
  };
};

// Funções de conveniência para notificações específicas da aplicação
export const notify = {
  // Operações CRUD
  created: (itemType: string, itemName?: string) => {
    toast.success(`${itemType} criado${itemName ? ` - ${itemName}` : ''}`, {
      description: 'O item foi adicionado com sucesso',
      duration: 3000,
    });
  },

  updated: (itemType: string, itemName?: string) => {
    toast.success(`${itemType} atualizado${itemName ? ` - ${itemName}` : ''}`, {
      description: 'As alterações foram guardadas',
      duration: 3000,
    });
  },

  deleted: (itemType: string, itemName?: string) => {
    toast.success(`${itemType} eliminado${itemName ? ` - ${itemName}` : ''}`, {
      description: 'O item foi removido com sucesso',
      duration: 3000,
    });
  },

  // Operações de comunicação
  sent: (type: 'email' | 'carta' | 'convocatória', count?: number) => {
    const message = count 
      ? `${count} ${type}${count > 1 ? 's' : ''} enviada${count > 1 ? 's' : ''}`
      : `${type} enviada`;
    
    toast.success(message, {
      description: 'A comunicação foi enviada com sucesso',
      duration: 4000,
    });
  },

  // Operações de autenticação
  loggedIn: (userName?: string) => {
    toast.success('Sessão iniciada', {
      description: userName ? `Bem-vindo, ${userName}!` : 'Bem-vindo de volta!',
      duration: 3000,
    });
  },

  loggedOut: () => {
    toast.info('Sessão terminada', {
      description: 'A sua sessão foi terminada com segurança',
      duration: 3000,
    });
  },

  // Operações de ficheiros
  fileUploaded: (fileName?: string) => {
    toast.success(`Ficheiro carregado${fileName ? ` - ${fileName}` : ''}`, {
      description: 'O ficheiro foi carregado com sucesso',
      duration: 3000,
    });
  },

  fileDownloaded: (fileName?: string) => {
    toast.success(`Download concluído${fileName ? ` - ${fileName}` : ''}`, {
      description: 'O ficheiro foi descarregado',
      duration: 3000,
    });
  },

  // Operações de exportação
  exported: (format: 'PDF' | 'Excel' | 'CSV', fileName?: string) => {
    toast.success(`Exportado para ${format}`, {
      description: fileName ? `Ficheiro: ${fileName}` : 'A exportação foi concluída',
      duration: 4000,
      action: {
        label: 'Ver',
        onClick: () => {
          // Implementar lógica para abrir ficheiro se necessário
        },
      },
    });
  },

  // Erros comuns
  networkError: (retry?: () => void) => {
    toast.error('Erro de ligação', {
      description: 'Verifique a sua ligação à internet',
      duration: 6000,
      action: retry ? {
        label: 'Tentar novamente',
        onClick: retry,
      } : undefined,
    });
  },

  validationError: (field?: string) => {
    toast.error('Dados inválidos', {
      description: field 
        ? `Verifique o campo: ${field}` 
        : 'Verifique os dados introduzidos',
      duration: 5000,
    });
  },

  permissionError: () => {
    toast.error('Sem permissões', {
      description: 'Não tem permissões para realizar esta ação',
      duration: 5000,
    });
  },

  // Avisos
  unsavedChanges: () => {
    toast.warning('Alterações não guardadas', {
      description: 'Tem alterações por guardar',
      duration: 5000,
    });
  },

  maintenanceMode: () => {
    toast.warning('Modo de manutenção', {
      description: 'Algumas funcionalidades podem estar limitadas',
      duration: 8000,
    });
  },

  // Informações
  dataRefreshed: () => {
    toast.info('Dados atualizados', {
      description: 'Os dados foram sincronizados',
      duration: 2000,
    });
  },

  offlineMode: () => {
    toast.info('Modo offline', {
      description: 'A trabalhar sem ligação à internet',
      duration: 5000,
    });
  },

  backOnline: () => {
    toast.success('Ligação restaurada', {
      description: 'A sincronizar dados...',
      duration: 3000,
    });
  },
};

export default NotificationProvider;