import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { workflowEngine, ACTA_WORKFLOW } from '@/lib/workflows';
import { CheckCircle, Circle, Clock, AlertCircle, FileSignature } from 'lucide-react';

// Import workflow step components
import PreparacionReunionStep from '@/components/workflows/PreparacionReunionStep';
import ControlAsistenciaStep from '@/components/workflows/ControlAsistenciaStep';
import VerificacionQuorumStep from '@/components/workflows/VerificacionQuorumStep';
import DesarrolloReunionStep from '@/components/workflows/DesarrolloReunionStep';
import VotingStep from '@/components/workflows/VotingStep';
import RedaccionActaStep from '@/components/workflows/RedaccionActaStep';
import FirmasActaStep from '@/components/workflows/FirmasActaStep';
import { getMinuteById, updateMinuteAgendaItems, getConvocatoriaById } from '@/lib/api';
import { toast } from 'sonner';

interface ActaWorkflowProps {
  convocatoriaId?: string;
  actaId?: string; // NEW: Para editar acta existente
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

const ActaWorkflow: React.FC<ActaWorkflowProps> = ({
  convocatoriaId,
  actaId,
  onComplete,
  onCancel
}) => {
  const [workflowState, setWorkflowState] = useState(() => {
    // Try to load existing workflow state
    const saved = workflowEngine.loadWorkflowState(ACTA_WORKFLOW.id);
    return saved || workflowEngine.startWorkflow(ACTA_WORKFLOW.id, { convocatoriaId, actaId });
  });

  const [currentStep, setCurrentStep] = useState(() =>
    workflowEngine.getCurrentStep(ACTA_WORKFLOW.id)
  );

  const [isLoadingActa, setIsLoadingActa] = useState(false);

  const progress = workflowEngine.getWorkflowProgress(ACTA_WORKFLOW.id);

  // Load acta data if editing existing acta
  useEffect(() => {
    const loadActaData = async () => {
      if (actaId && !workflowState.data.agenda_items) {
        setIsLoadingActa(true);
        try {
          const result = await getMinuteById(actaId);
          const acta = result.data || result;

          // Update workflow state with acta data
          handleStepUpdate({
            actaId,
            agenda_items: acta.agenda_items || [],
            building_id: acta.building_id,
            building_name: acta.building_name,
            building_address: acta.building_address,
            minute_number: acta.minute_number,
            meeting_date: acta.meeting_date,
            meeting_time: acta.meeting_time,
            location: acta.location,
            assembly_type: acta.assembly_type,
            president_name: acta.president_name,
            secretary_name: acta.secretary_name,
            president_signature: acta.president_signature,  // ✅ NOVO
            secretary_signature: acta.secretary_signature,  // ✅ NOVO
            signatures: {  // ✅ NOVO - Dados completos de assinaturas
              president_name: acta.president_name,
              president_signed: !!acta.president_signature,
              president_signed_date: acta.president_signed_date,
              president_signature: acta.president_signature,
              secretary_name: acta.secretary_name,
              secretary_signed: !!acta.secretary_signature,
              secretary_signed_date: acta.secretary_signed_date,
              secretary_signature: acta.secretary_signature
            }
          });

          toast.success('Acta carregada com sucesso');
        } catch (error) {
          console.error('Error loading acta:', error);
          toast.error('Erro ao carregar acta');
        } finally {
          setIsLoadingActa(false);
        }
      }
    };

    loadActaData();
  }, [actaId]);

  // Load convocatoria data when creating new acta from convocatoria
  useEffect(() => {
    const loadConvocatoriaData = async () => {
      if (convocatoriaId && !actaId && !workflowState.data.convocatoria_loaded) {
        setIsLoadingActa(true);
        try {
          const result = await getConvocatoriaById(convocatoriaId);
          const convocatoria = result.data || result;

          // Pre-fill workflow with convocatoria data
          handleStepUpdate({
            convocatoriaId,
            convocatoria_loaded: true,
            agenda_items: convocatoria.agenda_items || [],
            building_id: convocatoria.building_id,
            building_name: convocatoria.building_name,
            building_address: convocatoria.building_address,
            postal_code: convocatoria.postal_code,
            city: convocatoria.city,
            assembly_number: convocatoria.assembly_number,
            minute_number: convocatoria.assembly_number, // Same as assembly_number
            meeting_date: convocatoria.date || convocatoria.meeting_date,
            meeting_time: convocatoria.time || convocatoria.meeting_time,
            location: convocatoria.location || convocatoria.meeting_location,
            assembly_type: convocatoria.assembly_type,
            administrator: convocatoria.administrator
          });

          toast.success(`Dados da convocatória #${convocatoria.assembly_number} carregados`);
        } catch (error) {
          console.error('Error loading convocatoria:', error);
          toast.error('Erro ao carregar convocatória');
        } finally {
          setIsLoadingActa(false);
        }
      }
    };

    loadConvocatoriaData();
  }, [convocatoriaId, actaId]);

  // Save state whenever it changes
  useEffect(() => {
    workflowEngine.saveWorkflowState(ACTA_WORKFLOW.id);
  }, [workflowState]);

  const handleStepUpdate = (data: any) => {
    workflowEngine.updateWorkflowData(ACTA_WORKFLOW.id, data);
    setWorkflowState({ ...workflowState, data: { ...workflowState.data, ...data } });
  };

  const handleNext = async () => {
    // Si estamos en el paso de desarrollo y hay actaId, guardar votaciones
    if (currentStep?.component === 'DesarrolloReunionStep' && workflowState.data.actaId) {
      try {
        await updateMinuteAgendaItems(workflowState.data.actaId, workflowState.data.agenda_items);
        toast.success('Votações guardadas com sucesso');
      } catch (error) {
        console.error('Error saving votes:', error);
        toast.error('Erro ao guardar votações');
        return; // No avanzar si falla el guardado
      }
    }

    const nextState = workflowEngine.nextStep(ACTA_WORKFLOW.id);
    if (nextState) {
      setWorkflowState(nextState);
      setCurrentStep(workflowEngine.getCurrentStep(ACTA_WORKFLOW.id));

      if (nextState.isComplete && onComplete) {
        onComplete(nextState.data);
      }
    }
  };

  const handlePrevious = () => {
    const prevState = workflowEngine.previousStep(ACTA_WORKFLOW.id);
    if (prevState) {
      setWorkflowState(prevState);
      setCurrentStep(workflowEngine.getCurrentStep(ACTA_WORKFLOW.id));
    }
  };

  const handleCancel = () => {
    workflowEngine.resetWorkflow(ACTA_WORKFLOW.id);
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
      case 'PreparacionReunionStep':
        return <PreparacionReunionStep {...commonProps} />;
      case 'ControlAsistenciaStep':
        return <ControlAsistenciaStep {...commonProps} />;
      case 'VerificacionQuorumStep':
        return <VerificacionQuorumStep {...commonProps} />;
      case 'DesarrolloReunionStep':
        return <DesarrolloReunionStep {...commonProps} />;
      case 'VotingStep':
        return <VotingStep {...commonProps} />;
      case 'RedaccionActaStep':
        return <RedaccionActaStep {...commonProps} />;
      case 'FirmasActaStep':
        return <FirmasActaStep {...commonProps} />;
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
    const stepId = ACTA_WORKFLOW.steps[stepIndex]?.id;
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
                <FileSignature className="h-8 w-8 text-primary" />
                <span>{ACTA_WORKFLOW.name}</span>
              </CardTitle>

              {/* Informação Contextual: Número e Edifício */}
              <div className="flex items-center gap-2 mt-3">
                {(workflowState.data.minute_number || workflowState.data.assembly_number) && (
                  <Badge variant="default" className="text-base px-3 py-1">
                    {workflowState.data.minute_number
                      ? `Acta #${workflowState.data.minute_number}`
                      : `Convocatória #${workflowState.data.assembly_number}`}
                  </Badge>
                )}
                {workflowState.data.building_name && (
                  <Badge variant="outline" className="text-sm">
                    {workflowState.data.building_name}
                  </Badge>
                )}
                {workflowState.data.assembly_type && (
                  <Badge variant="secondary" className="text-sm">
                    {workflowState.data.assembly_type === 'ordinary' ? 'Ordinária' : 'Extraordinária'}
                  </Badge>
                )}
              </div>

              <CardDescription className="mt-2">
                {ACTA_WORKFLOW.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {ACTA_WORKFLOW.category}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Tempo estimado: {ACTA_WORKFLOW.estimatedTotalTime} min
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
              {ACTA_WORKFLOW.steps.map((step, index) => {
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
                    Passo {workflowState.currentStepIndex + 1} de {ACTA_WORKFLOW.steps.length}
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

export default ActaWorkflow;