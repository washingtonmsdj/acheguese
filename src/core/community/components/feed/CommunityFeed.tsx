import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock3,
  Flame,
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
  COMMUNITY_FEED_HEADER_FILTERS,
  COMMUNITY_FEED_SORT_FILTERS,
  type CommunityFeedSortType,
} from "@/core/community/utils/communityFeedTab";
import { isLaunchCommunityPostEnabled } from "@/app/config/launchScope";
import { COMMUNITY_FEED_COPY } from "@/core/community/utils/communityCopy";
import type { CommunityAction } from "@/core/community-experience/access";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import type { UnifiedPost } from "@/shared/types/posts";
import type { PostType } from "@/core/posts/types";
import { UnifiedFeedWithMessages } from "./UnifiedFeedWithMessages";
import {
  consumePendingNewPost,
  subscribeNewPost,
} from "@/core/community-feed/state/newPostHighlight";
import { CommunityComposerEntry } from "../composer/CommunityComposerEntry";
import { PostCardSkeleton } from "../PostCardSkeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { MessageCirclePlus } from "lucide-react";

import { SPACING } from "../styles/communityDesignSystem";
import { getRecordValue } from "@/shared/utils/recordLookup";

const SORT_ICONS: Record<CommunityFeedSortType, React.ElementType> = {
  recent: Clock3,
  popular: Flame,
  most_commented: MessageCircle,
};

const DISCUSSION_POST_TYPES = new Set<PostType>([
  "post",
  "discussao",
  "pergunta",
  "enquete",
  "recomendacao",
  "alerta",
]);

type CommunityFeedContentMode = "feed" | "discussions";

function getSortIcon(id: CommunityFeedSortType): React.ElementType {
  return getRecordValue(SORT_ICONS, id) ?? Clock3;
}

interface CommunityFeedProps {
  currentUserId?: string;
  communityId?: string;
  onPostClick?: (postId: string, post: UnifiedPost) => void;
  onCommentClick?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onOpenCreatePost: (defaultType?: PostType) => void;
  communityName?: string;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onReportPost: (postId: string) => void;
  canReact?: boolean;
  canComment?: boolean;
  canSave?: boolean;
  canReport?: boolean;
  canSendMessage?: boolean;
  canCreatePost?: boolean;
  onBlockedAction?: (action: CommunityAction) => void;
  locationScope?: LocationScope;
  territoryFilter?: TerritoryFilter;
  initialHeaderFilter?: TerritorialFeedChannel;
  onHeaderFilterChange?: (filter: TerritorialFeedChannel) => void;
  contentMode?: CommunityFeedContentMode;
}

export function CommunityFeed({
  currentUserId,
  communityId,
  onPostClick,
  onCommentClick,
  onTagClick,
  onOpenCreatePost,
  communityName = "sua comunidade",
  onDeletePost,
  onEditPost,
  onReportPost,
  canReact = true,
  canComment = true,
  canSave = true,
  canReport = true,
  canSendMessage = true,
  canCreatePost = false,
  onBlockedAction,
  locationScope = "city",
  territoryFilter,
  initialHeaderFilter = "para_voce",
  onHeaderFilterChange,
  contentMode = "feed",
}: CommunityFeedProps) {
  const { activeProfile } = useSessionContext();
  const { likePost, savePost, sharePost } = usePostActions();
  const {
    posts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useCommunityFeedSimple({ locationScope, territoryFilter });

  const [sortType, setSortType] = useState<CommunityFeedSortType>("recent");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [activeHeaderFilter, setActiveHeaderFilter] =
    useState<TerritorialFeedChannel>(initialHeaderFilter);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(() =>
    consumePendingNewPost(),
  );

  useEffect(() => {
    setActiveHeaderFilter(initialHeaderFilter);
  }, [initialHeaderFilter]);

  useEffect(() => {
    const unsubscribe = subscribeNewPost((id) => setHighlightPostId(id));
    return unsubscribe;
  }, []);

  // Scroll + highlight visual quando o post recém-publicado aparecer no DOM.
  useEffect(() => {
    if (!highlightPostId || typeof window === "undefined") return;
    let cancelled = false;
    const start = Date.now();
    const tryHighlight = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(
        `[data-feed-post-id="${CSS.escape(highlightPostId)}"]`,
      );
      if (el) {
        el.setAttribute("data-new-post", "true");
        el.classList.add(
          "ring-2",
          "ring-primary/60",
          "rounded-2xl",
          "shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]",
          "transition-all",
          "duration-500",
        );
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
          el.classList.remove(
            "ring-2",
            "ring-primary/60",
            "shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]",
          );
          el.removeAttribute("data-new-post");
        }, 6000);
        setHighlightPostId(null);
        return;
      }
      if (Date.now() - start < 5000) {
        window.setTimeout(tryHighlight, 200);
      } else {
        setHighlightPostId(null);
      }
    };
    tryHighlight();
    return () => {
      cancelled = true;
    };
  }, [highlightPostId]);

  const handleLike = useCallback(
    (postId: string) => {
      if (!canReact) {
        onBlockedAction?.("react");
        return;
      }

      likePost(postId);
    },
    [canReact, likePost, onBlockedAction],
  );

  const handleComment = useCallback(
    (postId: string) => {
      if (!canComment) {
        onBlockedAction?.("comment");
        return;
      }

      onCommentClick?.(postId);
    },
    [canComment, onBlockedAction, onCommentClick],
  );

  const handleSave = useCallback(
    (postId: string) => {
      if (!canSave) {
        onBlockedAction?.("save");
        return;
      }

      savePost(postId);
    },
    [canSave, onBlockedAction, savePost],
  );

  const handleShare = useCallback(
    (postId: string) => {
      sharePost(postId);
    },
    [sharePost],
  );

  const handleReport = useCallback(
    (postId: string) => {
      if (!canReport) {
        onBlockedAction?.("report");
        return;
      }

      onReportPost(postId);
    },
    [canReport, onBlockedAction, onReportPost],
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      onTagClick?.(tag);
    },
    [onTagClick],
  );

  const handleUpvoteReport = useCallback((_reportId: string) => {}, []);

  const sortCriteria = useMemo(() => {
    if (sortType === "popular") return "popular";
    if (sortType === "most_commented") return "most_commented";
    return "recent";
  }, [sortType]);

  const filterType = useMemo(() => activeHeaderFilter, [activeHeaderFilter]);
  const unifiedPosts = useMemo(() => {
    const launchPosts = posts.filter(isLaunchCommunityPostEnabled);
    const visiblePosts =
      contentMode === "discussions"
        ? launchPosts.filter((post) => DISCUSSION_POST_TYPES.has(post.type))
        : launchPosts;

    return visiblePosts.map((post) => ({
      ...post,
      type: post.type as UnifiedPost["type"],
      author_name: (post as { author_name?: string }).author_name ?? "Morador",
      tags: (post as { tags?: string[] }).tags ?? [],
    }));
  }, [contentMode, posts]);

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
          {COMMUNITY_FEED_COPY.errorLoadingFeedPrefix}{" "}
          {error?.message || COMMUNITY_FEED_COPY.unknownError}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-4">
      {canCreatePost ? (
        <CommunityComposerEntry
          communityName={communityName}
          onOpenCreatePost={onOpenCreatePost}
          className="border-territory-border bg-territory-surface shadow-territory-highlight"
        />
      ) : null}

      <div className="rounded-territory-highlight border border-territory-border bg-territory-surface p-3 shadow-territory-highlight md:p-4">
        {contentMode === "discussions" ? (
          <div className="mb-3 border-b border-border/60 pb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Conversas do bairro
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Perguntas, recomendações, enquetes e conversas entre vizinhos.
            </p>
          </div>
        ) : null}
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
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFiltersExpanded((current) => !current)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            aria-label={COMMUNITY_FEED_COPY.adjustFiltersAriaLabel}
            aria-expanded={filtersExpanded}
            aria-controls="community-feed-sort-options"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div
          id="community-feed-sort-options"
          className={`${filtersExpanded ? "mt-3 flex" : "hidden"} min-w-0 flex-wrap gap-2 border-t border-border/60 pt-3 sm:mt-3 sm:flex`}
          aria-label={COMMUNITY_FEED_COPY.sortAriaLabel}
        >
          {COMMUNITY_FEED_SORT_FILTERS.map(({ id, label }) => {
            const Icon = getSortIcon(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSortType(id)}
                className={`flex min-h-9 min-w-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  sortType === id
                    ? "border-foreground/20 bg-foreground/10 text-foreground"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        {unifiedPosts.length === 0 ? (
          <EmptyState
            icon={MessageCirclePlus}
            title={`Ainda sem publicações em ${communityName}.`}
            description="Seja o primeiro morador a compartilhar algo por aqui — uma dica, um alerta ou uma pergunta."
            action={
              onOpenCreatePost && canCreatePost
                ? { label: "Publicar no bairro", onClick: onOpenCreatePost }
                : undefined
            }
          />
        ) : (
          <UnifiedFeedWithMessages
            civicReports={[]}
            communityPosts={unifiedPosts}
            currentUserId={currentUserId}
            communityId={communityId}
            sortCriteria={sortCriteria}
            filterType={filterType}
            userLocation={{
              location_id: activeProfile?.locationId ?? null,
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
            canSendMessage={canSendMessage}
            onBlockedSendMessage={() => onBlockedAction?.("send_message")}
          />
        )}
      </div>

      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
