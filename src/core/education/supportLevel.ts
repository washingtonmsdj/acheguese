export const EDUCATION_SUPPORT_LEVELS_CANONICAL = {
  FULL_ENABLED: 'full_enabled',
  BASIC_ENABLED: 'basic_enabled',
  BETA: 'beta',
  PLANNED: 'planned',
} as const;

export type EducationSupportLevel =
  (typeof EDUCATION_SUPPORT_LEVELS_CANONICAL)[keyof typeof EDUCATION_SUPPORT_LEVELS_CANONICAL];

const EDUCATION_SUPPORT_LEVEL_VALUES = Object.values(
  EDUCATION_SUPPORT_LEVELS_CANONICAL,
) as readonly EducationSupportLevel[];

export function isEducationSupportLevel(
  value: string,
): value is EducationSupportLevel {
  return EDUCATION_SUPPORT_LEVEL_VALUES.includes(value as EducationSupportLevel);
}
