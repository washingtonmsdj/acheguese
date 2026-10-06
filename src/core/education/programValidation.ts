export const EDUCATION_PROGRAM_NAME_MAX_LENGTH = 100;
export const EDUCATION_PROGRAM_AGE_GROUP_MAX_LENGTH = 50;

export function getEducationProgramNameValidationError(
  value: string | null | undefined,
): string | null {
  const name = value?.trim() ?? '';

  if (name.length < 3) {
    return 'Informe um nome ou etapa com pelo menos 3 caracteres.';
  }
  if (name.length > EDUCATION_PROGRAM_NAME_MAX_LENGTH) {
    return `O nome ou etapa deve ter no máximo ${EDUCATION_PROGRAM_NAME_MAX_LENGTH} caracteres.`;
  }

  return null;
}

export function getEducationProgramNumericValidationError(input: {
  availableSlots?: number | null;
  priceFrom?: number | null;
  maxCapacity?: number | null;
  currentEnrollment?: number | null;
}): string | null {
  if (
    input.availableSlots !== undefined &&
    input.availableSlots !== null &&
    (!Number.isFinite(input.availableSlots) ||
      !Number.isInteger(input.availableSlots) ||
      input.availableSlots < 0)
  ) {
    return 'A quantidade de vagas deve ser um número inteiro não negativo.';
  }

  if (
    input.priceFrom !== undefined &&
    input.priceFrom !== null &&
    (!Number.isFinite(input.priceFrom) || input.priceFrom < 0)
  ) {
    return 'O preço inicial não pode ser negativo.';
  }

  if (
    input.maxCapacity !== undefined &&
    input.maxCapacity !== null &&
    (!Number.isFinite(input.maxCapacity) ||
      !Number.isInteger(input.maxCapacity) ||
      input.maxCapacity < 0)
  ) {
    return 'A capacidade máxima deve ser um número inteiro não negativo.';
  }

  if (
    input.currentEnrollment !== undefined &&
    input.currentEnrollment !== null &&
    (!Number.isFinite(input.currentEnrollment) ||
      !Number.isInteger(input.currentEnrollment) ||
      input.currentEnrollment < 0)
  ) {
    return 'O número de matriculados deve ser um número inteiro não negativo.';
  }

  if (
    input.maxCapacity != null &&
    input.currentEnrollment != null &&
    input.currentEnrollment > input.maxCapacity
  ) {
    return 'O número de matriculados não pode exceder a capacidade máxima.';
  }

  return null;
}
