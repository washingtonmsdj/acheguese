import type { EducationProfileStatus } from './types';

export const EDUCATION_PROFILE_STATUSES_CANONICAL = [
  'draft',
  'published',
  'paused',
] as const satisfies readonly EducationProfileStatus[];

export function isEducationProfileStatus(
  value: string,
): value is EducationProfileStatus {
  return EDUCATION_PROFILE_STATUSES_CANONICAL.includes(
    value as EducationProfileStatus,
  );
}
