import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { mapAdminUserList } from "./profile.service.admin-rules";
import type { ProfilePermissions, ProfileStatus } from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type { PassengerRatingRow, UserListRow } from "./profile.service.types";

const TABLE = "profiles";

export async function getUserIdsByCity(city: string, limit = 500): Promise<string[]> {
  try {
    const normalizedCity = city.trim();
    if (!normalizedCity) return [];

    const { data, error } = await supabase
      .from(TABLE)
      .select("user_id")
      .eq("city", normalizedCity)
      .limit(limit);

    if (error) {
      trackError(new Error("Error fetching user ids by city"), {
        component: "profile.queries",
        action: "getUserIdsByCity",
        metadata: { city: normalizedCity, limit, error: error.message },
      });
      return [];
    }

    return (data ?? [])
      .map((row) => row.user_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch (error) {
    trackError(new Error("Error fetching user ids by city"), {
      component: "profile.queries",
      action: "getUserIdsByCity",
      metadata: { city, limit, error: error instanceof Error ? error.message : String(error) },
    });
    return [];
  }
}

export async function getVerificationStats(): Promise<{
  total_pending: number;
  total_verified: number;
  total_rejected: number;
}> {
  try {
    const [pending, verified, rejected] = await Promise.all([
      (supabase as any).from(TABLE).select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
      (supabase as any).from(TABLE).select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
      (supabase as any).from(TABLE).select("*", { count: "exact", head: true }).eq("verification_status", "rejected"),
    ]);

    return {
      total_pending: pending.count ?? 0,
      total_verified: verified.count ?? 0,
      total_rejected: rejected.count ?? 0,
    };
  } catch (error) {
    trackError(new Error("Error getting verification stats"), {
      component: "profile.queries",
      action: "getVerificationStats",
      metadata: { error },
    });
    throw error;
  }
}

export async function getAllUsers(): Promise<
  Array<{
    id: string;
    name: string;
    status: ProfileStatus;
    avatar_url?: string;
    verified: boolean;
    permissions: ProfilePermissions;
    reputation: number;
  }>
> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "id, name, avatar_url, is_active, is_suspended, suspended_at, suspension_reason, suspended_until, verified, reputation",
    )
    .order("created_at", { ascending: false });

  if (error) {
    trackError(new Error("Error fetching all users"), {
      component: "profile.queries",
      action: "getAllUsers",
      metadata: { error },
    });
    return [];
  }

  return mapAdminUserList((data as UserListRow[] | null) || []);
}

export async function resolveOwnedProfileIds(userId: string): Promise<string[]> {
  const { data: byUserId, error: byUserIdError } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId);
  if (byUserIdError) return [];

  const idsByUser = ((byUserId as Array<{ id: string }> | null) || []).map((p) => p.id);
  if (idsByUser.length > 0) return idsByUser;

  const { data: byProfileId, error: byProfileIdError } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", userId)
    .limit(1);
  if (byProfileIdError) return [];

  return ((byProfileId as Array<{ id: string }> | null) || []).map((p) => p.id);
}

export async function resolveProfileIdByUserId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getPassengerRatings(params: {
  minRides: number;
  limit: number;
  ascending: boolean;
  maxRating?: number;
  errorLabel: string;
}): Promise<PassengerRatingRow[]> {
  try {
    let query = (supabase as any)
      .from(TABLE)
      .select(
        "id, name, avatar_url, passenger_rating, passenger_trust_level, passenger_completed_rides",
      )
      .gte("passenger_completed_rides", params.minRides)
      .order("passenger_rating", { ascending: params.ascending })
      .limit(params.limit);

    if (typeof params.maxRating === "number") {
      query = query.lte("passenger_rating", params.maxRating);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as PassengerRatingRow[] | null) || [];
  } catch (error) {
    logger.error(`Error fetching ${params.errorLabel}:`, error);
    return [];
  }
}

export async function isUsernameAvailable(
  username: string,
  excludeProfileId?: string,
): Promise<boolean> {
  try {
    let query = supabase.from(TABLE).select("id").eq("username", username);

    if (excludeProfileId) {
      query = query.neq("id", excludeProfileId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      logger.error("[profile.queries] isUsernameAvailable error:", error);
      return false;
    }

    return !data;
  } catch (error) {
    logger.error("[profile.queries] isUsernameAvailability check failed:", error);
    return false;
  }
}

export async function checkUsernameExists(
  username: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    let query = supabase.from(TABLE).select("id").eq("username", username).limit(1);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      logger.error("[profile.queries] checkUsernameExists error:", error);
      throw new Error(`Failed to check username existence: ${error.message}`);
    }

    return !!data;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Failed to check")) {
      throw error;
    }
    logger.error("[profile.queries] checkUsernameExists unexpected error:", error);
    throw new Error("Infrastructure error checking username");
  }
}

export async function getSimilarUsernames(
  username: string,
  limit = 20,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("username")
      .ilike("username", `${username}%`)
      .limit(limit);

    if (error) {
      logger.error("[profile.queries] getSimilarUsernames error:", error);
      throw new Error(`Failed to get similar usernames: ${error.message}`);
    }

    return (data || [])
      .map((d: { username: string | null }) => d.username)
      .filter((u): u is string => !!u);
  } catch (error) {
    logger.error("[profile.queries] getSimilarUsernames unexpected error:", error);
    throw new Error("Infrastructure error getting similar usernames");
  }
}

export async function getUsernameHistory(profileId: string): Promise<
  Array<{
    id: string;
    profile_id: string;
    old_username: string;
    new_username: string;
    change_reason: string;
    changed_at: string;
  }>
> {
  try {
    const { data, error } = await supabase
      .from("profile_username_history")
      .select("*")
      .eq("profile_id", profileId)
      .order("changed_at", { ascending: false });

    if (error) {
      logger.error("[profile.queries] getUsernameHistory error:", error);
      throw new Error(`Failed to get username history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    logger.error("[profile.queries] getUsernameHistory unexpected error:", error);
    throw new Error("Infrastructure error getting username history");
  }
}
