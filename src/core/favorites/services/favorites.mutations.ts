/**
 * ⭐ FAVORITES MUTATIONS - operações de escrita (SSOT)
 *
 * Profile-to-profile favorites were retired in G6. Business favorites remain
 * on the canonical BusinessFavoriteStore.
 */

import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { BusinessFavoriteStore } from "./BusinessFavoriteStore";
import { resolveBusinessDataIdFromProfile } from "./businessFavoriteAdapters";

/**
 * Define favorito de negócio no store canônico.
 * @returns true quando o estado final é favoritado; false quando removido.
 */
export async function setBusinessFavorite(
  businessId: string,
  favorited: boolean,
): Promise<boolean> {
  try {
    const businessDataId = await resolveBusinessDataIdFromProfile(businessId);
    if (!businessDataId) {
      throw new Error("Empresa indisponivel para favorito");
    }

    return BusinessFavoriteStore.setFavorited(businessDataId, favorited);
  } catch (error) {
    logger.error("[favorites.mutations] Error setting business favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "setBusinessFavorite",
      metadata: { businessId, favorited },
    });
    throw error;
  }
}

/**
 * Adiciona um negócio aos favoritos do usuário.
 */
export async function addBusinessFavorite(
  businessId: string,
): Promise<void> {
  try {
    await setBusinessFavorite(businessId, true);
    logger.info("[favorites.mutations] Business favorite added:", { businessId });
  } catch (error) {
    logger.error("[favorites.mutations] Error adding business favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "addBusinessFavorite",
      metadata: { businessId },
    });
    throw error;
  }
}

/**
 * Remove um negócio dos favoritos do usuário.
 */
export async function removeBusinessFavorite(
  businessId: string,
): Promise<void> {
  try {
    await setBusinessFavorite(businessId, false);
    logger.info("[favorites.mutations] Business favorite removed:", { businessId });
  } catch (error) {
    logger.error("[favorites.mutations] Error removing business favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "removeBusinessFavorite",
      metadata: { businessId },
    });
    throw error;
  }
}
