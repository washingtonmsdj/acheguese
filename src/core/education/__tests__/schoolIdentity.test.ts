import { describe, expect, it } from 'vitest';
import {
  getEducationSchoolIdentityPatchError,
  isEducationSchoolNetworkCompatible,
  isEducationSchoolType,
  isEducationSchoolNetwork,
  normalizeEducationSchoolNetwork,
} from '../schoolIdentity';

describe('Education school identity contract', () => {
  it('validates canonical school types and networks', () => {
    expect(isEducationSchoolType('public')).toBe(true);
    expect(isEducationSchoolType('private')).toBe(true);
    expect(isEducationSchoolType('unknown')).toBe(false);

    expect(isEducationSchoolNetwork('municipal')).toBe(true);
    expect(isEducationSchoolNetwork('private')).toBe(true);
    expect(isEducationSchoolNetwork('unknown')).toBe(false);
  });

  it('enforces the existing public/private network rules', () => {
    expect(isEducationSchoolNetworkCompatible('public', 'municipal')).toBe(true);
    expect(isEducationSchoolNetworkCompatible('public', 'private')).toBe(false);
    expect(isEducationSchoolNetworkCompatible('private', 'private')).toBe(true);
    expect(isEducationSchoolNetworkCompatible('private', 'municipal')).toBe(false);
  });

  it('keeps the setup normalization behavior', () => {
    expect(normalizeEducationSchoolNetwork('private', 'municipal')).toBe('private');
    expect(normalizeEducationSchoolNetwork('public', 'private')).toBe('');
    expect(normalizeEducationSchoolNetwork('community', 'state')).toBe('state');
  });

  it('validates partial school identity patches against persisted values', () => {
    expect(
      getEducationSchoolIdentityPatchError({
        currentSchoolType: 'public',
        currentSchoolNetwork: 'municipal',
        nextSchoolNetwork: 'private',
      }),
    ).toBe('Rede administrativa incompativel com o tipo de escola');

    expect(
      getEducationSchoolIdentityPatchError({
        currentSchoolType: 'private',
        currentSchoolNetwork: 'private',
        nextSchoolType: 'public',
      }),
    ).toBe('Rede administrativa incompativel com o tipo de escola');

    expect(
      getEducationSchoolIdentityPatchError({
        currentSchoolType: 'private',
        currentSchoolNetwork: 'private',
        nextSchoolType: 'public',
        nextSchoolNetwork: 'state',
      }),
    ).toBeNull();
  });
});
