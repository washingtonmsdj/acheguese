/**
 * Education Module - Types
 * 
 * Tipagens centralizadas do modulo Education.
 */

// Tipos específicos para escolas regulares
export type SchoolType = 'public' | 'private' | 'charter' | 'community';

// Nichos do módulo Education
export type EducationNicheKey =
  | 'regular_school'
  | 'daycare'
  | 'language_school'
  | 'prep_course'
  | 'technical_school'
  | 'tutoring_center'
  | 'music_school'
  | 'sports_school';

export type EducationLevel = 
  | 'early_childhood' 
  | 'elementary_1' 
  | 'elementary_2' 
  | 'middle_school' 
  | 'high_school' 
  | 'technical';

export type SchoolShift = 'morning' | 'afternoon' | 'evening' | 'full_day';

export interface SchoolAgeRange {
  min: number;
  max: number;
}

// Placeholder - serao implementados nas fases seguintes
export interface EducationProfile {
  id: string;
  business_id: string;
  institution_type: string;
  niche_key: EducationNicheKey;
  support_level: string;
  summary: string | null;
  whatsapp_number: string | null;
  status: 'draft' | 'published' | 'paused';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Campos específicos para escolas regulares (regular_school)
  school_type?: SchoolType | null;
  education_levels?: EducationLevel[] | null;
  shifts?: SchoolShift[] | null;
  age_range_min?: number | null;
  age_range_max?: number | null;
  enrollment_open?: boolean | null;
}

export interface EducationProgram {
  id: string;
  education_profile_id: string;
  name: string;
  description: string | null;
  age_group: string | null;
  shift: string | null;
  modality: string | null;
  available_slots: number | null;
  price_from: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  
  // Campos específicos para escolas regulares (regular_school)
  education_level?: EducationLevel | null;
  grade?: string | null; // Ex: "1º ano", "6º ano", "3ª série"
  class_name?: string | null; // Ex: "A", "B", "Turma 1"
  max_capacity?: number | null;
  current_enrollment?: number | null;
  schedule?: string | null; // Ex: "Seg-Sex 07:30-12:00"
}

export interface EducationLead {
  id: string;
  education_profile_id: string;
  full_name: string;
  email: string;
  phone: string;
  child_name: string | null;
  child_age: number | null;
  interest_note: string | null;
  source_channel: string | null;
  status: 'new' | 'contacted' | 'visit_scheduled' | 'proposal_sent' | 'enrolled' | 'lost';
  owner_user_id: string | null;
  first_contact_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Campos específicos para matrícula escolar (regular_school)
  guardian_name?: string | null; // Nome do responsável (quando diferente de full_name)
  student_name?: string | null; // Nome do aluno (quando diferente de child_name)
  student_age?: number | null; // Idade do aluno
  desired_grade?: string | null; // Série/ano desejado: "1º ano", "6º ano"
  desired_shift?: SchoolShift | null; // Turno desejado
}

export interface EducationLeadEvent {
  id: string;
  lead_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  actor_user_id: string | null;
  created_at: string;
}

export interface EducationEvent {
  id: string;
  education_profile_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  
  // Campo específico para escolas regulares
  school_event_type?: SchoolEventType | null;
}

export type EducationLeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'visit_scheduled' 
  | 'proposal_sent' 
  | 'enrolled' 
  | 'lost';

export type EducationProfileStatus = 
  | 'draft' 
  | 'published' 
  | 'paused';

// Tipos de eventos escolares
export type SchoolEventType = 
  | 'open_house' 
  | 'enrollment_fair' 
  | 'parent_meeting'
  | 'trial_class'
  | 'school_tour'
  | 'cultural_event'
  | 'sports_event'
  | 'other';

// ============================================================
// ANALYTICS EVENT TYPES
// ============================================================

export type EducationAnalyticsEventType =
  | 'profile_view'
  | 'program_view'
  | 'event_view'
  | 'whatsapp_click'
  | 'enrollment_cta_click'
  | 'lead_submitted'
  | 'event_interest';

export interface EducationAnalyticsEvent {
  id: string;
  education_profile_id: string;
  business_id?: string | null;
  niche_key: EducationNicheKey;
  event_type: EducationAnalyticsEventType;
  program_id?: string | null;
  education_event_id?: string | null;
  lead_id?: string | null;
  source_page?: string | null;
  session_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TrackEventPayload {
  educationProfileId: string;
  businessId?: string;
  nicheKey: EducationNicheKey;
  eventType: EducationAnalyticsEventType;
  programId?: string;
  educationEventId?: string;
  leadId?: string;
  sourcePage?: string;
  metadata?: Record<string, unknown>;
}
