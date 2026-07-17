import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { classifiedMessagingService } from "@/core/messaging";
import { useAuth } from "@/core/auth";
import { useSessionContext } from "@/core/session";
import type { ClassifiedConversationCursor } from "@/core/messaging/types";

const CONVERSATION_PAGE_SIZE = 30;

export function useMensagens() {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile } = useSessionContext();
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim();

  const query = useInfiniteQuery({
    queryKey: ["classified-messages", activeProfile?.id, normalizedSearch],
    initialPageParam: null as ClassifiedConversationCursor | null,
    queryFn: async ({ pageParam }) => {
      if (!activeProfile) {
        return { items: [], nextCursor: null };
      }
      return classifiedMessagingService.listConversationPreviews({
        profileId: activeProfile.id,
        limit: CONVERSATION_PAGE_SIZE,
        cursor: pageParam,
        search: normalizedSearch,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user && !!activeProfile,
  });

  const conversations = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const totalUnreadCount = conversations.reduce(
    (total, conversation) => total + conversation.unread_count,
    0,
  );

  return {
    conversations,
    loading: query.isLoading,
    authLoading,
    search,
    setSearch,
    totalUnreadCount,
    hasUnreadMessages: totalUnreadCount > 0,
    shouldShowSearch: conversations.length > 3 || normalizedSearch.length > 0,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => query.fetchNextPage(),
  };
}
