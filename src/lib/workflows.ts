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
  description: 'Processo simplificado para criar uma convocatória de assembleia',
  category: 'convocatoria',
  icon: 'FileText',
  estimatedTotalTime: 35,
  requiredDocuments: [],
  outputDocuments: ['convocatoria_oficial'],
  legalContext: {
    framework: 'CC_PT',
    applicableArticles: ['Art. 1430.º CC', 'Art. 1431.º CC', 'Art. 1432.º CC'],
    complianceNotes: [
      'Convocatória com 15-30 dias de antecedência',
      'Ordem do dia detalhada',
      'Envio posterior por email/WhatsApp'
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
      description: 'Estabelecer quando e onde se realizará a assembleia (1ª e 2ª convocatória)',
      component: 'FechaLugarStep',
      estimatedTime: 7,
      validation: [
        { field: 'meetingDate', type: 'date', message: 'Data da reunião obrigatória' },
        { field: 'meetingTime', type: 'required', message: 'Hora da reunião obrigatória' },
        { field: 'meetingLocation', type: 'required', message: 'Local da reunião obrigatório' }
      ],
      legalRequirement: {
        article: 'Art. 1430.º e 1431.º CC',
        description: 'Mínimo 15 dias de antecedência. Segunda convocatória: meia hora depois',
        mandatory: true
      }
    },
    {
      id: 'orden-dia',
      title: 'Ordem do Dia',
      description: 'Definir os pontos a tratar na reunião (biblioteca com 27 modelos)',
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
      description: 'Anexar orçamentos, relatórios e documentos necessários (opcional)',
      component: 'DocumentacionStep',
      estimatedTime: 5,
      canSkip: true,
      validation: []
    },
    {
      id: 'revision-guardar',
      title: 'Revisão e Guardar',
      description: 'Vista prévia da convocatória e guardar na base de dados',
      component: 'RevisionGuardarStep',
      estimatedTime: 5,
      validation: []
    }
  ]
};

export const ACTA_WORKFLOW: WorkflowDefinition = {
  id: 'celebracion-acta',
  name: 'Celebração de Assembleia e Redação de Acta',
  description: 'Gestão completa da reunião e geração automática da acta oficial',
  category: 'acta',
  icon: 'FileSignature',
  estimatedTotalTime: 120,
  legalContext: {
    framework: 'LPH',
    applicableArticles: ['Art. 19 LPH', 'Art. 20 LPH'],
    complianceNotes: [
      'Registo obrigatório de participantes',
      'Verificação de quórum legal',
      'Acta deve ser assinada pelo Presidente e Secretário'
    ]
  },
  steps: [
    {
      id: 'preparacion-reunion',
      title: 'Preparação da Reunião',
      description: 'Configurar sala, documentos e material necessário',
      component: 'PreparacionReunionStep',
      estimatedTime: 15
    },
    {
      id: 'control-asistencia',
      title: 'Controlo de Presenças',
      description: 'Registo de participantes, representações e procurações',
      component: 'ControlAsistenciaStep',
      estimatedTime: 20,
      validation: [
        { field: 'attendees', type: 'required', message: 'Deve registar os participantes' }
      ]
    },
    {
      id: 'verificacion-quorum',
      title: 'Verificação de Quórum',
      description: 'Cálculo automático do quórum segundo coeficientes de participação',
      component: 'VerificacionQuorumStep',
      estimatedTime: 5,
      legalRequirement: {
        article: 'Art. 16 LPH',
        description: 'Primeira convocatória: >50% coeficientes. Segunda: >25%',
        mandatory: true
      }
    },
    {
      id: 'desarrollo-reunion',
      title: 'Desenvolvimento da Reunião',
      description: 'Discussão e votação de cada ponto da ordem do dia',
      component: 'DesarrolloReunionStep',
      estimatedTime: 75,  // Aumentado para incluir votações inline
      legalRequirement: {
        article: 'Art. 1430º CC e Art. 1432º CC',
        description: 'Maioria simples (>50%) ou qualificada (2/3) calculada por permilagem. Votação nominal obrigatória.',
        mandatory: true
      }
    },
    {
      id: 'redaccion-acta',
      title: 'Geração da Acta',
      description: 'Criação automática da acta com modelo legal',
      component: 'RedaccionActaStep',
      estimatedTime: 10
    },
    {
      id: 'firmas-acta',
      title: 'Assinaturas e Aprovação',
      description: 'Assinatura do Presidente, Secretário e aprovação final',
      component: 'FirmasActaStep',
      estimatedTime: 5,
      legalRequirement: {
        article: 'Art. 19 LPH',
        description: 'Acta deve ser assinada pelo Presidente e Secretário',
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