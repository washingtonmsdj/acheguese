import { describe, expect, it } from 'vitest';
import {
  EDUCATION_SUPPORT_LEVELS_CANONICAL,
  isEducationSupportLevel,
} from '../supportLevel';

describe('Education support level contract', () => {
  it('accepts every canonical support level', () => {
    expect(isEducationSupportLevel(EDUCATION_SUPPORT_LEVELS_CANONICAL.FULL_ENABLED)).toBe(true);
    expect(isEducationSupportLevel(EDUCATION_SUPPORT_LEVELS_CANONICAL.BASIC_ENABLED)).toBe(true);
    expect(isEducationSupportLevel(EDUCATION_SUPPORT_LEVELS_CANONICAL.BETA)).toBe(true);
    expect(isEducationSupportLevel(EDUCATION_SUPPORT_LEVELS_CANONICAL.PLANNED)).toBe(true);
  });

  it('rejects values outside the database contract', () => {
    expect(isEducationSupportLevel('enabled')).toBe(false);
    expect(isEducationSupportLevel('experimental')).toBe(false);
  });
});
