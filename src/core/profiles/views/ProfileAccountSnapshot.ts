import type { ProfileVerificationStatus as ProfileVerificationStatusValue } from "@/core/profile/constants/verificationStatus";

/**
 * Profile account snapshot for UI display.
 *
 * This read model aggregates moderation, verification, and plan state for
 * account headers and health panels. Do not use it for authorization checks.
 */
export interface ProfileAccountSnapshot {
  accountState: "active" | "inactive" | "suspended" | "blocked";
  isBlocked: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspendedUntil?: string;
  suspensionReason?: string;
  verificationStatus: ProfileVerificationStatusValue;
  verificationRejectionReason?: string;
}
