import { supabase } from "@/integrations/supabase";

export interface CreateRideRatingInput {
  rideId: string;
  rating: number;
  comment?: string | null;
  behaviorRating?: number | null;
  punctualityRating?: number | null;
  paymentRating?: number | null;
}

export interface RideRatingCommandResult {
  ratingId: string;
  trustEventId: string;
}

export interface RideRatingSummary {
  profileId: string;
  averageRating: number;
  totalRatings: number;
}

function asCommandResult(value: unknown): RideRatingCommandResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Resposta invalida do comando de avaliacao.");
  }

  const result = value as Record<string, unknown>;
  if (
    typeof result.ratingId !== "string" ||
    typeof result.trustEventId !== "string"
  ) {
    throw new Error("Resposta incompleta do comando de avaliacao.");
  }
  return {
    ratingId: result.ratingId,
    trustEventId: result.trustEventId,
  };
}

export class RideRatingService {
  static async upsert(
    input: CreateRideRatingInput,
  ): Promise<RideRatingCommandResult> {
    const { data, error } = await supabase.rpc("submit_ride_rating", {
      p_ride_id: input.rideId,
      p_rating: input.rating,
      p_comment: input.comment?.trim() || null,
      p_behavior_rating: input.behaviorRating ?? null,
      p_punctuality_rating: input.punctualityRating ?? null,
      p_payment_rating: input.paymentRating ?? null,
    });

    if (error) throw error;
    return asCommandResult(data);
  }

  static async getSummary(profileId: string): Promise<RideRatingSummary> {
    const { data, error } = await supabase.rpc("get_ride_rating_summary", {
      p_profile_id: profileId,
    });
    if (error) throw error;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Resumo de avaliacoes indisponivel.");
    }

    const summary = data as Record<string, unknown>;
    return {
      profileId:
        typeof summary.profile_id === "string" ? summary.profile_id : profileId,
      averageRating: Number(summary.average_rating) || 0,
      totalRatings: Number(summary.total_ratings) || 0,
    };
  }
}
