/**
 * ProfileVerificationAdminService - SSOT admin para verificação de perfil
 *
 * Ownership:
 * - Fonte de dados: ProfileService (verification_status em profiles)
 * - Consumidores: módulos administrativos de verificação
 */
import { logger } from '@/shared/utils/logger';
import { profileService } from '@/core/profiles/services/ProfileService';
import {
  PROFILE_WORKFLOW_VERIFICATION_STATUS,
  type ProfileWorkflowVerificationStatus,
} from '@/core/profiles/constants/verificationWorkflowStatus';

export interface PendingVerification {
  id: string;
  profile_id: string;
  display_name: string;
  avatar_url: string | null;
  requested_at: string;
  type: string;
  status?: ProfileWorkflowVerificationStatus;
  decision_at?: string | null;
  decision_by?: string | null;
  rejection_reason?: string | null;
}

export interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  // backward compatibility
  total_pending: number;
  total_verified: number;
  total_rejected: number;
}

type VerificationProfileRow = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  verification_requested_at?: string | null;
  updated_at?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  verification_rejection_reason?: string | null;
};

export class ProfileVerificationAdminService {
  static async getPendingVerifications(): Promise<PendingVerification[]> {
    try {
      const profiles = await profileService.getProfilesByVerificationStatus(PROFILE_WORKFLOW_VERIFICATION_STATUS.PENDING);
      return (profiles as VerificationProfileRow[]).map((p) => ({
        id: p.id,
        profile_id: p.id,
        display_name: p.display_name || 'Sem nome',
        avatar_url: p.avatar_url,
        requested_at: p.verification_requested_at || p.updated_at,
        type: 'profile',
        status: PROFILE_WORKFLOW_VERIFICATION_STATUS.PENDING,
        decision_at: p.verified_at ?? null,
        decision_by: p.verified_by ?? null,
        rejection_reason: p.verification_rejection_reason ?? null,
      }));
    } catch (err) {
      logger.error('ProfileVerificationAdminService.getPendingVerifications failed:', err);
      return [];
    }
  }

  static async getVerifiedProfiles(): Promise<PendingVerification[]> {
    try {
      const profiles = await profileService.getProfilesByVerificationStatus(PROFILE_WORKFLOW_VERIFICATION_STATUS.VERIFIED);
      return (profiles as VerificationProfileRow[]).map((p) => ({
        id: p.id,
        profile_id: p.id,
        display_name: p.display_name || 'Sem nome',
        avatar_url: p.avatar_url,
        requested_at: p.updated_at,
        type: 'profile',
        status: PROFILE_WORKFLOW_VERIFICATION_STATUS.VERIFIED,
        decision_at: p.verified_at ?? p.updated_at ?? null,
        decision_by: p.verified_by ?? null,
        rejection_reason: p.verification_rejection_reason ?? null,
      }));
    } catch (err) {
      logger.error('ProfileVerificationAdminService.getVerifiedProfiles failed:', err);
      return [];
    }
  }

  static async getRejectedProfiles(): Promise<PendingVerification[]> {
    try {
      const profiles = await profileService.getProfilesByVerificationStatus(PROFILE_WORKFLOW_VERIFICATION_STATUS.REJECTED);
      return (profiles as VerificationProfileRow[]).map((p) => ({
        id: p.id,
        profile_id: p.id,
        display_name: p.display_name || 'Sem nome',
        avatar_url: p.avatar_url,
        requested_at: p.updated_at,
        type: 'profile',
        status: PROFILE_WORKFLOW_VERIFICATION_STATUS.REJECTED,
        decision_at: p.updated_at ?? null,
        decision_by: p.verified_by ?? null,
        rejection_reason: p.verification_rejection_reason ?? null,
      }));
    } catch (err) {
      logger.error('ProfileVerificationAdminService.getRejectedProfiles failed:', err);
      return [];
    }
  }

  static async getVerificationStats(): Promise<VerificationStats> {
    try {
      const stats = await profileService.getVerificationStats();
      const pending = stats.total_pending ?? 0;
      const verified = stats.total_verified ?? 0;
      const rejected = stats.total_rejected ?? 0;
      return {
        total: pending + verified + rejected,
        pending,
        verified,
        rejected,
        total_pending: pending,
        total_verified: verified,
        total_rejected: rejected,
      };
    } catch (err) {
      logger.error('ProfileVerificationAdminService.getVerificationStats failed:', err);
      return {
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        total_pending: 0,
        total_verified: 0,
        total_rejected: 0,
      };
    }
  }

  static async approveVerification(profileId: string): Promise<void> {
    await profileService.approveVerification(profileId);
  }

  static async rejectVerification(profileId: string, reason?: string): Promise<void> {
    await profileService.rejectVerification(profileId, reason);
  }

  static async revokeVerification(profileId: string): Promise<void> {
    await profileService.revokeVerification(profileId);
  }
}

export const profileVerificationAdminService = ProfileVerificationAdminService;
