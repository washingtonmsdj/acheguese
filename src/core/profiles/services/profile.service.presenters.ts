import type {
  CreateProfilePayload,
  ProfileContext,
  ProfileRow as Profile,
} from "./types";
import type { VerificationWorkflowStatus } from "./profile.service.types";
import type {
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";

export function validateCreateProfileInput(profile: CreateProfilePayload): void {
  if (!profile.profile_type) throw new Error("profile_type is required");
  if (!profile.name) throw new Error("name is required");
  if (!profile.username) throw new Error("username is required");
}

export function buildCreateProfileInsert(
  userId: string,
  profile: CreateProfilePayload,
): CreateProfilePayload & { user_id: string; display_name: string; is_active: boolean } {
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
