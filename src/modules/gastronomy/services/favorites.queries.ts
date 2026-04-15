// @ts-nocheck
/**
 * Favorites Query Service — operações de favoritos de gastronomia
 *
 * Usa a tabela `user_favorite_businesses` criada pela migration 20260412000002.
 * É distinta de:
 *   - `profile_favorites_new` (core/favorites — favoritos entre perfis)
 *   - `business_favorites` (core/favorites — tabela legada de business)
 *
 * Esta tabela é específica para o relacionamento user → business_data
 * com campos extras (tags, notas, preferências de notificação).
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

export interface FavoriteBusiness {
  favorite_id: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_description: string | null;
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

export class FavoritesQueryService {
  /**
   * Obter favoritos do usuário
   */
  static async getUserFavorites(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<FavoriteBusiness[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_favorite_businesses', {
        p_user_id: params.userId,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0,
      });

      if (error) {
        logger.error('Failed to fetch user favorites', error, {
          userId: params.userId,
        });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getUserFavorites', error);
      throw error;
    }
  }

  /**
   * Verificar se negócio está nos favoritos
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
   * Atualizar preferências de um favorito
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
   * Obter contador de favoritos de um negócio
   */
  static async getBusinessFavoritesCount(businessId: string): Promise<number> {
    // Validar UUID antes de chamar o banco (evita 400 com IDs de mock)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
            name,
            slug,
            description,
            banner_url,
            rating,
            total_reviews,
            is_verified,
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
          name: string;
          slug: string;
          description: string | null;
          banner_url: string | null;
          rating: number;
          total_reviews: number;
          is_verified: boolean;
          gastronomy_profiles?: Array<{
            cuisine_type: string;
            delivery_enabled: boolean;
            price_range: string;
          }>;
        };
      };

      const favorites: FavoriteBusiness[] = (data as TagSearchRow[] || []).map((item) => ({
        favorite_id: item.id,
        business_id: item.business_data.id,
        business_name: item.business_data.name,
        business_slug: item.business_data.slug,
        business_description: item.business_data.description,
        business_banner_url: item.business_data.banner_url,
        business_rating: item.business_data.rating,
        business_total_reviews: item.business_data.total_reviews,
        business_is_verified: item.business_data.is_verified,
        business_geographic_path: null, // não disponível nesta query
        cuisine_type: item.business_data.gastronomy_profiles?.[0]?.cuisine_type ?? null,
        delivery_enabled: item.business_data.gastronomy_profiles?.[0]?.delivery_enabled ?? null,
        price_range: item.business_data.gastronomy_profiles?.[0]?.price_range ?? null,
        notify_on_promotions: item.notify_on_promotions,
        notify_on_new_items: item.notify_on_new_items,
        notes: item.notes,
        tags: item.tags,
        favorited_at: item.created_at,
      }));

      return favorites;
    } catch (error) {
      logger.error('Error in searchFavoritesByTags', error);
      throw error;
    }
  }
}
