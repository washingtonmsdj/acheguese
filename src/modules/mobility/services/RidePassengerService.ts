import { mobilityService } from "@/modules/mobility/services/MobilityService.impl";

export class RidePassengerService {
  static async confirmRideCompletion(
    rideId: string,
    passengerProfileId: string,
  ): Promise<void> {
    await mobilityService.confirmRideCompletionByPassenger(rideId, passengerProfileId);
  }
}

