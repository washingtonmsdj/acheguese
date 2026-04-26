export const GASTRONOMY_PROFILE_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TEMPORARILY_CLOSED: 'temporarily_closed',
} as const;

export type GastronomyProfileStatus =
  (typeof GASTRONOMY_PROFILE_STATUSES)[keyof typeof GASTRONOMY_PROFILE_STATUSES];
