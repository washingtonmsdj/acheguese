import { describe, expect, it } from 'vitest';
import {
  EDUCATION_PROGRAM_NAME_MAX_LENGTH,
  getEducationProgramNameValidationError,
  getEducationProgramNumericValidationError,
} from '../programValidation';

describe('Education program validation', () => {
  it('accepts a valid program name', () => {
    expect(getEducationProgramNameValidationError('Curso Intensivo')).toBeNull();
  });

  it('rejects names outside the canonical database bound', () => {
    expect(getEducationProgramNameValidationError('ab')).toContain(
      'pelo menos 3 caracteres',
    );
    expect(
      getEducationProgramNameValidationError(
        'x'.repeat(EDUCATION_PROGRAM_NAME_MAX_LENGTH + 1),
      ),
    ).toContain('no máximo');
  });

  it('rejects negative or non-finite numeric values', () => {
    expect(
      getEducationProgramNumericValidationError({ availableSlots: -1 }),
    ).toBe('A quantidade de vagas deve ser um número inteiro não negativo.');
    expect(
      getEducationProgramNumericValidationError({ priceFrom: -0.01 }),
    ).toBe('O preço inicial não pode ser negativo.');
    expect(
      getEducationProgramNumericValidationError({ availableSlots: 0, priceFrom: 0 }),
    ).toBeNull();
    expect(
      getEducationProgramNumericValidationError({ availableSlots: 1.5 }),
    ).toContain('número inteiro');
    expect(
      getEducationProgramNumericValidationError({ maxCapacity: -1 }),
    ).toContain('capacidade máxima');
    expect(
      getEducationProgramNumericValidationError({ currentEnrollment: 1.5 }),
    ).toContain('matriculados');
    expect(
      getEducationProgramNumericValidationError({
        maxCapacity: 20,
        currentEnrollment: 21,
      }),
    ).toBe('O número de matriculados não pode exceder a capacidade máxima.');
    expect(
      getEducationProgramNumericValidationError({
        maxCapacity: 20,
        currentEnrollment: 20,
      }),
    ).toBeNull();
  });
});
