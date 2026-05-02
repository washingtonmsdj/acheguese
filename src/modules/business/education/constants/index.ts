/**
 * Education Module - Constants
 * 
 * Constantes e enums do modulo Education.
 */

import type { EducationLeadStatus, EducationProfileStatus } from '../types';

export const EDUCATION_PROFILE_STATUS: Record<EducationProfileStatus, { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', color: 'gray', variant: 'secondary' },
  published: { label: 'Publicado', color: 'green', variant: 'default' },
  paused: { label: 'Pausado', color: 'yellow', variant: 'destructive' },
};

export const EDUCATION_LEAD_STATUS: Record<EducationLeadStatus, { label: string; color: string; order: number; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'Novo', color: 'blue', order: 1, variant: 'default' },
  contacted: { label: 'Contactado', color: 'purple', order: 2, variant: 'secondary' },
  visit_scheduled: { label: 'Visita Agendada', color: 'orange', order: 3, variant: 'outline' },
  proposal_sent: { label: 'Proposta Enviada', color: 'cyan', order: 4, variant: 'outline' },
  enrolled: { label: 'Matriculado', color: 'green', order: 5, variant: 'default' },
  lost: { label: 'Perdido', color: 'red', order: 6, variant: 'destructive' },
};

export const EDUCATION_SUPPORT_LEVELS = {
  FULL_ENABLED: 'full_enabled',
  BASIC_ENABLED: 'basic_enabled',
  BETA: 'beta',
  PLANNED: 'planned',
} as const;

export const UI_LIMITS = {
  MAX_PROGRAMS_PER_PROFILE: 50,
  MAX_LEADS_PER_PAGE: 25,
  MAX_EVENTS_PER_PROFILE: 100,
  MAX_SUMMARY_LENGTH: 500,
  MAX_PROGRAM_NAME_LENGTH: 100,
  MAX_NOTE_LENGTH: 1000,
} as const;
