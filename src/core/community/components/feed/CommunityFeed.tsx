import React, { useState, useCallback, useMemo } from "react";

import { UnifiedFeedWithMessages } from "./UnifiedFeedWithMessages";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import { PostCardSkeleton } from "../PostCardSkeleton";
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import { LocationScope } from "@/core/community/hooks/feed/useFeedFilters";
import { useSessionContext } from "@/core/session";
import { AlertCircle, BarChart3, Clock3, Flame, MessageCircle, ThumbsUp } from "lucide-react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { SPACING } from "../styles/communityDesignSystem";
import type { TerritoryFilter } from "@/core/location";

type FeedSortType = "recent" | "popular" | "most_commented";
type FeedPostType =
  | "all"
  | "discussao"
  | "recomendacao"
  | "enquete"
  | "alerta"
  | "civic_report";

const POST_TYPE_FILTERS: { id: FeedPostType; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Todos", icon: MessageCircle },
  { id: "discussao", label: "Textos", icon: MessageCircle },
  { id: "recomendacao", label: "Indicacoes", icon: ThumbsUp },
  { id: "enquete", label: "Enquetes", icon: BarChart3 },
];

const SORT_FILTERS: { id: FeedSortType; label: string; icon: React.ElementType }[] = [
  { id: "recent", label: "Recentes", icon: Clock3 },
  { id: "popular", label: "Em alta", icon: Flame },
  { id: "most_commented", label: "Comentados", icon: MessageCircle },
];

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
  territoryFilter?: TerritoryFilter;
}

export function CommunityFeed({
  currentUserId,
  onPostClick,
  onCommentClick,
  onTagClick,
  onOpenCreatePost,
  onDeletePost,
  onEditPost,
  onReportClick,
  locationScope = "city",
  defaultPostType = "all",
  territoryFilter,
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
  } = useCommunityFeedSimple({ locationScope, territoryFilter });

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
  const sortCriteria = useMemo(() => {
    if (sortType === "popular") return "popular";
    if (sortType === "most_commented") return "most_commented";
    return "recent";
  }, [sortType]);

  const filterType = useMemo(() => {
    switch (postType) {
      case "discussao":    return "discussao";
      case "recomendacao": return "recomendacao";
      case "enquete":      return "enquete";
      case "alerta":       return "alerta";
      case "civic_report": return "civic_report";
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-[#0f171a] p-3 shadow-xl shadow-black/10 md:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-teal-200">
            <MessageCircle className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onOpenCreatePost}
            className="min-h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 text-left text-sm text-white/55 transition-colors hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-white"
          >
            Compartilhe uma indicacao, pedido, foto ou texto com a comunidade
          </button>
        </div>

        <div className="mt-3 flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2" role="tablist" aria-label="Tipo de publicacao">
            {POST_TYPE_FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={postType === id}
                onClick={() => setPostType(id)}
                className={`flex min-h-9 min-w-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  postType === id
                    ? "border-teal-300/50 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-wrap gap-2" aria-label="Ordenacao do feed">
            {SORT_FILTERS.map(({ id, label, icon: Icon }) => (
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
            ))}
          </div>
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
            location_id: activeProfile?.locationId,
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

      {/* Infinite scroll trigger */}
      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}

