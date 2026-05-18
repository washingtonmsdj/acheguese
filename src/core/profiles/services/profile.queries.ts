/**
 * 👤 PROFILE QUERIES - Operações de leitura (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { SessionService } from "@/core/session/services/SessionService";
import type {
  AdminFilters,
  AdminProfileListItem,
  Profile,
  ProfileContext,
  ProfilePrivateWorkspace,
  ProfileStats,
  ProfileSummary,
  ProfileSummaryExtended,
} from "./types";

const TABLE = "profiles";

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
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("*")
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

  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("*")
    .eq("user_id", targetUserId)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getActiveProfile",
      metadata: { userId: targetUserId },
    });
  }

  return (data as Profile) || null;
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

  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("*")
    .eq("user_id", targetUserId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getProfilesByUserId",
      metadata: { userId: targetUserId },
    });
    return [];
  }

  return ((data || []) as Profile[]);
}

/**
 * Busca profile por tipo
 */
export async function getProfileByType(
  userId: string,
  profileType: "personal" | "driver" | "business" | "professional",
): Promise<Profile | null> {
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("profile_type", profileType)
    .single();

  if (error && error.code !== "PGRST116") {
    trackError(error as Error, {
      component: "profile.queries",
      action: "getProfileByType",
      metadata: { userId, profileType },
    });
  }

  return (data as Profile) || null;
}

/**
 * Busca profile por username
 */
export async function getByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await (supabase as any)
    .from("public_profiles")
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
  const { data, error } = await (supabase as any)
    .from("public_profiles")
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

  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select()
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

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, name, avatar_url, verified")
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
    userId: profile.user_id,
    name: profile.name,
    avatarUrl: profile.avatar_url,
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
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    verified: false,
    neighborhood: profile.public_neighborhood,
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

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,username.ilike.%${filters.search}%`);
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
export async function getStats(userId: string): Promise<ProfileStats | null> {
  const activeProfile = await getActiveProfile(userId);

  if (!activeProfile) {
    return null;
  }

  // Contagens em paralelo
  const [
    postsResult,
    likesResult,
  ] = await Promise.all([
    (supabase as any)
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", activeProfile.id),
    (supabase as any)
      .from("post_likes_new")
      .select("id", { count: "exact", head: true })
      .eq("liker_profile_id", activeProfile.id),
  ]);

  const commentsCount = 0;

  return {
    posts: postsResult.count || 0,
    likes: likesResult.count || 0,
    favorites: 0,
    businesses: 0,
  };
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
      .select("*", { count: "exact", head: true });

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
      .select("*", { count: "exact", head: true })
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

/**
 * Verifica se username está disponível
 */
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

/**
 * Busca usernames similares
 */
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

/**
 * Obtém histórico de mudanças de username
 */
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

