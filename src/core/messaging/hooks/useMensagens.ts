import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { messagingService } from "@/core/messaging/services/MessagingService";
import { useAuth } from "@/core/auth";

export function useMensagens() {
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ["mensagens", user?.id, search],
    queryFn: async () => {
      if (!user) return [];
      // ✅ SSOT — usa MessagingService
      return await messagingService.getConversationPreviews(user.id);
    },
    enabled: !!user,
  });

  const totalUnreadCount = conversations.reduce(
    (acc: number, c: any) => acc + (c.unread_count || 0),
    0,
  );
  const hasUnreadMessages = totalUnreadCount > 0;
  const shouldShowSearch = conversations.length > 3;

  return {
    conversations,
    loading,
    authLoading,
    search,
    setSearch,
    totalUnreadCount,
    hasUnreadMessages,
    shouldShowSearch,
  };
}
