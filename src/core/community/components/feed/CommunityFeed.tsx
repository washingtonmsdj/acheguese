import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Clock3,
  FileText,
  Flame,
  ImageIcon,
  Megaphone,
  MessageCircle,
  SlidersHorizontal,
} from "lucide-react";
import { usePostActions } from "@/core/posts/hooks";
import { useSessionContext } from "@/core/session";
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import type { LocationScope } from "@/core/community/hooks/feed/useFeedFilters";
import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";
import type { TerritoryFilter } from "@/core/location";
import {
  COMMUNITY_FEED_COMPOSER_ACTIONS,
  COMMUNITY_FEED_HEADER_FILTERS,
  COMMUNITY_FEED_SORT_FILTERS,
  type CommunityFeedComposerActionId,
  type CommunityFeedSortType,
} from "@/core/community/utils/communityFeedTab";
import { COMMUNITY_FEED_COPY } from "@/core/community/utils/communityCopy";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import type { UnifiedPost } from "@/shared/types/posts";
import { UnifiedFeedWithMessages } from "./UnifiedFeedWithMessages";
import { PostCardSkeleton } from "../PostCardSkeleton";
import { SPACING } from "../styles/communityDesignSystem";

const SORT_ICONS: Record<CommunityFeedSortType, React.ElementType> = {
  recent: Clock3,
  popular: Flame,
  most_commented: MessageCircle,
};

const COMPOSER_ICONS: Record<CommunityFeedComposerActionId, React.ElementType> = {
  text: MessageCircle,
  media: ImageIcon,
  poll: BarChart3,
  alert: Megaphone,
  file: FileText,
};

interface CommunityFeedProps {
  currentUserId?: string;
  onPostClick?: (postId: string, post: UnifiedPost) => void;
  onCommentClick?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onOpenCreatePost?: () => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  locationScope?: LocationScope;
  territoryFilter?: TerritoryFilter;
  initialHeaderFilter?: TerritorialFeedChannel;
  onHeaderFilterChange?: (filter: TerritorialFeedChannel) => void;
}

export function CommunityFeed({
  currentUserId,
  onPostClick,
  onCommentClick,
  onTagClick,
  onOpenCreatePost,
  onDeletePost,
  onEditPost,
  locationScope = "city",
  territoryFilter,
  initialHeaderFilter = "para_voce",
  onHeaderFilterChange,
}: CommunityFeedProps) {
  const { activeProfile } = useSessionContext();
  const { likePost, savePost, sharePost, reportPost } = usePostActions();
  const { posts, isLoading, isError, error, hasNextPage, isFetchingNextPage, loadMore } =
    useCommunityFeedSimple({ locationScope, territoryFilter });

  const [sortType, setSortType] = useState<CommunityFeedSortType>("recent");
  const [activeHeaderFilter, setActiveHeaderFilter] =
    useState<TerritorialFeedChannel>(initialHeaderFilter);

  useEffect(() => {
    setActiveHeaderFilter(initialHeaderFilter);
  }, [initialHeaderFilter]);

  const handleLike = useCallback((postId: string) => {
    likePost(postId);
  }, [likePost]);

  const handleComment = useCallback((postId: string) => {
    onCommentClick?.(postId);
  }, [onCommentClick]);

  const handleSave = useCallback((postId: string) => {
    savePost(postId);
  }, [savePost]);

  const handleShare = useCallback((postId: string) => {
    sharePost(postId);
  }, [sharePost]);

  const handleReport = useCallback((postId: string) => {
    reportPost({
      postId,
      reason: "inappropriate_content",
      description: "Denuncia enviada pelo fluxo principal do feed",
    });
  }, [reportPost]);

  const handleTagClick = useCallback((tag: string) => {
    onTagClick?.(tag);
  }, [onTagClick]);

  const handleUpvoteReport = useCallback((_reportId: string) => {}, []);
  const profileName = activeProfile?.name?.trim() || "Usuario";
  const profileAvatar = activeProfile?.avatar_url ?? activeProfile?.avatarUrl ?? undefined;
  const profileInitial = profileName[0]?.toUpperCase() ?? "U";

  const sortCriteria = useMemo(() => {
    if (sortType === "popular") return "popular";
    if (sortType === "most_commented") return "most_commented";
    return "recent";
  }, [sortType]);

  const filterType = useMemo(() => activeHeaderFilter, [activeHeaderFilter]);

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
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {COMMUNITY_FEED_COPY.errorLoadingFeedPrefix} {error?.message || COMMUNITY_FEED_COPY.unknownError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0f171a] p-3 shadow-xl shadow-black/10 md:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 border border-white/15">
            <AvatarImage src={profileAvatar} alt={profileName} />
            <AvatarFallback className="bg-accent text-foreground font-semibold">
              {profileInitial}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={onOpenCreatePost}
            className="min-h-16 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left transition-colors hover:border-teal-400/40 hover:bg-teal-400/10"
          >
            <span className="flex flex-col">
              <span className="block whitespace-nowrap overflow-hidden text-ellipsis text-sm font-medium text-white/85 leading-5">
                {COMMUNITY_FEED_COPY.composerTitle}
              </span>
              <span className="block whitespace-nowrap overflow-hidden text-ellipsis text-xs text-white/50 leading-5">
                {COMMUNITY_FEED_COPY.composerSubtitle}
              </span>
            </span>
          </button>
        </div>

        <div
          className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-white/10 pt-3"
          aria-label={COMMUNITY_FEED_COPY.composerActionsAriaLabel}
        >
          {COMMUNITY_FEED_COMPOSER_ACTIONS.map(({ id, label }) => {
            const Icon = COMPOSER_ICONS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={onOpenCreatePost}
                className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-white/75 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f171a] p-3 shadow-xl shadow-black/10 md:p-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div
            className="flex min-w-0 flex-wrap gap-2"
            role="tablist"
            aria-label={COMMUNITY_FEED_COPY.headerFiltersAriaLabel}
          >
            {COMMUNITY_FEED_HEADER_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeHeaderFilter === id}
                onClick={() => {
                  setActiveHeaderFilter(id);
                  onHeaderFilterChange?.(id);
                }}
                className={`flex min-h-9 min-w-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  activeHeaderFilter === id
                    ? "border-teal-300/50 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/65 transition-colors hover:border-white/20 hover:text-white"
            aria-label={COMMUNITY_FEED_COPY.adjustFiltersAriaLabel}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div
          className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-white/10 pt-3"
          aria-label={COMMUNITY_FEED_COPY.sortAriaLabel}
        >
          {COMMUNITY_FEED_SORT_FILTERS.map(({ id, label }) => {
            const Icon = SORT_ICONS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSortType(id)}
                className={`flex min-h-9 min-w-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  sortType === id
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 bg-black/20 text-white/50 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <UnifiedFeedWithMessages
          civicReports={[]}
          communityPosts={posts}
          currentUserId={currentUserId}
          sortCriteria={sortCriteria}
          filterType={filterType}
          userLocation={{
            location_id: activeProfile?.locationId ?? activeProfile?.location_id,
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
      </div>

      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
