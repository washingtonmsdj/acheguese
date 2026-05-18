/**
 * Favorites Query Service â€” operaÃ§Ãµes de favoritos de gastronomia
 *
 * Usa a tabela `user_favorite_businesses` criada pela migration 20260412000002.
 * Ã‰ distinta de:
 *   - `profile_favorites_new` (core/favorites â€” favoritos entre perfis)
 *   - `business_favorites` (core/favorites â€” tabela legada de business)
 *
 * Esta tabela Ã© especÃ­fica para o relacionamento user â†’ business_data
 * com campos extras (tags, notas, preferÃªncias de notificaÃ§Ã£o).
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface FavoriteBusiness {
  favorite_id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_description: string | null;
  business_logo_url: string | null;
  business_banner_url: string | null;
  business_rating: number;
  business_total_reviews: number;
  business_is_verified: boolean;
  business_geographic_path: string | null;
  cuisine_type: string | null;
  delivery_enabled: boolean | null;
  price_range: string | null;
  notify_on_promotions: boolean;
  notify_on_new_items: boolean;
  notes: string | null;
  tags: string[];
  favorited_at: string;
}

export interface UpdateFavoritePreferencesInput {
  notify_on_promotions?: boolean;
  notify_on_new_items?: boolean;
  notes?: string;
  tags?: string[];
}

type FavoriteRpcRow = {
  favorite_id: string;
  business_id: string;
  business_name: string;
  business_slug: string | null;
  business_description: string | null;
  business_banner_url: string | null;
  business_rating: number | null;
  business_total_reviews: number | null;
  business_is_verified: boolean | null;
  business_geographic_path: string | null;
  cuisine_type: string | null;
  delivery_enabled: boolean | null;
  price_range: string | null;
  notify_on_promotions: boolean | null;
  notify_on_new_items: boolean | null;
  notes: string | null;
  tags: string[] | null;
  favorited_at: string;
};

type FavoriteRecordRow = {
  id: string;
  business_id: string;
  notify_on_promotions: boolean | null;
  notify_on_new_items: boolean | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
};

type FavoriteBusinessDataRow = {
  id: string;
  business_name: string | null;
  slug: string | null;
  description: string | null;
  rating: number | null;
  total_reviews: number | null;
  is_verified: boolean | null;
  metadata: {
    logo_url?: string | null;
    banner_url?: string | null;
  } | null;
  location?: {
    geographic_path?: string | null;
  } | null;
};

type FavoriteGastronomyProfileRow = {
  business_id: string;
  cuisine_type: string | null;
  delivery_enabled: boolean | null;
  price_range: string | null;
};

function mapRpcRowToFavoriteBusiness(row: FavoriteRpcRow): FavoriteBusiness {
  return {
    favorite_id: row.favorite_id,
    business_id: row.business_id,
    business_name: row.business_name,
    business_slug: row.business_slug ?? '',
    business_description: row.business_description,
    business_logo_url: null,
    business_banner_url: row.business_banner_url,
    business_rating: row.business_rating ?? 0,
    business_total_reviews: row.business_total_reviews ?? 0,
    business_is_verified: row.business_is_verified ?? false,
    business_geographic_path: row.business_geographic_path,
    cuisine_type: row.cuisine_type,
    delivery_enabled: row.delivery_enabled,
    price_range: row.price_range,
    notify_on_promotions: row.notify_on_promotions ?? true,
    notify_on_new_items: row.notify_on_new_items ?? false,
    notes: row.notes,
    tags: row.tags ?? [],
    favorited_at: row.favorited_at,
  };
}

function isLegacyFavoritesRpcSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as {
    code?: string;
    message?: string;
    hint?: string;
    details?: string;
    cause?: unknown;
  };

  const message = (maybeError.message || '').toLowerCase();
  const hint = (maybeError.hint || '').toLowerCase();
  const details = (maybeError.details || '').toLowerCase();
  const causeMessage =
    maybeError.cause && typeof maybeError.cause === 'object'
      ? String((maybeError.cause as { message?: string }).message || '').toLowerCase()
      : '';
  const mergedText = `${message} ${hint} ${details} ${causeMessage}`;

  return (
    maybeError.code === '42703' ||
    mergedText.includes('bd.name') ||
    mergedText.includes('column bd.name does not exist') ||
    mergedText.includes('l.name') ||
    (mergedText.includes('column') && mergedText.includes('does not exist'))
  );
}

export class FavoritesQueryService {
  /**
   * Em SSOT, o caminho principal Ã© leitura direta de `user_favorite_businesses`
   * + `business_data` + `gastronomy_profiles`.
   * RPC fica desabilitada por padrÃ£o para evitar drift de schema em ambientes
   * ainda nÃ£o migrados, mas pode ser reativada alterando este flag.
   */
  private static useFavoritesRpc = false;
  private static hasLoggedRpcFallback = false;

  private static async getUserFavoritesFallback(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<FavoriteBusiness[]> {
    const limit = Math.max(0, params.limit ?? 50);
    const offset = Math.max(0, params.offset ?? 0);

    const { data: favoriteRowsRaw, error: favoritesError } = await supabase
      .from('user_favorite_businesses')
      .select('id, business_id, notify_on_promotions, notify_on_new_items, notes, tags, created_at')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Math.max(0, limit - 1));

    if (favoritesError) {
      throw favoritesError;
    }

    const favoriteRows = (favoriteRowsRaw as FavoriteRecordRow[] | null) ?? [];
    if (favoriteRows.length === 0) return [];

    const businessIds = favoriteRows.map((item) => item.business_id);

    const { data: businessRowsRaw, error: businessError } = await supabase
      .from('business_data')
      .select(`
        id,
        business_name,
        slug,
        description,
        rating,
        total_reviews,
        is_verified,
        metadata,
        location:locations!location_id(geographic_path)
      `)
      .in('id', businessIds)
      .eq('status', 'active');

    if (businessError) {
      throw businessError;
    }

    const { data: gastronomyRowsRaw, error: gastronomyError } = await supabase
      .from('gastronomy_profiles')
      .select('business_id, cuisine_type, delivery_enabled, price_range')
      .in('business_id', businessIds);

    if (gastronomyError) {
      throw gastronomyError;
    }

    const businessRows = (businessRowsRaw as FavoriteBusinessDataRow[] | null) ?? [];
    const gastronomyRows = (gastronomyRowsRaw as FavoriteGastronomyProfileRow[] | null) ?? [];

    const businessMap = new Map(businessRows.map((item) => [item.id, item]));
    const gastronomyMap = new Map(gastronomyRows.map((item) => [item.business_id, item]));

    return favoriteRows
      .map((favoriteRow) => {
        const businessRow = businessMap.get(favoriteRow.business_id);
        if (!businessRow) return null;

        const gastronomy = gastronomyMap.get(favoriteRow.business_id);
        return {
          favorite_id: favoriteRow.id,
          business_id: businessRow.id,
          business_name: businessRow.business_name || '',
          business_slug: businessRow.slug || '',
          business_description: businessRow.description,
          business_logo_url: businessRow.metadata?.logo_url ?? null,
          business_banner_url: businessRow.metadata?.banner_url ?? null,
          business_rating: businessRow.rating ?? 0,
          business_total_reviews: businessRow.total_reviews ?? 0,
          business_is_verified: businessRow.is_verified ?? false,
          business_geographic_path: businessRow.location?.geographic_path ?? null,
          cuisine_type: gastronomy?.cuisine_type ?? null,
          delivery_enabled: gastronomy?.delivery_enabled ?? null,
          price_range: gastronomy?.price_range ?? null,
          notify_on_promotions: favoriteRow.notify_on_promotions ?? true,
          notify_on_new_items: favoriteRow.notify_on_new_items ?? false,
          notes: favoriteRow.notes,
          tags: favoriteRow.tags ?? [],
          favorited_at: favoriteRow.created_at,
        } satisfies FavoriteBusiness;
      })
      .filter((item): item is FavoriteBusiness => Boolean(item));
  }

  /**
   * Obter favoritos do usuÃ¡rio
   */
  static async getUserFavorites(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<FavoriteBusiness[]> {
    try {
      if (!UUID_REGEX.test(params.userId)) {
        return [];
      }

      if (!this.useFavoritesRpc) {
        return await this.getUserFavoritesFallback(params);
      }

      const { data, error } = await supabase.rpc('get_user_favorite_businesses', {
        p_user_id: params.userId,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0,
      });

      if (error) {
        if (isLegacyFavoritesRpcSchemaError(error)) {
          this.useFavoritesRpc = false;
          if (!this.hasLoggedRpcFallback) {
            this.hasLoggedRpcFallback = true;
            logger.warn('RPC get_user_favorite_businesses com schema legado detectado. Usando fallback SSOT.', {
              code: (error as { code?: string })?.code,
              message: (error as { message?: string })?.message,
            });
          }
          return await this.getUserFavoritesFallback(params);
        }

        logger.error('Failed to fetch user favorites', error, {
          userId: params.userId,
        });
        throw error;
      }

      const rows = (data as FavoriteRpcRow[] | null) ?? [];
      return rows.map(mapRpcRowToFavoriteBusiness);
    } catch (error) {
      logger.error('Error in getUserFavorites', error);
      throw error;
    }
  }

  /**
   * Verificar se negÃ³cio estÃ¡ nos favoritos
   */
  static async isBusinessFavorited(params: {
    userId: string;
    businessId: string;
  }): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_business_favorited', {
        p_user_id: params.userId,
        p_business_id: params.businessId,
      });

      if (error) {
        logger.error('Failed to check if business is favorited', error, params);
        return false;
      }

      return data === true;
    } catch (error) {
      logger.error('Error in isBusinessFavorited', error);
      return false;
    }
  }

  /**
   * Toggle favorito (adiciona ou remove)
   */
  static async toggleFavorite(params: {
    userId: string;
    businessId: string;
  }): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('toggle_business_favorite', {
        p_user_id: params.userId,
        p_business_id: params.businessId,
      });

      if (error) {
        logger.error('Failed to toggle favorite', error, params);
        throw error;
      }

      const isFavorited = data === true;
      logger.info('Favorite toggled successfully', {
        ...params,
        isFavorited,
      });

      return isFavorited;
    } catch (error) {
      logger.error('Error in toggleFavorite', error);
      throw error;
    }
  }

  /**
   * Adicionar aos favoritos
   */
  static async addFavorite(params: {
    userId: string;
    businessId: string;
  }): Promise<{ id: string }> {
    try {
      const { data, error } = await supabase
        .from('user_favorite_businesses')
        .insert({
          user_id: params.userId,
          business_id: params.businessId,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to add favorite', error, params);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from favorite creation');
      }

      logger.info('Favorite added successfully', { favoriteId: data.id });
      return { id: data.id };
    } catch (error) {
      logger.error('Error in addFavorite', error);
      throw error;
    }
  }

  /**
   * Remover dos favoritos
   */
  static async removeFavorite(params: {
    userId: string;
    businessId: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_favorite_businesses')
        .delete()
        .eq('user_id', params.userId)
        .eq('business_id', params.businessId);

      if (error) {
        logger.error('Failed to remove favorite', error, params);
        throw error;
      }

      logger.info('Favorite removed successfully', params);
    } catch (error) {
      logger.error('Error in removeFavorite', error);
      throw error;
    }
  }

  /**
   * Atualizar preferÃªncias de um favorito
   */
  static async updateFavoritePreferences(
    favoriteId: string,
    input: UpdateFavoritePreferencesInput,
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_favorite_businesses')
        .update({
          notify_on_promotions: input.notify_on_promotions,
          notify_on_new_items: input.notify_on_new_items,
          notes: input.notes,
          tags: input.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', favoriteId);

      if (error) {
        logger.error('Failed to update favorite preferences', error, {
          favoriteId,
          input,
        });
        throw error;
      }

      logger.info('Favorite preferences updated successfully', { favoriteId });
    } catch (error) {
      logger.error('Error in updateFavoritePreferences', error);
      throw error;
    }
  }

  /**
   * Obter contador de favoritos de um negÃ³cio
   */
  static async getBusinessFavoritesCount(businessId: string): Promise<number> {
    if (!UUID_REGEX.test(businessId)) {
      return 0;
    }

    try {
      const { data, error } = await supabase.rpc('get_business_favorites_count', {
        p_business_id: businessId,
      });

      if (error) {
        logger.error('Failed to get business favorites count', error, {
          businessId,
        });
        return 0;
      }

      return data || 0;
    } catch (error) {
      logger.error('Error in getBusinessFavoritesCount', error);
      return 0;
    }
  }

  /**
   * Buscar favoritos por tags
   */
  static async searchFavoritesByTags(params: {
    userId: string;
    tags: string[];
  }): Promise<FavoriteBusiness[]> {
    try {
      const { data, error } = await supabase
        .from('user_favorite_businesses')
        .select(
          `
          id,
          business_id,
          notify_on_promotions,
          notify_on_new_items,
          notes,
          tags,
          created_at,
          business_data!inner (
            id,
            business_name,
            slug,
            description,
            rating,
            total_reviews,
            is_verified,
            metadata,
            gastronomy_profiles (
              cuisine_type,
              delivery_enabled,
              price_range
            )
          )
        `,
        )
        .eq('user_id', params.userId)
        .contains('tags', params.tags);

      if (error) {
        logger.error('Failed to search favorites by tags', error, params);
        throw error;
      }

      // Transformar dados para o formato esperado
      type TagSearchRow = {
        id: string;
        notify_on_promotions: boolean;
        notify_on_new_items: boolean;
        notes: string | null;
        tags: string[];
        created_at: string;
        business_data: {
          id: string;
          business_name: string;
          slug: string;
          description: string | null;
          rating: number;
          total_reviews: number;
          is_verified: boolean;
          metadata?: {
            logo_url?: string | null;
            banner_url?: string | null;
          } | null;
          gastronomy_profiles?:
            | Array<{
                cuisine_type: string;
                delivery_enabled: boolean;
                price_range: string;
              }>
            | {
              cuisine_type: string;
              delivery_enabled: boolean;
              price_range: string;
            };
        };
      };

      const favorites: FavoriteBusiness[] = (((data as unknown) as TagSearchRow[]) || []).map((item) => {
        const profile = Array.isArray(item.business_data.gastronomy_profiles)
          ? item.business_data.gastronomy_profiles[0]
          : item.business_data.gastronomy_profiles;
        return ({
        favorite_id: item.id,
        business_id: item.business_data.id,
        business_name: item.business_data.business_name,
        business_slug: item.business_data.slug,
        business_description: item.business_data.description,
        business_logo_url: item.business_data.metadata?.logo_url ?? null,
        business_banner_url: item.business_data.metadata?.banner_url ?? null,
        business_rating: item.business_data.rating,
        business_total_reviews: item.business_data.total_reviews,
        business_is_verified: item.business_data.is_verified,
        business_geographic_path: null, // nÃ£o disponÃ­vel nesta query
        cuisine_type: profile?.cuisine_type ?? null,
        delivery_enabled: profile?.delivery_enabled ?? null,
        price_range: profile?.price_range ?? null,
        notify_on_promotions: item.notify_on_promotions,
        notify_on_new_items: item.notify_on_new_items,
        notes: item.notes,
        tags: item.tags,
        favorited_at: item.created_at,
      });
      });

      return favorites;
    } catch (error) {
      logger.error('Error in searchFavoritesByTags', error);
      throw error;
    }
  }
}



