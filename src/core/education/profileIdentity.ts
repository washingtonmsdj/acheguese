import type { EducationNicheKey } from './contracts';

export type EducationInstitutionType =
  | 'school'
  | 'daycare'
  | 'language_school'
  | 'prep_course'
  | 'technical_school'
  | 'tutoring_center'
  | 'music_school'
  | 'sports_school';

const EDUCATION_INSTITUTION_TYPE_BY_NICHE: Record<
  EducationNicheKey,
  EducationInstitutionType
> = {
  regular_school: 'school',
  daycare: 'daycare',
  language_school: 'language_school',
  prep_course: 'prep_course',
  technical_school: 'technical_school',
  tutoring_center: 'tutoring_center',
  music_school: 'music_school',
  sports_school: 'sports_school',
};

export function getEducationInstitutionTypeForNiche(
  nicheKey: EducationNicheKey,
): EducationInstitutionType {
  return EDUCATION_INSTITUTION_TYPE_BY_NICHE[nicheKey];
}

export function isEducationInstitutionTypeForNiche(
  institutionType: string,
  nicheKey: EducationNicheKey,
): institutionType is EducationInstitutionType {
  return institutionType === getEducationInstitutionTypeForNiche(nicheKey);
}
