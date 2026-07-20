import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { postService } from "@/core/posts/services";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { PostEngagementService } from "@/core/engagement/services/PostEngagementService";
import { communityFeedQueryKeys } from "@/core/feed";
import { sharePost } from "@/core/posts/utils/postShare";

/**
 * Hook profissional para gerenciar interações com posts
 *
 * SSOT MIGRATION - FASE 10: Migrado para usar PostService
 *
 * Features:
 * - Otimistic updates para UX instantânea
 * - Rollback automático em caso de erro
 * - Invalidação de cache do React Query
 * - Tratamento robusto de erros
 * - Prevenção de race conditions
 */

interface PostInteractionState {
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
}

export function usePostInteractions(
  postId: string,
  initialState: PostInteractionState,
) {
  const { user, activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const [state, setState] = useState(initialState);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;
    setState({
      isLiked: initialState.isLiked,
      isSaved: initialState.isSaved,
      likesCount: initialState.likesCount,
    });
  }, [initialState.isLiked, initialState.isSaved, initialState.likesCount, isProcessing]);

  /**
   * Curtir/Descurtir post
   * Implementa otimistic update com rollback em caso de erro
   */
  const handleLike = async () => {
    if (isProcessing || !user || !activeProfile) {
      if (!user) {
        if (import.meta.env.DEV) {
          logger.info(" Usuário não autenticado");
        }
        toast.error("Faça login para curtir posts");
      }
      return;
    }

    setIsProcessing(true);
    const previousState = { ...state };

    try {
      // Otimistic update
      const newIsLiked = !state.isLiked;
      const newLikesCount = newIsLiked
        ? state.likesCount + 1
        : Math.max(0, state.likesCount - 1);

      if (import.meta.env.DEV) {
        logger.info(" Otimistic update:", {
          previousState,
          newIsLiked,
          newLikesCount,
        });
      }

      setState({
        ...state,
        isLiked: newIsLiked,
        likesCount: newLikesCount,
      });

      if (newIsLiked) {
        // Adicionar curtida
        if (import.meta.env.DEV) {
          logger.info(" Adicionando curtida...");
        }

        // Canonical Post engagement owner.
        const result = await PostEngagementService.likePost(
          postId,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao curtir post");
        }

        if (import.meta.env.DEV) {
          logger.info(" Curtida adicionada");
        }
      } else {
        // Remover curtida
        if (import.meta.env.DEV) {
          logger.info(" Removendo curtida...");
        }

        // Canonical Post engagement owner.
        const result = await PostEngagementService.unlikePost(
          postId,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao remover curtida");
        }

        if (import.meta.env.DEV) {
          logger.info(" Curtida removida");
        }
      }

      // Invalidate cache do feed
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });

      if (import.meta.env.DEV) {
        logger.info(" Cache invalidado");
      }
    } catch (error: unknown) {
      // Rollback em caso de erro
      if (import.meta.env.DEV) {
        logger.error(" Erro no handleLike:", error);
      }

      setState(previousState);

      // Mensagem de erro específica
      if ((error as { code?: string })?.code === "23503") {
        toast.error("Este post não está mais disponível");
        // Limpar cache para remove post órfão
        queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
      } else {
        toast.error("Não foi possível curtir o post. Tente novamente.");
      }
    } finally {
      setIsProcessing(false);
      if (import.meta.env.DEV) {
        logger.info(" handleLike finalizado");
      }
    }
  };

  /**
   * Salvar/Remover post dos salvos
   * Implementa otimistic update com rollback em caso de erro
   */
  const handleSave = async () => {
    if (isProcessing || !user || !activeProfile) {
      if (!user) {
        toast.error("Faça login para save posts");
      }
      return;
    }

    // Otimistic update
    const previousState = { ...state };
    const newIsSaved = !state.isSaved;

    setState({
      ...state,
      isSaved: newIsSaved,
    });

    setIsProcessing(true);

    try {
      if (newIsSaved) {
        // Salvar post
        // Canonical Post engagement owner.
        const result = await PostEngagementService.savePost(
          postId,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao salvar post");
        }

        toast.success("Post salvo com sucesso");
      } else {
        // Remover dos salvos
        // Canonical Post engagement owner.
        const result = await PostEngagementService.unsavePost(
          postId,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao remover post dos salvos");
        }

        toast.success("Post removido dos salvos");
      }

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    } catch (error) {
      // Rollback em caso de erro
      setState(previousState);

      logger.error("Error save post:", error);
      toast.error("Não foi possível save o post. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Compartilhar post — usa o utilitário SSOT `sharePost`.
   * Web Share API quando disponível, fallback para clipboard.
   */
  const handleShare = async () => {
    await sharePost({
      postId,
      title: "Post da Comunidade",
      text: "Confira este post no Achegue-se",
      onShared: activeProfile
        ? () =>
            postService.recordPostShare(postId).catch((error) => {
              logger.warn("Failed to record post share:", error);
            })
        : undefined,
    });
  };

  return {
    state,
    isProcessing,
    handleLike,
    handleSave,
    handleShare,
  };
}
