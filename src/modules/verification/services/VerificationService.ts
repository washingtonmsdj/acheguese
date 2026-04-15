/**
 * VerificationService (module facade)
 *
 * Canonical implementation lives in core/profiles/services/ProfileVerificationAdminService.
 */

export {
  ProfileVerificationAdminService as VerificationService,
  profileVerificationAdminService as verificationService,
} from '@/core/profiles/services/ProfileVerificationAdminService';

export type {
  PendingVerification,
  VerificationStats,
} from '@/core/profiles/services/ProfileVerificationAdminService';
