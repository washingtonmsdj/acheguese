import { supabase } from "@/core/infrastructure/supabase";

export interface CreateRideRatingInput {
  rideId: string;
  raterId: string;
  ratedId: string;
  rating: number;
  comment?: string | null;
}

export class RideRatingService {
  static async upsert(input: CreateRideRatingInput): Promise<void> {
    const { error } = await supabase.from("ride_ratings").upsert(
      {
        ride_id: input.rideId,
        rater_id: input.raterId,
        rated_id: input.ratedId,
        rating: input.rating,
        comment: input.comment || null,
      },
      { onConflict: "ride_id,rater_id" },
    );

    if (error) throw error;
  }
}


