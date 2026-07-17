/**
 * ⭐ FAVORITES QUERIES - Operações de leitura (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { FavoriteStats } from "../types";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";
import { BusinessFavoriteStore } from "./BusinessFavoriteStore";
import {
  resolveBusinessDataIdFromProfile,
  resolveBusinessProfileIdsByDataIds,
} from "./businessFavoriteAdapters";

const TABLE = "profile_favorites_new";

const supabaseTyped = supabase as unknown as AdminSupabaseClient;

/**
 * Verificar se um profile favoritou outro
 */
export async function isFavorited(
  favoritedProfileId: string,
  favoritingProfileId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabaseTyped
      .from(TABLE)
      .select("id")
      .eq("favorited_profile_id", favoritedProfileId)
      .eq("favoriting_profile_id", favoritingProfileId)
      .limit(1);

    if (error) {
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    logger.error("[favorites.queries] Error checking if favorited:", error);
    return false;
  }
}

/**
 * Buscar favoritos de um profile (profiles que este profile favoritou)
 */
export async function getFavoritesByProfile(
  favoritingProfileId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("favorited_profile_id")
      .eq("favoriting_profile_id", favoritingProfileId);

    if (error) throw error;

    return data?.map((f) => f.favorited_profile_id) || [];
  } catch (error) {
    logger.error("[favorites.queries] Error getting favorites by profile:", error);
    trackError(error as Error, {
      component: "favorites.queries",
      action: "getFavoritesByProfile",
      metadata: { favoritingProfileId },
    });
    return [];
  }
}

/**
 * Buscar quem favoritou um profile
 */
export async function getFavoritersOfProfile(
  favoritedProfileId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("favoriting_profile_id")
      .eq("favorited_profile_id", favoritedProfileId);

    if (error) throw error;

    return data?.map((f) => f.favoriting_profile_id) || [];
  } catch (error) {
    logger.error("[favorites.queries] Error getting favoriters of profile:", error);
    trackError(error as Error, {
      component: "favorites.queries",
      action: "getFavoritersOfProfile",
      metadata: { favoritedProfileId },
    });
    return [];
  }
}

/**
 * Buscar estatísticas de favoritos de um profile
 */
export async function getFavoriteStats(profileId: string): Promise<FavoriteStats> {
  try {
    const [favoritesGiven, favoritesReceived] = await Promise.all([
      supabase
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("favoriting_profile_id", profileId),
      supabase
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("favorited_profile_id", profileId),
    ]);

    return {
      total_favorites_given: favoritesGiven.count || 0,
      total_favorites_received: favoritesReceived.count || 0,
    };
  } catch (error) {
    logger.error("[favorites.queries] Error getting favorite stats:", error);
    trackError(error as Error, {
      component: "favorites.queries",
      action: "getFavoriteStats",
      metadata: { profileId },
    });
    return {
      total_favorites_given: 0,
      total_favorites_received: 0,
    };
  }
}

/**
 * Buscar favoritos com detalhes dos profiles
 */
export async function getFavoritesWithProfiles(favoritingProfileId: string) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        `
        id,
        favorited_profile_id,
        created_at,
        favorited_profile:profiles!favorited_profile_id (
          id,
          name,
          username,
          avatar_url,
          profile_type,
          city,
          neighborhood
        )
      `,
      )
      .eq("favoriting_profile_id", favoritingProfileId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error("[favorites.queries] Error getting favorites with profiles:", error);
    trackError(error as Error, {
      component: "favorites.queries",
      action: "getFavoritesWithProfiles",
      metadata: { favoritingProfileId },
    });
    return [];
  }
}

/**
 * Verificar se um negócio é favorito do usuário
 */
export async function isBusinessFavorited(
  businessId: string,
): Promise<boolean> {
  try {
    const businessDataId = await resolveBusinessDataIdFromProfile(businessId);

    if (!businessDataId) return false;

    return BusinessFavoriteStore.isFavorited(businessDataId);
  } catch (error) {
    logger.error("[favorites.queries] Error checking if business is favorited:", error);
    trackError(error as Error, {
      component: "favorites.queries",
      action: "isBusinessFavorited",
      metadata: { businessId },
    });
    return false;
  }
}

/**
 * Buscar IDs dos negócios favoritados por um usuário
 */
export async function getCurrentUserBusinessFavorites(): Promise<string[]> {
  try {
    const favorites = await BusinessFavoriteStore.list({ limit: 100 });
    return resolveBusinessProfileIdsByDataIds(
      favorites.map((favorite) => favorite.business_id),
    );
  } catch (error) {
    logger.error("[favorites.queries] Error getting user business favorites:", error);
    trackError(error as Error, {
      component: "favorites.queries",
      action: "getCurrentUserBusinessFavorites",
    });
    return [];
  }
}
