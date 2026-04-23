import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BusinessRecommendationService {
  static async isRecommendedByUser(
    businessId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      if (!UUID_REGEX.test(businessId) || !UUID_REGEX.test(userId)) {
        return false;
      }

      const { data, error } = await supabase.rpc('is_business_recommended', {
        p_business_id: businessId,
        p_user_id: userId,
      });

      if (error) {
        logger.error('[BusinessRecommendationService] Failed to check recommendation', error, {
          businessId,
          userId,
        });
        return false;
      }

      return data === true;
    } catch (error) {
      logger.error('[BusinessRecommendationService] Error in isRecommendedByUser', error);
      return false;
    }
  }

  static async toggleRecommendation(
    businessId: string,
    userId: string,
  ): Promise<boolean> {
    if (!UUID_REGEX.test(businessId) || !UUID_REGEX.test(userId)) {
      throw new Error('IDs invalidos para recomendacao');
    }

    const { data, error } = await supabase.rpc('toggle_business_recommendation', {
      p_business_id: businessId,
      p_user_id: userId,
    });

    if (error) {
      logger.error('[BusinessRecommendationService] Failed to toggle recommendation', error, {
        businessId,
        userId,
      });
      throw error;
    }

    return data === true;
  }
}
