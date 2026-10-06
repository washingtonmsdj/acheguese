import type { EducationLeadStatus } from './contracts';

export const EDUCATION_LEAD_PIPELINE: readonly EducationLeadStatus[] = [
  'new',
  'contacted',
  'visit_scheduled',
  'proposal_sent',
  'enrolled',
];

export function canMoveEducationLeadToStatus(
  from: EducationLeadStatus,
  to: EducationLeadStatus,
): boolean {
  if (from === to) return true;
  if (from === 'enrolled' || from === 'lost') return false;
  if (to === 'lost') return true;

  const fromIndex = EDUCATION_LEAD_PIPELINE.indexOf(from);
  const toIndex = EDUCATION_LEAD_PIPELINE.indexOf(to);
  return fromIndex >= 0 && toIndex === fromIndex + 1;
}

export function getEducationLeadNextStatuses(
  current: EducationLeadStatus,
): EducationLeadStatus[] {
  if (current === 'enrolled' || current === 'lost') return [];

  const index = EDUCATION_LEAD_PIPELINE.indexOf(current);
  if (index < 0 || index >= EDUCATION_LEAD_PIPELINE.length - 1) {
    return [];
  }

  return [EDUCATION_LEAD_PIPELINE[index + 1], 'lost'];
}

export const EDUCATION_LEAD_LOST_REASON_MIN_LENGTH = 3;
export const EDUCATION_LEAD_LOST_REASON_MAX_LENGTH = 500;

export function getEducationLeadLostReasonValidationError(
  value: string | null | undefined,
): string | null {
  const reason = value?.trim() ?? '';

  if (reason.length < EDUCATION_LEAD_LOST_REASON_MIN_LENGTH) {
    return `Informe um motivo com pelo menos ${EDUCATION_LEAD_LOST_REASON_MIN_LENGTH} caracteres.`;
  }

  if (reason.length > EDUCATION_LEAD_LOST_REASON_MAX_LENGTH) {
    return `O motivo deve ter no máximo ${EDUCATION_LEAD_LOST_REASON_MAX_LENGTH} caracteres.`;
  }

  return null;
}
