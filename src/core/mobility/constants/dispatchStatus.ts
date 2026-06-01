export const DISPATCH_ATTEMPT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  TIMEOUT: 'timeout',
  REJECTED: 'rejected',
} as const;

export type DispatchAttemptStatus =
  (typeof DISPATCH_ATTEMPT_STATUS)[keyof typeof DISPATCH_ATTEMPT_STATUS];

export const OPERATIONAL_VERIFICATION_STATUS = {
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
} as const;
