export const PROFILE_VERIFICATION_STATUS = {
  NOT_REQUESTED: "not_requested",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type ProfileVerificationStatus =
  (typeof PROFILE_VERIFICATION_STATUS)[keyof typeof PROFILE_VERIFICATION_STATUS];

interface VerificationRecordLike {
  verified?: boolean | null;
  rejection_reason?: string | null;
}

export function resolveProfileVerificationStatus(
  verification?: VerificationRecordLike | null,
): { status: ProfileVerificationStatus; rejectionReason?: string } {
  if (!verification) {
    return { status: PROFILE_VERIFICATION_STATUS.NOT_REQUESTED };
  }

  if (verification.verified) {
    return { status: PROFILE_VERIFICATION_STATUS.APPROVED };
  }

  if (verification.rejection_reason) {
    return {
      status: PROFILE_VERIFICATION_STATUS.REJECTED,
      rejectionReason: verification.rejection_reason,
    };
  }

  return { status: PROFILE_VERIFICATION_STATUS.PENDING };
}
