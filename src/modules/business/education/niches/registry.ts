/**
 * Education Niches - Registry
 * 
 * SSOT para configuracao de nichos de Education.
 * Unica fonte de verdade para nichos, capacidades e secoes admin.
 */

import type { 
  EducationNicheConfig, 
  EducationNicheRegistry,
  EducationNicheCapability,
  EducationAdminSection,
  EducationNicheStatus 
} from './types';
import { getRecordValue } from '@/shared/utils/recordLookup';

const EDUCATION_NICHES: EducationNicheRegistry = {
  regular_school: {
    nicheKey: 'regular_school',
    displayName: 'Escola Regular',
    supportLevel: 'basic_enabled',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'events_public',
      'whatsapp_cta',
      'analytics_basic',
    ],
    missingCapabilities: [
      'trial_class_booking',
      'document_upload_pre_enrollment',
      'guardian_portal_basic',
      'attendance_tracking',
      'gradebook',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'events', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: false,
    description: 'Escola regular com foco em matriculas e captacao de leads',
    version: { major: 1, minor: 0, patch: 0 },
    entitlements: {
      maxPrograms: 20,
      maxLeadsPerMonth: 500,
      maxEvents: 10,
      storageMB: 100,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: true,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: false,
      requireParentInfo: true,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Escola',
      institutionTypePlaceholder: 'Ex: Escola Municipal, Escola Particular',
      summaryLabel: 'Sobre a Escola',
      summaryPlaceholder: 'Descreva a escola, metodologia, diferenciais...',
      programSingular: 'Série/Turma',
      programPlural: 'Séries/Turmas',
      programAddButton: 'Adicionar Série/Turma',
      programEmptyState: 'Nenhuma série/turma cadastrada',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu a escola',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero matricular',
      gradeLabel: 'Série/Ano',
      shiftLabel: 'Turno',
      ageGroupLabel: 'Faixa Etária',
      dashboardWelcome: 'Bem-vindo à gestão da escola',
      dashboardProgramsTitle: 'Séries e Turmas',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },
  
  daycare: {
    nicheKey: 'daycare',
    displayName: 'Creche/Bercario',
    supportLevel: 'basic_enabled',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'events_public',
      'whatsapp_cta',
      'trial_class_booking',
      'analytics_basic',
    ],
    missingCapabilities: [
      'document_upload_pre_enrollment',
      'guardian_portal_basic',
      'attendance_tracking',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'events', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: false,
    description: 'Creche e bercario com destaque para rotina e seguranca',
    version: { major: 1, minor: 0, patch: 0 },
    entitlements: {
      maxPrograms: 15,
      maxLeadsPerMonth: 300,
      maxEvents: 15,
      storageMB: 150,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: true,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: false,
      requireParentInfo: true,
      highlightSafety: true,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Creche',
      institutionTypePlaceholder: 'Ex: Creche Municipal, Creche Particular',
      summaryLabel: 'Sobre a Creche',
      summaryPlaceholder: 'Descreva a creche, rotina, cuidados especiais...',
      programSingular: 'Turma',
      programPlural: 'Turmas',
      programAddButton: 'Adicionar Turma',
      programEmptyState: 'Nenhuma turma cadastrada',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu a creche',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero matricular',
      gradeLabel: 'Faixa Etária',
      shiftLabel: 'Turno',
      ageGroupLabel: 'Idade',
      dashboardWelcome: 'Bem-vindo à gestão da creche',
      dashboardProgramsTitle: 'Turmas',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },
  
  language_school: {
    nicheKey: 'language_school',
    displayName: 'Escola de Idiomas',
    supportLevel: 'basic_enabled',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'events_public',
      'whatsapp_cta',
      'trial_class_booking',
      'analytics_basic',
    ],
    missingCapabilities: [
      'document_upload_pre_enrollment',
      'guardian_portal_basic',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'events', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: false,
    description: 'Escola de idiomas com destaque para niveis e certificacao',
    version: { major: 1, minor: 0, patch: 0 },
    entitlements: {
      maxPrograms: 30,
      maxLeadsPerMonth: 400,
      maxEvents: 8,
      storageMB: 80,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: true,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: true,
      requireParentInfo: false,
      showCertifications: true,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Escola',
      institutionTypePlaceholder: 'Ex: Escola de Inglês, Centro de Idiomas',
      summaryLabel: 'Sobre a Escola',
      summaryPlaceholder: 'Descreva a escola, metodologia, certificações...',
      programSingular: 'Curso',
      programPlural: 'Cursos',
      programAddButton: 'Adicionar Curso',
      programEmptyState: 'Nenhum curso cadastrado',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu a escola',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero me matricular',
      gradeLabel: 'Nível',
      shiftLabel: 'Horário',
      ageGroupLabel: 'Público-alvo',
      dashboardWelcome: 'Bem-vindo à gestão da escola de idiomas',
      dashboardProgramsTitle: 'Cursos',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },
  
  prep_course: {
    nicheKey: 'prep_course',
    displayName: 'Pre-Vestibular',
    supportLevel: 'basic_enabled',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'events_public',
      'whatsapp_cta',
      'trial_class_booking',
      'analytics_basic',
    ],
    missingCapabilities: [
      'document_upload_pre_enrollment',
      'guardian_portal_basic',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'events', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: false,
    description: 'Curso pre-vestibular com destaque para resultados e simulados',
    version: { major: 1, minor: 0, patch: 0 },
    entitlements: {
      maxPrograms: 25,
      maxLeadsPerMonth: 600,
      maxEvents: 12,
      storageMB: 120,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: true,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: true,
      requireParentInfo: false,
      showResults: true,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Curso',
      institutionTypePlaceholder: 'Ex: Pré-Vestibular, Pré-Enem',
      summaryLabel: 'Sobre o Curso',
      summaryPlaceholder: 'Descreva o curso, metodologia, resultados...',
      programSingular: 'Turma',
      programPlural: 'Turmas',
      programAddButton: 'Adicionar Turma',
      programEmptyState: 'Nenhuma turma cadastrada',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu o curso',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero me matricular',
      gradeLabel: 'Ano',
      shiftLabel: 'Turno',
      ageGroupLabel: 'Período',
      dashboardWelcome: 'Bem-vindo à gestão do pré-vestibular',
      dashboardProgramsTitle: 'Turmas',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },

  technical_school: {
    nicheKey: 'technical_school',
    displayName: 'Escola Tecnica',
    supportLevel: 'beta',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'whatsapp_cta',
      'analytics_basic',
    ],
    missingCapabilities: [
      'events_public',
      'trial_class_booking',
      'document_upload_pre_enrollment',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: true,
    description: 'Escola tecnica e profissionalizante',
    version: { major: 0, minor: 9, patch: 0 },
    entitlements: {
      maxPrograms: 20,
      maxLeadsPerMonth: 400,
      maxEvents: 8,
      storageMB: 100,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: false,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: true,
      requireParentInfo: false,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Escola',
      institutionTypePlaceholder: 'Ex: Escola Técnica, Centro Profissionalizante',
      summaryLabel: 'Sobre a Escola',
      summaryPlaceholder: 'Descreva os cursos técnicos e áreas de atuação...',
      programSingular: 'Curso',
      programPlural: 'Cursos',
      programAddButton: 'Adicionar Curso',
      programEmptyState: 'Nenhum curso cadastrado',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu a escola',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero me matricular',
      gradeLabel: 'Modalidade',
      shiftLabel: 'Turno',
      ageGroupLabel: 'Duração',
      dashboardWelcome: 'Bem-vindo à gestão da escola técnica',
      dashboardProgramsTitle: 'Cursos',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },

  tutoring_center: {
    nicheKey: 'tutoring_center',
    displayName: 'Centro de Reforco',
    supportLevel: 'beta',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'whatsapp_cta',
      'analytics_basic',
    ],
    missingCapabilities: [
      'events_public',
      'trial_class_booking',
      'document_upload_pre_enrollment',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: true,
    description: 'Centro de reforco escolar e aula particular',
    version: { major: 0, minor: 9, patch: 0 },
    entitlements: {
      maxPrograms: 15,
      maxLeadsPerMonth: 300,
      maxEvents: 6,
      storageMB: 80,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: false,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: true,
      requireParentInfo: false,
      highlightIndividualClasses: true,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Centro',
      institutionTypePlaceholder: 'Ex: Centro de Reforço, Aula Particular',
      summaryLabel: 'Sobre o Centro',
      summaryPlaceholder: 'Descreva as disciplinas e modalidades de ensino...',
      programSingular: 'Modalidade',
      programPlural: 'Modalidades',
      programAddButton: 'Adicionar Modalidade',
      programEmptyState: 'Nenhuma modalidade cadastrada',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu o centro',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero me matricular',
      gradeLabel: 'Disciplina',
      shiftLabel: 'Horário',
      ageGroupLabel: 'Série',
      dashboardWelcome: 'Bem-vindo à gestão do centro de reforço',
      dashboardProgramsTitle: 'Modalidades',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },

  music_school: {
    nicheKey: 'music_school',
    displayName: 'Escola de Musica',
    supportLevel: 'beta',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'whatsapp_cta',
      'analytics_basic',
    ],
    missingCapabilities: [
      'events_public',
      'trial_class_booking',
      'document_upload_pre_enrollment',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: true,
    description: 'Escola de musica e aulas instrumentais',
    version: { major: 0, minor: 9, patch: 0 },
    entitlements: {
      maxPrograms: 20,
      maxLeadsPerMonth: 250,
      maxEvents: 8,
      storageMB: 60,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: false,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: true,
      requireParentInfo: false,
      highlightInstruments: true,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Escola',
      institutionTypePlaceholder: 'Ex: Escola de Música, Conservatório',
      summaryLabel: 'Sobre a Escola',
      summaryPlaceholder: 'Descreva os instrumentos e estilos musicais...',
      programSingular: 'Curso',
      programPlural: 'Cursos',
      programAddButton: 'Adicionar Curso',
      programEmptyState: 'Nenhum curso cadastrado',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu a escola',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero me matricular',
      gradeLabel: 'Instrumento',
      shiftLabel: 'Horário',
      ageGroupLabel: 'Nível',
      dashboardWelcome: 'Bem-vindo à gestão da escola de música',
      dashboardProgramsTitle: 'Cursos',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },

  sports_school: {
    nicheKey: 'sports_school',
    displayName: 'Escola de Esportes',
    supportLevel: 'beta',
    enabledCapabilities: [
      'basic_programs_catalog',
      'lead_capture',
      'lead_pipeline',
      'whatsapp_cta',
      'analytics_basic',
    ],
    missingCapabilities: [
      'events_public',
      'trial_class_booking',
      'document_upload_pre_enrollment',
    ],
    adminSections: ['basic_profile', 'programs', 'leads', 'analytics'],
    isPublic: true,
    isSelectable: true,
    isBeta: true,
    description: 'Escola de esportes e modalidades esportivas',
    version: { major: 0, minor: 9, patch: 0 },
    entitlements: {
      maxPrograms: 15,
      maxLeadsPerMonth: 300,
      maxEvents: 10,
      storageMB: 80,
      allowsCustomDomain: false,
      allowsAnalytics: true,
      allowsExport: false,
    },
    defaultSettings: {
      showPricing: true,
      allowDirectEnrollment: true,
      requireParentInfo: true,
      highlightAgeGroups: true,
    },
    uiLabels: {
      institutionTypeLabel: 'Tipo de Escola',
      institutionTypePlaceholder: 'Ex: Escola de Futebol, Academia de Esportes',
      summaryLabel: 'Sobre a Escola',
      summaryPlaceholder: 'Descreva as modalidades esportivas e faixas etárias...',
      programSingular: 'Modalidade',
      programPlural: 'Modalidades',
      programAddButton: 'Adicionar Modalidade',
      programEmptyState: 'Nenhuma modalidade cadastrada',
      programCapacityLabel: 'Vagas',
      leadSingular: 'Interessado',
      leadPlural: 'Interessados',
      leadAddButton: 'Adicionar Interessado',
      leadEmptyState: 'Nenhum interessado cadastrado',
      leadSourceLabel: 'Como conheceu a escola',
      eventSingular: 'Evento',
      eventPlural: 'Eventos',
      eventAddButton: 'Criar Evento',
      eventEmptyState: 'Nenhum evento agendado',
      enrollmentLabel: 'Matrícula',
      enrollmentCTA: 'Quero me matricular',
      gradeLabel: 'Esporte',
      shiftLabel: 'Horário',
      ageGroupLabel: 'Faixa Etária',
      dashboardWelcome: 'Bem-vindo à gestão da escola de esportes',
      dashboardProgramsTitle: 'Modalidades',
      dashboardLeadsTitle: 'Interessados',
      dashboardEventsTitle: 'Eventos',
    },
  },
};

// ============================================================================
// HELPERS
// ============================================================================

export function getNicheByKey(key: string): EducationNicheConfig | null {
  return getRecordValue(EDUCATION_NICHES, key) ?? null;
}

export function getAllNiches(): EducationNicheConfig[] {
  return Object.values(EDUCATION_NICHES);
}

export function listNiches(filters?: { 
  isPublic?: boolean; 
  isSelectable?: boolean;
  supportLevel?: EducationNicheStatus;
}): EducationNicheConfig[] {
  let niches = Object.values(EDUCATION_NICHES);
  
  if (filters?.isPublic !== undefined) {
    niches = niches.filter(n => n.isPublic === filters.isPublic);
  }
  
  if (filters?.isSelectable !== undefined) {
    niches = niches.filter(n => n.isSelectable === filters.isSelectable);
  }
  
  if (filters?.supportLevel !== undefined) {
    niches = niches.filter(n => n.supportLevel === filters.supportLevel);
  }
  
  return niches;
}

export function getSelectableNiches(): EducationNicheConfig[] {
  return getAllNiches().filter(n => n.isSelectable);
}

export function getPublicNiches(): EducationNicheConfig[] {
  return getAllNiches().filter(n => n.isPublic);
}

export function getAdminNiches(): EducationNicheConfig[] {
  return getAllNiches().filter(n => n.supportLevel !== 'planned');
}

export function nicheExists(key: string): boolean {
  return key in EDUCATION_NICHES;
}

export function hasCapability(
  nicheKey: string, 
  capability: EducationNicheCapability
): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;
  return niche.enabledCapabilities.includes(capability);
}

export function shouldShowAdminSection(
  nicheKey: string, 
  section: EducationAdminSection
): boolean {
  const niche = getNicheByKey(nicheKey);
  if (!niche) return false;
  return niche.adminSections.includes(section);
}

export function getNicheOrDefault(key: string): EducationNicheConfig {
  return getNicheByKey(key) ?? EDUCATION_NICHES.regular_school;
}

// ============================================================
// ENTITLEMENT GUARDS
// ============================================================

export function getNicheEntitlements(nicheKey: string): EducationNicheConfig['entitlements'] | null {
  const niche = getNicheByKey(nicheKey);
  return niche?.entitlements ?? null;
}

export function canCreateProgram(nicheKey: string, currentProgramCount: number): boolean {
  const entitlements = getNicheEntitlements(nicheKey);
  if (!entitlements) return false;
  return currentProgramCount < entitlements.maxPrograms;
}

export function canCreateEvent(nicheKey: string, currentEventCount: number): boolean {
  const entitlements = getNicheEntitlements(nicheKey);
  if (!entitlements) return false;
  return currentEventCount < entitlements.maxEvents;
}

export function canReceiveLead(nicheKey: string, currentLeadsThisMonth: number): boolean {
  const entitlements = getNicheEntitlements(nicheKey);
  if (!entitlements) return false;
  return currentLeadsThisMonth < entitlements.maxLeadsPerMonth;
}

export function allowsAnalytics(nicheKey: string): boolean {
  const entitlements = getNicheEntitlements(nicheKey);
  return entitlements?.allowsAnalytics ?? false;
}

export function allowsExport(nicheKey: string): boolean {
  const entitlements = getNicheEntitlements(nicheKey);
  return entitlements?.allowsExport ?? false;
}

export function getVersion(nicheKey: string): EducationNicheConfig['version'] | null {
  const niche = getNicheByKey(nicheKey);
  return niche?.version ?? null;
}

export { EDUCATION_NICHES };
