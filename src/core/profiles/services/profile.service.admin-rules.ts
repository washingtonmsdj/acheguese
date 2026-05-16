import type {
  ProfilePermissions,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type { VerificationWorkflowStatus } from "./profile.service.types";
import type { UserListRow } from "./profile.service.types";

export type AdminUserProfileView = {
  id: string;
  name: string;
  status: ProfileStatus;
  avatar_url?: string;
  verified: boolean;
  permissions: ProfilePermissions;
  reputation: number;
};

export function buildVerificationStatusUpdates(
  status: VerificationWorkflowStatus,
  reason?: string,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {
    verification_status: status,
  };

  if (status === "verified") {
    updates.is_verified = true;
    updates.verified_at = new Date().toISOString();
  } else if (status === "rejected" && reason) {
    updates.verification_rejection_reason = reason;
  }

  return updates;
}

export function mapAdminUserList(rows: UserListRow[]): AdminUserProfileView[] {
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    avatar_url: p.avatar_url,
    verified: p.verified || false,
    reputation: p.reputation || 0,
    status: {
      isActive: !!(p.is_active && !p.is_suspended),
      isBlocked: false,
      isSuspended: p.is_suspended || false,
      suspendedAt: p.suspended_at,
      suspensionReason: p.suspension_reason,
      suspendedUntil: p.suspended_until,
    },
    permissions: {
      canPost: true,
      canComment: true,
      canMessage: true,
      canCreateBusiness: true,
      canModerate: false,
    },
  }));
}
