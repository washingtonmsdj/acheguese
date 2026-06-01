export const DATABASE_DRIVER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type DatabaseDriverStatus =
  (typeof DATABASE_DRIVER_STATUS)[keyof typeof DATABASE_DRIVER_STATUS];

export const DATABASE_PROFILE_VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export type DatabaseProfileVerificationStatus =
  (typeof DATABASE_PROFILE_VERIFICATION_STATUS)[keyof typeof DATABASE_PROFILE_VERIFICATION_STATUS];
