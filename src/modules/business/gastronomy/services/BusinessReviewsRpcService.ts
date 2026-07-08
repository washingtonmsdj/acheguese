import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type {
  BusinessResponseInput,
  CreateReviewInput,
  Review,
  UpdateReviewInput,
} from "./review.queries";

type BusinessReviewsRpcAction =
  | "canUserReviewBusiness"
  | "createReview"
  | "updateReview"
  | "deleteReview"
  | "addBusinessResponse";

interface CanReviewBrokerData {
  canReview: boolean;
}

interface CreateReviewBrokerData {
  id: string;
  review: Review;
}

interface ReviewBrokerData {
  review: Review;
}

interface DeleteReviewBrokerData {
  deleted: boolean;
}

const FUNCTION_NAME = "business-reviews-rpc";
const SERVICE_NAME = "BusinessReviewsRpcService";

export class BusinessReviewsRpcService {
  private static async invoke<T>(
    action: BusinessReviewsRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    return invokeSupabaseBroker<T, BusinessReviewsRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Business reviews broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async canUserReviewBusiness(businessProfileId: string): Promise<boolean> {
    const result = await this.invoke<CanReviewBrokerData>("canUserReviewBusiness", {
      businessProfileId,
    });
    return result.canReview === true;
  }

  static async createReview(input: CreateReviewInput): Promise<{ id: string }> {
    const result = await this.invoke<CreateReviewBrokerData>("createReview", {
      reviewedProfileId: input.reviewed_profile_id,
      reviewerProfileId: input.reviewer_profile_id,
      rating: input.rating,
      comment: input.comment,
      photos: input.photos,
      orderId: input.order_id,
    });
    return { id: result.id || result.review.id };
  }

  static async updateReview(reviewId: string, input: UpdateReviewInput): Promise<void> {
    await this.invoke<ReviewBrokerData>("updateReview", {
      reviewId,
      rating: input.rating,
      comment: input.comment,
      photos: input.photos,
    });
  }

  static async deleteReview(reviewId: string): Promise<void> {
    const result = await this.invoke<DeleteReviewBrokerData>("deleteReview", { reviewId });
    if (!result.deleted) {
      throw new Error("Review was not deleted");
    }
  }

  static async addBusinessResponse(
    reviewId: string,
    input: BusinessResponseInput,
  ): Promise<void> {
    await this.invoke<ReviewBrokerData>("addBusinessResponse", {
      reviewId,
      businessResponse: input.business_response,
    });
  }
}
