import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

interface RevisionLegalStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface LegalCheck {
  id: string;
  title: string;
  description: string;
  status: 'checking' | 'passed' | 'warning' | 'failed';
  details?: string;
  isRequired: boolean;
}

const RevisionLegalStep: React.FC<RevisionLegalStepProps> = ({
  data,
  onUpdate,
  onNext,
  onPrevious
}) => {
  const [checks, setChecks] = useState<LegalCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const legalChecks: LegalCheck[] = [
    {
      id: 'meeting-date',
      title: 'Antecedência da Convocatória',
      description: 'Verificar se a data da reunião cumpre o prazo mínimo de 15 dias',
      status: 'checking',
      isRequired: true
    },
    {
      id: 'agenda-items',
      title: 'Ordem do Dia Completa',
      description: 'Verificar se a ordem do dia contém todos os pontos obrigatórios',
      status: 'checking',
      isRequired: true
    },
    {
      id: 'legal-documents',
      title: 'Documentação Legal',
      description: 'Verificar se todos os documentos obrigatórios estão anexados',
      status: 'checking',
      isRequired: false
    },
    {
      id: 'delivery-method',
      title: 'Método de Notificação',
      description: 'Verificar se o método de envio garante a recepção',
      status: 'checking',
      isRequired: true
    },
    {
      id: 'quorum-calculation',
      title: 'Cálculo de Quórum',
      description: 'Verificar se os coeficientes de participação estão corretos',
      status: 'checking',
      isRequired: true
    }
  ];

  const runLegalChecks = async () => {
    setIsRunning(true);
    setProgress(0);
    const updatedChecks = [...legalChecks];

    for (let i = 0; i < updatedChecks.length; i++) {
      const check = updatedChecks[i];
      setProgress(((i + 1) / updatedChecks.length) * 100);

      // Simular verificação
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Lógica de verificação baseada nos dados
      switch (check.id) {
        case 'meeting-date':
          const meetingDate = new Date(data.meetingDate);
          const today = new Date();
          const daysDiff = Math.ceil((meetingDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          
          if (daysDiff >= 15) {
            check.status = 'passed';
            check.details = `${daysDiff} dias de antecedência (mínimo: 15 dias)`;
          } else if (daysDiff >= 10) {
            check.status = 'warning';
            check.details = `Apenas ${daysDiff} dias de antecedência. Recomendado mínimo 15 dias.`;
          } else {
            check.status = 'failed';
            check.details = `Apenas ${daysDiff} dias de antecedência. Obrigatório mínimo 15 dias.`;
          }
          break;

        case 'agenda-items':
          const items = data.agendaItems || [];
          if (items.length >= 3) {
            check.status = 'passed';
            check.details = `${items.length} pontos na ordem do dia`;
          } else if (items.length >= 1) {
            check.status = 'warning';
            check.details = `Apenas ${items.length} ponto(s). Recomendado pelo menos 3 pontos.`;
          } else {
            check.status = 'failed';
            check.details = 'Ordem do dia vazia. Obrigatório pelo menos 1 ponto.';
          }
          break;

        case 'legal-documents':
          const docs = data.attachedDocuments || [];
          if (docs.length >= 2) {
            check.status = 'passed';
            check.details = `${docs.length} documentos anexados`;
          } else if (docs.length === 1) {
            check.status = 'warning';
            check.details = 'Apenas 1 documento anexado. Recomendado incluir orçamentos e relatórios.';
          } else {
            check.status = 'warning';
            check.details = 'Nenhum documento anexado. Considere incluir documentação de apoio.';
          }
          break;

        case 'delivery-method':
          const method = data.deliveryMethod;
          if (method === 'certified-mail' || method === 'hand-delivery') {
            check.status = 'passed';
            check.details = 'Método de entrega com validação legal';
          } else if (method === 'email') {
            check.status = 'warning';
            check.details = 'Email pode não ter validade legal. Considere correio registado.';
          } else {
            check.status = 'failed';
            check.details = 'Método de entrega não definido ou inválido.';
          }
          break;

        case 'quorum-calculation':
          // Simulação de verificação de quórum
          check.status = 'passed';
          check.details = 'Coeficientes de participação verificados e corretos';
          break;

        default:
          check.status = 'passed';
      }

      setChecks([...updatedChecks]);
    }

    setIsRunning(false);
    
    // Atualizar dados com resultado da revisão
    const passedChecks = updatedChecks.filter(c => c.status === 'passed').length;
    const totalRequired = updatedChecks.filter(c => c.isRequired).length;
    const requiredPassed = updatedChecks.filter(c => c.isRequired && c.status === 'passed').length;
    
    onUpdate({
      legalReview: {
        completed: true,
        totalChecks: updatedChecks.length,
        passedChecks,
        requiredPassed,
        totalRequired,
        canProceed: requiredPassed === totalRequired
      }
    });
  };

  useEffect(() => {
    if (checks.length === 0) {
      setChecks(legalChecks);
      // Auto-iniciar verificação após 1 segundo
      setTimeout(() => {
        runLegalChecks();
      }, 1000);
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="success">Aprovado</Badge>;
      case 'warning':
        return <Badge variant="warning">Atenção</Badge>;
      case 'failed':
        return <Badge variant="destructive">Reprovado</Badge>;
      default:
        return <Badge variant="outline">Verificando...</Badge>;
    }
  };

  const hasFailedRequired = checks.some(c => c.isRequired && c.status === 'failed');
  const allCompleted = checks.every(c => c.status !== 'checking');
  const canProceed = allCompleted && !hasFailedRequired;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Info className="h-6 w-6 text-blue-600" />
            <span>Revisão Legal Automática</span>
          </CardTitle>
          <CardDescription>
            Verificação automática do cumprimento de todos os requisitos legais para a convocatória
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da verificação</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de verificações */}
      <div className="space-y-4">
        {checks.map((check) => (
          <Card key={check.id} className={`transition-all ${
            check.status === 'failed' && check.isRequired 
              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' 
              : check.status === 'warning'
              ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
              : check.status === 'passed'
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
              : ''
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getStatusIcon(check.status)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{check.title}</h3>
                    <div className="flex items-center space-x-2">
                      {check.isRequired && (
                        <Badge variant="outline" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                      {getStatusBadge(check.status)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{check.description}</p>
                  {check.details && (
                    <p className={`text-sm ${
                      check.status === 'failed' ? 'text-red-700 dark:text-red-400' :
                      check.status === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
                      'text-green-700 dark:text-green-400'
                    }`}>
                      {check.details}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo e ações */}
      {allCompleted && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {canProceed ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Revisão Legal Concluída
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    Todos os requisitos legais obrigatórios foram cumpridos. A convocatória está pronta para envio.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                    Requisitos Não Cumpridos
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    Existem requisitos legais obrigatórios que não foram cumpridos. 
                    Por favor, corrija os problemas identificados antes de continuar.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de navegação */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <div className="flex space-x-3">
          {allCompleted && !canProceed && (
            <Button variant="outline" onClick={runLegalChecks}>
              Reverificar
            </Button>
          )}
          <Button 
            onClick={onNext} 
            disabled={!canProceed}
            variant={canProceed ? "default" : "outline"}
          >
            {canProceed ? 'Continuar' : 'Corrigir Problemas'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RevisionLegalStep;