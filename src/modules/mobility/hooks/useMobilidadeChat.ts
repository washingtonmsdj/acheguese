import { useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { useRideChat } from "./useRideChat";

export function useMobilidadeChat(rideId?: string) {
  const { activeProfile } = useSessionContext();
  const resolvedRideId = rideId ?? "";

  const chat = useRideChat({
    rideId: resolvedRideId,
    enabled: Boolean(resolvedRideId && activeProfile?.id),
  });

  const markAllAsRead = useCallback(async () => {
    await chat.markAsRead();
  }, [chat.markAsRead]);

  return {
    messages: chat.messages,
    loading: chat.loading,
    sending: chat.sending,
    error: chat.error,
    sendMessage: chat.sendMessage,
    markAsRead: chat.markAsRead,
    markAllAsRead,
  };
}
