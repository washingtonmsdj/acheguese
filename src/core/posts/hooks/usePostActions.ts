/**
 * FASE PROFILE.1.2 - Hook de ações de post migrado para ProfileService
 *
 * Migração dos acessos diretos ao banco para usar ProfileService
 * e verificações de permissão centralizadas
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { PostsFacade, postService } from "@/core/posts/services"; // ✅ SSOT v2.0
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { PostEngagementService } from "@/core/engagement/services/PostEngagementService";
import { communityFeedQueryKeys } from "@/core/feed";
interface FeedLikeablePost {
  id?: string;
  is_liked?: boolean;
  likes_count?: number;
}

interface FeedItemWithEmbeddedPost {
  type?: string;
  data?: FeedLikeablePost;
  id?: string;
}

type FeedItem = FeedItemWithEmbeddedPost | FeedLikeablePost;

interface CommunityFeedPage {
  feed?: FeedItem[];
  posts?: FeedItem[];
}

interface CommunityFeedCache {
  pages?: CommunityFeedPage[];
}

type FeedInteractionPatch = Partial<
  Pick<FeedLikeablePost, "is_liked" | "likes_count"> & { is_saved: boolean }
>;

function updateFeedItem(
  item: FeedItem,
  postId: string,
  updater: (
    post: FeedLikeablePost & { is_saved?: boolean },
  ) => FeedInteractionPatch,
): FeedItem {
  const embedded = "type" in item && item.type === "post";
  const post = (embedded ? item.data : item) as FeedLikeablePost & {
    is_saved?: boolean;
  };
  if ((post?.id ?? item.id) !== postId) return item;

  const updated = { ...post, ...updater(post) };
  return embedded ? { ...item, data: updated } : updated;
}

function updateFeedCache(
  cache: CommunityFeedCache | undefined,
  postId: string,
  updater: (
    post: FeedLikeablePost & { is_saved?: boolean },
  ) => FeedInteractionPatch,
): CommunityFeedCache | undefined {
  if (!cache?.pages) return cache;

  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      feed: page.feed?.map((item) => updateFeedItem(item, postId, updater)),
      posts: page.posts?.map((item) => updateFeedItem(item, postId, updater)),
    })),
  };
}

/**
 * Hook de ações de post migrado para ProfileService
 *
 * ✅ MIGRADO - Usa AuthContext integrado com ProfileService
 * ✅ MIGRADO - Verificações de permissão centralizadas
 * ✅ MIGRADO - Elimina acessos diretos desnecessários
 */
export function usePostActions() {
  const { user, activeProfile: profileContext } = useSessionContext();

  const queryClient = useQueryClient();

  // ✅ MIGRADO - Like/Unlike com verificação de permissão
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user || !profileContext) throw new Error("Usuário não autenticado");

      // ✅ MIGRADO - Verifica permissão usando isActive
      if (!profileContext.isActive) {
        throw new Error("Você não tem permissão para curtir posts");
      }

      // Resolve current engagement before applying an explicit idempotent command.
      const hasLiked = await PostEngagementService.hasLikedPost(postId);

      if (hasLiked) {
        // Descurtir
        const result = await PostEngagementService.unlikePost(postId);
        if (!result.success) {
          throw new Error(result.error || "Erro ao descurtir post");
        }

        return { action: "unlike" };
      } else {
        // Curtir
        const result = await PostEngagementService.likePost(postId);
        if (!result.success) {
          throw new Error(result.error || "Erro ao curtir post");
        }

        // ✅ MIGRADO - Criar notificação de like usando PostService
        return { action: "like" };
      }
    },
    // Optimistic update mantido igual
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({
        queryKey: communityFeedQueryKeys.root,
      });
      const previousFeeds = queryClient.getQueriesData<CommunityFeedCache>({
        queryKey: communityFeedQueryKeys.root,
      });

      queryClient.setQueriesData(
        { queryKey: communityFeedQueryKeys.root },
        (old: CommunityFeedCache | undefined) =>
          updateFeedCache(old, postId, (post) => {
            const isLiked = Boolean(post.is_liked);
            return {
              is_liked: !isLiked,
              likes_count: isLiked
                ? Math.max(0, (post.likes_count ?? 0) - 1)
                : (post.likes_count ?? 0) + 1,
            };
          }),
      );

      return { previousFeeds };
    },
    onError: (error: Error, _postId, context) => {
      context?.previousFeeds.forEach(([queryKey, data]) =>
        queryClient.setQueryData(queryKey, data),
      );
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: ["user-reputation"] });
    },
  });
  // ✅ MIGRADO - Save/Unsave com verificação de permissão
  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user || !profileContext) throw new Error("Usuário não autenticado");

      // ✅ MIGRADO - Verifica permissão usando isActive
      if (!profileContext.isActive) {
        throw new Error("Você não tem permissão para salvar posts");
      }

      // Resolve current engagement before applying an explicit idempotent command.
      const hasSaved = await PostEngagementService.hasSavedPost(postId);

      if (hasSaved) {
        // Remover dos salvos
        const result = await PostEngagementService.unsavePost(postId);
        if (!result.success) {
          throw new Error(result.error || "Erro ao remover post dos salvos");
        }

        toast.success("Post removido dos salvos");
        return { action: "unsave" };
      } else {
        // Salvar
        const result = await PostEngagementService.savePost(postId);
        if (!result.success) {
          throw new Error(result.error || "Erro ao salvar post");
        }

        toast.success("Post salvo!");
        return { action: "save" };
      }
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({
        queryKey: communityFeedQueryKeys.root,
      });
      const previousFeeds = queryClient.getQueriesData<CommunityFeedCache>({
        queryKey: communityFeedQueryKeys.root,
      });
      queryClient.setQueriesData(
        { queryKey: communityFeedQueryKeys.root },
        (old: CommunityFeedCache | undefined) =>
          updateFeedCache(old, postId, (post) => ({
            is_saved: !post.is_saved,
          })),
      );
      return { previousFeeds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
    },
    onError: (error: Error, _postId, context) => {
      context?.previousFeeds.forEach(([queryKey, data]) =>
        queryClient.setQueryData(queryKey, data),
      );
      toast.error(error.message);
    },
  });

  const sharePost = async (postId: string) => {
    const { sharePost: sharePostLink } = await import(
      "@/core/posts/utils/postShare"
    );
    await sharePostLink({
      postId,
      title: "Post da Comunidade",
      onShared: profileContext
        ? () =>
            postService.recordPostShare(postId).catch((error) => {
              logger.warn("Failed to record post share:", error);
            })
        : undefined,
    });
  };

  // ✅ MIGRADO - Delete com verificação de permissão usando PostService
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user || !profileContext) throw new Error("Usuário não autenticado");

      // ✅ MIGRADO - Verifica permissão usando isActive
      if (!profileContext.isActive) {
        throw new Error("Você não tem permissão para deletar posts");
      }

      // ✅ MIGRADO - Usar PostsFacade.mutations para deletar com verificação de ownership (SSOT v2.0)
      await PostsFacade.mutations.deletePostByAuthor(postId, profileContext.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
      toast.success("Post excluído");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    likePost: likeMutation.mutate,
    savePost: saveMutation.mutate,
    sharePost,
    deletePost: deleteMutation.mutate,
    isLiking: likeMutation.isPending,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
