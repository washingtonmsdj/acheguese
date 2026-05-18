import { useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { useRideChat } from "./useRideChat";

export function useMobilidadeChat(conversationId?: string) {
  const { activeProfile } = useSessionContext();
  const rideId = conversationId ?? "";
  const userId = activeProfile?.id ?? "";

  const chat = useRideChat({
    rideId,
    userId,
    enabled: Boolean(rideId && userId),
  });

  const markAllAsRead = useCallback(async () => {
    await chat.markAsRead();
  }, [chat]);

  return {
    messages: chat.messages,
    loading: chat.loading,
    sending: chat.sending,
    sendMessage: chat.sendMessage,
    markAsRead: chat.markAsRead,
    markAllAsRead,
  };
}

