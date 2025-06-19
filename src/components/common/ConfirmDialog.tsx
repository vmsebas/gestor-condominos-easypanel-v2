import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: 'destructive' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'destructive',
  icon,
  disabled = false,
  loading = false
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error in confirm action:', error);
      // Keep dialog open on error
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const variantConfig = {
    destructive: {
      icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      actionVariant: 'destructive' as const,
      iconBg: 'bg-destructive/10'
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      actionVariant: 'default' as const,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    info: {
      icon: <Info className="h-5 w-5 text-blue-600" />,
      actionVariant: 'default' as const,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    success: {
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      actionVariant: 'default' as const,
      iconBg: 'bg-green-100 dark:bg-green-900/30'
    }
  };

  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {displayIcon && (
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                config.iconBg
              )}>
                {displayIcon}
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="mt-3">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            variant={config.actionVariant}
            disabled={disabled || loading}
          >
            {loading ? 'A processar...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Componentes específicos pré-configurados

export const DeleteConfirmDialog: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}> = ({
  open,
  onOpenChange,
  trigger,
  title,
  itemName = 'este item',
  onConfirm,
  loading = false
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    trigger={trigger}
    title={title || 'Confirmar eliminação'}
    description={`Tem a certeza que pretende eliminar ${itemName}? Esta ação não pode ser desfeita.`}
    confirmText="Eliminar"
    cancelText="Cancelar"
    onConfirm={onConfirm}
    variant="destructive"
    loading={loading}
  />
);

export const LogoutConfirmDialog: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
}> = ({ open, onOpenChange, trigger, onConfirm }) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    trigger={trigger}
    title="Terminar sessão"
    description="Tem a certeza que pretende terminar a sua sessão?"
    confirmText="Terminar sessão"
    cancelText="Cancelar"
    onConfirm={onConfirm}
    variant="warning"
    icon={<X className="h-5 w-5" />}
  />
);

export const SaveConfirmDialog: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}> = ({
  open,
  onOpenChange,
  trigger,
  title = 'Guardar alterações',
  description = 'Tem a certeza que pretende guardar as alterações?',
  onConfirm,
  loading = false
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    trigger={trigger}
    title={title}
    description={description}
    confirmText="Guardar"
    cancelText="Cancelar"
    onConfirm={onConfirm}
    variant="success"
    loading={loading}
  />
);

export const SendConfirmDialog: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  recipientCount?: number;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}> = ({
  open,
  onOpenChange,
  trigger,
  title = 'Confirmar envio',
  recipientCount,
  onConfirm,
  loading = false
}) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    trigger={trigger}
    title={title}
    description={`Tem a certeza que pretende enviar ${recipientCount ? `para ${recipientCount} destinatários` : 'esta comunicação'}? O envio não pode ser cancelado depois de iniciado.`}
    confirmText="Enviar"
    cancelText="Cancelar"
    onConfirm={onConfirm}
    variant="info"
    loading={loading}
  />
);

export const UnsavedChangesDialog: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}> = ({ open, onOpenChange, onConfirm, onCancel }) => (
  <ConfirmDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Alterações não guardadas"
    description="Tem alterações não guardadas. Se sair agora, as alterações serão perdidas."
    confirmText="Sair sem guardar"
    cancelText="Continuar a editar"
    onConfirm={onConfirm}
    onCancel={onCancel}
    variant="warning"
  />
);

// Hook para gerir estado de confirmação
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const confirmAction = React.useRef<(() => void | Promise<void>) | null>(null);

  const openDialog = (action: () => void | Promise<void>) => {
    confirmAction.current = action;
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    if (confirmAction.current) {
      setLoading(true);
      try {
        await confirmAction.current();
        setIsOpen(false);
      } catch (error) {
        console.error('Error in confirm action:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    confirmAction.current = null;
  };

  return {
    isOpen,
    loading,
    openDialog,
    handleConfirm,
    handleCancel,
    setIsOpen
  };
};

export default ConfirmDialog;