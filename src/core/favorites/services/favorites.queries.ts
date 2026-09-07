/**
 * ⭐ FAVORITES QUERIES - Operações de leitura (SSOT)
 *
 * Profile-to-profile favorites were retired in G6 after both legacy tables were
 * proven empty and dropped. Business/entity favorites remain on their canonical
 * stores. The zero-valued profile stats adapter is kept only for existing
 * workspace contracts until those legacy counters are removed from presentation.
 */

import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { FavoriteStats } from "../types";
import { BusinessFavoriteStore } from "./BusinessFavoriteStore";
import {
  resolveBusinessDataIdFromProfile,
  resolveBusinessProfileIdsByDataIds,
} from "./businessFavoriteAdapters";

/**
 * Legacy profile-to-profile favorite counters.
 *
 * The backing aggregates were retired with zero rows in
 * 20260906094125_drop_retired_business_and_profile_favorites_g6.sql.
 */
export async function getFavoriteStats(
  _profileId: string,
): Promise<FavoriteStats> {
  return {
    total_favorites_given: 0,
    total_favorites_received: 0,
  };
}

/**
 * Verificar se um negócio é favorito do usuário.
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
 * Buscar IDs dos negócios favoritados pelo usuário atual.
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
