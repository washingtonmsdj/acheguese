import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import { mapAdminUserList } from "./profile.service.admin-rules";
import { ProfileRpcService } from "./ProfileRpcService";
import type { ProfilePermissions, ProfileStatus } from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type { PassengerRatingRow, UserListRow } from "./profile.service.types";

const TABLE = "profiles";

interface QueryError {
  message?: string | null;
  code?: string | null;
}

interface QueryArrayResult<T> {
  data: T[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface QuerySingleResult<T> {
  data: T | null;
  error: QueryError | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (
    columns?: string,
    options?: { count?: "exact"; head?: boolean },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  neq: (column: string, value: unknown) => QueryBuilder<TRow>;
  ilike: (column: string, value: string) => QueryBuilder<TRow>;
  gte: (column: string, value: string | number) => QueryBuilder<TRow>;
  lte: (column: string, value: string | number) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QuerySingleResult<TRow>>;
}

interface ProfileAdminQueriesDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const profileAdminQueriesDb = supabase as unknown as ProfileAdminQueriesDbClient;

export async function getVerificationStats(): Promise<{
  pending: number;
  verified: number;
  rejected: number;
}> {
  try {
    const [pending, verified, rejected] = await Promise.all([
      profileAdminQueriesDb
        .from<{ id: string }>(TABLE)
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending"),
      profileAdminQueriesDb
        .from<{ id: string }>(TABLE)
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "verified"),
      profileAdminQueriesDb
        .from<{ id: string }>(TABLE)
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "rejected"),
    ]);

    return {
      pending: pending.count ?? 0,
      verified: verified.count ?? 0,
      rejected: rejected.count ?? 0,
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

export async function getSuspendedUsers(limit = 100): Promise<
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
  const boundedLimit = Math.max(1, Math.min(limit, 100));
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("is_suspended", true)
    .order("created_at", { ascending: false })
    .limit(boundedLimit);

  if (error) {
    trackError(new Error("Error fetching suspended profile ids"), {
      component: "profile.queries",
      action: "getSuspendedUsers",
      metadata: { error },
    });
    return [];
  }

  const profileIds = (data ?? []).map((profile) => profile.id);
  if (profileIds.length === 0) return [];

  const profiles = await ProfileRpcService.getAccessibleProfiles<UserListRow[]>({
    profileIds,
  });
  return mapAdminUserList(profiles);
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
    let query = profileAdminQueriesDb
      .from<PassengerRatingRow>(TABLE)
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
    const sanitizedUsername = sanitizeForILike(username);
    if (!sanitizedUsername) return [];

    const { data, error } = await supabase
      .from(TABLE)
      .select("username")
      .ilike("username", `${sanitizedUsername}%`)
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
