import { describe, expect, it } from 'vitest';
import {
  EDUCATION_NICHE_KEYS_CANONICAL,
  isEducationNicheKey,
} from '../nicheKey';

describe('Education niche key contract', () => {
  it('accepts every canonical niche', () => {
    for (const nicheKey of EDUCATION_NICHE_KEYS_CANONICAL) {
      expect(isEducationNicheKey(nicheKey)).toBe(true);
    }
  });

  it('rejects values outside the domain', () => {
    expect(isEducationNicheKey('school')).toBe(false);
    expect(isEducationNicheKey('unknown_niche')).toBe(false);
  });
});
