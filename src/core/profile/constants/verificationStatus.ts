export const PROFILE_VERIFICATION_STATUS = {
  NOT_REQUESTED: "not_requested",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ProfileVerificationStatus =
  (typeof PROFILE_VERIFICATION_STATUS)[keyof typeof PROFILE_VERIFICATION_STATUS];

