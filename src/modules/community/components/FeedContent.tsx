import React, { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PostCard, FeedPost } from "./PostCard";
import { LoadingSkeleton, ErrorState, EmptyState } from "./FeedStates";
import type { FeedCategory } from "./FeedCategoryFilter";

interface FeedContentProps {
  posts: FeedPost[];
  filter: FeedCategory;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  isMobile: boolean;
  currentProfileId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onReport: (postId: string) => void;
  onRefresh: () => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export const FeedContent = ({
  posts,
  filter,
  loading,
  loadingMore,
  error,
  isMobile,
  currentProfileId,
  onLike,
  onComment,
  onReport,
  onRefresh,
  sentinelRef,
}: FeedContentProps) => {
  const filteredAndSortedPosts = useMemo(() => {
    const safePosts = posts as Array<FeedPost & { category?: string; hidden?: boolean }>;
    const urgent = ["alerta", "seguranca"];
    const filtered = filter === "todos" ? safePosts : safePosts.filter((p) => p.category === filter);

    return [...filtered]
      .filter((p) => !p.hidden)
      .sort((a, b) => {
        const aUrgent = typeof a.category === "string" ? urgent.includes(a.category) : false;
        const bUrgent = typeof b.category === "string" ? urgent.includes(b.category) : false;
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;
        return 0;
      });
  }, [posts, filter]);

  return (
    <main
      role="main"
      aria-label="Feed de posts"
      aria-live="polite"
      aria-busy={loading || loadingMore}
      className={isMobile ? "flex flex-col" : "grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"}
    >
      {error ? (
        <div className="col-span-full">
          <ErrorState onRetry={onRefresh} />
        </div>
      ) : loading ? (
        <div className="col-span-full">
          <LoadingSkeleton />
        </div>
      ) : filteredAndSortedPosts.length === 0 ? (
        <div className="col-span-full">
          <EmptyState filter={filter} />
        </div>
      ) : (
        <AnimatePresence>
          {filteredAndSortedPosts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              onLike={onLike}
              onComment={onComment}
              onReport={onReport}
              isLoggedIn={!!currentProfileId}
            />
          ))}
        </AnimatePresence>
      )}

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {loadingMore && (
        <div className="col-span-full flex justify-center py-4" role="status" aria-label="Carregando mais posts">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando mais posts...</span>
        </div>
      )}
    </main>
  );
};
