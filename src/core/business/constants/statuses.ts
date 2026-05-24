export const BUSINESS_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  SUSPENDED: "suspended",
} as const;

export type BusinessStatusValue = (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];
