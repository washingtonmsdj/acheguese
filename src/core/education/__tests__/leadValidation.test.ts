import { describe, expect, it } from 'vitest';
import {
  EDUCATION_LEAD_NOTE_MAX_LENGTH,
  getEducationLeadContactValidationError,
  normalizeEducationLeadAdminPatch,
} from '../leadValidation';

describe('Education lead contact validation', () => {
  it('accepts and normalizes a coherent administrative patch', () => {
    const patch = {
      full_name: '  Maria   Souza  ',
      email: ' MARIA@EXAMPLE.COM ',
      phone: ' (71) 99999-9999 ',
      guardian_name: '  Ana   Souza ',
      interest_note: '  Retornar   pela manhã ',
      desired_grade: '  6º ano ',
      child_age: 10,
      owner_user_id: '123e4567-e89b-42d3-a456-426614174000',
    };

    expect(getEducationLeadContactValidationError(patch)).toBeNull();
    expect(normalizeEducationLeadAdminPatch(patch)).toEqual({
      full_name: 'Maria Souza',
      email: 'maria@example.com',
      phone: '(71) 99999-9999',
      guardian_name: 'Ana Souza',
      interest_note: 'Retornar pela manhã',
      desired_grade: '6º ano',
      child_age: 10,
      owner_user_id: '123e4567-e89b-42d3-a456-426614174000',
    });
  });

  it('rejects invalid required contact fields', () => {
    expect(
      getEducationLeadContactValidationError({ full_name: 'A' }),
    ).toContain('entre 2 e 160 caracteres');

    expect(
      getEducationLeadContactValidationError({ email: 'email-invalido' }),
    ).toBe('Informe um e-mail válido.');

    expect(
      getEducationLeadContactValidationError({ phone: '123' }),
    ).toContain('10 a 15 dígitos');
  });

  it('rejects invalid ages, owner ids, and oversized notes', () => {
    expect(
      getEducationLeadContactValidationError({ student_age: 121 }),
    ).toContain('entre 0 e 120 anos');

    expect(
      getEducationLeadContactValidationError({ owner_user_id: 'nao-e-uuid' }),
    ).toBe('O responsável interno do lead é inválido.');

    expect(
      getEducationLeadContactValidationError({
        desired_shift: 'overnight' as never,
      }),
    ).toBe('O turno desejado é inválido.');

    expect(
      getEducationLeadContactValidationError({
        interest_note: 'x'.repeat(EDUCATION_LEAD_NOTE_MAX_LENGTH + 1),
      }),
    ).toContain('no máximo 1000 caracteres');
  });

  it('normalizes optional blank text to null', () => {
    expect(
      normalizeEducationLeadAdminPatch({
        child_name: '   ',
        guardian_name: '',
        student_name: '  ',
        desired_grade: ' ',
        interest_note: '',
      }),
    ).toEqual({
      child_name: null,
      guardian_name: null,
      student_name: null,
      desired_grade: null,
      interest_note: null,
    });
  });
});
