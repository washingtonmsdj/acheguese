/**
 * Education Module - Constants
 *
 * Constantes e enums do módulo Education.
 */

import { EDUCATION_SUPPORT_LEVELS_CANONICAL } from '@/core/education';
import type {
  EducationLeadStatus,
  EducationLevel,
  EducationProfileStatus,
  SchoolEventType,
  SchoolShift,
} from '@/core/education';

export const EDUCATION_PROFILE_STATUS: Record<
  EducationProfileStatus,
  {
    label: string;
    color: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  draft: { label: 'Rascunho', color: 'gray', variant: 'secondary' },
  published: { label: 'Publicado', color: 'green', variant: 'default' },
  paused: { label: 'Pausado', color: 'yellow', variant: 'destructive' },
};

export const EDUCATION_LEAD_STATUS: Record<
  EducationLeadStatus,
  {
    label: string;
    color: string;
    order: number;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  new: { label: 'Novo', color: 'blue', order: 1, variant: 'default' },
  contacted: { label: 'Contactado', color: 'purple', order: 2, variant: 'secondary' },
  visit_scheduled: {
    label: 'Visita Agendada',
    color: 'orange',
    order: 3,
    variant: 'outline',
  },
  proposal_sent: {
    label: 'Proposta Enviada',
    color: 'cyan',
    order: 4,
    variant: 'outline',
  },
  enrolled: { label: 'Matriculado', color: 'green', order: 5, variant: 'default' },
  lost: { label: 'Perdido', color: 'red', order: 6, variant: 'destructive' },
};

export const SCHOOL_EVENT_TYPE_LABELS: Record<SchoolEventType, string> = {
  open_house: 'Portas Abertas',
  enrollment_fair: 'Feira de Matrícula',
  parent_meeting: 'Reunião de Pais',
  trial_class: 'Aula Experimental',
  school_tour: 'Visita Escolar',
  cultural_event: 'Evento Cultural',
  sports_event: 'Evento Esportivo',
  other: 'Outro',
};

export const SCHOOL_EVENT_TYPE_OPTIONS: readonly {
  value: SchoolEventType;
  label: string;
}[] = Object.entries(SCHOOL_EVENT_TYPE_LABELS).map(([value, label]) => ({
  value: value as SchoolEventType,
  label,
}));

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  early_childhood: 'Educação Infantil',
  elementary_1: 'Ensino Fundamental - Anos Iniciais',
  elementary_2: 'Ensino Fundamental - Anos Finais',
  youth_adult_education: 'EJA - Educação de Jovens e Adultos',
  high_school: 'Ensino Médio',
  technical: 'Técnico',
};

export const EDUCATION_LEVEL_OPTIONS: readonly {
  key: EducationLevel;
  label: string;
}[] = Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => ({
  key: key as EducationLevel,
  label,
}));

export function getEducationLevelLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const option = EDUCATION_LEVEL_OPTIONS.find(
    (candidate) => candidate.key === value,
  );
  return option?.label ?? null;
}

export const EDUCATION_SUPPORT_LEVELS = EDUCATION_SUPPORT_LEVELS_CANONICAL;

export const UI_LIMITS = {
  MAX_PROGRAMS_PER_PROFILE: 50,
  MAX_LEADS_PER_PAGE: 25,
  MAX_EVENTS_PER_PROFILE: 100,
  MAX_SUMMARY_LENGTH: 500,
  MAX_PROGRAM_NAME_LENGTH: 100,
  MAX_NOTE_LENGTH: 1000,
} as const;


export const EDUCATION_PROGRAM_MODALITY_OPTIONS = [
  { value: 'in_person', label: 'Presencial' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Híbrido' },
] as const;

export const EDUCATION_PROGRAM_SHIFT_LABELS: Record<SchoolShift, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite',
  full_day: 'Integral',
};

export const EDUCATION_PROGRAM_SHIFT_OPTIONS = Object.entries(
  EDUCATION_PROGRAM_SHIFT_LABELS,
).map(([value, label]) => ({
  value: value as SchoolShift,
  label,
}));

export function getEducationProgramModalityLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const option = EDUCATION_PROGRAM_MODALITY_OPTIONS.find(
    (candidate) => candidate.value === value,
  );
  return option?.label ?? value.split('_').join(' ');
}

export function getEducationProgramShiftLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const option = EDUCATION_PROGRAM_SHIFT_OPTIONS.find(
    (candidate) => candidate.value === value,
  );
  return option?.label ?? value.split('_').join(' ');
}
