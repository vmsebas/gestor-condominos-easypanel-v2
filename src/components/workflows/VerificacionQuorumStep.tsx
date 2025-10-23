import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Users, PercentCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '@/lib/api';

interface VerificacionQuorumStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const VerificacionQuorumStep: React.FC<VerificacionQuorumStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  // Cargar miembros desde la base de datos
  const { data: membersResponse, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers(),
  });

  const members = membersResponse?.data?.members || [];
  const attendees = data?.attendees || {};

  // Calcular quórum según ley portuguesa
  const quorumData = useMemo(() => {
    // Total de permilagem del edificio
    const totalPermilage = members.reduce((sum, member) =>
      sum + (parseFloat(member.permilage) || 0), 0
    );

    // Permilagem de presentes y representados
    let presentPermilage = 0;
    let presentCount = 0;
    let representedCount = 0;

    Object.entries(attendees).forEach(([memberId, attendance]: [string, any]) => {
      const member = members.find(m => m.id === memberId);
      if (member && (attendance.present || attendance.represented)) {
        presentPermilage += parseFloat(member.permilage) || 0;
        if (attendance.present) presentCount++;
        if (attendance.represented) representedCount++;
      }
    });

    // Calcular porcentaje
    const percentage = totalPermilage > 0 ? (presentPermilage / totalPermilage) * 100 : 0;

    // Determinar tipo de quórum válido según Art. 16 LPH
    const isFirstCallValid = percentage >= 50; // Primera convocatoria: >50%
    const isSecondCallValid = percentage >= 25; // Segunda convocatoria: >25%

    return {
      totalPermilage: totalPermilage.toFixed(1),
      presentPermilage: presentPermilage.toFixed(1),
      percentage: percentage.toFixed(1),
      presentCount,
      representedCount,
      totalMembers: members.length,
      isFirstCallValid,
      isSecondCallValid,
      requiredFirstCall: (totalPermilage * 0.5).toFixed(1),
      requiredSecondCall: (totalPermilage * 0.25).toFixed(1)
    };
  }, [members, attendees]);

  const handleContinue = () => {
    // Guardar información del quórum en el workflow
    onUpdate({
      quorum: {
        totalPermilage: quorumData.totalPermilage,
        presentPermilage: quorumData.presentPermilage,
        percentage: quorumData.percentage,
        presentCount: quorumData.presentCount,
        representedCount: quorumData.representedCount,
        isFirstCallValid: quorumData.isFirstCallValid,
        isSecondCallValid: quorumData.isSecondCallValid,
        validatedAt: new Date().toISOString()
      }
    });
    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">A calcular quórum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Minute Number */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">Verificação de Quórum</h2>
          <p className="text-muted-foreground">
            Cálculo automático segundo coeficientes de participação (Art. 16 LPH)
          </p>
        </div>
        {data?.minute_number && (
          <div className="text-right ml-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Acta #{data.minute_number}
            </Badge>
          </div>
        )}
      </div>

      {/* Resumo Estatístico */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{quorumData.presentCount}</p>
                <p className="text-sm text-muted-foreground">Presentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{quorumData.representedCount}</p>
                <p className="text-sm text-muted-foreground">Representados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <PercentCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{quorumData.percentage}%</p>
                <p className="text-sm text-muted-foreground">Quórum</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-lg font-bold">{quorumData.presentPermilage}‰</p>
              <p className="text-sm text-muted-foreground">Permilagem presente</p>
              <p className="text-xs text-muted-foreground mt-1">
                de {quorumData.totalPermilage}‰ total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado do Quórum - Primeira Convocatória */}
      <Card className={`border-2 ${
        quorumData.isFirstCallValid
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
          : 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {quorumData.isFirstCallValid ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span className="text-green-800 dark:text-green-200">
                  Quórum válido para Primeira Convocatória
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-amber-600" />
                <span className="text-amber-800 dark:text-amber-200">
                  Quórum insuficiente para Primeira Convocatória
                </span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Requisito legal (Art. 16 LPH):</span>
              <span className="font-semibold">&gt;50% dos coeficientes</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Permilagem necessária:</span>
              <span className="font-semibold">{quorumData.requiredFirstCall}‰</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Permilagem presente:</span>
              <span className={`font-semibold ${
                quorumData.isFirstCallValid ? 'text-green-600' : 'text-amber-600'
              }`}>
                {quorumData.presentPermilage}‰
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
              <div
                className={`h-3 rounded-full transition-all ${
                  quorumData.isFirstCallValid ? 'bg-green-600' : 'bg-amber-600'
                }`}
                style={{ width: `${Math.min(parseFloat(quorumData.percentage), 100)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado do Quórum - Segunda Convocatória */}
      {!quorumData.isFirstCallValid && (
        <Card className={`border-2 ${
          quorumData.isSecondCallValid
            ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'
            : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {quorumData.isSecondCallValid ? (
                <>
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  <span className="text-blue-800 dark:text-blue-200">
                    Quórum válido para Segunda Convocatória
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="text-red-800 dark:text-red-200">
                    Quórum insuficiente mesmo para Segunda Convocatória
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Requisito legal (Art. 16 LPH):</span>
                <span className="font-semibold">&gt;25% dos coeficientes</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Permilagem necessária:</span>
                <span className="font-semibold">{quorumData.requiredSecondCall}‰</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Permilagem presente:</span>
                <span className={`font-semibold ${
                  quorumData.isSecondCallValid ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {quorumData.presentPermilage}‰
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert legal */}
      {!quorumData.isSecondCallValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Quórum Insuficiente</AlertTitle>
          <AlertDescription>
            Não há quórum legal para celebrar a assembleia. É necessário convocar nova reunião
            conforme Art. 1430.º e 1431.º do Código Civil Português.
          </AlertDescription>
        </Alert>
      )}

      {quorumData.isSecondCallValid && !quorumData.isFirstCallValid && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Segunda Convocatória</AlertTitle>
          <AlertDescription>
            A assembleia pode prosseguir em segunda convocatória. As decisões requerem
            maioria simples dos presentes (Art. 17 LPH).
          </AlertDescription>
        </Alert>
      )}

      {/* Informação Legal */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Requisitos Legais - Lei de Propriedade Horizontal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p><strong>Art. 16 LPH:</strong> Quórum constitutivo</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Primeira convocatória: maioria de condóminos que representem mais de 50% do valor total do prédio</li>
            <li>Segunda convocatória: maioria de condóminos que representem pelo menos 25% do valor total do prédio</li>
          </ul>
          <p className="mt-3"><strong>Art. 17 LPH:</strong> Quórum deliberativo</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Maioria simples: mais de 50% dos votos dos presentes</li>
            <li>Maioria qualificada: dois terços do valor total do prédio</li>
            <li>Unanimidade: todos os condóminos</li>
          </ul>
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          variant="workflow"
          size="lg"
          disabled={!quorumData.isSecondCallValid}
        >
          {quorumData.isFirstCallValid
            ? 'Continuar (Primeira Convocatória)'
            : quorumData.isSecondCallValid
              ? 'Continuar (Segunda Convocatória)'
              : 'Quórum Insuficiente'
          }
        </Button>
      </div>
    </div>
  );
};

export default VerificacionQuorumStep;
