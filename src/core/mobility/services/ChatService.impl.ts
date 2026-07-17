/**
 * ChatService - SSOT for ride chat.
 *
 * Keep direct consumption behind this facade.
 */

import * as chatMutations from "./chat.mutations";
import * as chatQueries from "./chat.queries";
import type { ChatMessage, RideChat, SendMessageInput } from "./chat.types";

export type { ChatMessage, RideChat, SendMessageInput } from "./chat.types";

export class ChatService {
  static async getChatByRideId(rideId: string): Promise<RideChat | null> {
    return chatQueries.getChatByRideId(rideId);
  }

  static async getMessages(chatId: string): Promise<ChatMessage[]> {
    return chatQueries.getMessages(chatId);
  }

  static async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    return chatMutations.sendMessage(input);
  }

  static async markMessagesAsRead(
    chatId: string,
    userId: string,
  ): Promise<void> {
    await chatMutations.markMessagesAsRead(chatId, userId);
  }

  static async createChat(rideId: string): Promise<RideChat> {
    return chatMutations.createChat(rideId);
  }
}
