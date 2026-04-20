/**
 * FASE PROFILE.1.2 - Hook de ações de post migrado para ProfileService
 *
 * Migração dos acessos diretos ao banco para usar ProfileService
 * e verificações de permissão centralizadas
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles/services";
import { PostsFacade, postService } from "@/core/posts/services"; // ✅ SSOT v2.0
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import { ModerationService } from "@/core/moderation";

// Helper para criar notificação de like
async function createLikeNotification(postId: string, userId: string) {
  try {
    // ✅ SSOT — Usar PostService para criar notificação
    await postService.createLikeNotification(postId, userId);
  } catch (error) {
    logger.error("Error creating like notification:", error);
  }
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

      // ✅ MIGRADO - Verifica permissão usando ProfileService
      if (!profileContext.status.isActive || profileContext.status.isBlocked) {
        throw new Error("Você não tem permissão para curtir posts");
      }

      // ✅ MIGRADO - Buscar informações do post usando PostsFacade.queries (SSOT v2.0)
      const authorProfileId = await PostsFacade.queries.getPostAuthorId(postId);

      // ✅ GATE 3 FASE 3C - Verificar se já curtiu usando SocialInteractionsService
      const hasLiked = await SocialInteractionsService.hasLikedPost(
        postId,
        profileContext.id,
      );

      if (hasLiked) {
        // Descurtir
        const result = await SocialInteractionsService.unlikePost(
          postId,
          profileContext.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao descurtir post");
        }

        // ✅ MIGRADO - Atualizar reputação usando PostService
        if (authorProfileId) {
          try {
            await postService.incrementUserReputation(authorProfileId, -2);
          } catch (error) {
            logger.warn("Failed to update reputation:", error);
          }
        }

        return { action: "unlike", authorProfileId: authorProfileId };
      } else {
        // Curtir
        const result = await SocialInteractionsService.likePost(
          postId,
          profileContext.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao curtir post");
        }

        // ✅ MIGRADO - Criar notificação de like usando PostService
        await createLikeNotification(postId, profileContext.id);

        // ✅ MIGRADO - Incrementar reputação usando PostService
        if (authorProfileId) {
          try {
            await postService.incrementUserReputation(authorProfileId, 2);
          } catch (error) {
            logger.warn("Failed to update reputation:", error);
          }
        }

        return { action: "like", authorProfileId: authorProfileId };
      }
    },
    // Optimistic update mantido igual
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["community-feed"] });
      const previousFeed = queryClient.getQueryData(["community-feed"]);

      queryClient.setQueriesData(
        { queryKey: ["community-feed"] },
        (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              feed: (page.feed || page.posts || []).map((item: any) => {
                const postData = item.type === "post" ? item.data : item;
                const postId2 = postData?.id || item?.id;
                if (postId2 === postId) {
                  const isCurrentlyLiked = postData.is_liked;
                  const updated = {
                    ...postData,
                    is_liked: !isCurrentlyLiked,
                    likes_count: isCurrentlyLiked
                      ? (postData.likes_count || 1) - 1
                      : (postData.likes_count || 0) + 1,
                  };
                  return item.type === "post"
                    ? { ...item, data: updated }
                    : updated;
                }
                return item;
              }),
            })),
          };
        },
      );

      return { previousFeed };
    },
    onError: (error: Error, postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["community-feed"], context.previousFeed);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      queryClient.invalidateQueries({ queryKey: ["user-reputation"] });
    },
  });
  // ✅ MIGRADO - Save/Unsave com verificação de permissão
  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user || !profileContext) throw new Error("Usuário não autenticado");

      // ✅ MIGRADO - Verifica permissão usando ProfileService
      if (!profileContext.status.isActive || profileContext.status.isBlocked) {
        throw new Error("Você não tem permissão para salvar posts");
      }

      // ✅ GATE 3 FASE 3C - Verificar se já salvou usando SocialInteractionsService
      const hasSaved = await SocialInteractionsService.hasSavedPost(
        postId,
        profileContext.id,
      );

      if (hasSaved) {
        // Remover dos salvos
        const result = await SocialInteractionsService.unsavePost(
          postId,
          profileContext.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao remover post dos salvos");
        }

        toast.success("Post removido dos salvos");
        return { action: "unsave" };
      } else {
        // Salvar
        const result = await SocialInteractionsService.savePost(
          postId,
          profileContext.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao salvar post");
        }

        toast.success("Post salvo!");
        return { action: "save" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ✅ SSOT — Follow/Unfollow via PostService
  const followMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user || !profileContext) throw new Error("Usuário não autenticado");

      if (!profileContext.status.isActive || profileContext.status.isBlocked) {
        throw new Error("Você não tem permissão para seguir posts");
      }

      const result = await postService.toggleFollowPost(
        postId,
        profileContext.id,
      );
      const message =
        result.action === "follow"
          ? "Você está seguindo este post"
          : "Você não está mais seguindo este post";
      toast.success(message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Share post (mantido igual - não precisa de migração)
  const sharePost = (postId: string) => {
    const url = `${window.location.origin}/comunidade?post=${postId}`;

    if (navigator.share) {
      navigator
        .share({
          title: "Post da Comunidade",
          url: url,
        })
        .catch(() => {
          navigator.clipboard.writeText(url);
          toast.success("Link copiado!");
        });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  // ✅ MIGRADO - Report com verificação de permissão
  const reportMutation = useMutation({
    mutationFn: async ({
      postId,
      reason,
      description,
    }: {
      postId: string;
      reason: string;
      description?: string;
    }) => {
      if (!user || !profileContext) throw new Error("Usuário não autenticado");

      // ✅ MIGRADO - Verifica permissão usando ProfileService
      if (!profileContext.status.isActive || profileContext.status.isBlocked) {
        throw new Error("Você não tem permissão para reportar posts");
      }

      // ✅ GATE 4A FASE 3 - Usar ModerationService
      await ModerationService.reportContent({
        targetType: "post",
        targetId: postId,
        reporterId: profileContext.id,
        reason,
        details: description,
      });
    },
    onSuccess: () => {
      toast.success(
        "Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // ✅ MIGRADO - Delete com verificação de permissão usando PostService
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user || !profileContext) throw new Error("Usuário não autenticado");

      // ✅ MIGRADO - Verifica permissão usando ProfileService
      if (!profileContext.status.isActive || profileContext.status.isBlocked) {
        throw new Error("Você não tem permissão para deletar posts");
      }

      // ✅ MIGRADO - Usar PostsFacade.mutations para deletar com verificação de ownership (SSOT v2.0)
      await PostsFacade.mutations.deletePostByAuthor(postId, profileContext.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success("Post excluído");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    likePost: likeMutation.mutate,
    savePost: saveMutation.mutate,
    followPost: followMutation.mutate,
    sharePost,
    reportPost: reportMutation.mutate,
    deletePost: deleteMutation.mutate,
    isLiking: likeMutation.isPending,
    isSaving: saveMutation.isPending,
    isFollowing: followMutation.isPending,
    isReporting: reportMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
