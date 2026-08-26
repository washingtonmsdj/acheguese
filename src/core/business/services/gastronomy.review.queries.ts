/**
 * Review Query Service - operacoes de reviews para Gastronomia.
 *
 * Opera na tabela canonica e e o SSOT para reviews de Gastronomia.
 */

import { logger } from "@/shared/utils/logger";
import { BusinessReviewService } from "@/core/business/services/BusinessReviewService";
import { ReviewEngagementService } from "@/core/reviews/services/ReviewEngagementService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";

// Read shape exposed by the business review projection.

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
  reason: "spam" | "offensive" | "fake" | "inappropriate" | "other";
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
      const limit = Math.min(Math.max(Math.trunc(params.limit ?? 20), 1), 100);
      const offset = Math.max(Math.trunc(params.offset ?? 0), 0);
      const fetchLimit = Math.min(limit + offset, 100);
      const reviews = await ReviewsService.getReviewsForProfile(
        params.businessProfileId,
        "business",
        fetchLimit,
      );

      return reviews.slice(offset, offset + limit).map((review) => ({
        id: review.id,
        reviewer_profile_id: review.reviewer_profile_id,
        reviewer_name: review.reviewer_profile?.name || "Usuário",
        reviewer_avatar: review.reviewer_profile?.avatar_url ?? null,
        rating: review.rating,
        comment: review.comment,
        photos: review.photos,
        business_response: review.business_response,
        business_response_at: review.business_response_at,
        order_id: review.order_id,
        helpful_count: review.helpful_count,
        not_helpful_count: review.not_helpful_count,
        created_at: review.created_at,
        is_verified: review.order_id !== null,
      }));
    } catch (error) {
      logger.error("Error in getBusinessReviews", error, {
        businessProfileId: params.businessProfileId,
      });
      throw error;
    }
  }

  /**
   *  Verificar se usuario pode avaliar um negocio
   */
  static async canUserReviewBusiness(params: {
    userId: string;
    businessProfileId: string;
    reviewerProfileId?: string | null;
  }): Promise<boolean> {
    try {
      void params.userId;
      return await BusinessReviewService.canUserReviewBusiness(
        params.businessProfileId,
        params.reviewerProfileId,
      );
    } catch (error) {
      logger.error("Error in canUserReviewBusiness", error);
      return false;
    }
  }

  /**
   *  Criar avaliao
   */
  static async createReview(input: CreateReviewInput): Promise<{ id: string }> {
    try {
      const review = await BusinessReviewService.createReview(input);
      logger.info("Review created successfully", { reviewId: review.id });
      return review;
    } catch (error) {
      logger.error("Error in createReview", error);
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
      await BusinessReviewService.updateReview(reviewId, input);
      logger.info("Review updated successfully", { reviewId });
    } catch (error) {
      logger.error("Error in updateReview", error);
      throw error;
    }
  }

  /**
   *  Deletar avaliao
   */
  static async deleteReview(reviewId: string): Promise<void> {
    try {
      await BusinessReviewService.deleteReview(reviewId);
      logger.info("Review deleted successfully", { reviewId });
    } catch (error) {
      logger.error("Error in deleteReview", error);
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
      await BusinessReviewService.addBusinessResponse(reviewId, input);
      logger.info("Business response added successfully", { reviewId });
    } catch (error) {
      logger.error("Error in addBusinessResponse", error);
      throw error;
    }
  }

  /**
   *  Denunciar avaliao
   */
  static async reportReview(input: ReportReviewInput): Promise<{ id: string }> {
    try {
      const report = await ReviewEngagementService.reportReview({
        reviewId: input.review_id,
        reason: input.reason,
        description: input.description,
      });
      logger.info("Review reported successfully", { reportId: report.id });
      return report;
    } catch (error) {
      logger.error("Error in reportReview", error);
      throw error;
    }
  }

  /**
   *  Votar em avaliao (til/no til)
   */
  static async voteReview(input: VoteReviewInput): Promise<void> {
    try {
      await ReviewEngagementService.setHelpfulness({
        reviewId: input.review_id,
        voterProfileId: input.voter_profile_id,
        isHelpful: input.is_helpful,
      });
      logger.info("Review vote recorded successfully", input);
    } catch (error) {
      logger.error("Error in voteReview", error);
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
      return await ReviewEngagementService.getCurrentHelpfulness(
        params.reviewId,
        params.voterProfileId,
      );
    } catch (error) {
      logger.error("Error in getUserReviewVote", error);
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
      const stats = await ReviewsService.getReviewStats(
        businessProfileId,
        "business",
      );

      return {
        total: stats.total,
        average: stats.average,
        distribution: stats.distribution,
      };
    } catch (error) {
      logger.error("Error in getBusinessReviewStats", error, {
        businessProfileId,
      });
      throw error;
    }
  }
}
