export const PROFILE_WORKFLOW_VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  NONE: "none",
} as const;

export type ProfileWorkflowVerificationStatus =
  (typeof PROFILE_WORKFLOW_VERIFICATION_STATUS)[keyof typeof PROFILE_WORKFLOW_VERIFICATION_STATUS];
