import { describe, expect, it } from 'vitest';
import {
  EDUCATION_PROFILE_MAX_AGE,
  getEducationProfileSetupValidationErrors,
  resolveEducationSourceProvenance,
} from '../profileValidation';

describe('Education source provenance', () => {
  it('preserves the timestamp when the normalized source URL is unchanged', () => {
    expect(
      resolveEducationSourceProvenance({
        currentUrl: 'https://educacao.gov.br/escola',
        currentUpdatedAt: '2026-10-01T10:00:00.000Z',
        nextUrl: '  https://educacao.gov.br/escola  ',
        nowIso: '2026-10-06T15:00:00.000Z',
      }),
    ).toEqual({
      schoolSourceUrl: 'https://educacao.gov.br/escola',
      schoolSourceUpdatedAt: '2026-10-01T10:00:00.000Z',
    });
  });

  it('renews provenance only when the source changes', () => {
    expect(
      resolveEducationSourceProvenance({
        currentUrl: 'https://educacao.gov.br/escola-a',
        currentUpdatedAt: '2026-10-01T10:00:00.000Z',
        nextUrl: 'https://educacao.gov.br/escola-b',
        nowIso: '2026-10-06T15:00:00.000Z',
      }),
    ).toEqual({
      schoolSourceUrl: 'https://educacao.gov.br/escola-b',
      schoolSourceUpdatedAt: '2026-10-06T15:00:00.000Z',
    });
  });

  it('clears the provenance timestamp when the source is removed', () => {
    expect(
      resolveEducationSourceProvenance({
        currentUrl: 'https://educacao.gov.br/escola',
        currentUpdatedAt: '2026-10-01T10:00:00.000Z',
        nextUrl: '   ',
      }),
    ).toEqual({
      schoolSourceUrl: null,
      schoolSourceUpdatedAt: null,
    });
  });
});

describe('Education profile setup validation', () => {
  it('accepts a coherent age range and canonical INEP code', () => {
    expect(
      getEducationProfileSetupValidationErrors({
        ageRangeMin: 4,
        ageRangeMax: 17,
        schoolInepCode: '29193559',
      }),
    ).toEqual([]);
  });

  it('rejects ages outside the supported domain', () => {
    const errors = getEducationProfileSetupValidationErrors({
      ageRangeMin: -1,
      ageRangeMax: EDUCATION_PROFILE_MAX_AGE + 1,
    });

    expect(errors.map((error) => error.field)).toEqual([
      'age_range_min',
      'age_range_max',
    ]);
  });

  it('rejects an inverted age range', () => {
    expect(
      getEducationProfileSetupValidationErrors({
        ageRangeMin: 18,
        ageRangeMax: 6,
      }),
    ).toContainEqual({
      field: 'age_range_min',
      message: 'A idade mínima não pode ser maior que a idade máxima.',
    });
  });

  it('accepts only absolute http or https provenance URLs', () => {
    expect(
      getEducationProfileSetupValidationErrors({
        schoolSourceUrl: 'https://educacao.gov.br/escola',
      }),
    ).toEqual([]);

    expect(
      getEducationProfileSetupValidationErrors({
        schoolSourceUrl: 'javascript:alert(1)',
      }),
    ).toContainEqual({
      field: 'school_source_url',
      message: 'A fonte pública deve ser uma URL http ou https válida.',
    });

    expect(
      getEducationProfileSetupValidationErrors({
        schoolSourceUrl: '/fonte-relativa',
      }),
    ).toContainEqual({
      field: 'school_source_url',
      message: 'A fonte pública deve ser uma URL http ou https válida.',
    });
  });

  it('rejects non-canonical INEP codes and accepts blank optional values', () => {
    expect(
      getEducationProfileSetupValidationErrors({ schoolInepCode: '1234' }),
    ).toContainEqual({
      field: 'school_inep_code',
      message: 'O código INEP deve conter exatamente 8 dígitos.',
    });

    expect(
      getEducationProfileSetupValidationErrors({ schoolInepCode: '   ' }),
    ).toEqual([]);
  });
});
