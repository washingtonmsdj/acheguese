import { Bookmark } from "lucide-react";
import { PostCard, PostCardSkeleton } from "@/core/posts/components";
import type { CommunityPost } from "@/core/posts/types";
import { usePostActions } from "@/core/posts/hooks";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import { EmptyStateProfile } from "./EmptyStateProfile";
import { useSavedPosts } from "../hooks/useSavedPosts";
import type { ProfileFeedPost } from "../types/profileFeed";

interface SavedPostsGridProps {
  userId: string;
  currentProfileId?: string;
  onPostClick?: (postId: string) => void;
  onCommentClick?: (postId: string) => void;
}

function toCommunityPost(post: ProfileFeedPost): CommunityPost {
  return {
    ...post,
    type: post.type === "achados_e_perdidos" ? "achado_perdido" : post.type,
  };
}

export function SavedPostsGrid({
  userId,
  currentProfileId,
  onPostClick,
  onCommentClick,
}: SavedPostsGridProps) {
  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useSavedPosts({ userId });
  const { likePost, savePost, sharePost } = usePostActions();

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
      <div className="py-12 text-center">
        <p className="text-red-500">Erro ao carregar posts salvos.</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyStateProfile
        icon={Bookmark}
        title="Nenhum post salvo"
        description="Voce ainda nao salvou posts para consultar depois."
      />
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={toCommunityPost(post)}
          currentUserId={currentProfileId}
          onLike={likePost}
          onComment={onCommentClick ?? (() => undefined)}
          onSave={savePost}
          onShare={sharePost}
          onReport={() => undefined}
          onPostClick={onPostClick}
        />
      ))}

      <InfiniteScrollTrigger
        onLoadMore={loadMore}
        hasMore={Boolean(hasNextPage)}
        isLoading={isFetchingNextPage}
      />
    </div>
  );
}
