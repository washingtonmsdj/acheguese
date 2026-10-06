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
