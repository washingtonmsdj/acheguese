import { useState } from "react";
import { Clock, FileText, TrendingUp } from "lucide-react";
import { PostCard, PostCardSkeleton } from "@/core/community";
import { usePostActions } from "@/core/posts/hooks";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { EmptyStateProfile } from "./EmptyStateProfile";
import { useUserPosts } from "../hooks/useUserPosts";
import type { ProfileFeedPostType } from "../types/profileFeed";

interface UserPostsGridProps {
  profileId: string;
  currentProfileId?: string;
  onPostClick?: (postId: string) => void;
  onCommentClick?: (postId: string) => void;
}

type TypeFilterValue = "all" | ProfileFeedPostType;
type SortValue = "recent" | "popular";

const TYPE_OPTIONS: Array<{ value: TypeFilterValue; label: string }> = [
  { value: "all", label: "Todos os tipos" },
  { value: "discussao", label: "Discussao" },
  { value: "pergunta", label: "Pergunta" },
  { value: "recomendacao", label: "Recomendacao" },
  { value: "enquete", label: "Enquete" },
  { value: "achados_e_perdidos", label: "Achados e perdidos" },
];

function isTypeFilterValue(value: string): value is TypeFilterValue {
  return TYPE_OPTIONS.some((option) => option.value === value);
}

function isSortValue(value: string): value is SortValue {
  return value === "recent" || value === "popular";
}

export function UserPostsGrid({
  profileId,
  currentProfileId,
  onPostClick,
  onCommentClick,
}: UserPostsGridProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");
  const [sortBy, setSortBy] = useState<SortValue>("recent");
  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useUserPosts({
    profileId,
    filters: {
      type: typeFilter === "all" ? undefined : typeFilter,
      sortBy,
    },
  });
  const { likePost, savePost, sharePost, deletePost } = usePostActions();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Erro ao carregar posts publicados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            if (isTypeFilterValue(value)) {
              setTypeFilter(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <FileText className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo de post" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) => {
            if (isSortValue(value)) {
              setSortBy(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            {sortBy === "recent" ? (
              <Clock className="w-4 h-4 mr-2" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="popular">Mais populares</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {posts.length === 0 ? (
        <EmptyStateProfile
          icon={FileText}
          title="Nenhum post encontrado"
          description="Este perfil ainda nao publicou posts neste formato."
        />
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentProfileId}
                onLike={likePost}
                onComment={onCommentClick ?? (() => undefined)}
                onSave={savePost}
                onShare={sharePost}
                onReport={() => undefined}
                onDelete={profileId === currentProfileId ? deletePost : undefined}
                onPostClick={onPostClick}
              />
            ))}
          </div>

          <InfiniteScrollTrigger
            onLoadMore={loadMore}
            hasMore={Boolean(hasNextPage)}
            isLoading={isFetchingNextPage}
          />
        </>
      )}
    </div>
  );
}
