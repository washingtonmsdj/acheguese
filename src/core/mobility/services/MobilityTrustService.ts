import {
  OperationalTrustCommandService,
  type OperationalTrustFeedbackInput,
  type RideTrustFeedbackSubjectRole,
} from "@/core/trust";

const EXPLICIT_RIDE_FEEDBACK_ROLES = new Set<RideTrustFeedbackSubjectRole>([
  "customer",
  "merchant",
  "driver",
  "courier",
]);

export class MobilityTrustService {
  static submitFeedback(
    rideId: string,
    input: OperationalTrustFeedbackInput,
  ) {
    const selector = input.subjectProfileId as RideTrustFeedbackSubjectRole;
    const subjectRole: RideTrustFeedbackSubjectRole =
      EXPLICIT_RIDE_FEEDBACK_ROLES.has(selector)
        ? selector
        : "counterparty";

    return OperationalTrustCommandService.submitRideFeedback(rideId, {
      subjectRole,
      rating: input.rating,
      reasonCode: input.reasonCode,
      description: input.description,
    });
  }
}