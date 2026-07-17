/**
 * ⭐ FAVORITES MUTATIONS - Operações de escrita (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { ProfileFavorite, CreateFavoriteData } from "../types";
import { isFavorited as checkIsFavorited } from "./favorites.queries";
import { BusinessFavoriteStore } from "./BusinessFavoriteStore";
import { resolveBusinessDataIdFromProfile } from "./businessFavoriteAdapters";

const TABLE = "profile_favorites_new";

interface QueryError {
  message?: string | null;
  code?: string | null;
}

interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  delete: () => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
}

interface FavoritesDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const favoritesDb = supabase as unknown as FavoritesDbClient;

/**
 * Adicionar favorito
 */
export async function addFavorite(
  data: CreateFavoriteData,
): Promise<ProfileFavorite | null> {
  try {
    const { data: favorite, error } = await favoritesDb
      .from(TABLE)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    logger.info("[favorites.mutations] Favorite added:", {
      favorited: data.favorited_profile_id,
      favoriting: data.favoriting_profile_id,
    });

    return favorite;
  } catch (error) {
    logger.error("[favorites.mutations] Error adding favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "addFavorite",
      metadata: { ...data },
    });
    throw error;
  }
}

/**
 * Remover favorito
 */
export async function removeFavorite(
  favoritedProfileId: string,
  favoritingProfileId: string,
): Promise<boolean> {
  try {
    const { error } = await favoritesDb
      .from(TABLE)
      .delete()
      .eq("favorited_profile_id", favoritedProfileId)
      .eq("favoriting_profile_id", favoritingProfileId);

    if (error) throw error;

    logger.info("[favorites.mutations] Favorite removed:", {
      favorited: favoritedProfileId,
      favoriting: favoritingProfileId,
    });

    return true;
  } catch (error) {
    logger.error("[favorites.mutations] Error removing favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "removeFavorite",
      metadata: { favoritedProfileId, favoritingProfileId },
    });
    throw error;
  }
}

/**
 * Toggle favorito (adicionar se não existe, remover se existe)
 */
export async function toggleFavorite(
  favoritedProfileId: string,
  favoritingProfileId: string,
): Promise<{ isFavorited: boolean; favorite?: ProfileFavorite }> {
  try {
    const isFavorited = await checkIsFavorited(favoritedProfileId, favoritingProfileId);

    if (isFavorited) {
      await removeFavorite(favoritedProfileId, favoritingProfileId);
      return { isFavorited: false };
    } else {
      const favorite = await addFavorite({
        favorited_profile_id: favoritedProfileId,
        favoriting_profile_id: favoritingProfileId,
      });
      return { isFavorited: true, favorite: favorite || undefined };
    }
  } catch (error) {
    logger.error("[favorites.mutations] Error toggling favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "toggleFavorite",
      metadata: { favoritedProfileId, favoritingProfileId },
    });
    throw error;
  }
}

/**
 * Toggle favorito de negócio (adicionar se não existe, remover se existe)
 * @returns true se foi adicionado, false se foi removido
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
