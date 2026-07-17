import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type {
  ReviewHelpfulnessVote,
  ReviewReportReason,
} from "../types";

export interface ReportReviewInput {
  reviewId: string;
  reason: ReviewReportReason;
  description?: string;
}

export interface SetReviewHelpfulnessInput {
  reviewId: string;
  voterProfileId: string;
  isHelpful: boolean;
}

export class ReviewEngagementService {
  static async reportReview(input: ReportReviewInput): Promise<{ id: string }> {
    const { data, error } = await supabase.rpc("create_review_report", {
      p_description: input.description?.trim() || undefined,
      p_reason: input.reason,
      p_review_id: input.reviewId,
    });

    if (error) {
      logger.error("ReviewEngagementService.reportReview", error, {
        reviewId: input.reviewId,
        reason: input.reason,
      });
      throw error;
    }
    if (!data?.id) throw new Error("Review report command returned no id");
    return { id: data.id };
  }

  static async setHelpfulness(
    input: SetReviewHelpfulnessInput,
  ): Promise<ReviewHelpfulnessVote> {
    const { data, error } = await supabase.rpc("set_review_helpfulness", {
      p_is_helpful: input.isHelpful,
      p_review_id: input.reviewId,
      p_voter_profile_id: input.voterProfileId,
    });

    if (error) {
      logger.error("ReviewEngagementService.setHelpfulness", error, {
        reviewId: input.reviewId,
      });
      throw error;
    }
    if (!data || typeof data !== "object") {
      throw new Error("Review helpfulness command returned no vote");
    }

    return data as unknown as ReviewHelpfulnessVote;
  }

  static async getCurrentHelpfulness(
    reviewId: string,
    voterProfileId: string,
  ): Promise<boolean | null> {
    const { data, error } = await supabase.rpc(
      "get_current_review_helpfulness",
      {
        p_review_id: reviewId,
        p_voter_profile_id: voterProfileId,
      },
    );

    if (error) {
      logger.error("ReviewEngagementService.getCurrentHelpfulness", error, {
        reviewId,
      });
      throw error;
    }
    return data ?? null;
  }
}
