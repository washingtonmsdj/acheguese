/**
 * Stable facade for mobility chat service.
 *
 * Canonical implementations live in chat.queries/chat.mutations/ChatService.impl.
 */

export {
  getChatByRideId,
  getMessages,
} from "./chat.queries";

export {
  sendMessage,
  markMessagesAsRead,
  createChat,
} from "./chat.mutations";

export type {
  RideChat,
  ChatMessage,
  SendMessageInput,
  Conversation,
  CreateMessageData,
} from "./chat.types";

export { ChatFacade, ChatService, chatService } from "./ChatService.impl";
