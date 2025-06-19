// Motor de workflows guiados para gestión de condominios

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  component?: string; // Nombre del componente a renderizar
  validation?: ValidationRule[];
  requiredRole?: 'admin' | 'president' | 'secretary';
  legalRequirement?: LegalRequirement;
  nextStep?: string | ((data: any) => string);
  canSkip?: boolean;
  estimatedTime?: number; // en minutos
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'convocatoria' | 'acta' | 'financiero' | 'comunicacion';
  icon?: string;
  steps: WorkflowStep[];
  legalContext: LegalContext;
  estimatedTotalTime?: number;
  requiredDocuments?: string[];
  outputDocuments?: string[];
}

export interface LegalRequirement {
  article: string;
  description: string;
  mandatory: boolean;
  penalty?: string;
  deadline?: string;
}

export interface LegalContext {
  framework: 'LPH' | 'CC_PT' | 'LOCAL'; // Ley de Propiedad Horizontal, Código Civil PT, Local
  applicableArticles: string[];
  complianceNotes: string[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'date' | 'number' | 'email' | 'custom';
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface WorkflowState {
  workflowId: string;
  currentStepIndex: number;
  data: Record<string, any>;
  completedSteps: string[];
  validationErrors: Record<string, string[]>;
  startedAt: string;
  lastModified: string;
  isComplete: boolean;
}

// Definiciones de workflows principales

export const CONVOCATORIA_WORKFLOW: WorkflowDefinition = {
  id: 'convocatoria-junta',
  name: 'Convocatória de Assembleia de Condóminos',
  description: 'Processo completo para convocar uma assembleia de condóminos cumprindo todos os requisitos legais',
  category: 'convocatoria',
  icon: 'FileText',
  estimatedTotalTime: 45,
  requiredDocuments: ['estatutos', 'censo_proprietarios'],
  outputDocuments: ['convocatoria_oficial', 'comprovativo_receção'],
  legalContext: {
    framework: 'CC_PT',
    applicableArticles: ['Art. 1430.º CC', 'Art. 1431.º CC', 'Art. 1432.º CC'],
    complianceNotes: [
      'Convocatória com 15-30 dias de antecedência',
      'Ordem do dia detalhada',
      'Documentação anexa obrigatória'
    ]
  },
  steps: [
    {
      id: 'tipo-reunion',
      title: 'Tipo de Reunião',
      description: 'Selecionar se é assembleia ordinária (anual) ou extraordinária',
      component: 'TipoReunionStep',
      estimatedTime: 3,
      validation: [
        { field: 'meetingType', type: 'required', message: 'Deve selecionar o tipo de reunião' }
      ],
      legalRequirement: {
        article: 'Art. 1430.º CC',
        description: 'Reunião anual obrigatória de condóminos',
        mandatory: true,
        penalty: 'Responsabilidade legal do administrador'
      }
    },
    {
      id: 'fecha-lugar',
      title: 'Data, Hora e Local',
      description: 'Estabelecer quando e onde se realizará a assembleia',
      component: 'FechaLugarStep',
      estimatedTime: 5,
      validation: [
        { field: 'meetingDate', type: 'date', message: 'Data da reunião obrigatória' },
        { field: 'meetingTime', type: 'required', message: 'Hora da reunião obrigatória' },
        { field: 'meetingLocation', type: 'required', message: 'Local da reunião obrigatório' }
      ],
      legalRequirement: {
        article: 'Art. 1430.º CC',
        description: 'Mínimo 15 dias naturais de antecedência para primeira convocatória',
        mandatory: true
      }
    },
    {
      id: 'orden-dia',
      title: 'Ordem do Dia',
      description: 'Definir os pontos a tratar na reunião',
      component: 'OrdenDiaStep',
      estimatedTime: 15,
      validation: [
        { field: 'agendaItems', type: 'required', message: 'Deve incluir pelo menos um ponto na ordem do dia' }
      ],
      legalRequirement: {
        article: 'Art. 1430.º CC',
        description: 'Ordem do dia deve incluir todos os assuntos a tratar',
        mandatory: true
      }
    },
    {
      id: 'documentacion',
      title: 'Documentação Anexa',
      description: 'Anexar orçamentos, relatórios e documentos necessários',
      component: 'DocumentacionStep',
      estimatedTime: 10,
      canSkip: true,
      validation: []
    },
    {
      id: 'segunda-convocatoria',
      title: 'Segunda Convocatória',
      description: 'Configurar segunda convocatória caso não haja quórum',
      component: 'SegundaConvocatoriaStep',
      estimatedTime: 8,
      validation: [],
      legalRequirement: {
        article: 'Art. 1431.º CC',
        description: 'Segunda convocatória com qualquer número de condóminos presentes',
        mandatory: false
      }
    },
    {
      id: 'metodo-envio',
      title: 'Método de Envio',
      description: 'Selecionar método de notificação com validade legal',
      component: 'MetodoEnvioStep',
      estimatedTime: 5,
      validation: [
        { field: 'deliveryMethods', type: 'required', message: 'Método de envio obrigatório' }
      ],
      legalRequirement: {
        article: 'Art. 1430.º CC',
        description: 'Notificação por método que garanta a receção',
        mandatory: true
      }
    },
    {
      id: 'revision-legal',
      title: 'Revisão Legal Automática',
      description: 'Verificação do cumprimento de todos os requisitos legais',
      component: 'RevisionLegalStep',
      estimatedTime: 3,
      validation: []
    },
    {
      id: 'envio-confirmacion',
      title: 'Envio e Confirmação',
      description: 'Envio massivo de convocatórias e rastreamento de entregas',
      component: 'EnvioConfirmacionStep',
      estimatedTime: 4,
      validation: []
    }
  ]
};

export const ACTA_WORKFLOW: WorkflowDefinition = {
  id: 'celebracion-acta',
  name: 'Celebración de Junta y Redacción de Acta',
  description: 'Gestión completa de la reunión y generación automática del acta oficial',
  category: 'acta',
  icon: 'FileSignature',
  estimatedTotalTime: 120,
  legalContext: {
    framework: 'LPH',
    applicableArticles: ['Art. 19 LPH', 'Art. 20 LPH'],
    complianceNotes: [
      'Registro obligatorio de asistentes',
      'Verificación de quórum legal',
      'Acta debe ser firmada por Presidente y Secretario'
    ]
  },
  steps: [
    {
      id: 'preparacion-reunion',
      title: 'Preparación de la Reunión',
      description: 'Configurar sala, documentos y material necesario',
      component: 'PreparacionReunionStep',
      estimatedTime: 15
    },
    {
      id: 'control-asistencia',
      title: 'Control de Asistencia',
      description: 'Registro de asistentes, representaciones y poderes',
      component: 'ControlAsistenciaStep',
      estimatedTime: 20,
      validation: [
        { field: 'attendees', type: 'required', message: 'Debe registrar los asistentes' }
      ]
    },
    {
      id: 'verificacion-quorum',
      title: 'Verificación de Quórum',
      description: 'Cálculo automático del quórum según coeficientes de participación',
      component: 'VerificacionQuorumStep',
      estimatedTime: 5,
      legalRequirement: {
        article: 'Art. 16 LPH',
        description: 'Primera convocatoria: >50% coeficientes. Segunda: >25%',
        mandatory: true
      }
    },
    {
      id: 'desarrollo-reunion',
      title: 'Desarrollo de la Reunión',
      description: 'Tratamiento punto por punto del orden del día',
      component: 'DesarrolloReunionStep',
      estimatedTime: 60
    },
    {
      id: 'votaciones',
      title: 'Registro de Votaciones',
      description: 'Captura de votos, cálculo de mayorías y aprobación de acuerdos',
      component: 'VotacionesStep',
      estimatedTime: 15,
      legalRequirement: {
        article: 'Art. 17 LPH',
        description: 'Mayorías: Simple (>50% presentes), Cualificada (>2/3 total), Unanimidad',
        mandatory: true
      }
    },
    {
      id: 'redaccion-acta',
      title: 'Generación del Acta',
      description: 'Creación automática del acta con plantilla legal',
      component: 'RedaccionActaStep',
      estimatedTime: 10
    },
    {
      id: 'firmas-acta',
      title: 'Firmas y Aprobación',
      description: 'Firma del Presidente, Secretario y aprobación final',
      component: 'FirmasActaStep',
      estimatedTime: 5,
      legalRequirement: {
        article: 'Art. 19 LPH',
        description: 'Acta debe ser firmada por Presidente y Secretario',
        mandatory: true
      }
    }
  ]
};

export const GESTION_FINANCIERA_WORKFLOW: WorkflowDefinition = {
  id: 'gestion-financiera-anual',
  name: 'Gestión Financiera Anual',
  description: 'Proceso completo de cierre de ejercicio, rendición de cuentas y presupuesto',
  category: 'financiero',
  icon: 'Calculator',
  estimatedTotalTime: 180,
  legalContext: {
    framework: 'LPH',
    applicableArticles: ['Art. 20 LPH', 'Art. 9.1.f) LPH'],
    complianceNotes: [
      'Rendición de cuentas anual obligatoria',
      'Fondo de reserva mínimo 5% del presupuesto',
      'Aprobación en Junta de Propietarios'
    ]
  },
  steps: [
    {
      id: 'cierre-ejercicio',
      title: 'Cierre del Ejercicio Anterior',
      description: 'Consolidación de todos los ingresos y gastos del año',
      component: 'CierreEjercicioStep',
      estimatedTime: 45
    },
    {
      id: 'rendicion-cuentas',
      title: 'Rendición de Cuentas',
      description: 'Informe detallado de la situación económica',
      component: 'RendicionCuentasStep',
      estimatedTime: 30,
      legalRequirement: {
        article: 'Art. 20 LPH',
        description: 'Administrador debe rendir cuentas anualmente',
        mandatory: true
      }
    },
    {
      id: 'presupuesto-nuevo',
      title: 'Elaboración del Nuevo Presupuesto',
      description: 'Presupuesto de ingresos y gastos para el siguiente ejercicio',
      component: 'PresupuestoNuevoStep',
      estimatedTime: 60
    },
    {
      id: 'calculo-cuotas',
      title: 'Cálculo de Cuotas',
      description: 'Distribución de gastos según coeficientes de participación',
      component: 'CalculoCuotasStep',
      estimatedTime: 30
    },
    {
      id: 'fondo-reserva',
      title: 'Fondo de Reserva',
      description: 'Cálculo y validación del fondo de reserva legal',
      component: 'FondoReservaStep',
      estimatedTime: 10,
      legalRequirement: {
        article: 'Art. 9.1.f) LPH',
        description: 'Fondo de reserva mínimo 5% del presupuesto anual',
        mandatory: true
      }
    },
    {
      id: 'aprobacion-junta',
      title: 'Documentos para Aprobación',
      description: 'Preparación de documentos para votación en junta',
      component: 'AprobacionJuntaStep',
      estimatedTime: 5
    }
  ]
};

export const GESTION_MOROSOS_WORKFLOW: WorkflowDefinition = {
  id: 'gestion-morosos',
  name: 'Gestión Legal de Morosos',
  description: 'Proceso escalonado legal para el cobro de cuotas impagadas',
  category: 'comunicacion',
  icon: 'AlertTriangle',
  estimatedTotalTime: 30,
  legalContext: {
    framework: 'LPH',
    applicableArticles: ['Art. 9.1.e) LPH', 'Art. 21 LPH'],
    complianceNotes: [
      'Requerimiento previo obligatorio',
      'Interés legal del dinero aplicable',
      'Posibilidad de vía judicial'
    ]
  },
  steps: [
    {
      id: 'deteccion-impago',
      title: 'Detección de Impago',
      description: 'Identificación automática de cuotas vencidas',
      component: 'DeteccionImpagoStep',
      estimatedTime: 2
    },
    {
      id: 'primer-requerimiento',
      title: 'Primer Requerimiento Amistoso',
      description: 'Carta de requerimiento con plazo de 15 días',
      component: 'PrimerRequerimientoStep',
      estimatedTime: 10,
      legalRequirement: {
        article: 'Art. 9.1.e) LPH',
        description: 'Requerimiento previo necesario antes de acciones legales',
        mandatory: true
      }
    },
    {
      id: 'segundo-requerimiento',
      title: 'Requerimiento Notarial',
      description: 'Requerimiento vía notarial con coste para el moroso',
      component: 'SegundoRequerimientoStep',
      estimatedTime: 8
    },
    {
      id: 'calculo-intereses',
      title: 'Cálculo de Intereses y Gastos',
      description: 'Aplicación del interés legal y gastos de gestión',
      component: 'CalculoInteresesStep',
      estimatedTime: 5,
      legalRequirement: {
        article: 'Art. 21 LPH',
        description: 'Interés legal del dinero + gastos justificados',
        mandatory: true
      }
    },
    {
      id: 'via-judicial',
      title: 'Preparación Vía Judicial',
      description: 'Documentación para procedimiento monitorio',
      component: 'ViaJudicialStep',
      estimatedTime: 5
    }
  ]
};

// Clase principal del motor de workflows
export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private activeWorkflows: Map<string, WorkflowState> = new Map();

  constructor() {
    this.registerWorkflow(CONVOCATORIA_WORKFLOW);
    this.registerWorkflow(ACTA_WORKFLOW);
    this.registerWorkflow(GESTION_FINANCIERA_WORKFLOW);
    this.registerWorkflow(GESTION_MOROSOS_WORKFLOW);
  }

  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  getWorkflowsByCategory(category: string): WorkflowDefinition[] {
    return Array.from(this.workflows.values()).filter(w => w.category === category);
  }

  startWorkflow(workflowId: string, initialData: Record<string, any> = {}): WorkflowState {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const state: WorkflowState = {
      workflowId,
      currentStepIndex: 0,
      data: initialData,
      completedSteps: [],
      validationErrors: {},
      startedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isComplete: false
    };

    this.activeWorkflows.set(workflowId, state);
    return state;
  }

  getCurrentStep(workflowId: string): WorkflowStep | null {
    const workflow = this.workflows.get(workflowId);
    const state = this.activeWorkflows.get(workflowId);
    
    if (!workflow || !state) return null;
    
    return workflow.steps[state.currentStepIndex] || null;
  }

  canGoToNextStep(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    const state = this.activeWorkflows.get(workflowId);
    
    if (!workflow || !state) return false;
    
    const currentStep = workflow.steps[state.currentStepIndex];
    if (!currentStep) return false;

    // Validar step actual
    const validationResult = this.validateStep(workflowId, currentStep, state.data);
    return validationResult.isValid;
  }

  nextStep(workflowId: string): WorkflowState | null {
    const workflow = this.workflows.get(workflowId);
    const state = this.activeWorkflows.get(workflowId);
    
    if (!workflow || !state || !this.canGoToNextStep(workflowId)) {
      return null;
    }

    const currentStep = workflow.steps[state.currentStepIndex];
    state.completedSteps.push(currentStep.id);
    
    if (state.currentStepIndex < workflow.steps.length - 1) {
      state.currentStepIndex++;
    } else {
      state.isComplete = true;
    }
    
    state.lastModified = new Date().toISOString();
    return state;
  }

  previousStep(workflowId: string): WorkflowState | null {
    const state = this.activeWorkflows.get(workflowId);
    
    if (!state || state.currentStepIndex <= 0) return null;
    
    state.currentStepIndex--;
    state.lastModified = new Date().toISOString();
    
    // Remover de completados si volvemos atrás
    const currentStepId = this.getCurrentStep(workflowId)?.id;
    if (currentStepId) {
      state.completedSteps = state.completedSteps.filter(id => id !== currentStepId);
    }
    
    return state;
  }

  updateWorkflowData(workflowId: string, data: Record<string, any>): void {
    const state = this.activeWorkflows.get(workflowId);
    if (state) {
      state.data = { ...state.data, ...data };
      state.lastModified = new Date().toISOString();
    }
  }

  validateStep(workflowId: string, step: WorkflowStep, data: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!step.validation) return { isValid: true, errors: [] };
    
    for (const rule of step.validation) {
      const value = data[rule.field];
      
      switch (rule.type) {
        case 'required':
          if (!value || (Array.isArray(value) && value.length === 0)) {
            errors.push(rule.message);
          }
          break;
        case 'date':
          if (!value || isNaN(new Date(value).getTime())) {
            errors.push(rule.message);
          }
          break;
        case 'number':
          if (!value || isNaN(Number(value))) {
            errors.push(rule.message);
          }
          break;
        case 'email':
          if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(rule.message);
          }
          break;
        case 'custom':
          if (rule.customValidator && !rule.customValidator(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  getWorkflowProgress(workflowId: string): number {
    const workflow = this.workflows.get(workflowId);
    const state = this.activeWorkflows.get(workflowId);
    
    if (!workflow || !state) return 0;
    
    return Math.round((state.currentStepIndex / workflow.steps.length) * 100);
  }

  saveWorkflowState(workflowId: string): void {
    const state = this.activeWorkflows.get(workflowId);
    if (state) {
      localStorage.setItem(`workflow_${workflowId}`, JSON.stringify(state));
    }
  }

  loadWorkflowState(workflowId: string): WorkflowState | null {
    const saved = localStorage.getItem(`workflow_${workflowId}`);
    if (saved) {
      const state = JSON.parse(saved);
      this.activeWorkflows.set(workflowId, state);
      return state;
    }
    return null;
  }

  completeWorkflow(workflowId: string): void {
    const state = this.activeWorkflows.get(workflowId);
    if (state) {
      state.isComplete = true;
      state.lastModified = new Date().toISOString();
      this.saveWorkflowState(workflowId);
    }
  }

  resetWorkflow(workflowId: string): void {
    this.activeWorkflows.delete(workflowId);
    localStorage.removeItem(`workflow_${workflowId}`);
  }
}

// Instancia global del motor de workflows
export const workflowEngine = new WorkflowEngine();