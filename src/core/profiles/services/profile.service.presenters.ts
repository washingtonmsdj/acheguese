import type {
  AdminProfileListItem,
  CreateProfileData,
  Profile,
  ProfileContext,
  ProfileSummary,
  ProfileSummaryExtended,
} from "./types";
import type {
  AdminProfileListRow,
  ProfileSummaryExtendedRow,
  ProfileSummaryRow,
  UserSubscriptionLike,
  VerificationWorkflowStatus,
} from "./profile.service.types";
import type {
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";

export function validateCreateProfileInput(profile: CreateProfileData): void {
  if (!profile.profile_type) throw new Error("profile_type is required");
  if (!profile.name) throw new Error("name is required");
  if (!profile.username) throw new Error("username is required");
}

export function buildCreateProfileInsert(
  userId: string,
  profile: CreateProfileData,
): CreateProfileData & { user_id: string; display_name: string; is_active: boolean } {
  return {
    user_id: userId,
    profile_type: profile.profile_type,
    name: profile.name,
    display_name: profile.display_name || profile.name,
    username: profile.username,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    is_active: true,
    ...profile,
  };
}

export function mapProfileContext(params: {
  profile: Profile;
  status: ProfileStatus;
  permissions: ProfilePermissions;
  plan: ProfilePlan;
  reputation: ProfileReputation;
  verification: VerificationWorkflowStatus | null;
}): ProfileContext {
  const { profile, status, permissions, plan, reputation, verification } = params;
  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.display_name,
    username: profile.username,
    avatar: profile.avatar_url,
    status,
    permissions,
    plan,
    reputation,
    verified: profile.verified || verification === "verified" || false,
  };
}

export function mapAdminProfilesList(data: AdminProfileListRow[] | null): AdminProfileListItem[] {
  return (data || []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    verified: profile.verified || false,
    suspended: profile.is_suspended || false,
    createdAt: profile.created_at,
    profileType: profile.profile_type,
  }));
}

export function mapProfilesSummary(data: ProfileSummaryRow[] | null): ProfileSummary[] {
  return (data || []).map((profile) => ({
    id: profile.id,
    userId: profile.user_id,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    verified: profile.verified || false,
  }));
}

export function mapProfilesSummaryExtended(
  data: ProfileSummaryExtendedRow[] | null,
): ProfileSummaryExtended[] {
  return (data || []).map((profile) => ({
    id: profile.id,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    verified: false,
    neighborhood: profile.public_neighborhood,
    whatsapp: null,
  }));
}
