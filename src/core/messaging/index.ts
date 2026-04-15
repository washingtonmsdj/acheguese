/**
 * 🏆 MESSAGING SERVICE - Barrel Export
 */

export {
  messagingService,
  default as MessagingService,
} from "./services/MessagingService";
export type {
  Conversation,
  Message,
  ConversationWithDetails,
  ConversationPreview,
  CreateConversationInput,
  SendMessageInput,
  BlockConversationInput,
} from "./types";
