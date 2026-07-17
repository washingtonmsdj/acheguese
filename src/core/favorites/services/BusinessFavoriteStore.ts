import { supabase, type Database } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import { isValidUUID } from '@/shared/utils/validation';

export type BusinessFavoriteRecord =
  Database['public']['Tables']['user_favorite_businesses']['Row'];

type ListArgs =
  Database['public']['Functions']['get_current_user_business_favorites']['Args'];
type PatchArgs =
  Database['public']['Functions']['patch_current_user_business_favorite']['Args'];

export interface ListBusinessFavoritesInput {
  limit?: number;
  offset?: number;
  tags?: string[];
}

export interface PatchBusinessFavoriteInput {
  notifyOnPromotions?: boolean;
  notifyOnNewItems?: boolean;
  notes?: string | null;
  tags?: string[] | null;
}

const hasOwn = <T extends object>(value: T, key: keyof T): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

export class BusinessFavoriteStore {
  static async getFavoritedBusinessIds(
    businessDataIds: string[],
  ): Promise<string[]> {
    const candidates = [...new Set(businessDataIds.filter(isValidUUID))].sort();
    if (candidates.length === 0) return [];
    if (candidates.length > 100) {
      throw new Error('A consulta aceita no maximo 100 empresas');
    }

    const { data, error } = await supabase.rpc(
      'get_current_user_business_favorite_ids',
      { p_business_ids: candidates },
    );

    if (error) {
      logger.error('[BusinessFavoriteStore] Failed to read favorite IDs', error, {
        candidateCount: candidates.length,
      });
      throw error;
    }

    return data ?? [];
  }

  static async list(
    input: ListBusinessFavoritesInput = {},
  ): Promise<BusinessFavoriteRecord[]> {
    const args: ListArgs = {
      p_limit: input.limit ?? 50,
      p_offset: input.offset ?? 0,
    };

    if (input.tags) {
      args.p_tags = input.tags;
    }

    const { data, error } = await supabase.rpc(
      'get_current_user_business_favorites',
      args,
    );

    if (error) {
      logger.error('[BusinessFavoriteStore] Failed to list favorites', error);
      throw error;
    }

    return data ?? [];
  }

  static async isFavorited(businessDataId: string): Promise<boolean> {
    if (!isValidUUID(businessDataId)) return false;

    const { data, error } = await supabase.rpc(
      'is_current_user_business_favorite',
      { p_business_id: businessDataId },
    );

    if (error) {
      logger.error('[BusinessFavoriteStore] Failed to read favorite state', error, {
        businessDataId,
      });
      throw error;
    }

    return data === true;
  }

  static async setFavorited(
    businessDataId: string,
    favorited: boolean,
  ): Promise<boolean> {
    if (!isValidUUID(businessDataId)) {
      throw new Error('Empresa invalida para favorito');
    }

    const { data, error } = await supabase.rpc(
      'set_current_user_business_favorite',
      {
        p_business_id: businessDataId,
        p_favorited: favorited,
      },
    );

    if (error) {
      logger.error('[BusinessFavoriteStore] Failed to set favorite state', error, {
        businessDataId,
        favorited,
      });
      throw error;
    }

    return data === true;
  }

  static async patchPreferences(
    favoriteId: string,
    input: PatchBusinessFavoriteInput,
  ): Promise<BusinessFavoriteRecord> {
    if (!isValidUUID(favoriteId)) {
      throw new Error('Favorito invalido');
    }

    const args: PatchArgs = { p_favorite_id: favoriteId };

    if (input.notifyOnPromotions !== undefined) {
      args.p_notify_on_promotions = input.notifyOnPromotions;
    }
    if (input.notifyOnNewItems !== undefined) {
      args.p_notify_on_new_items = input.notifyOnNewItems;
    }
    if (hasOwn(input, 'notes')) {
      args.p_notes_set = true;
      if (input.notes !== null && input.notes !== undefined) {
        args.p_notes = input.notes;
      }
    }
    if (hasOwn(input, 'tags')) {
      args.p_tags_set = true;
      if (input.tags !== null && input.tags !== undefined) {
        args.p_tags = input.tags;
      }
    }

    const { data, error } = await supabase.rpc(
      'patch_current_user_business_favorite',
      args,
    );

    if (error) {
      logger.error('[BusinessFavoriteStore] Failed to patch favorite', error, {
        favoriteId,
      });
      throw error;
    }
    if (!data) {
      throw new Error('Favorito nao retornado pelo comando canonico');
    }

    return data;
  }

  static async getBusinessFavoritesCount(businessDataId: string): Promise<number> {
    if (!isValidUUID(businessDataId)) return 0;

    const { data, error } = await supabase
      .from('business_data')
      .select('favorites_count')
      .eq('id', businessDataId)
      .maybeSingle();

    if (error) {
      logger.error('[BusinessFavoriteStore] Failed to read favorite count', error, {
        businessDataId,
      });
      throw error;
    }

    return data?.favorites_count ?? 0;
  }
}
