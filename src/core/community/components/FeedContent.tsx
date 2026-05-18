 
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
    const URGENT = ["alerta", "segurança"];
    const filtered =
      filter === "todos"
        ? posts
        : posts.filter((p) => ((p as { category?: string }).category ?? "") === filter);

    return [...filtered]
      .filter((p) => !((p as { hidden?: boolean }).hidden ?? false))
      .sort((a, b) => {
        const aUrgent = URGENT.includes((a as { category?: string }).category ?? "");
        const bUrgent = URGENT.includes((b as { category?: string }).category ?? "");
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
      className={
        isMobile
          ? "flex flex-col"
          : "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      }
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
          {filteredAndSortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentProfileId}
              onLike={onLike}
              onComment={onComment}
              onReport={onReport}
              onSave={() => {}}
              onShare={() => {}}
            />
          ))}
        </AnimatePresence>
      )}

      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {loadingMore && (
        <div
          className="flex justify-center py-4 col-span-full"
          role="status"
          aria-label="Carregando mais posts"
        >
          <Loader2
            className="h-5 w-5 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <span className="ml-2 text-sm text-muted-foreground">
            Carregando mais posts...
          </span>
        </div>
      )}
    </main>
  );
};
