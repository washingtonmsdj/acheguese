import {
  OperationalTrustCommandService,
  type OperationalTrustFeedbackInput,
} from "@/core/trust";

export class OrderTrustService {
  static submitFeedback(orderId: string, input: OperationalTrustFeedbackInput) {
    return OperationalTrustCommandService.submitOrderFeedback(orderId, input);
  }
}
