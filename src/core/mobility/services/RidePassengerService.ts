import { MobilityRpcService } from "@/core/mobility/services/MobilityRpcService";

export class RidePassengerService {
  static async confirmRideCompletion(rideId: string): Promise<void> {
    const result = await MobilityRpcService.confirmPassengerCompletion(rideId);
    if (result.success !== true) {
      throw new Error(
        `Passenger completion confirmation was not applied${result.reason ? `: ${result.reason}` : ""}`,
      );
    }
  }
}
