import React, { useState, useCallback, useMemo } from "react";

import { UnifiedFeedWithMessages } from "./UnifiedFeedWithMessages";
import { UnifiedComposer } from "../composer/UnifiedComposer";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import { PostCardSkeleton } from "../PostCardSkeleton";
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import { LocationScope } from "@/core/community/hooks/feed/useFeedFilters";
import { useSessionContext } from "@/core/session";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { SPACING } from "../styles/communityDesignSystem";

type FeedSortType = "recent" | "popular" | "most_commented";
type FeedPostType =
  | "all"
  | "discussao"
  | "recomendacao"
  | "enquete";

interface CommunityFeedProps {
  currentUserId?: string;
  onPostClick?: (postId: string) => void;
  onCommentClick?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onOpenCreatePost?: () => void;
  onOpenAlertModal?: () => void;
  onOpenIssueModal?: () => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onReportClick?: (reportId: string) => void;
  locationScope?: LocationScope;
  defaultPostType?: FeedPostType;
}

export function CommunityFeed({
  currentUserId,
  onPostClick,
  onCommentClick,
  onTagClick,
  onOpenCreatePost,
  onOpenAlertModal,
  onOpenIssueModal,
  onDeletePost,
  onEditPost,
  onReportClick,
  locationScope = "city",
  defaultPostType = "all",
}: CommunityFeedProps) {
  const { activeProfile } = useSessionContext();
  const {
    posts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useCommunityFeedSimple({ locationScope });

  // Local filter states
  const [sortType, setSortType] = useState<FeedSortType>("recent");
  const [postType, setPostType] = useState<FeedPostType>(defaultPostType);

  // Handlers
  const handleLike = useCallback((postId: string) => {
    // Delegated to usePostActions via page-level handler
  }, []);

  const handleComment = useCallback(
    (postId: string) => {
      onCommentClick?.(postId);
    },
    [onCommentClick],
  );

  const handleSave = useCallback((postId: string) => {}, []);
  const handleShare = useCallback((postId: string) => {}, []);
  const handleReport = useCallback((postId: string) => {}, []);

  const handleTagClick = useCallback(
    (tag: string) => {
      onTagClick?.(tag);
    },
    [onTagClick],
  );

  const handleUpvoteReport = useCallback((reportId: string) => {}, []);

  // Memoized derived values
  const sortCriteria = useMemo(
    () => (sortType === "popular" ? "popular" : "recent"),
    [sortType],
  );

  const filterType = useMemo(() => {
    switch (postType) {
      case "discussao":    return "discussao";
      case "recomendacao": return "recomendacao";
      case "enquete":      return "enquete";
      default:             return "all";
    }
  }, [postType]);

  if (isLoading) {
    return (
      <div className={SPACING.sectionGap}>
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        variant="destructive"
        className="border-destructive/50 bg-destructive/10"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar feed: {error?.message || "Erro desconhecido"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={SPACING.sectionGap}>
      {/* Unified Composer - hidden on mobile */}
      <div className="hidden md:block">
        <UnifiedComposer
          onOpenCreatePost={onOpenCreatePost}
          onOpenAlertModal={onOpenAlertModal}
          onOpenIssueModal={onOpenIssueModal}
          locationScope={locationScope}
        />
      </div>

      {/* Unified Feed */}
      <UnifiedFeedWithMessages
        civicReports={[]}
        communityPosts={posts}
        currentUserId={currentUserId}
        sortCriteria={sortCriteria}
        filterType={filterType}
        userLocation={{
          location_id: activeProfile?.location_id,
        }}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onSave={handleSave}
        onReport={handleReport}
        onUpvote={handleUpvoteReport}
        onPostClick={onPostClick}
        onDelete={onDeletePost}
        onEdit={onEditPost}
        onTagClick={handleTagClick}
      />

      {/* Infinite scroll trigger */}
      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}

