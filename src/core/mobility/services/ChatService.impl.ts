/**
 * ChatService - SSOT for ride chat.
 *
 * Keep direct consumption behind this facade.
 */

import * as chatMutations from "./chat.mutations";
import * as chatQueries from "./chat.queries";
import type { ChatMessage, RideChat, SendMessageInput } from "./chat.types";
import { realtimeService, type RealtimeSubscription } from "@/core/realtime";

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

  static async markMessagesAsRead(rideId: string): Promise<void> {
    await chatMutations.markMessagesAsRead(rideId);
  }

  static async createChat(rideId: string): Promise<RideChat> {
    return chatMutations.createChat(rideId);
  }

  static subscribeToMessages(
    chatId: string,
    onMessage: (message: ChatMessage) => void,
  ): RealtimeSubscription {
    return realtimeService.subscribe("mobility.ride-chat-messages", {
      filterValues: { chatId },
      onEvent: ({ row }) => onMessage(row as unknown as ChatMessage),
    });
  }
}
