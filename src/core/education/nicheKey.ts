import type { EducationNicheKey } from './contracts';

export const EDUCATION_NICHE_KEYS_CANONICAL = [
  'regular_school',
  'daycare',
  'language_school',
  'prep_course',
  'technical_school',
  'tutoring_center',
  'music_school',
  'sports_school',
] as const satisfies readonly EducationNicheKey[];

export function isEducationNicheKey(
  value: string,
): value is EducationNicheKey {
  return EDUCATION_NICHE_KEYS_CANONICAL.includes(
    value as EducationNicheKey,
  );
}
