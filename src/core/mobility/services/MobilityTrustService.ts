import {
  OperationalTrustCommandService,
  type OperationalTrustFeedbackInput,
} from "@/core/trust";

export class MobilityTrustService {
  static submitFeedback(
    rideId: string,
    input: OperationalTrustFeedbackInput,
  ) {
    return OperationalTrustCommandService.submitRideFeedback(rideId, input);
  }
}
