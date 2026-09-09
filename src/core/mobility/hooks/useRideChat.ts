/**
 * useRideChat - canonical ride chat runtime.
 *
 * SSOT: ride_chats/ride_chat_messages -> ChatService -> hook -> UI.
 * Writes are server-owned and sender identity is derived from the active Profile.
 */
import { useCallback, useEffect, useState } from "react";
import { logger } from "@/shared/utils/logger";
import {
  ChatService,
  type ChatMessage,
  type RideChat,
} from "@/core/mobility/services/ChatService";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage | ChatMessage[],
): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of Array.isArray(incoming) ? incoming : [incoming]) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((left, right) => {
    const byTime =
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  });
}

interface UseRideChatOptions {
  rideId: string;
  enabled?: boolean;
}

export function useRideChat({
  rideId,
  enabled = true,
}: UseRideChatOptions) {
  const [chat, setChat] = useState<RideChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !rideId) {
      setChat(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const existingChat = await ChatService.getChatByRideId(rideId);
        const chatData = existingChat ?? (await ChatService.createChat(rideId));
        if (!active) return;

        setChat(chatData);

        subscription = ChatService.subscribeToMessages(chatData.id, (message) => {
          if (!active) return;
          setMessages((current) => mergeMessages(current, message));
        });

        const initialMessages = await ChatService.getMessages(chatData.id);
        if (!active) return;
        setMessages((current) => mergeMessages(current, initialMessages));
      } catch (err: unknown) {
        if (!active) return;
        logger.error("useRideChat.load", err);
        setError(getErrorMessage(err, "Erro ao carregar chat"));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [rideId, enabled]);

  const sendMessage = useCallback(
    async (message: string) => {
      const normalized = message.trim();
      if (!rideId || !normalized) return;

      try {
        setSending(true);
        setError(null);

        const data = await ChatService.sendMessage({
          ride_id: rideId,
          message: normalized,
        });

        setMessages((current) => mergeMessages(current, data));
      } catch (err: unknown) {
        logger.error("useRideChat.sendMessage", err);
        setError(getErrorMessage(err, "Erro ao enviar mensagem"));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [rideId],
  );

  const markAsRead = useCallback(async () => {
    if (!rideId) return;

    try {
      await ChatService.markMessagesAsRead(rideId);
    } catch (err) {
      logger.error("useRideChat.markAsRead", err);
    }
  }, [rideId]);

  return {
    chat,
    messages,
    loading,
    sending,
    error,
    sendMessage,
    markAsRead,
  };
}
