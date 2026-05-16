import React, { useState, useCallback, useMemo } from "react";

import { UnifiedFeedWithMessages } from "./UnifiedFeedWithMessages";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import { PostCardSkeleton } from "../PostCardSkeleton";
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import { LocationScope } from "@/core/community/hooks/feed/useFeedFilters";
import { useSessionContext } from "@/core/session";
import { AlertCircle, BarChart3, Clock3, FileText, Flame, ImageIcon, Megaphone, MessageCircle, SlidersHorizontal } from "lucide-react";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { SPACING } from "../styles/communityDesignSystem";
import type { TerritoryFilter } from "@/core/location";
import { usePostActions } from "@/core/posts/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";

type FeedSortType = "recent" | "popular" | "most_commented";

const SORT_FILTERS: { id: FeedSortType; label: string; icon: React.ElementType }[] = [
  { id: "recent", label: "Recentes", icon: Clock3 },
  { id: "popular", label: "Em alta", icon: Flame },
  { id: "most_commented", label: "Comentados", icon: MessageCircle },
];

const COMPOSER_ACTIONS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "text", label: "Texto", icon: MessageCircle },
  { id: "media", label: "Foto/vídeo", icon: ImageIcon },
  { id: "poll", label: "Enquete", icon: BarChart3 },
  { id: "alert", label: "Aviso", icon: Megaphone },
  { id: "file", label: "Arquivo", icon: FileText },
];

const HEADER_FILTERS: { id: TerritorialFeedChannel; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "para_voce", label: "Para você" },
  { id: "moradores", label: "Moradores" },
  { id: "empresas", label: "Empresas" },
  { id: "eventos", label: "Eventos" },
  { id: "alertas", label: "Alertas" },
  { id: "vagas", label: "Vagas" },
  { id: "classificados", label: "Classificados" },
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
  territoryFilter,
}: CommunityFeedProps) {
  const { activeProfile } = useSessionContext();
  const { likePost, savePost, sharePost, reportPost } = usePostActions();
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
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<TerritorialFeedChannel>("todos");

  // Handlers
  const handleLike = useCallback((postId: string) => {
    likePost(postId);
  }, [likePost]);

  const handleComment = useCallback(
    (postId: string) => {
      onCommentClick?.(postId);
    },
    [onCommentClick],
  );

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

  const handleTagClick = useCallback(
    (tag: string) => {
      onTagClick?.(tag);
    },
    [onTagClick],
  );

  const handleUpvoteReport = useCallback((reportId: string) => {}, []);
  const profileName = activeProfile?.name?.trim() || "Usuário";
  const profileAvatar = activeProfile?.avatar_url ?? activeProfile?.avatarUrl ?? undefined;
  const profileInitial = profileName[0]?.toUpperCase() ?? "U";

  // Memoized derived values
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
                O que você quer compartilhar com o bairro?
              </span>
              <span className="block whitespace-nowrap overflow-hidden text-ellipsis text-xs text-white/50 leading-5">
                Compartilhe uma indicação, pedido, foto ou texto com a comunidade.
              </span>
            </span>
          </button>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-white/10 pt-3" aria-label="Ações de postagem">
          {COMPOSER_ACTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={onOpenCreatePost}
              className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-white/75 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f171a] p-3 shadow-xl shadow-black/10 md:p-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-2" role="tablist" aria-label="Filtros principais do feed">
            {HEADER_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeHeaderFilter === id}
                onClick={() => {
                  setActiveHeaderFilter(id);
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
            aria-label="Ajustar filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2 border-t border-white/10 pt-3" aria-label="Ordenacao do feed">
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

      {/* Infinite scroll trigger */}
      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={!!hasNextPage}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}

