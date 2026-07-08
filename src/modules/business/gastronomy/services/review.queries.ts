/**
 * Review Query Service - operacoes de reviews para Gastronomia.
 *
 * Opera na tabela canonica e e o SSOT para reviews de Gastronomia.
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { REPORT_STATUS } from '@/shared/types/constants';
import { EntityStatus } from '@/shared/types/enums';
import { BusinessReviewsRpcService } from './BusinessReviewsRpcService';

// Types estendidos da tabela canonica `reviews`
//  Estende o tipo base de @/shared/types/reviews com os campos adicionados
//  pela migration 20260412000001 (especficos de gastronomia).

export interface Review {
  id: string;
  reviewer_profile_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string | null;
  //  Campos adicionados pela migration 20260412000001
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
   *  Obter avaliacoes de um negocio
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
   *  Verificar se usuario pode avaliar um negocio
   */
  static async canUserReviewBusiness(params: {
    userId: string;
    businessProfileId: string;
  }): Promise<boolean> {
    try {
      void params.userId;
      return await BusinessReviewsRpcService.canUserReviewBusiness(params.businessProfileId);
    } catch (error) {
      logger.error('Error in canUserReviewBusiness', error);
      return false;
    }
  }

  /**
   *  Criar avaliao
   */
  static async createReview(input: CreateReviewInput): Promise<{ id: string }> {
    try {
      const review = await BusinessReviewsRpcService.createReview(input);
      logger.info('Review created successfully', { reviewId: review.id });
      return review;
    } catch (error) {
      logger.error('Error in createReview', error);
      throw error;
    }
  }

  /**
   *  Atualizar avaliao
   */
  static async updateReview(
    reviewId: string,
    input: UpdateReviewInput,
  ): Promise<void> {
    try {
      await BusinessReviewsRpcService.updateReview(reviewId, input);
      logger.info('Review updated successfully', { reviewId });
    } catch (error) {
      logger.error('Error in updateReview', error);
      throw error;
    }
  }

  /**
   *  Deletar avaliao
   */
  static async deleteReview(reviewId: string): Promise<void> {
    try {
      await BusinessReviewsRpcService.deleteReview(reviewId);
      logger.info('Review deleted successfully', { reviewId });
    } catch (error) {
      logger.error('Error in deleteReview', error);
      throw error;
    }
  }

  /**
   *  Adicionar resposta do estabelecimento
   */
  static async addBusinessResponse(
    reviewId: string,
    input: BusinessResponseInput,
  ): Promise<void> {
    try {
      await BusinessReviewsRpcService.addBusinessResponse(reviewId, input);
      logger.info('Business response added successfully', { reviewId });
    } catch (error) {
      logger.error('Error in addBusinessResponse', error);
      throw error;
    }
  }

  /**
   *  Denunciar avaliao
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
   *  Votar em avaliao (til/no til)
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
   *  Obter voto do usuario em uma avaliao
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
   *  Obter Estatisticas de avaliacoes de um negocio
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

      //  Garantir que todas as estrelas estejam no objeto
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
