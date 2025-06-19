import React from 'react';
import { useConvocatorias } from '@/hooks/useNeonData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const ConvocatoriasDebug: React.FC = () => {
  const { data, isLoading, error, isError, isSuccess } = useConvocatorias();

  return (
    <Card className="m-4 border-2 border-blue-500">
      <CardHeader className="bg-blue-50 dark:bg-blue-950">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Debug: Estado de Convocatórias
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Query State */}
        <div>
          <h3 className="font-semibold mb-2">Estado da Query:</h3>
          <div className="flex gap-2">
            <Badge variant={isLoading ? "default" : "outline"}>
              {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Loading: {isLoading ? 'Sim' : 'Não'}
            </Badge>
            <Badge variant={isError ? "destructive" : "outline"}>
              Error: {isError ? 'Sim' : 'Não'}
            </Badge>
            <Badge variant={isSuccess ? "success" : "outline"}>
              {isSuccess && <CheckCircle className="h-3 w-3 mr-1" />}
              Success: {isSuccess ? 'Sim' : 'Não'}
            </Badge>
          </div>
        </div>

        {/* Error Details */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 p-3 rounded">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1">Erro:</h3>
            <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
              {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Data Info */}
        {data && (
          <div>
            <h3 className="font-semibold mb-2">Dados Recebidos:</h3>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded space-y-2">
              <p className="text-sm">
                <strong>Total de convocatórias:</strong> {Array.isArray(data) ? data.length : 'N/A'}
              </p>
              <p className="text-sm">
                <strong>Tipo de dados:</strong> {Array.isArray(data) ? 'Array' : typeof data}
              </p>
              {Array.isArray(data) && data.length > 0 && (
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium hover:text-blue-600">
                    Ver primeira convocatória (clique para expandir)
                  </summary>
                  <pre className="mt-2 text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto">
                    {JSON.stringify(data[0], null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Raw Data */}
        <details className="cursor-pointer">
          <summary className="text-sm font-medium hover:text-blue-600">
            Ver dados brutos completos (clique para expandir)
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-96">
            {JSON.stringify({ data, isLoading, error, isError, isSuccess }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default ConvocatoriasDebug;