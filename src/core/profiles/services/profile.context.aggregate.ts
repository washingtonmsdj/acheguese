import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { adminRolesService } from "@/core/admin/services/AdminRolesService";
import type { ProfileContext, ProfileRow as Profile } from "./types";
import type { ProfilePermissions, ProfileStatus } from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type { BannedUserLike } from "./profile.service.types";
import {
  calculatePlan,
  calculateProfileStatus,
  calculateReputation,
} from "./profile.service.rules";
import { mapProfileContext } from "./profile.service.presenters";

type ProfileContextDependencies = {
  userId: string;
  getActiveProfile: (userId: string) => Promise<Profile | null>;
};

async function calculatePermissions(
  status: ProfileStatus,
  profile: Profile,
): Promise<ProfilePermissions> {
  if (status.isBlocked || status.isSuspended) {
    return {
      canPost: false,
      canComment: false,
      canMessage: false,
      canCreateBusiness: false,
      canModerate: false,
    };
  }

  if (!status.isActive) {
    return {
      canPost: false,
      canComment: false,
      canMessage: true,
      canCreateBusiness: false,
      canModerate: false,
    };
  }

  let canModerate = false;
  try {
    const roles = await adminRolesService.getUserRoles(profile.user_id);
    canModerate = roles.some((r) => ["admin", "moderator"].includes(r.role) && r.is_active);
  } catch {
    canModerate = false;
  }

  return {
    canPost: true,
    canComment: true,
    canMessage: true,
    canCreateBusiness: true,
    canModerate,
  };
}

async function getBannedUserStatus(userId: string): Promise<BannedUserLike> {
  try {
    const { ModerationService } = await import("@/core/moderation/services/ModerationService");
    return (await ModerationService.getBannedStatus(userId)) as unknown as BannedUserLike;
  } catch (error) {
    logger.error("Error in getBannedUserStatus:", error);
    return null;
  }
}

async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      if (!["PGRST116", "42P01", "PGRST301"].includes(error.code || "")) {
        logger.error("Error fetching user subscription:", error);
      }
      return null;
    }

    return data;
  } catch (error) {
    logger.error("Error in getUserSubscription:", error);
    return null;
  }
}

async function getVerificationStatus(profileId: string) {
  try {
    const { VerificationService } = await import("@/core/verification/services/VerificationService");
    const verifications = await VerificationService.getProfileVerifications(profileId);
    return verifications[0] ?? null;
  } catch (error) {
    logger.error("Error in getVerificationStatus:", error);
    return null;
  }
}

export async function getProfileContextAggregate(
  deps: ProfileContextDependencies,
): Promise<ProfileContext | null> {
  const { userId } = deps;

  try {
    const profile = await deps.getActiveProfile(userId);
    if (!profile) {
      logger.warn("No active profile found for user", { userId });
      return null;
    }

    const [bannedUser, subscription, verification] = await Promise.all([
      getBannedUserStatus(userId),
      getUserSubscription(userId),
      profile.id ? getVerificationStatus(profile.id) : Promise.resolve(null),
    ]);

    const status = calculateProfileStatus(profile, bannedUser);
    const permissions = await calculatePermissions(status, profile);

    return mapProfileContext({
      profile,
      status,
      permissions,
      plan: calculatePlan(subscription),
      reputation: calculateReputation(profile),
      verification,
    });
  } catch (error) {
    logger.error("Error getting profile context:", error);
    trackError(new Error("Error getting profile context"), {
      component: "profile.context.aggregate",
      action: "getProfileContextAggregate",
      metadata: { userId },
    });
    return null;
  }
}
