import { PROFILE_VERIFICATION_STATUS } from "@/core/profile/constants/verificationStatus";
import type {
  PlanType,
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type {
  Business,
  Profile,
  ProfileVerificationStatusValue,
} from "./types";
import type {
  BannedUserLike,
  BusinessRow,
  UserSubscriptionLike,
} from "./profile.service.types";

export function calculateProfileStatus(
  profile: Profile,
  bannedUser: BannedUserLike,
): ProfileStatus {
  const isBanned = !!bannedUser;
  const isSuspended = profile.is_suspended || false;
  const isActive = profile.is_active && !isBanned && !isSuspended;

  return {
    isActive,
    isBlocked: isBanned,
    isSuspended,
    suspendedAt: profile.suspended_at,
    suspensionReason: profile.suspension_reason,
    suspendedUntil: profile.suspended_until,
  };
}

export function calculatePlan(subscription: UserSubscriptionLike): ProfilePlan {
  if (!subscription || !subscription.active) {
    return {
      type: "basic",
      isPremium: false,
    };
  }

  return {
    type: (subscription.plan_type || "premium") as PlanType,
    isPremium: true,
    expiresAt: subscription.expires_at,
  };
}

export function calculateRank(reputation: number): string {
  if (reputation >= 1000) return "Expert";
  if (reputation >= 500) return "Avancado";
  if (reputation >= 100) return "Intermediario";
  return "Iniciante";
}

export function calculateReputation(profile: Profile): ProfileReputation {
  return {
    level: Math.floor(profile.reputation / 100) + 1,
    score: profile.reputation || 0,
    rank: calculateRank(profile.reputation || 0),
  };
}

export function resolveVerificationStatus(
  verification?: {
    verified?: boolean | null;
    rejection_reason?: string | null;
  } | null,
): {
  status: ProfileVerificationStatusValue;
  rejectionReason?: string;
} {
  if (!verification) {
    return { status: PROFILE_VERIFICATION_STATUS.NOT_REQUESTED };
  }

  if (verification.verified) {
    return { status: PROFILE_VERIFICATION_STATUS.APPROVED };
  }

  if (verification.rejection_reason) {
    return {
      status: PROFILE_VERIFICATION_STATUS.REJECTED,
      rejectionReason: verification.rejection_reason,
    };
  }

  return { status: PROFILE_VERIFICATION_STATUS.PENDING };
}

export function mapBusinessRecords(records: BusinessRow[]): Business[] {
  return records.map((business) => ({
    id: business.profile_id,
    name: business.business_name,
    logo: business.metadata?.logo_url || business.logo || "",
    category: business.category,
    rating: business.rating || 0,
    neighborhood: business.profiles?.neighborhood || "",
    city: business.profiles?.city || "",
    verified: business.is_verified || business.verified || false,
    slug: business.slug || "",
    geographic_path: business.geographic_path || null,
    is_premium: business.is_premium || false,
    aberto: business.aberto ?? true,
    nicho: business.category,
    description: business.description,
  }));
}

export function calculateSuspensionEnd(duration: string): string {
  const now = new Date();

  if (duration === "1 day") {
    now.setDate(now.getDate() + 1);
  } else if (duration === "7 days") {
    now.setDate(now.getDate() + 7);
  } else if (duration === "30 days") {
    now.setDate(now.getDate() + 30);
  } else if (duration === "permanent") {
    now.setFullYear(now.getFullYear() + 100);
  }

  return now.toISOString();
}
