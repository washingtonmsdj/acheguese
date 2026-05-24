/**
 * InteractionService - SSOT de interacoes sociais.
 *
 * Coordena curtidas, salvos e comentarios delegando para os services
 * de dominio corretos, sem acesso direto ao banco.
 */
import { InteractionError } from "../types";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import { CommentService } from "@/core/comments/services";
import type { Comment } from "@/core/comments/types";

class InteractionService {
  async likePost(postId: string, profileId: string): Promise<void> {
    try {
      const result = await SocialInteractionsService.likePost(postId, profileId);
      if (!result.success) {
        throw new InteractionError(
          result.error || "Erro ao curtir post",
          "LIKE_FAILED",
        );
      }
    } catch (error) {
      if (error instanceof InteractionError) throw error;
      throw new InteractionError(
        "Erro inesperado ao curtir post",
        "UNKNOWN_ERROR",
      );
    }
  }

  async unlikePost(postId: string, profileId: string): Promise<void> {
    try {
      const result = await SocialInteractionsService.unlikePost(postId, profileId);
      if (!result.success) {
        throw new InteractionError(
          result.error || "Erro ao descurtir post",
          "UNLIKE_FAILED",
        );
      }
    } catch (error) {
      if (error instanceof InteractionError) throw error;
      throw new InteractionError(
        "Erro inesperado ao descurtir post",
        "UNKNOWN_ERROR",
      );
    }
  }

  async addComment(
    postId: string,
    profileId: string,
    data: { content: string },
  ): Promise<Comment | null> {
    return (await CommentService.createComment({
      post_id: postId,
      author_profile_id: profileId,
      content: data.content,
    })) as Comment | null;
  }

  async deleteComment(commentId: string): Promise<void> {
    await CommentService.deleteComment(commentId);
  }

  async savePost(postId: string, userId: string): Promise<void> {
    try {
      const result = await SocialInteractionsService.savePost(postId, userId);
      if (!result.success) {
        throw new InteractionError(
          result.error || "Erro ao salvar post",
          "SAVE_FAILED",
        );
      }
    } catch (error) {
      if (error instanceof InteractionError) throw error;
      throw new InteractionError(
        "Erro inesperado ao salvar post",
        "UNKNOWN_ERROR",
      );
    }
  }

  async unsavePost(postId: string, userId: string): Promise<void> {
    try {
      const result = await SocialInteractionsService.unsavePost(postId, userId);
      if (!result.success) {
        throw new InteractionError(
          result.error || "Erro ao remover post dos salvos",
          "UNSAVE_FAILED",
        );
      }
    } catch (error) {
      if (error instanceof InteractionError) throw error;
      throw new InteractionError(
        "Erro inesperado ao remover post dos salvos",
        "UNKNOWN_ERROR",
      );
    }
  }
}

export const interactionService = new InteractionService();
