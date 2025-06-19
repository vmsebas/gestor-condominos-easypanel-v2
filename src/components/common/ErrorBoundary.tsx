import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  expanded: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'section' | 'component';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      expanded: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send to error reporting service (if configured)
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Here you could send to an error reporting service like Sentry
    const errorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // For now, just log to console
    console.error('Error Report:', errorReport);
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      expanded: false
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleExpanded = () => {
    this.setState(prev => ({ expanded: !prev.expanded }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Different UI based on error level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  renderErrorUI() {
    const { level = 'component', showDetails = true } = this.props;
    const { error, errorInfo, expanded } = this.state;

    if (level === 'page') {
      return this.renderPageError();
    }

    if (level === 'section') {
      return this.renderSectionError();
    }

    return this.renderComponentError();
  }

  renderPageError() {
    const { error, errorInfo, expanded } = this.state;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Algo correu mal</CardTitle>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado. Por favor, tente novamente ou contacte o suporte se o problema persistir.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Ir para Início
              </Button>
            </div>

            {this.props.showDetails && error && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full flex items-center gap-2"
                    onClick={this.toggleExpanded}
                  >
                    <Bug className="h-4 w-4" />
                    {expanded ? 'Ocultar' : 'Ver'} Detalhes Técnicos
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Detalhes do Erro</AlertTitle>
                    <AlertDescription asChild>
                      <div className="mt-2 space-y-2">
                        <div>
                          <strong>Erro:</strong> {error.message}
                        </div>
                        {error.stack && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        {errorInfo?.componentStack && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="mt-1 whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  renderSectionError() {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na Secção</AlertTitle>
          <AlertDescription>
            Esta secção não pôde ser carregada devido a um erro.
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={this.handleRetry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Tentar Novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  renderComponentError() {
    return (
      <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium text-sm">Erro no Componente</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Este componente não pôde ser renderizado.
        </p>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={this.handleRetry}
          className="mt-2 h-7 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Tentar Novamente
        </Button>
      </div>
    );
  }
}

// HOC para wrapping automático de componentes
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook para trigger de erros (útil para testes)
export const useErrorHandler = () => {
  const throwError = (error: string | Error) => {
    if (typeof error === 'string') {
      throw new Error(error);
    }
    throw error;
  };

  return { throwError };
};

// Componente para erros específicos de loading/fetch
export const FetchErrorBoundary: React.FC<{
  children: ReactNode;
  onRetry?: () => void;
  error?: Error | null;
}> = ({ children, onRetry, error }) => {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao Carregar Dados</AlertTitle>
        <AlertDescription>
          Não foi possível carregar os dados solicitados.
          {onRetry && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRetry}
              className="mt-2 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Tentar Novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary;