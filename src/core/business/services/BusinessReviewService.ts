import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export interface BusinessReviewCreateInput {
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
  photos?: string[];
  order_id?: string;
}

export interface BusinessReviewUpdateInput {
  rating?: number;
  comment?: string;
  photos?: string[];
}

export interface BusinessReviewResponseInput {
  business_response: string;
}

type BusinessReviewAction =
  | "canUserReviewBusiness"
  | "createReview"
  | "updateReview"
  | "deleteReview"
  | "addBusinessResponse";

interface CanReviewBrokerData {
  canReview: boolean;
}

interface ReviewBrokerData {
  review: { id: string };
}

interface CreateReviewBrokerData extends ReviewBrokerData {
  id: string;
}

interface DeleteReviewBrokerData {
  deleted: boolean;
}

const FUNCTION_NAME = "business-reviews-rpc";
const SERVICE_NAME = "BusinessReviewService";

export class BusinessReviewService {
  private static invoke<T>(
    action: BusinessReviewAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    return invokeSupabaseBroker<T, BusinessReviewAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Business reviews broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async canUserReviewBusiness(
    businessProfileId: string,
    reviewerProfileId?: string | null,
  ): Promise<boolean> {
    const result = await this.invoke<CanReviewBrokerData>(
      "canUserReviewBusiness",
      {
        businessProfileId,
        reviewerProfileId: reviewerProfileId ?? undefined,
      },
    );
    return result.canReview === true;
  }

  static async createReview(
    input: BusinessReviewCreateInput,
  ): Promise<{ id: string }> {
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

  static async updateReview(
    reviewId: string,
    input: BusinessReviewUpdateInput,
  ): Promise<void> {
    await this.invoke<ReviewBrokerData>("updateReview", {
      reviewId,
      rating: input.rating,
      comment: input.comment,
      photos: input.photos,
    });
  }

  static async deleteReview(reviewId: string): Promise<void> {
    const result = await this.invoke<DeleteReviewBrokerData>("deleteReview", {
      reviewId,
    });
    if (!result.deleted) throw new Error("Review was not deleted");
  }

  static async addBusinessResponse(
    reviewId: string,
    input: BusinessReviewResponseInput,
  ): Promise<void> {
    await this.invoke<ReviewBrokerData>("addBusinessResponse", {
      reviewId,
      businessResponse: input.business_response,
    });
  }
}
