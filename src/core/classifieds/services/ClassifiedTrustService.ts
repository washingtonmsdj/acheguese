import { classifiedMessagingService } from "@/core/messaging/services/ClassifiedMessagingService";
import {
  OperationalTrustCommandService,
  type OperationalTrustFeedbackInput,
} from "@/core/trust";

export interface ClassifiedConversationParticipant {
  conversationId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string | null;
  sellerName: string | null;
}

export class ClassifiedTrustService {
  static async listConversationParticipants(classifiedId: string): Promise<ClassifiedConversationParticipant[]> {
    return classifiedMessagingService.listConversationParticipantsByClassified(classifiedId);
  }

  static submitFeedback(
    classifiedId: string,
    input: OperationalTrustFeedbackInput,
  ) {
    return OperationalTrustCommandService.submitClassifiedFeedback(
      classifiedId,
      input,
    );
  }
}
