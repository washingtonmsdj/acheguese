import { BusinessFavoriteService } from '@/core/business/services/BusinessFavoriteService';
import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import { isValidUUID } from '@/shared/utils/validation';

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
  notes?: string | null;
  tags?: string[] | null;
}

interface FavoriteBusinessDataRow {
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
}

interface FavoriteGastronomyProfileRow {
  business_id: string;
  cuisine_type: string | null;
  delivery_enabled: boolean | null;
  price_range: string | null;
}

interface ListFavoriteBusinessesInput {
  limit?: number;
  offset?: number;
  tags?: string[];
}

export class FavoritesQueryService {
  private static async composeCurrentUserFavorites(
    input: ListFavoriteBusinessesInput,
  ): Promise<FavoriteBusiness[]> {
    const favoriteRows = await BusinessFavoriteService.listCurrentUserFavorites(input);
    if (favoriteRows.length === 0) return [];

    const businessIds = favoriteRows.map((favorite) => favorite.business_id);
    const [businessResult, gastronomyResult] = await Promise.all([
      supabase
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
        .eq('status', 'active'),
      supabase
        .from('gastronomy_profiles')
        .select('business_id, cuisine_type, delivery_enabled, price_range')
        .in('business_id', businessIds),
    ]);

    if (businessResult.error) throw businessResult.error;
    if (gastronomyResult.error) throw gastronomyResult.error;

    const businessRows =
      (businessResult.data as FavoriteBusinessDataRow[] | null) ?? [];
    const gastronomyRows =
      (gastronomyResult.data as FavoriteGastronomyProfileRow[] | null) ?? [];
    const businessById = new Map(businessRows.map((business) => [business.id, business]));
    const gastronomyByBusinessId = new Map(
      gastronomyRows.map((profile) => [profile.business_id, profile]),
    );

    return favoriteRows
      .map((favorite) => {
        const business = businessById.get(favorite.business_id);
        if (!business) return null;

        const gastronomy = gastronomyByBusinessId.get(favorite.business_id);
        return {
          favorite_id: favorite.id,
          business_id: business.id,
          business_name: business.business_name ?? '',
          business_slug: business.slug ?? '',
          business_description: business.description,
          business_logo_url: business.metadata?.logo_url ?? null,
          business_banner_url: business.metadata?.banner_url ?? null,
          business_rating: business.rating ?? 0,
          business_total_reviews: business.total_reviews ?? 0,
          business_is_verified: business.is_verified ?? false,
          business_geographic_path: business.location?.geographic_path ?? null,
          cuisine_type: gastronomy?.cuisine_type ?? null,
          delivery_enabled: gastronomy?.delivery_enabled ?? null,
          price_range: gastronomy?.price_range ?? null,
          notify_on_promotions: favorite.notify_on_promotions,
          notify_on_new_items: favorite.notify_on_new_items,
          notes: favorite.notes,
          tags: favorite.tags ?? [],
          favorited_at: favorite.created_at,
        } satisfies FavoriteBusiness;
      })
      .filter((favorite): favorite is FavoriteBusiness => favorite !== null);
  }

  static async getCurrentUserFavorites(
    input: ListFavoriteBusinessesInput = {},
  ): Promise<FavoriteBusiness[]> {
    try {
      return await this.composeCurrentUserFavorites(input);
    } catch (error) {
      logger.error('[FavoritesQueryService] Failed to list favorites', error);
      throw error;
    }
  }

  static async isBusinessFavorited(businessId: string): Promise<boolean> {
    if (!isValidUUID(businessId)) return false;

    try {
      return await BusinessFavoriteService.isFavorited(businessId);
    } catch (error) {
      logger.error('[FavoritesQueryService] Failed to read favorite state', error, {
        businessId,
      });
      throw error;
    }
  }

  static async setFavorite(
    businessId: string,
    favorited: boolean,
  ): Promise<boolean> {
    try {
      return await BusinessFavoriteService.setFavorite(businessId, favorited);
    } catch (error) {
      logger.error('[FavoritesQueryService] Failed to set favorite state', error, {
        businessId,
        favorited,
      });
      throw error;
    }
  }

  static async updateFavoritePreferences(
    favoriteId: string,
    input: UpdateFavoritePreferencesInput,
  ): Promise<void> {
    await BusinessFavoriteService.updatePreferences(favoriteId, {
      notifyOnPromotions: input.notify_on_promotions,
      notifyOnNewItems: input.notify_on_new_items,
      ...(Object.prototype.hasOwnProperty.call(input, 'notes')
        ? { notes: input.notes }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(input, 'tags')
        ? { tags: input.tags }
        : {}),
    });
  }

  static async getBusinessFavoritesCount(businessId: string): Promise<number> {
    try {
      return await BusinessFavoriteService.getFavoritesCount(businessId);
    } catch (error) {
      logger.error('[FavoritesQueryService] Failed to read favorite count', error, {
        businessId,
      });
      throw error;
    }
  }
}
