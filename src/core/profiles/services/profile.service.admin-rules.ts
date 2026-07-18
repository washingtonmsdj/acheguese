import type {
  ProfilePermissions,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";
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
