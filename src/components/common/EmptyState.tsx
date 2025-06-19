import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Building, 
  FileText, 
  Mail, 
  Euro, 
  Calendar, 
  Search,
  Plus,
  AlertCircle,
  Database
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'search' | 'error' | 'card';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3'
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6'
    }
  };

  const variantClasses = {
    default: 'bg-muted/50',
    search: 'bg-muted/30 border border-dashed border-muted-foreground/30',
    error: 'bg-destructive/5 border border-destructive/20',
    card: 'bg-card border'
  };

  const iconColorClasses = {
    default: 'text-muted-foreground',
    search: 'text-muted-foreground',
    error: 'text-destructive',
    card: 'text-muted-foreground'
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size].container,
      sizeClasses[size].spacing,
      className
    )}>
      {icon && (
        <div className={cn(
          'mb-2 rounded-full p-3',
          variantClasses[variant],
          iconColorClasses[variant]
        )}>
          <div className={sizeClasses[size].icon}>
            {icon}
          </div>
        </div>
      )}
      
      <div className={sizeClasses[size].spacing}>
        <h3 className={cn(
          'font-semibold text-foreground',
          sizeClasses[size].title
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            'text-muted-foreground max-w-md mx-auto',
            sizeClasses[size].description
          )}>
            {description}
          </p>
        )}
        
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
              >
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      'rounded-lg',
      variantClasses[variant]
    )}>
      {content}
    </div>
  );
};

// Estados específicos pré-configurados

export const EmptyMembers: React.FC<{
  onAddMember?: () => void;
  className?: string;
}> = ({ onAddMember, className }) => (
  <EmptyState
    icon={<Users className="h-full w-full" />}
    title="Nenhum membro encontrado"
    description="Ainda não foram adicionados membros a este edifício. Comece por adicionar o primeiro membro."
    action={onAddMember ? {
      label: 'Adicionar Membro',
      onClick: onAddMember
    } : undefined}
    className={className}
  />
);

export const EmptyBuildings: React.FC<{
  onAddBuilding?: () => void;
  className?: string;
}> = ({ onAddBuilding, className }) => (
  <EmptyState
    icon={<Building className="h-full w-full" />}
    title="Nenhum edifício encontrado"
    description="Comece por adicionar o primeiro edifício para gerir condóminos e propriedades."
    action={onAddBuilding ? {
      label: 'Adicionar Edifício',
      onClick: onAddBuilding
    } : undefined}
    className={className}
  />
);

export const EmptyTransactions: React.FC<{
  onAddTransaction?: () => void;
  className?: string;
}> = ({ onAddTransaction, className }) => (
  <EmptyState
    icon={<Euro className="h-full w-full" />}
    title="Nenhuma transação encontrada"
    description="Não há transações registadas para este período. Adicione receitas e despesas para começar."
    action={onAddTransaction ? {
      label: 'Adicionar Transação',
      onClick: onAddTransaction
    } : undefined}
    className={className}
  />
);

export const EmptyMinutes: React.FC<{
  onCreateMinute?: () => void;
  className?: string;
}> = ({ onCreateMinute, className }) => (
  <EmptyState
    icon={<FileText className="h-full w-full" />}
    title="Nenhuma ata encontrada"
    description="Ainda não foram criadas atas de reuniões. Documente as assembleias e decisões importantes."
    action={onCreateMinute ? {
      label: 'Criar Ata',
      onClick: onCreateMinute
    } : undefined}
    className={className}
  />
);

export const EmptyConvocatorias: React.FC<{
  onCreateConvocatoria?: () => void;
  className?: string;
}> = ({ onCreateConvocatoria, className }) => (
  <EmptyState
    icon={<Calendar className="h-full w-full" />}
    title="Nenhuma convocatória encontrada"
    description="Não há convocatórias criadas. Organize reuniões e assembleias com convocatórias formais."
    action={onCreateConvocatoria ? {
      label: 'Criar Convocatória',
      onClick: onCreateConvocatoria
    } : undefined}
    className={className}
  />
);

export const EmptyLetters: React.FC<{
  onCreateLetter?: () => void;
  className?: string;
}> = ({ onCreateLetter, className }) => (
  <EmptyState
    icon={<Mail className="h-full w-full" />}
    title="Nenhuma carta encontrada"
    description="Não há cartas ou comunicações registadas. Crie cartas personalizadas para os condóminos."
    action={onCreateLetter ? {
      label: 'Criar Carta',
      onClick: onCreateLetter
    } : undefined}
    className={className}
  />
);

export const EmptySearch: React.FC<{
  searchTerm: string;
  onClearSearch?: () => void;
  className?: string;
}> = ({ searchTerm, onClearSearch, className }) => (
  <EmptyState
    icon={<Search className="h-full w-full" />}
    title="Nenhum resultado encontrado"
    description={`Não foram encontrados resultados para "${searchTerm}". Tente usar termos diferentes.`}
    action={onClearSearch ? {
      label: 'Limpar Pesquisa',
      onClick: onClearSearch,
      variant: 'outline'
    } : undefined}
    variant="search"
    size="sm"
    className={className}
  />
);

export const DataError: React.FC<{
  onRetry?: () => void;
  message?: string;
  className?: string;
}> = ({ onRetry, message, className }) => (
  <EmptyState
    icon={<AlertCircle className="h-full w-full" />}
    title="Erro ao carregar dados"
    description={message || "Ocorreu um erro ao carregar os dados. Verifique a sua ligação e tente novamente."}
    action={onRetry ? {
      label: 'Tentar Novamente',
      onClick: onRetry
    } : undefined}
    variant="error"
    className={className}
  />
);

export const NoData: React.FC<{
  title?: string;
  description?: string;
  className?: string;
}> = ({ 
  title = "Sem dados disponíveis", 
  description = "Não há informações para mostrar neste momento.",
  className 
}) => (
  <EmptyState
    icon={<Database className="h-full w-full" />}
    title={title}
    description={description}
    size="sm"
    className={className}
  />
);

// Estado de lista vazia genérico
export const EmptyList: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}> = ({ icon, title, description, actionLabel, onAction, className }) => (
  <EmptyState
    icon={icon || <Plus className="h-full w-full" />}
    title={title}
    description={description}
    action={actionLabel && onAction ? {
      label: actionLabel,
      onClick: onAction
    } : undefined}
    className={className}
  />
);

export default EmptyState;