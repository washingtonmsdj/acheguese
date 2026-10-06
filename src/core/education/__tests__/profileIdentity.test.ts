import { describe, expect, it } from 'vitest';
import {
  getEducationInstitutionTypeForNiche,
  isEducationInstitutionTypeForNiche,
} from '../profileIdentity';

describe('Education profile institution identity', () => {
  it('maps every niche to its canonical institution type', () => {
    expect(getEducationInstitutionTypeForNiche('regular_school')).toBe('school');
    expect(getEducationInstitutionTypeForNiche('daycare')).toBe('daycare');
    expect(getEducationInstitutionTypeForNiche('technical_school')).toBe(
      'technical_school',
    );
  });

  it('rejects institution types that do not match the niche', () => {
    expect(
      isEducationInstitutionTypeForNiche('school', 'regular_school'),
    ).toBe(true);
    expect(
      isEducationInstitutionTypeForNiche('language_school', 'regular_school'),
    ).toBe(false);
  });
});
