import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { commentService } from "@/core/comments/services"; // ✅ GATE 4A FASE 2
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService"; // ✅ GATE 3 FASE 3C
/**
 * Hook profissional para gerenciar interações com comentários
 *
 * Features:
 * - Curtir/Descurtir comentários
 * - Otimistic updates para UX instantânea
 * - Rollback automático em caso de erro
 * - Invalidação de cache
 * - Tratamento robusto de erros
 */

interface CommentInteractionState {
  [commentId: string]: {
    isLiked: boolean;
    likesCount: number;
  };
}

export function useCommentInteractions(postId: string) {
  const { user, activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const [state, setState] = useState<CommentInteractionState>({});
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>(
    {},
  );

  /**
   * Inicializar state de um comentário
   */
  const initializeComment = (
    commentId: string,
    isLiked: boolean,
    likesCount: number,
  ) => {
    setState((prev) => ({
      ...prev,
      [commentId]: { isLiked, likesCount },
    }));
  };

  /**
   * Curtir/Descurtir comentário
   */
  const handleLike = async (commentId: string) => {
    if (isProcessing[commentId] || !user || !activeProfile) {
      if (!user) {
        toast.error("Faça login para curtir comentários");
      }
      return;
    }

    // Otimistic update
    const previousState = state[commentId] || { isLiked: false, likesCount: 0 };
    const newIsLiked = !previousState.isLiked;
    const newLikesCount = newIsLiked
      ? previousState.likesCount + 1
      : previousState.likesCount - 1;

    setState((prev) => ({
      ...prev,
      [commentId]: {
        isLiked: newIsLiked,
        likesCount: newLikesCount,
      },
    }));

    setIsProcessing((prev) => ({ ...prev, [commentId]: true }));

    try {
      // ✅ GATE 4A FASE 2 - Usar SocialInteractionsService para likes
      if (newIsLiked) {
        const result = await SocialInteractionsService.likeComment(
          commentId,
          activeProfile.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao curtir comentário");
        }
      } else {
        const result = await SocialInteractionsService.unlikeComment(
          commentId,
          activeProfile.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao descurtir comentário");
        }
      }

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    } catch (error) {
      // Rollback em caso de erro
      setState((prev) => ({
        ...prev,
        [commentId]: previousState,
      }));

      logger.error("Error curtir comentário:", error);
      toast.error("Não foi possível curtir o comentário. Tente novamente.");
    } finally {
      setIsProcessing((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  /**
   * Obter state de um comentário
   */
  const getCommentState = (commentId: string) => {
    return state[commentId] || { isLiked: false, likesCount: 0 };
  };

  return {
    state,
    isProcessing,
    initializeComment,
    handleLike,
    getCommentState,
  };
}
