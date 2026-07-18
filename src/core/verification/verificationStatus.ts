import {
  VERIFICATION_STATUS,
  type VerificationStatus,
} from "@/core/verification/types";

export const PROFILE_VERIFICATION_STATUS = {
  NOT_REQUESTED: "not_requested",
  PENDING: VERIFICATION_STATUS.PENDING,
  APPROVED: VERIFICATION_STATUS.APPROVED,
  REJECTED: VERIFICATION_STATUS.REJECTED,
  REVOKED: VERIFICATION_STATUS.REVOKED,
} as const;

export type ProfileVerificationStatus =
  (typeof PROFILE_VERIFICATION_STATUS)[keyof typeof PROFILE_VERIFICATION_STATUS];

interface VerificationRecordLike {
  status?: VerificationStatus | null;
  review_reason?: string | null;
}

export function resolveProfileVerificationStatus(
  verification?: VerificationRecordLike | null,
): { status: ProfileVerificationStatus; rejectionReason?: string } {
  if (!verification) {
    return { status: PROFILE_VERIFICATION_STATUS.NOT_REQUESTED };
  }

  if (verification.status === VERIFICATION_STATUS.REJECTED) {
    return {
      status: PROFILE_VERIFICATION_STATUS.REJECTED,
      rejectionReason: verification.review_reason ?? undefined,
    };
  }

  return { status: verification.status ?? PROFILE_VERIFICATION_STATUS.NOT_REQUESTED };
}
