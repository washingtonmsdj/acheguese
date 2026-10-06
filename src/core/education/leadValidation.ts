import type {
  EducationLead,
  EducationLeadAdminPatch,
  SchoolShift,
} from './contracts';

export const EDUCATION_LEAD_NAME_MAX_LENGTH = 160;
export const EDUCATION_LEAD_EMAIL_MAX_LENGTH = 254;
export const EDUCATION_LEAD_PHONE_MAX_LENGTH = 32;
export const EDUCATION_LEAD_NOTE_MAX_LENGTH = 1000;
export const EDUCATION_LEAD_GRADE_MAX_LENGTH = 120;
export const EDUCATION_LEAD_MIN_AGE = 0;
export const EDUCATION_LEAD_MAX_AGE = 120;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EDUCATION_LEAD_SHIFTS: readonly SchoolShift[] = [
  'morning',
  'afternoon',
  'evening',
  'full_day',
];

type EducationLeadValidationInput = Pick<
  EducationLead,
  | 'full_name'
  | 'email'
  | 'phone'
  | 'child_name'
  | 'child_age'
  | 'interest_note'
  | 'owner_user_id'
  | 'guardian_name'
  | 'student_name'
  | 'student_age'
  | 'desired_grade'
  | 'desired_shift'
>;

function normalizedText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function validateOptionalText(
  value: string | null | undefined,
  maxLength: number,
  label: string,
): string | null {
  if (value == null || value === '') return null;
  if (normalizedText(value).length > maxLength) {
    return `${label} deve ter no máximo ${maxLength} caracteres.`;
  }
  return null;
}

function validateOptionalAge(
  value: number | null | undefined,
  label: string,
): string | null {
  if (value == null) return null;
  if (
    !Number.isInteger(value) ||
    value < EDUCATION_LEAD_MIN_AGE ||
    value > EDUCATION_LEAD_MAX_AGE
  ) {
    return `${label} deve ser um número inteiro entre ${EDUCATION_LEAD_MIN_AGE} e ${EDUCATION_LEAD_MAX_AGE} anos.`;
  }
  return null;
}

export function getEducationLeadContactValidationError(
  input: EducationLeadAdminPatch | EducationLeadValidationInput,
): string | null {
  if (input.full_name !== undefined) {
    const fullName = normalizedText(input.full_name ?? '');
    if (fullName.length < 2 || fullName.length > EDUCATION_LEAD_NAME_MAX_LENGTH) {
      return `O nome deve ter entre 2 e ${EDUCATION_LEAD_NAME_MAX_LENGTH} caracteres.`;
    }
  }

  if (input.email !== undefined) {
    const email = normalizedText(input.email ?? '').toLowerCase();
    if (
      email.length < 5 ||
      email.length > EDUCATION_LEAD_EMAIL_MAX_LENGTH ||
      !EMAIL_PATTERN.test(email)
    ) {
      return 'Informe um e-mail válido.';
    }
  }

  if (input.phone !== undefined) {
    const phone = normalizedText(input.phone ?? '');
    const digits = phone.replace(/\D/g, '');
    if (
      phone.length < 8 ||
      phone.length > EDUCATION_LEAD_PHONE_MAX_LENGTH ||
      digits.length < 10 ||
      digits.length > 15
    ) {
      return 'Informe um telefone válido com 10 a 15 dígitos.';
    }
  }

  const textErrors = [
    validateOptionalText(
      input.child_name,
      EDUCATION_LEAD_NAME_MAX_LENGTH,
      'O nome do aluno',
    ),
    validateOptionalText(
      input.guardian_name,
      EDUCATION_LEAD_NAME_MAX_LENGTH,
      'O nome do responsável',
    ),
    validateOptionalText(
      input.student_name,
      EDUCATION_LEAD_NAME_MAX_LENGTH,
      'O nome do estudante',
    ),
    validateOptionalText(
      input.interest_note,
      EDUCATION_LEAD_NOTE_MAX_LENGTH,
      'A observação',
    ),
    validateOptionalText(
      input.desired_grade,
      EDUCATION_LEAD_GRADE_MAX_LENGTH,
      'A etapa/série desejada',
    ),
  ].find((error): error is string => Boolean(error));
  if (textErrors) return textErrors;

  const ageErrors = [
    validateOptionalAge(input.child_age, 'A idade'),
    validateOptionalAge(input.student_age, 'A idade do estudante'),
  ].find((error): error is string => Boolean(error));
  if (ageErrors) return ageErrors;

  if (
    input.owner_user_id !== undefined &&
    input.owner_user_id !== null &&
    !UUID_PATTERN.test(input.owner_user_id)
  ) {
    return 'O responsável interno do lead é inválido.';
  }

  if (
    input.desired_shift !== undefined &&
    input.desired_shift !== null &&
    !EDUCATION_LEAD_SHIFTS.includes(input.desired_shift)
  ) {
    return 'O turno desejado é inválido.';
  }

  return null;
}

export function normalizeEducationLeadAdminPatch(
  payload: EducationLeadAdminPatch,
): EducationLeadAdminPatch {
  const normalized: EducationLeadAdminPatch = { ...payload };

  if (normalized.full_name !== undefined) {
    normalized.full_name = normalizedText(normalized.full_name);
  }
  if (normalized.email !== undefined) {
    normalized.email = normalizedText(normalized.email).toLowerCase();
  }
  if (normalized.phone !== undefined) {
    normalized.phone = normalizedText(normalized.phone);
  }

  if (normalized.child_name !== undefined) {
    normalized.child_name =
      normalized.child_name == null ||
      normalizedText(normalized.child_name) === ''
        ? null
        : normalizedText(normalized.child_name);
  }
  if (normalized.interest_note !== undefined) {
    normalized.interest_note =
      normalized.interest_note == null ||
      normalizedText(normalized.interest_note) === ''
        ? null
        : normalizedText(normalized.interest_note);
  }
  if (normalized.guardian_name !== undefined) {
    normalized.guardian_name =
      normalized.guardian_name == null ||
      normalizedText(normalized.guardian_name) === ''
        ? null
        : normalizedText(normalized.guardian_name);
  }
  if (normalized.student_name !== undefined) {
    normalized.student_name =
      normalized.student_name == null ||
      normalizedText(normalized.student_name) === ''
        ? null
        : normalizedText(normalized.student_name);
  }
  if (normalized.desired_grade !== undefined) {
    normalized.desired_grade =
      normalized.desired_grade == null ||
      normalizedText(normalized.desired_grade) === ''
        ? null
        : normalizedText(normalized.desired_grade);
  }

  return normalized;
}
