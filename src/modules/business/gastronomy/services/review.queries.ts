/**
 * Review Query Service â€” operaÃ§Ãµes de reviews para gastronomia
 *
 * Usa a tabela canÃ´nica `reviews` (schema base) com as colunas
 * adicionadas pela migration 20260412000001 (photos, status, helpful_count, etc.)
 *
 * O core/reviews usa tabelas legadas (business_reviews_new) â€” este serviÃ§o
 * opera na tabela canÃ´nica e Ã© o SSOT para reviews de gastronomia.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import { REPORT_STATUS } from '@/shared/types/constants';
import { EntityStatus } from '@/shared/types/enums';
const rpcDb = supabase as any;

// â”€â”€ Tipos estendidos da tabela canÃ´nica `reviews` â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Estende o tipo base de @/shared/types/reviews com os campos adicionados
// pela migration 20260412000001 (especÃ­ficos de gastronomia).

export interface Review {
  id: string;
  reviewer_profile_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string | null;
  // Campos adicionados pela migration 20260412000001
  photos: string[];
  business_response: string | null;
  business_response_at: string | null;
  order_id: string | null;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  is_verified: boolean;
}

export interface CreateReviewInput {
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
  photos?: string[];
  order_id?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
  photos?: string[];
}

export interface BusinessResponseInput {
  business_response: string;
}

export interface ReportReviewInput {
  review_id: string;
  reporter_profile_id: string;
  reason: 'spam' | 'offensive' | 'fake' | 'inappropriate' | 'other';
  description?: string;
}

export interface VoteReviewInput {
  review_id: string;
  voter_profile_id: string;
  is_helpful: boolean;
}

export class ReviewQueryService {
  /**
   * Obter avaliaÃ§Ãµes de um negÃ³cio
   */
  static async getBusinessReviews(params: {
    businessProfileId: string;
    limit?: number;
    offset?: number;
  }): Promise<Review[]> {
    try {
      const { data, error } = await supabase.rpc('get_business_reviews', {
        p_business_profile_id: params.businessProfileId,
        p_limit: params.limit ?? 20,
        p_offset: params.offset ?? 0,
      });

      if (error) {
        logger.error('Failed to fetch business reviews', error, {
          businessProfileId: params.businessProfileId,
        });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getBusinessReviews', error);
      throw error;
    }
  }

  /**
   * Verificar se usuÃ¡rio pode avaliar um negÃ³cio
   */
  static async canUserReviewBusiness(params: {
    userId: string;
    businessProfileId: string;
  }): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_user_review_business', {
        p_user_id: params.userId,
        p_business_profile_id: params.businessProfileId,
      });

      if (error) {
        logger.error('Failed to check if user can review', error, params);
        return false;
      }

      return data === true;
    } catch (error) {
      logger.error('Error in canUserReviewBusiness', error);
      return false;
    }
  }

  /**
   * Criar avaliaÃ§Ã£o
   */
  static async createReview(input: CreateReviewInput): Promise<{ id: string }> {
    try {
      const { data, error } = await rpcDb.rpc('create_business_review', {
        p_reviewed_profile_id: input.reviewed_profile_id,
        p_reviewer_profile_id: input.reviewer_profile_id,
        p_rating: input.rating,
        p_comment: input.comment || null,
        p_photos: input.photos || [],
        p_order_id: input.order_id || null,
      });

      if (error) {
        logger.error('Failed to create review', error, input);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from review creation');
      }

      const reviewData = (data ?? {}) as { id?: string; review_id?: string };
      logger.info('Review created successfully', { reviewId: reviewData.id ?? reviewData.review_id });
      return { id: reviewData.id ?? reviewData.review_id ?? '' };
    } catch (error) {
      logger.error('Error in createReview', error);
      throw error;
    }
  }

  /**
   * Atualizar avaliaÃ§Ã£o
   */
  static async updateReview(
    reviewId: string,
    input: UpdateReviewInput,
  ): Promise<void> {
    try {
      const { error } = await rpcDb.rpc('update_business_review', {
        p_review_id: reviewId,
        p_rating: input.rating ?? null,
        p_comment: input.comment ?? null,
        p_photos: input.photos ?? null,
      });

      if (error) {
        logger.error('Failed to update review', error, { reviewId, input });
        throw error;
      }

      logger.info('Review updated successfully', { reviewId });
    } catch (error) {
      logger.error('Error in updateReview', error);
      throw error;
    }
  }

  /**
   * Deletar avaliaÃ§Ã£o
   */
  static async deleteReview(reviewId: string): Promise<void> {
    try {
      const { error } = await rpcDb.rpc('delete_business_review', {
        p_review_id: reviewId,
      });

      if (error) {
        logger.error('Failed to delete review', error, { reviewId });
        throw error;
      }

      logger.info('Review deleted successfully', { reviewId });
    } catch (error) {
      logger.error('Error in deleteReview', error);
      throw error;
    }
  }

  /**
   * Adicionar resposta do estabelecimento
   */
  static async addBusinessResponse(
    reviewId: string,
    input: BusinessResponseInput,
  ): Promise<void> {
    try {
      const { error } = await rpcDb.rpc('add_business_review_response', {
        p_review_id: reviewId,
        p_business_response: input.business_response,
      });

      if (error) {
        logger.error('Failed to add business response', error, { reviewId });
        throw error;
      }

      logger.info('Business response added successfully', { reviewId });
    } catch (error) {
      logger.error('Error in addBusinessResponse', error);
      throw error;
    }
  }

  /**
   * Denunciar avaliaÃ§Ã£o
   */
  static async reportReview(input: ReportReviewInput): Promise<{ id: string }> {
    try {
      const { data, error } = await supabase
        .from('review_reports')
        .insert({
          review_id: input.review_id,
          reporter_profile_id: input.reporter_profile_id,
          reason: input.reason,
          description: input.description || null,
          status: REPORT_STATUS.PENDING,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to report review', error, input);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from review report');
      }

      logger.info('Review reported successfully', { reportId: data.id });
      return { id: data.id };
    } catch (error) {
      logger.error('Error in reportReview', error);
      throw error;
    }
  }

  /**
   * Votar em avaliaÃ§Ã£o (Ãºtil/nÃ£o Ãºtil)
   */
  static async voteReview(input: VoteReviewInput): Promise<void> {
    try {
      const { error } = await supabase
        .from('review_helpfulness')
        .upsert(
          {
            review_id: input.review_id,
            voter_profile_id: input.voter_profile_id,
            is_helpful: input.is_helpful,
          },
          {
            onConflict: 'review_id,voter_profile_id',
          },
        );

      if (error) {
        logger.error('Failed to vote on review', error, input);
        throw error;
      }

      logger.info('Review vote recorded successfully', input);
    } catch (error) {
      logger.error('Error in voteReview', error);
      throw error;
    }
  }

  /**
   * Obter voto do usuÃ¡rio em uma avaliaÃ§Ã£o
   */
  static async getUserReviewVote(params: {
    reviewId: string;
    voterProfileId: string;
  }): Promise<boolean | null> {
    try {
      const { data, error } = await supabase
        .from('review_helpfulness')
        .select('is_helpful')
        .eq('review_id', params.reviewId)
        .eq('voter_profile_id', params.voterProfileId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to get user review vote', error, params);
        return null;
      }

      return data?.is_helpful ?? null;
    } catch (error) {
      logger.error('Error in getUserReviewVote', error);
      return null;
    }
  }

  /**
   * Obter estatÃ­sticas de avaliaÃ§Ãµes de um negÃ³cio
   */
  static async getBusinessReviewStats(businessProfileId: string): Promise<{
    total: number;
    average: number;
    distribution: Record<number, number>;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_business_reviews', {
        p_business_profile_id: businessProfileId,
        p_limit: 500,
        p_offset: 0,
      });

      if (error) {
        logger.error('Failed to get review stats', error, { businessProfileId });
        throw error;
      }

      const reviews = Array.isArray(data) ? data : [];
      const total = reviews.length;

      if (total === 0) {
        return {
          total: 0,
          average: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const sum = reviews.reduce((acc, r) => {
        const rating = Number(r?.rating ?? 0);
        return acc + (Number.isFinite(rating) ? rating : 0);
      }, 0);
      const average = sum / total;

      const distribution = reviews.reduce(
        (acc, r) => {
          const rating = Number(r?.rating ?? 0);
          const normalizedRating = Math.max(1, Math.min(5, Math.round(rating)));
          const currentCount = acc.get(normalizedRating) ?? 0;
          acc.set(normalizedRating, currentCount + 1);
          return acc;
        },
        new Map<number, number>(),
      );

      // Garantir que todas as estrelas estejam no objeto
      for (let i = 1; i <= 5; i++) {
        if (!distribution.has(i)) {
          distribution.set(i, 0);
        }
      }

      return {
        total,
        average,
        distribution: Object.fromEntries(distribution.entries()) as Record<number, number>,
      };
    } catch (error) {
      logger.error('Error in getBusinessReviewStats', error);
      throw error;
    }
  }
}



