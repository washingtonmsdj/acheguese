import { useSessionContext } from "@/core/session";
import { useRideChat } from "./useRideChat";

export function useMobilidadeChat(rideId?: string) {
  const { activeProfile } = useSessionContext();
  const resolvedRideId = rideId ?? "";

  const chat = useRideChat({
    rideId: resolvedRideId,
    enabled: Boolean(resolvedRideId && activeProfile?.id),
  });

  return {
    messages: chat.messages,
    loading: chat.loading,
    sending: chat.sending,
    error: chat.error,
    sendMessage: chat.sendMessage,
    markAsRead: chat.markAsRead,
    markAllAsRead: chat.markAsRead,
  };
}
