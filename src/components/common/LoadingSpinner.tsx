import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'muted';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const variantClasses = {
    default: 'text-primary',
    white: 'text-white',
    muted: 'text-muted-foreground'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      />
      {text && (
        <p className={cn(
          'font-medium',
          textSizeClasses[size],
          variantClasses[variant]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Componente específico para carregamento de página
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'A carregar...' }) => (
  <div className="flex min-h-screen items-center justify-center">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

// Componente específico para carregamento de secção
export const SectionLoader: React.FC<{ text?: string; className?: string }> = ({ 
  text = 'A carregar...', 
  className 
}) => (
  <div className={cn('flex h-32 items-center justify-center', className)}>
    <LoadingSpinner size="md" text={text} />
  </div>
);

// Componente específico para botões
export const ButtonLoader: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} variant="white" />
);

// Componente overlay para carregamento modal
export const LoadingOverlay: React.FC<{ 
  isVisible: boolean; 
  text?: string;
  variant?: 'light' | 'dark';
}> = ({ 
  isVisible, 
  text = 'A processar...', 
  variant = 'light' 
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'absolute inset-0 z-10 flex items-center justify-center rounded-lg',
      variant === 'light' 
        ? 'bg-white/90 backdrop-blur-sm' 
        : 'bg-black/50 backdrop-blur-sm'
    )}>
      <LoadingSpinner 
        size="lg" 
        text={text}
        variant={variant === 'dark' ? 'white' : 'default'}
      />
    </div>
  );
};

// Skeleton loader para listas
export const ListSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton loader para cards
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('border rounded-lg p-6 space-y-4', className)}>
    <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
    </div>
    <div className="flex space-x-2">
      <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      <div className="h-8 w-20 bg-muted rounded animate-pulse" />
    </div>
  </div>
);

// Skeleton loader para tabelas
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  cols?: number; 
  className?: string;
}> = ({ 
  rows = 5, 
  cols = 4, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded animate-pulse flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-8 bg-muted rounded animate-pulse flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default LoadingSpinner;