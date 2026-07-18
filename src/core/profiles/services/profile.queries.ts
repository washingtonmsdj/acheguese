/**
 * 👤 PROFILE QUERIES - Operações de leitura (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { sanitizeForILike } from "@/shared/utils/sqlSanitization";
import { SessionService } from "@/core/session/services/SessionService";
import { SessionRpcService } from "@/core/session/services/SessionRpcService";
import { postService } from "@/core/posts/services/PostService";
import { ProfileRpcService } from "./ProfileRpcService";
import type {
  AdminFilters,
  AdminProfileListItem,
  ProfileContext,
  ProfilePrivateWorkspace,
  ProfileRow as Profile,
  ProfileSummary,
  ProfileSummaryExtended,
} from "./types";
import type { ProfileActivityStats } from "./ProfileOperationTypes";
import type {
  ProfileFilterRow,
  VerificationWorkflowStatus,
} from "./profile.service.types";

const TABLE = "profiles";
const PUBLIC_PROFILE_VIEW = "public_profiles";
const PUBLIC_PROFILE_COLUMNS = [
  "id",
  "user_id",
  "profile_type",
  "name",
  "display_name",
  "username",
  "handle",
  "slug",
  "bio",
  "avatar_url",
  "city",
  "neighborhood",
  "state",
  "location_id",
  "public_location_visibility",
  "reputation",
  "pontos",
  "verified",
  "verified_at",
  "website",
  "is_active",
  "created_at",
  "updated_at",
].join(",");

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
  in: (column: string, values: unknown[]) => QueryBuilder<TRow>;
  or: (filters: string) => QueryBuilder<TRow>;
  gte: (column: string, value: string | number) => QueryBuilder<TRow>;
  lte: (column: string, value: string | number) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  range: (from: number, to: number) => QueryBuilder<TRow>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface ProfileQueriesDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const profileQueriesDb = supabase as unknown as ProfileQueriesDbClient;

type RecentProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

/**
 * Busca profile por ID
 */
export async function getProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await profileQueriesDb
    .from<Profile>(PUBLIC_PROFILE_VIEW)
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("id", profileId)
    .single();

  if (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getProfileById",
      metadata: { profileId },
    });
    return null;
  }

  return (data as Profile) ?? null;
}

/**
 * Busca perfil ativo do usuário
 */
export async function getActiveProfile(userId?: string): Promise<Profile | null> {
  let targetUserId = userId;

  if (!targetUserId) {
    const currentUser = await SessionService.getCurrentUser();
    targetUserId = currentUser?.id;
  }

  if (!targetUserId) return null;
  const profiles = await getProfilesByUserId(targetUserId);
  return profiles.find((profile) => profile.is_active) ?? null;
}

export async function getActiveProfileRpc(userId?: string): Promise<Profile | null> {
  let targetUserId = userId;

  if (!targetUserId) {
    const user = await SessionService.getCurrentUser();
    if (!user) return null;
    targetUserId = user.id;
  }

  const currentUser = await SessionService.getCurrentUser();
  if (!currentUser || currentUser.id !== targetUserId) return null;

  const profile = await SessionRpcService.getActiveProfile();
  return (profile as Profile) || null;
}

/**
 * Busca todos os perfis de um usuário
 */
export async function getProfilesByUserId(userId?: string): Promise<Profile[]> {
  let targetUserId = userId;

  if (!targetUserId) {
    const currentUser = await SessionService.getCurrentUser();
    targetUserId = currentUser?.id;
  }

  if (!targetUserId) return [];

  try {
    return await ProfileRpcService.getAccessibleProfiles<Profile[]>({
      targetUserId,
    });
  } catch (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getProfilesByUserId",
      metadata: { userId: targetUserId },
    });
    return [];
  }
}

/**
 * Busca profile por tipo
 */
export async function getProfileByType(
  userId: string,
  profileType: "personal" | "driver" | "business" | "professional",
): Promise<Profile | null> {
  try {
    const profiles = await ProfileRpcService.getAccessibleProfiles<Profile[]>({
      targetUserId: userId,
      profileType,
    });
    return profiles[0] ?? null;
  } catch (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getProfileByType",
      metadata: { userId, profileType },
    });
    return null;
  }
}

/**
 * Busca profile por username
 */
export async function getByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await profileQueriesDb
    .from<Profile>("public_profiles")
    .select()
    .eq("username", username)
    .single();

  if (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getByUsername",
      metadata: { username },
    });
    return null;
  }

  return (data as Profile) ?? null;
}

/**
 * Busca perfil público por ID (view canônica public_profiles)
 */
export async function getPublicProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await profileQueriesDb
    .from<Profile>("public_profiles")
    .select()
    .eq("id", profileId)
    .single();

  if (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getPublicProfileById",
      metadata: { profileId },
    });
    return null;
  }

  return (data as Profile) ?? null;
}

/**
 * Busca profiles por IDs (batch)
 */
export async function getProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];

  const uniqueIds = [...new Set(ids)];

  const { data, error } = await profileQueriesDb
    .from<Profile>(PUBLIC_PROFILE_VIEW)
    .select(PUBLIC_PROFILE_COLUMNS)
    .in("id", uniqueIds);

  if (error) {
    trackError(new Error("Error fetching profiles by ids"), {
      component: "profile.queries",
      action: "getProfilesByIds",
      metadata: { ids: uniqueIds, error },
    });
    return [];
  }

  return ((data || []) as Profile[]);
}

/**
 * Busca profiles summary por IDs
 */
export async function getProfilesSummary(ids: string[]): Promise<ProfileSummary[]> {
  if (ids.length === 0) return [];

  const uniqueIds = [...new Set(ids)];

  const { data, error } = await profileQueriesDb
    .from<Profile>(PUBLIC_PROFILE_VIEW)
    .select("id, display_name, name, avatar_url, verified")
    .in("id", uniqueIds);

  if (error) {
    trackError(new Error("Error fetching profiles summary"), {
      component: "profile.queries",
      action: "getProfilesSummary",
      metadata: { ids: uniqueIds, error },
    });
    return [];
  }

  return (data || []).map((profile) => ({
    id: profile.id,
    displayName: profile.display_name ?? profile.name,
    avatarUrl: profile.avatar_url ?? null,
    verified: profile.verified || false,
  }));
}

/**
 * Busca profiles summary estendido por IDs
 */
export async function getProfilesSummaryExtended(
  ids: string[],
): Promise<ProfileSummaryExtended[]> {
  if (ids.length === 0) return [];

  const uniqueIds = [...new Set(ids)];

  const { data, error } = await supabase
    .from("public_profiles")
    .select(
      "id, display_name, avatar_url, username, public_neighborhood:neighborhood, public_city:city, public_state:state",
    )
    .in("id", uniqueIds);

  if (error) {
    trackError(new Error("Error fetching profiles summary extended"), {
      component: "profile.queries",
      action: "getProfilesSummaryExtended",
      metadata: { ids: uniqueIds, error },
    });
    return [];
  }

  return (data || []).map((profile) => ({
    id: profile.id,
    displayName: profile.display_name,
    username: profile.username,
    avatarUrl: profile.avatar_url ?? null,
    verified: false,
    neighborhood: profile.public_neighborhood ?? null,
    whatsapp: null,
  }));
}

/**
 * Busca lista de profiles para admin
 */
export async function getAdminProfilesList(
  filters?: AdminFilters,
): Promise<AdminProfileListItem[]> {
  let query = supabase
    .from(TABLE)
    .select(
      "id, name, username, avatar_url, verified, is_suspended, created_at, profile_type",
    );

  if (filters?.suspended !== undefined) {
    query = query.eq("is_suspended", filters.suspended);
  }

  if (filters?.verified !== undefined) {
    query = query.eq("verified", filters.verified);
  }

  if (filters?.profileType) {
    query = query.eq("profile_type", filters.profileType);
  }

  if (filters?.search) {
    const search = sanitizeForILike(filters.search);
    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
    }
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getAdminProfilesList",
      metadata: { filters },
    });
    return [];
  }

  return (data || []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    verified: profile.verified,
    suspended: profile.is_suspended,
    createdAt: profile.created_at,
    profileType: profile.profile_type,
  }));
}

/**
 * Busca estatísticas do profile
 */
export async function getStats(userId: string): Promise<ProfileActivityStats | null> {
  const activeProfile = await getActiveProfile(userId);

  if (!activeProfile) {
    return null;
  }

  // Contagens em paralelo
  const [
    postsCount,
    likesResult,
  ] = await Promise.all([
    postService.getPostsCountByAuthor(activeProfile.id),
    profileQueriesDb
      .from<{ id: string }>("post_likes_new")
      .select("id", { count: "exact", head: true })
      .eq("liker_profile_id", activeProfile.id),
  ]);

  const commentsCount = 0;

  return {
    posts: postsCount || 0,
    likes: likesResult.count || 0,
    favorites: 0,
    businesses: 0,
  };
}

export async function getProfilesFiltered(filters: {
  search?: string;
  profileType?: string;
  visibility?: "all" | "public" | "private";
  page?: number;
  limit?: number;
}): Promise<{ data: ProfileFilterRow[]; total: number }> {
  const { search, profileType, visibility = "all", page = 1, limit = 20 } = filters;

  let query = supabase
    .from(TABLE)
    .select(
      "id, user_id, created_at, profile_type, is_public, username, name, display_name",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (profileType) query = query.eq("profile_type", profileType);
  if (visibility !== "all") query = query.eq("is_public", visibility === "public");

  const term = search ? sanitizeForILike(search) : "";
  if (term) {
    query = query.or(
      `name.ilike.%${term}%,display_name.ilike.%${term}%,username.ilike.%${term}%,user_id.ilike.%${term}%`,
    );
  }

  const from = (page - 1) * limit;
  const { data, error, count } = await query.range(from, from + limit - 1);

  if (error) {
    trackError(new Error("Error fetching profiles filtered"), {
      component: "profile.queries",
      action: "getProfilesFiltered",
      metadata: { filters, error },
    });
    return { data: [], total: 0 };
  }

  return { data: (data as ProfileFilterRow[] | null) ?? [], total: count ?? 0 };
}

export async function getAllProfileIds(): Promise<string[]> {
  const { data, error } = await supabase.from(TABLE).select("id");

  if (error) {
    trackError(new Error("Error fetching all profile ids"), {
      component: "profile.queries",
      action: "getAllProfileIds",
      metadata: { error },
    });
    return [];
  }

  return (data ?? []).map((p: { id: string }) => p.id);
}

// ============================================================================
// 📊 ESTATÍSTICAS ADMINISTRATIVAS
// ============================================================================

/**
 * Contagem total de profiles
 */
export async function getTotalProfilesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true });

    if (error) {
      trackError(error, {
        component: "profile.queries",
        action: "getTotalProfilesCount",
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getTotalProfilesCount",
    });
    return 0;
  }
}

/**
 * Profiles recentes
 */
export async function getRecentProfiles(limit = 10): Promise<RecentProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, name, username, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      trackError(error, {
        component: "profile.queries",
        action: "getRecentProfiles",
        metadata: { limit },
      });
      return [];
    }

    return (data as RecentProfileRow[] | null) || [];
  } catch (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getRecentProfiles",
    });
    return [];
  }
}

/**
 * Profiles criados em um período
 */
export async function getProfilesCreatedInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      trackError(error, {
        component: "profile.queries",
        action: "getProfilesCreatedInPeriod",
        metadata: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getProfilesCreatedInPeriod",
    });
    return 0;
  }
}

export async function getProfilesByVerificationStatus(
  status: VerificationWorkflowStatus,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: "created_at" | "updated_at";
  },
): Promise<Profile[]> {
  try {
    let query = profileQueriesDb
      .from<Profile>(TABLE)
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq("verification_status", status)
      .order(options?.orderBy ?? "updated_at", { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("Error fetching profiles by verification status:", error);
      throw error;
    }

    return ((data ?? []) as unknown) as Profile[];
  } catch (error) {
    trackError(new Error("Error getting profiles by verification status"), {
      component: "profile.queries",
      action: "getProfilesByVerificationStatus",
      metadata: { status, options, error },
    });
    throw error;
  }
}

export {
  getVerificationStats,
  getSuspendedUsers,
  resolveOwnedProfileIds,
  resolveProfileIdByUserId,
  getPassengerRatings,
  isUsernameAvailable,
  checkUsernameExists,
  getSimilarUsernames,
  getUsernameHistory,
} from "./profile.admin-user-queries";
