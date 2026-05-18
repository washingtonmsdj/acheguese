import { messagingService } from "@/core/messaging/services/MessagingService";

export interface ClassifiedConversationParticipant {
  conversationId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string | null;
  sellerName: string | null;
}

export class ClassifiedTrustService {
  static async listConversationParticipants(classifiedId: string): Promise<ClassifiedConversationParticipant[]> {
    return messagingService.listConversationParticipantsByClassified(classifiedId);
  }
}
