/**
 * Education Niches - Types
 * 
 * Tipagens para o sistema de nichos de Education.
 */

export type EducationNicheStatus = 
  | 'full_enabled' 
  | 'basic_enabled' 
  | 'beta' 
  | 'planned';

export type EducationNicheCapability =
  | 'basic_programs_catalog'
  | 'lead_capture'
  | 'lead_pipeline'
  | 'events_public'
  | 'trial_class_booking'
  | 'whatsapp_cta'
  | 'document_upload_pre_enrollment'
  | 'guardian_portal_basic'
  | 'schedule_public'
  | 'attendance_tracking'
  | 'gradebook'
  | 'transport_tracking'
  | 'payment_installments'
  | 'analytics_basic'
  | 'analytics_advanced';

export type EducationAdminSection =
  | 'basic_profile'
  | 'programs'
  | 'leads'
  | 'events'
  | 'analytics'
  | 'documents'
  | 'guardians'
  | 'attendance'
  | 'grades'
  | 'transport';

export interface EducationNicheVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface EducationNicheEntitlements {
  maxPrograms: number;
  maxLeadsPerMonth: number;
  maxEvents: number;
  storageMB: number;
  allowsCustomDomain: boolean;
  allowsAnalytics: boolean;
  allowsExport: boolean;
}

export interface EducationNicheLabels {
  // Profile/Instituição
  institutionTypeLabel: string;
  institutionTypePlaceholder: string;
  summaryLabel: string;
  summaryPlaceholder: string;
  
  // Programas
  programSingular: string;
  programPlural: string;
  programAddButton: string;
  programEmptyState: string;
  programCapacityLabel: string;
  
  // Leads
  leadSingular: string;
  leadPlural: string;
  leadAddButton: string;
  leadEmptyState: string;
  leadSourceLabel: string;
  
  // Eventos
  eventSingular: string;
  eventPlural: string;
  eventAddButton: string;
  eventEmptyState: string;
  
  // Matrícula/Contexto específico
  enrollmentLabel: string;
  enrollmentCTA: string;
  gradeLabel: string;
  shiftLabel: string;
  ageGroupLabel: string;
  
  // Dashboard
  dashboardWelcome: string;
  dashboardProgramsTitle: string;
  dashboardLeadsTitle: string;
  dashboardEventsTitle: string;
}

export interface EducationNicheConfig {
  nicheKey: string;
  displayName: string;
  supportLevel: EducationNicheStatus;
  enabledCapabilities: EducationNicheCapability[];
  missingCapabilities: EducationNicheCapability[];
  adminSections: EducationAdminSection[];
  isPublic: boolean;
  isSelectable: boolean;
  isBeta: boolean;
  description?: string;
  version: EducationNicheVersion;
  entitlements: EducationNicheEntitlements;
  defaultSettings: Record<string, unknown>;
  uiLabels: EducationNicheLabels;
}

export interface EducationNicheRegistry {
  [key: string]: EducationNicheConfig;
}

export interface EducationNicheValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

const EDUCATION_NICHE_KEYS = [
  'regular_school',
  'daycare',
  'language_school',
  'prep_course',
  'technical_school',
  'tutoring_center',
  'music_school',
  'sports_school',
] as const;

const EDUCATION_CAPABILITIES = [
  'basic_programs_catalog',
  'lead_capture',
  'lead_pipeline',
  'events_public',
  'trial_class_booking',
  'whatsapp_cta',
  'document_upload_pre_enrollment',
  'guardian_portal_basic',
  'schedule_public',
  'attendance_tracking',
  'gradebook',
  'transport_tracking',
  'payment_installments',
  'analytics_basic',
  'analytics_advanced',
] as const;

export function isEducationNicheKey(key: string): key is typeof EDUCATION_NICHE_KEYS[number] {
  return EDUCATION_NICHE_KEYS.includes(key as typeof EDUCATION_NICHE_KEYS[number]);
}

export function isEducationCapability(capability: string): capability is EducationNicheCapability {
  return EDUCATION_CAPABILITIES.includes(capability as EducationNicheCapability);
}
