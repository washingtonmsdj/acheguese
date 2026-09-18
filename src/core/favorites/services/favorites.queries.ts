/**
 * ⭐ FAVORITES QUERIES - Operações de leitura (SSOT)
 *
 * Profile-to-profile favorites were retired in G6 after both legacy tables were
 * proven empty and dropped. Business/entity favorites remain on their canonical
 * stores.
 */

import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { BusinessFavoriteStore } from "./BusinessFavoriteStore";
import {
  resolveBusinessDataIdFromProfile,
  resolveBusinessProfileIdsByDataIds,
} from "./businessFavoriteAdapters";

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
