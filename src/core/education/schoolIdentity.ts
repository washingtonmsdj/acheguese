import type { SchoolNetwork, SchoolType } from './contracts';

export const EDUCATION_SCHOOL_TYPES_CANONICAL = [
  'public',
  'private',
  'community',
  'charter',
] as const satisfies readonly SchoolType[];

export const EDUCATION_SCHOOL_NETWORKS_CANONICAL = [
  'municipal',
  'state',
  'federal',
  'private',
] as const satisfies readonly SchoolNetwork[];

export function isEducationSchoolType(value: string): value is SchoolType {
  return EDUCATION_SCHOOL_TYPES_CANONICAL.includes(value as SchoolType);
}

export function isEducationSchoolNetwork(
  value: string,
): value is SchoolNetwork {
  return EDUCATION_SCHOOL_NETWORKS_CANONICAL.includes(value as SchoolNetwork);
}

export function isEducationSchoolNetworkCompatible(
  schoolType: SchoolType,
  schoolNetwork: SchoolNetwork,
): boolean {
  if (schoolType === 'public') return schoolNetwork !== 'private';
  if (schoolType === 'private') return schoolNetwork === 'private';
  return true;
}

export function normalizeEducationSchoolNetwork(
  schoolType: string,
  schoolNetwork: string,
): string {
  if (schoolType === 'private') return 'private';
  if (schoolType === 'public' && schoolNetwork === 'private') return '';
  return schoolNetwork;
}

export function getEducationSchoolIdentityPatchError(input: {
  currentSchoolType: SchoolType | null;
  currentSchoolNetwork: SchoolNetwork | null;
  nextSchoolType?: SchoolType | null;
  nextSchoolNetwork?: SchoolNetwork | null;
}): string | null {
  const schoolType =
    input.nextSchoolType !== undefined
      ? input.nextSchoolType
      : input.currentSchoolType;
  const schoolNetwork =
    input.nextSchoolNetwork !== undefined
      ? input.nextSchoolNetwork
      : input.currentSchoolNetwork;

  if (schoolType == null || schoolNetwork == null) return null;

  return isEducationSchoolNetworkCompatible(schoolType, schoolNetwork)
    ? null
    : 'Rede administrativa incompativel com o tipo de escola';
}
