export const CLASSIFIED_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD: 'sold',
  PENDING: 'pending',
  REJECTED: 'rejected',
} as const;

export type ClassifiedStatusValue =
  (typeof CLASSIFIED_STATUS)[keyof typeof CLASSIFIED_STATUS];

export const CLASSIFIED_STATUS_VALUES = Object.values(CLASSIFIED_STATUS);
