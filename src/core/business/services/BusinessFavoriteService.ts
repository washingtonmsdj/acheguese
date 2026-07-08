import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BusinessFavoriteService {
  static async getUserFavoriteBusinessIds(userId: string): Promise<string[]> {
    try {
      if (!UUID_REGEX.test(userId)) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_favorite_businesses')
        .select('business_id')
        .eq('user_id', userId);

      if (error) {
        logger.error('[BusinessFavoriteService] Failed to list favorites', error, {
          userId,
        });
        return [];
      }

      return (data ?? [])
        .map((item) => item.business_id)
        .filter((businessId): businessId is string => UUID_REGEX.test(businessId));
    } catch (error) {
      logger.error('[BusinessFavoriteService] Error in getUserFavoriteBusinessIds', error);
      return [];
    }
  }

  static async isFavoritedByUser(
    businessDataId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      if (!UUID_REGEX.test(businessDataId) || !UUID_REGEX.test(userId)) {
        return false;
      }

      const { data, error } = await supabase.rpc('is_business_favorited', {
        p_business_id: businessDataId,
        p_user_id: userId,
      });

      if (error) {
        logger.error('[BusinessFavoriteService] Failed to check favorite', error, {
          businessDataId,
          userId,
        });
        return false;
      }

      return data === true;
    } catch (error) {
      logger.error('[BusinessFavoriteService] Error in isFavoritedByUser', error);
      return false;
    }
  }

  static async toggleFavorite(
    businessDataId: string,
    userId: string,
  ): Promise<boolean> {
    if (!UUID_REGEX.test(businessDataId) || !UUID_REGEX.test(userId)) {
      throw new Error('IDs invalidos para favorito');
    }

    const { data, error } = await supabase.rpc('toggle_business_favorite', {
      p_business_id: businessDataId,
      p_user_id: userId,
    });

    if (error) {
      logger.error('[BusinessFavoriteService] Failed to toggle favorite', error, {
        businessDataId,
        userId,
      });
      throw error;
    }

    return data === true;
  }
}
