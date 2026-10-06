import { describe, expect, it } from 'vitest';
import {
  EDUCATION_PROFILE_MAX_AGE,
  getEducationProfileSetupValidationErrors,
} from '../profileValidation';

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
