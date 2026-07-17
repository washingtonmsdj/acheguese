import React from "react";
import { useMensagens } from "@/core/messaging/hooks/useMensagens";
import { MensagensHeader } from "@/core/messaging/components/MensagensHeader";
import { ConversationsList } from "@/core/messaging/components/ConversationsList";

export default function MensagensPage() {
  const {
    conversations,
    loading,
    authLoading,
    search,
    setSearch,
    totalUnreadCount,
    hasUnreadMessages,
    shouldShowSearch,
    hasMore,
    loadingMore,
    loadMore,
  } = useMensagens();

  if (authLoading) return null;

  return (
    <div className="flex flex-col min-h-full">
      <MensagensHeader
        totalUnreadCount={totalUnreadCount}
        hasUnreadMessages={hasUnreadMessages}
        shouldShowSearch={shouldShowSearch}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="flex-1">
        <ConversationsList
          conversations={conversations}
          loading={loading}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => void loadMore()}
        />
      </div>
    </div>
  );
}
