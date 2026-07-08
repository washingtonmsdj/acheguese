/**
 * ⭐ FAVORITES MUTATIONS - Operações de escrita (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { ProfileFavorite, CreateFavoriteData } from "../types";
import { isBusinessFavorited, isFavorited as checkIsFavorited } from "./favorites.queries";
import { BusinessFavoriteService } from "@/core/business/services/BusinessFavoriteService";
import {
  resolveAuthUserIdFromProfile,
  resolveBusinessDataIdFromProfile,
} from "./businessFavoriteAdapters";

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
export async function toggleBusinessFavorite(
  businessId: string,
  userId: string,
): Promise<boolean> {
  try {
    const isFavorited = await isBusinessFavorited(businessId, userId);

    if (isFavorited) {
      await removeBusinessFavorite(businessId, userId);
      return false;
    } else {
      await addBusinessFavorite(businessId, userId);
      return true;
    }
  } catch (error) {
    logger.error("[favorites.mutations] Error toggling business favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "toggleBusinessFavorite",
      metadata: { businessId, userId },
    });
    throw error;
  }
}

/**
 * Adiciona um negócio aos favoritos do usuário.
 */
export async function addBusinessFavorite(
  businessId: string,
  userId: string,
): Promise<void> {
  try {
    const [authUserId, businessDataId] = await Promise.all([
      resolveAuthUserIdFromProfile(userId),
      resolveBusinessDataIdFromProfile(businessId),
    ]);

    if (!authUserId || !businessDataId) {
      throw new Error("Perfil ou empresa indisponivel para favorito");
    }

    const alreadyFavorited = await BusinessFavoriteService.isFavoritedByUser(
      businessDataId,
      authUserId,
    );

    if (!alreadyFavorited) {
      const nextIsFavorited = await BusinessFavoriteService.toggleFavorite(
        businessDataId,
        authUserId,
      );

      if (!nextIsFavorited) {
        throw new Error("Favorito nao foi persistido");
      }
    }

    logger.info("[favorites.mutations] Business favorite added:", { businessId, userId });
  } catch (error) {
    logger.error("[favorites.mutations] Error adding business favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "addBusinessFavorite",
      metadata: { businessId, userId },
    });
    throw error;
  }
}

/**
 * Remove um negócio dos favoritos do usuário.
 */
export async function removeBusinessFavorite(
  businessId: string,
  userId: string,
): Promise<void> {
  try {
    const [authUserId, businessDataId] = await Promise.all([
      resolveAuthUserIdFromProfile(userId),
      resolveBusinessDataIdFromProfile(businessId),
    ]);

    if (!authUserId || !businessDataId) return;

    const alreadyFavorited = await BusinessFavoriteService.isFavoritedByUser(
      businessDataId,
      authUserId,
    );

    if (alreadyFavorited) {
      const nextIsFavorited = await BusinessFavoriteService.toggleFavorite(
        businessDataId,
        authUserId,
      );

      if (nextIsFavorited) {
        throw new Error("Favorito nao foi removido");
      }
    }

    logger.info("[favorites.mutations] Business favorite removed:", { businessId, userId });
  } catch (error) {
    logger.error("[favorites.mutations] Error removing business favorite:", error);
    trackError(error as Error, {
      component: "favorites.mutations",
      action: "removeBusinessFavorite",
      metadata: { businessId, userId },
    });
    throw error;
  }
}
