/**
 * Education Module - Types
 *
 * Tipagens centralizadas do modulo Education.
 */

// Tipos especificos para escolas regulares
export type SchoolType = 'public' | 'private' | 'charter' | 'community';
export type SchoolNetwork = 'municipal' | 'state' | 'federal' | 'private';

// Nichos do modulo Education
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
  | 'youth_adult_education'
  | 'high_school'
  | 'technical';

export type SchoolShift = 'morning' | 'afternoon' | 'evening' | 'full_day';

export type SchoolBasicResourceKey =
  | 'water_supply'
  | 'electricity'
  | 'sewage'
  | 'waste_collection';

export type SchoolAccessibilityFeatureKey =
  | 'handrails_guardrails'
  | 'elevator'
  | 'tactile_flooring'
  | 'wide_doors_80cm'
  | 'ramps'
  | 'sound_signage'
  | 'tactile_signage'
  | 'visual_signage';

export type SchoolEquipmentFeatureKey =
  | 'satellite_dish'
  | 'computer'
  | 'copier'
  | 'printer'
  | 'multifunction_printer'
  | 'scanner'
  | 'dvd_player'
  | 'sound_system'
  | 'television'
  | 'digital_whiteboard'
  | 'multimedia_projector'
  | 'desktop_computer'
  | 'notebook'
  | 'tablet'
  | 'internet';

export type SchoolFacilityFeatureKey =
  | 'warehouse'
  | 'green_area'
  | 'auditorium'
  | 'bathroom'
  | 'child_bathroom'
  | 'accessible_bathroom_pcd'
  | 'staff_bathroom'
  | 'bathroom_with_shower'
  | 'library'
  | 'reading_room'
  | 'kitchen'
  | 'pantry'
  | 'student_dormitory'
  | 'teacher_dormitory'
  | 'science_lab'
  | 'computer_lab'
  | 'covered_courtyard'
  | 'open_courtyard'
  | 'playground'
  | 'pool'
  | 'parking'
  | 'accessible_parking'
  | 'sports_court'
  | 'covered_sports_court'
  | 'open_sports_court'
  | 'cafeteria'
  | 'art_room'
  | 'music_room'
  | 'dance_studio'
  | 'multiuse_room'
  | 'principal_office'
  | 'teacher_room'
  | 'student_rest_room'
  | 'secretary_office'
  | 'aee_resource_room'
  | 'open_recreation_area'
  | 'animal_nursery';

export interface SchoolAgeRange {
  min: number;
  max: number;
}

// Canonical contracts for education profiles and their public/admin modules.
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

  // Identidade/regulacao escolar (quando aplicavel ao tipo de instituicao)
  school_type?: SchoolType | null;
  school_network?: SchoolNetwork | null;
  school_inep_code?: string | null;
  school_source_url?: string | null;
  school_source_updated_at?: string | null;
  education_levels?: EducationLevel[] | null;
  shifts?: SchoolShift[] | null;
  age_range_min?: number | null;
  age_range_max?: number | null;
  enrollment_open?: boolean | null;
  // Infraestrutura da unidade educacional (publica ou privada; qualquer nicho fisico)
  school_basic_resources?: SchoolBasicResourceKey[] | null;
  school_accessibility_features?: SchoolAccessibilityFeatureKey[] | null;
  school_equipment_features?: SchoolEquipmentFeatureKey[] | null;
  school_facility_features?: SchoolFacilityFeatureKey[] | null;
}

export interface EducationPublicRoute {
  state: string;
  city: string;
  district: string;
  slug: string;
  geographic_path: string;
}

export interface EducationPublicProfile extends EducationProfile {
  business_data_id: string | null;
  business_name: string | null;
  is_claimable: boolean;
  public_route: EducationPublicRoute | null;
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

  // Campos especificos para escolas regulares (regular_school)
  education_level?: EducationLevel | null;
  grade?: string | null; // Ex: "1 ano", "6 ano", "3 serie"
  class_name?: string | null; // Ex: "A", "B", "Turma 1"
  max_capacity?: number | null;
  current_enrollment?: number | null;
  schedule?: string | null; // Ex: "Seg-Sex 07:30-12:00"
  curriculum_topics?: string[] | null; // Disciplinas, modulos ou conteudos
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

  // Campos especificos para matricula escolar (regular_school)
  guardian_name?: string | null; // Nome do responsavel (quando diferente de full_name)
  student_name?: string | null; // Nome do aluno (quando diferente de child_name)
  student_age?: number | null; // Idade do aluno
  desired_grade?: string | null; // Serie/ano desejado: "1 ano", "6 ano"
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

  // Campo especifico para escolas regulares
  school_event_type?: SchoolEventType | null;
}

export type EducationLeadStatus =
  | 'new'
  | 'contacted'
  | 'visit_scheduled'
  | 'proposal_sent'
  | 'enrolled'
  | 'lost';

export type { EducationProfileStatus } from "@/core/education/types";

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

export interface EducationGradeMetrics {
  grade: string;
  leadCount: number;
  enrollmentCount: number;
}

export interface EducationShiftMetrics {
  shift: string;
  leadCount: number;
  enrollmentCount: number;
}

export interface EducationAnalyticsData {
  leads: {
    total: number;
    new: number;
    contacted: number;
    visitScheduled: number;
    proposalSent: number;
    enrolled: number;
    lost: number;
    conversionRate: number;
    avgDaysToFirstContact: number;
    byGrade?: EducationGradeMetrics[];
    byShift?: EducationShiftMetrics[];
  };
  programs: {
    total: number;
    active: number;
    avgEnrollmentRate?: number;
    totalVacancies?: number;
    filledVacancies?: number;
  };
  events: {
    total: number;
    upcoming: number;
    schoolToursCount?: number;
    openHouseCount?: number;
    enrollmentFairCount?: number;
  };
  schoolMetrics?: {
    enrollmentWindowOpen: boolean;
    mostRequestedGrade: string | null;
    mostRequestedShift: string | null;
  };
}

export interface EducationAnalyticsEvent {
  id: string;
  education_profile_id: string;
  business_data_id?: string | null;
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
  businessDataId?: string;
  nicheKey: EducationNicheKey;
  eventType: EducationAnalyticsEventType;
  programId?: string;
  educationEventId?: string;
  leadId?: string;
  sourcePage?: string;
  metadata?: Record<string, unknown>;
}
