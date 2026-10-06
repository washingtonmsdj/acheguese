export const EDUCATION_PROFILE_MIN_AGE = 0;
export const EDUCATION_PROFILE_MAX_AGE = 120;

export interface EducationProfileSetupValidationInput {
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  schoolInepCode?: string | null;
}

export interface EducationProfileSetupValidationError {
  field: 'age_range_min' | 'age_range_max' | 'school_inep_code';
  message: string;
}

function validateAge(
  field: 'age_range_min' | 'age_range_max',
  value: number | null | undefined,
  label: string,
): EducationProfileSetupValidationError | null {
  if (value === null || value === undefined) return null;

  if (
    !Number.isInteger(value) ||
    value < EDUCATION_PROFILE_MIN_AGE ||
    value > EDUCATION_PROFILE_MAX_AGE
  ) {
    return {
      field,
      message: `${label} deve ser um número inteiro entre ${EDUCATION_PROFILE_MIN_AGE} e ${EDUCATION_PROFILE_MAX_AGE} anos.`,
    };
  }

  return null;
}

export function getEducationProfileSetupValidationErrors(
  input: EducationProfileSetupValidationInput,
): EducationProfileSetupValidationError[] {
  const errors: EducationProfileSetupValidationError[] = [];

  const minError = validateAge(
    'age_range_min',
    input.ageRangeMin,
    'A idade mínima',
  );
  if (minError) errors.push(minError);

  const maxError = validateAge(
    'age_range_max',
    input.ageRangeMax,
    'A idade máxima',
  );
  if (maxError) errors.push(maxError);

  if (
    !minError &&
    !maxError &&
    input.ageRangeMin != null &&
    input.ageRangeMax != null &&
    input.ageRangeMin > input.ageRangeMax
  ) {
    errors.push({
      field: 'age_range_min',
      message: 'A idade mínima não pode ser maior que a idade máxima.',
    });
  }

  const inepCode = input.schoolInepCode?.trim() ?? '';
  if (inepCode && !/^\d{8}$/.test(inepCode)) {
    errors.push({
      field: 'school_inep_code',
      message: 'O código INEP deve conter exatamente 8 dígitos.',
    });
  }

  return errors;
}
