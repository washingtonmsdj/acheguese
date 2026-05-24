import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { postService } from "@/core/posts/services";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService"; //  GATE 3 FASE 3C

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

  /**
   * Curtir/Descurtir post
   * Implementa otimistic update com rollback em caso de erro
   * Valida existência do post antes de process
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

    try {
      //  MIGRADO - Verificar se o post existe usando PostService
      const postExists = await postService.postExists(postId);

      if (!postExists) {
        if (import.meta.env.DEV) {
          logger.error(" Post não encontrado no banco:", { postId });
        }

        // Post não existe - limpar do cache
        queryClient.invalidateQueries({ queryKey: ["community-feed"] });
        queryClient.invalidateQueries({ queryKey: ["community-feed-aaa"] });

        toast.error("Este post não está mais disponível");
        return;
      }

      // Otimistic update
      const previousState = { ...state };
      const newIsLiked = !state.isLiked;
      const newLikesCount = newIsLiked
        ? state.likesCount + 1
        : state.likesCount - 1;

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

        //  GATE 3 FASE 3C - Usar SocialInteractionsService
        const result = await SocialInteractionsService.likePost(
          postId,
          activeProfile.id,
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

        //  GATE 3 FASE 3C - Usar SocialInteractionsService
        const result = await SocialInteractionsService.unlikePost(
          postId,
          activeProfile.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao remover curtida");
        }

        if (import.meta.env.DEV) {
          logger.info(" Curtida removida");
        }
      }

      // Invalidate cache do feed
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      queryClient.invalidateQueries({ queryKey: ["community-feed-aaa"] });

      if (import.meta.env.DEV) {
        logger.info(" Cache invalidado");
      }
    } catch (error: unknown) {
      // Rollback em caso de erro
      if (import.meta.env.DEV) {
        logger.error(" Erro no handleLike:", error);
      }

      setState(state); // Restaurar state original

      // Mensagem de erro específica
      if ((error as { code?: string })?.code === "23503") {
        toast.error("Este post não está mais disponível");
        // Limpar cache para remove post órfão
        queryClient.invalidateQueries({ queryKey: ["community-feed"] });
        queryClient.invalidateQueries({ queryKey: ["community-feed-aaa"] });
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
        //  GATE 3 FASE 3C - Usar SocialInteractionsService
        const result = await SocialInteractionsService.savePost(
          postId,
          activeProfile.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao salvar post");
        }

        toast.success("Post salvo com sucesso");
      } else {
        // Remover dos salvos
        //  GATE 3 FASE 3C - Usar SocialInteractionsService
        const result = await SocialInteractionsService.unsavePost(
          postId,
          activeProfile.id,
        );
        if (!result.success) {
          throw new Error(result.error || "Erro ao remover post dos salvos");
        }

        toast.success("Post removido dos salvos");
      }

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
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
   * Compartilhar post
   * Usa Web Share API quando disponível, fallback para copiar link
   */
  const handleShare = async () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("post", postId);
    const shareUrl = currentUrl.toString();
    const shareData = {
      title: "Post da Comunidade",
      text: "Confira este post no Achegue-se",
      url: shareUrl,
    };

    try {
      // Tentar usar Web Share API (mobile)
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);

        //  MIGRADO - Incrementar contador usando PostService
        await postService.incrementSharesCount(postId);
      } else {
        // Fallback: copiar link
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiado para a área de transferência");
      }
    } catch (error) {
      // Usuário cancelou ou erro
      if ((error as Error).name !== "AbortError") {
        logger.error("Error compartilhar:", error);
        toast.error("Não foi possível compartilhar o post");
      }
    }
  };

  return {
    state,
    isProcessing,
    handleLike,
    handleSave,
    handleShare,
  };
}
