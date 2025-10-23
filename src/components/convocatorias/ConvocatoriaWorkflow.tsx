import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { workflowEngine, CONVOCATORIA_WORKFLOW } from '@/lib/workflows';
import { CheckCircle, Circle, Clock, AlertCircle, FileText } from 'lucide-react';

// Import workflow step components
import TipoReunionStep from '@/components/workflows/TipoReunionStep';
import FechaLugarStep from '@/components/workflows/FechaLugarStep';
import OrdenDiaStep from '@/components/workflows/OrdenDiaStep';
import DocumentacionStep from '@/components/workflows/DocumentacionStep';
import RevisionGuardarStep from '@/components/workflows/RevisionGuardarStep';

interface ConvocatoriaWorkflowProps {
  buildingId?: string;
  initialData?: any;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

const ConvocatoriaWorkflow: React.FC<ConvocatoriaWorkflowProps> = ({ 
  buildingId, 
  initialData,
  onComplete, 
  onCancel 
}) => {
  const [workflowState, setWorkflowState] = useState(() => {
    // Try to load existing workflow state
    const saved = workflowEngine.loadWorkflowState(CONVOCATORIA_WORKFLOW.id);
    const defaultData = { buildingId, ...initialData };
    return saved || workflowEngine.startWorkflow(CONVOCATORIA_WORKFLOW.id, defaultData);
  });

  const [currentStep, setCurrentStep] = useState(() => 
    workflowEngine.getCurrentStep(CONVOCATORIA_WORKFLOW.id)
  );

  const progress = workflowEngine.getWorkflowProgress(CONVOCATORIA_WORKFLOW.id);

  // Save state whenever it changes
  useEffect(() => {
    workflowEngine.saveWorkflowState(CONVOCATORIA_WORKFLOW.id);
  }, [workflowState]);

  const handleStepUpdate = (data: any) => {
    workflowEngine.updateWorkflowData(CONVOCATORIA_WORKFLOW.id, data);
    setWorkflowState({ ...workflowState, data: { ...workflowState.data, ...data } });
  };

  const handleNext = () => {
    const nextState = workflowEngine.nextStep(CONVOCATORIA_WORKFLOW.id);
    if (nextState) {
      setWorkflowState(nextState);
      setCurrentStep(workflowEngine.getCurrentStep(CONVOCATORIA_WORKFLOW.id));
      
      if (nextState.isComplete && onComplete) {
        onComplete(nextState.data);
      }
    }
  };

  const handlePrevious = () => {
    const prevState = workflowEngine.previousStep(CONVOCATORIA_WORKFLOW.id);
    if (prevState) {
      setWorkflowState(prevState);
      setCurrentStep(workflowEngine.getCurrentStep(CONVOCATORIA_WORKFLOW.id));
    }
  };

  const handleCancel = () => {
    workflowEngine.resetWorkflow(CONVOCATORIA_WORKFLOW.id);
    if (onCancel) onCancel();
  };

  const renderStepComponent = () => {
    if (!currentStep) return null;

    const commonProps = {
      data: workflowState.data,
      onUpdate: handleStepUpdate,
      onNext: handleNext,
      onPrevious: handlePrevious
    };

    switch (currentStep.component) {
      case 'TipoReunionStep':
        return <TipoReunionStep {...commonProps} />;
      case 'FechaLugarStep':
        return <FechaLugarStep {...commonProps} />;
      case 'OrdenDiaStep':
        return <OrdenDiaStep {...commonProps} />;
      case 'DocumentacionStep':
        return <DocumentacionStep {...commonProps} />;
      case 'RevisionGuardarStep':
        return <RevisionGuardarStep {...commonProps} />;
      default:
        return (
          <div className="text-center py-12">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Passo em desenvolvimento</h3>
                <p className="text-muted-foreground">
                  {currentStep.title} - {currentStep.description}
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                {workflowState.currentStepIndex > 0 && (
                  <Button variant="outline" onClick={handlePrevious}>
                    Anterior
                  </Button>
                )}
                <Button onClick={handleNext} variant="workflow">
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  const getStepStatus = (stepIndex: number) => {
    const stepId = CONVOCATORIA_WORKFLOW.steps[stepIndex]?.id;
    if (workflowState.completedSteps.includes(stepId)) return 'completed';
    if (stepIndex === workflowState.currentStepIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <span>{CONVOCATORIA_WORKFLOW.name}</span>
              </CardTitle>
              <CardDescription className="mt-2">
                {CONVOCATORIA_WORKFLOW.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {CONVOCATORIA_WORKFLOW.category}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Tempo estimado: {CONVOCATORIA_WORKFLOW.estimatedTotalTime} min
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso do workflow</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
              {CONVOCATORIA_WORKFLOW.steps.map((step, index) => {
                const status = getStepStatus(index);
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      status === 'completed' 
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                        : status === 'current'
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                        : 'bg-muted border-muted-foreground/20'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : status === 'current' ? (
                        <Circle className="h-5 w-5 text-primary fill-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs font-medium truncate">{step.title}</p>
                    {step.estimatedTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.estimatedTime}min
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {currentStep && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="default">
                    Passo {workflowState.currentStepIndex + 1} de {CONVOCATORIA_WORKFLOW.steps.length}
                  </Badge>
                  {currentStep.requiredRole && (
                    <Badge variant="outline">
                      {currentStep.requiredRole}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold">{currentStep.title}</h3>
                <p className="text-muted-foreground">{currentStep.description}</p>
              </div>
              {currentStep.estimatedTime && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{currentStep.estimatedTime} min</span>
                </div>
              )}
            </div>

            {/* Legal requirement info */}
            {currentStep.legalRequirement && (
              <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Requisito Legal - {currentStep.legalRequirement.article}
                    </p>
                    <p className="text-blue-700 dark:text-blue-200 mt-1">
                      {currentStep.legalRequirement.description}
                    </p>
                    {currentStep.legalRequirement.penalty && (
                      <p className="text-blue-600 dark:text-blue-300 mt-1 text-xs">
                        Sanção por incumprimento: {currentStep.legalRequirement.penalty}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {renderStepComponent()}
          </CardContent>
        </Card>
      )}

      {/* Cancel button */}
      <div className="flex justify-center">
        <Button variant="ghost" onClick={handleCancel} className="text-muted-foreground">
          Cancelar workflow
        </Button>
      </div>
    </div>
  );
};

export default ConvocatoriaWorkflow;