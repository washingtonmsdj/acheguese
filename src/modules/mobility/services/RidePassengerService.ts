import { supabase } from "@/integrations/supabase";

export class RidePassengerService {
  static async confirmRideCompletion(
    rideId: string,
    passengerProfileId: string,
  ): Promise<void> {
    const now = new Date().toISOString();

    const { error } = await (supabase as any)
      .from("ride_requests")
      .update({
        passenger_confirmed_at: now,
        updated_at: now,
      })
      .eq("id", rideId)
      .eq("passenger_profile_id", passengerProfileId);

    if (error) {
      throw error;
    }
  }
}

