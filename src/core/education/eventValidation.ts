export const EDUCATION_EVENT_TITLE_MAX_LENGTH = 150;
export const EDUCATION_EVENT_LOCATION_MAX_LENGTH = 255;

export interface EducationEventValidationInput {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
}

function isValidDateTime(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

export function getEducationEventValidationError(
  input: EducationEventValidationInput,
): string | null {
  const title = input.title.trim();
  if (title.length < 3) {
    return 'Informe um título com pelo menos 3 caracteres.';
  }
  if (title.length > EDUCATION_EVENT_TITLE_MAX_LENGTH) {
    return `O título deve ter no máximo ${EDUCATION_EVENT_TITLE_MAX_LENGTH} caracteres.`;
  }

  const startsAt = input.startsAt.trim();
  if (!startsAt || !isValidDateTime(startsAt)) {
    return 'Informe uma data e hora de início válidas.';
  }

  const endsAt = input.endsAt?.trim() ?? '';
  if (endsAt) {
    if (!isValidDateTime(endsAt)) {
      return 'Informe uma data e hora de término válidas.';
    }
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      return 'O término do evento deve ser posterior ao início.';
    }
  }

  const location = input.location?.trim() ?? '';
  if (location.length > EDUCATION_EVENT_LOCATION_MAX_LENGTH) {
    return `O local deve ter no máximo ${EDUCATION_EVENT_LOCATION_MAX_LENGTH} caracteres.`;
  }

  return null;
}


export interface EducationEventTimeRange {
  startsAt: string;
  endsAt?: string | null;
}

export function areEducationEventTimesOverlapping(
  left: EducationEventTimeRange,
  right: EducationEventTimeRange,
): boolean {
  const leftStart = new Date(left.startsAt).getTime();
  const rightStart = new Date(right.startsAt).getTime();
  const leftEnd = left.endsAt ? new Date(left.endsAt).getTime() : leftStart;
  const rightEnd = right.endsAt ? new Date(right.endsAt).getTime() : rightStart;

  if (
    [leftStart, rightStart, leftEnd, rightEnd].some((value) =>
      Number.isNaN(value),
    )
  ) {
    return false;
  }

  const leftIsInstant = leftEnd === leftStart;
  const rightIsInstant = rightEnd === rightStart;

  if (leftIsInstant && rightIsInstant) {
    return leftStart === rightStart;
  }

  if (leftIsInstant) {
    return leftStart >= rightStart && leftStart < rightEnd;
  }

  if (rightIsInstant) {
    return rightStart >= leftStart && rightStart < leftEnd;
  }

  return leftStart < rightEnd && rightStart < leftEnd;
}
