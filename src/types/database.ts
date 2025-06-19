// Tipos de base para todas las entidades
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// ENUMS
export type MeetingType = 'ordinaria' | 'extraordinaria';
export type ConvocatoriaStatus = 'draft' | 'sent' | 'held' | 'cancelled';
export type DeliveryMethod = 'burofax' | 'notarial' | 'hand' | 'email';
export type TransactionType = 'income' | 'expense';
export type LetterType = 'quota' | 'reminder' | 'general' | 'convocatoria' | 'minutes';
export type SendMethod = 'email' | 'print' | 'whatsapp';
export type MemberRole = 'owner' | 'tenant' | 'representative';

// BUILDING
export interface Building extends BaseEntity {
  name: string;
  address: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  president_name?: string;
  president_email?: string;
  secretary_name?: string;
  secretary_email?: string;
  administrator_name?: string;
  administrator_email?: string;
  notes?: string;
  iban?: string;
  registration_number?: string;
  construction_year?: number;
  total_units?: number;
  legal_framework?: Record<string, any>;
  statutes?: Record<string, any>;
  internal_rules?: Record<string, any>;
}

// MEMBER
export interface Member extends BaseEntity {
  building_id: string;
  name: string;
  apartment: string; // Número de apartamento/unidad
  nif_nie?: string;
  email?: string;
  phone?: string;
  address?: string;
  ownership_percentage?: number; // Coeficiente de participación
  deed_date?: string;
  is_active: boolean;
  legal_representative_id?: string;
  role: MemberRole;
  votes?: number;
  permillage?: number;
  year?: number;
  monthly_fee?: number;
  annual_fee?: number;
  avatar_url?: string;
  notes?: string;
}

// CONVOCATORIA
export interface Convocatoria extends BaseEntity {
  building_id: string;
  title: string;
  meeting_type: MeetingType;
  meeting_date: string;
  meeting_location?: string;
  convocation_date: string;
  legal_notice_period: number;
  delivery_method?: DeliveryMethod;
  agenda_items: AgendaItem[];
  attached_documents?: Document[];
  legal_validation?: Record<string, any>;
  quorum_requirements?: Record<string, any>;
  status: ConvocatoriaStatus;
  meeting_subject?: string;
  president_name?: string;
  president_email?: string;
  secretary_name?: string;
  secretary_email?: string;
  administrator_name?: string;
  administrator_email?: string;
  notification_sent_at?: string;
  published_at?: string;
  published_by_user_id?: string;
  notes?: string;
}

// MINUTE (ACTA)
export interface Minute extends BaseEntity {
  building_id: string;
  convocatoria_id?: string;
  meeting_date: string;
  start_time?: string;
  end_time?: string;
  meeting_location?: string;
  attendees: Attendee[];
  total_units_represented?: number;
  total_percentage_represented?: number;
  quorum_achieved?: boolean;
  agenda_development?: Record<string, any>;
  votes_record?: VoteRecord[];
  agreements_reached?: Agreement[];
  legal_validity?: boolean;
  signed_date?: string;
  president_signature?: string;
  secretary_signature?: string;
  final_document_url?: string;
  minute_number?: string;
  attendees_count?: number;
  quorum_percentage?: number;
  quorum_met?: boolean;
  agenda_items?: Record<string, any>;
  decisions?: Record<string, any>;
  voting_results?: Record<string, any>;
  next_meeting_date?: string;
  attachments?: Record<string, any>;
  is_approved?: boolean;
  approved_at?: string;
  approved_by_user_id?: string;
  president_name?: string;
  secretary_name?: string;
  notes?: string;
}

// FINANCIAL PERIOD
export interface FinancialPeriod extends BaseEntity {
  building_id: string;
  year: number;
  start_date: string;
  end_date: string;
  approved_budget?: Record<string, any>;
  budget_approval_date?: string;
  budget_approval_minute_id?: string;
  reserve_fund_minimum?: number;
  reserve_fund_actual?: number;
  legal_compliance_check?: Record<string, any>;
  is_closed: boolean;
  closed_at?: string;
  total_income?: number;
  total_expenses?: number;
  balance?: number;
  notes?: string;
  closed_by_user_id?: string;
  initial_balance?: number;
}

// TRANSACTION
export interface Transaction extends BaseEntity {
  building_id: string;
  financial_period_id?: string;
  category_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  reference_number?: string;
  receipt_url?: string;
  notes?: string;
  member_id?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  tags?: string[];
  created_by_user_id?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  transaction_date?: string;
  period_id?: string;
  transaction_type?: TransactionType;
}

// TRANSACTION CATEGORY
export interface TransactionCategory extends BaseEntity {
  building_id: string;
  name: string;
  description?: string;
  type: TransactionType;
  is_active: boolean;
  color?: string;
  budget_amount?: number;
  parent_category_id?: string;
  sort_order?: number;
  transaction_type?: TransactionType;
}

// LETTER TEMPLATE
export interface LetterTemplate extends BaseEntity {
  building_id?: string;
  name: string;
  type: LetterType;
  subject?: string;
  content: string;
  variables?: string[];
  is_active: boolean;
  legal_basis?: string;
  required_fields?: string[];
  validation_rules?: Record<string, any>;
  title?: string;
}

// SENT LETTER
export interface SentLetter extends BaseEntity {
  building_id: string;
  template_id: string;
  member_id?: string;
  recipient_name: string;
  recipient_email?: string;
  subject: string;
  content: string;
  send_method: SendMethod;
  sent_date?: string;
  delivery_confirmation?: boolean;
  tracking_number?: string;
  legal_validity?: boolean;
  created_by_user_id?: string;
}

// MEMBER ANNUAL FEE
export interface MemberAnnualFee extends BaseEntity {
  member_id: string;
  building_id: string;
  financial_period_id?: string;
  year: number;
  fee_amount: number;
  paid_amount: number;
  is_paid: boolean;
  due_date?: string;
  paid_date?: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  late_fee?: number;
  installments?: number;
  installment_amount?: number;
  fraction_id?: string;
}

// ARREARS (MOROSIDAD)
export interface Arrears extends BaseEntity {
  member_id: string;
  building_id: string;
  amount: number;
  original_amount: number;
  due_date: string;
  description: string;
  status: string;
  last_reminder_sent?: string;
  reminder_count: number;
  settled_date?: string;
  settlement_transaction_id?: string;
}

// ATTENDANCE SHEET
export interface AttendanceSheet extends BaseEntity {
  building_id: string;
  convocatoria_id?: string;
  minute_id?: string;
  meeting_date: string;
  total_members: number;
  present_members: number;
  represented_members: number;
}

// ATTENDEE
export interface Attendee extends BaseEntity {
  attendance_sheet_id?: string;
  member_id: string;
  member_name: string;
  attendance_type: 'present' | 'represented' | 'absent';
  representative_name?: string;
  signature?: string;
  arrival_time?: string;
}

// MEETING MEMBER
export interface MeetingMember extends BaseEntity {
  building_id: string;
  minutes_id: string;
  member_id: string;
  member_name: string;
  apartment: string;
  votes: number;
  attendance_type: string;
  is_president?: boolean;
  is_secretary?: boolean;
  representative_name?: string;
  signature?: string;
  arrival_time?: string;
  departure_time?: string;
  voting_power?: number;
  percentage_represented?: number;
}

// MINUTE AGENDA ITEM
export interface MinuteAgendaItem extends BaseEntity {
  minutes_id: string;
  building_id?: string;
  item_number: number;
  title: string;
  description?: string;
  discussion?: string;
  decision?: string;
  vote_type?: string;
  votes_in_favor?: number;
  votes_against?: number;
  abstentions?: number;
  is_approved?: boolean;
  legal_requirement?: string;
}

// MEMBER VOTE
export interface MemberVote extends BaseEntity {
  minute_agenda_item_id: string;
  member_id: string;
  building_id?: string;
  member_name: string;
  apartment: string;
  vote: 'favor' | 'against' | 'abstention';
  voting_power: number;
  representative_name?: string;
  comments?: string;
  vote_timestamp?: string;
  is_proxy_vote?: boolean;
  proxy_document_url?: string;
}

// VOTING RESULT
export interface VotingResult extends BaseEntity {
  minute_agenda_item_id: string;
  total_votes: number;
  votes_in_favor: number;
  votes_against: number;
  abstentions: number;
  quorum_percentage: number;
  is_approved: boolean;
}

// FRACTION
export interface Fraction extends BaseEntity {
  building_id: string;
  member_id?: string;
  unit_number: string;
  ownership_percentage: number;
  surface_area?: number;
  fraction_type?: string;
  is_active: boolean;
  deed_reference?: string;
  acquisition_date?: string;
  notes?: string;
}

// Tipos auxiliares
export interface AgendaItem {
  id: string;
  number: number;
  title: string;
  description?: string;
  type?: 'information' | 'decision' | 'vote';
  requiredMajority?: 'simple' | 'qualified' | 'unanimous';
  legalBasis?: string;
  attachedDocuments?: string[];
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt: string;
}

export interface VoteRecord {
  agendaItemId: string;
  votes: {
    memberId: string;
    memberName: string;
    vote: 'favor' | 'against' | 'abstention';
    votingPower: number;
  }[];
  result: {
    totalVotes: number;
    inFavor: number;
    against: number;
    abstentions: number;
    approved: boolean;
  };
}

export interface Agreement {
  agendaItemId: string;
  title: string;
  description: string;
  approved: boolean;
  effectiveDate?: string;
  responsibleParty?: string;
}

// Tipos para workflows
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  data?: Record<string, any>;
}

export interface WorkflowData {
  id: string;
  name: string;
  currentStep: number;
  steps: WorkflowStep[];
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Tipos para validaciones legales
export interface LegalValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requirements: LegalRequirement[];
}

export interface LegalRequirement {
  id: string;
  description: string;
  article: string;
  mandatory: boolean;
  fulfilled: boolean;
}