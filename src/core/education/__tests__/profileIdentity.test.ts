import { describe, expect, it } from 'vitest';
import {
  getEducationInstitutionTypeForNiche,
  getEducationProfileIdentityPatchError,
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

  it('validates partial identity patches against persisted values', () => {
    expect(
      getEducationProfileIdentityPatchError({
        currentInstitutionType: 'school',
        currentNicheKey: 'regular_school',
        nextInstitutionType: 'language_school',
      }),
    ).toBe('Tipo de instituicao incompativel com o nicho');

    expect(
      getEducationProfileIdentityPatchError({
        currentInstitutionType: 'school',
        currentNicheKey: 'regular_school',
        nextNicheKey: 'language_school',
      }),
    ).toBe('Tipo de instituicao incompativel com o nicho');

    expect(
      getEducationProfileIdentityPatchError({
        currentInstitutionType: 'school',
        currentNicheKey: 'regular_school',
        nextInstitutionType: 'language_school',
        nextNicheKey: 'language_school',
      }),
    ).toBeNull();
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
