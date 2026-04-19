/**
 * Interaction Service - GATE 4A FASE 2
 *
 * ✅ SSOT COMPLIANT - Delega todas as operações aos services corretos
 * - Likes → SocialInteractionsService
 * - Saved Posts → SocialInteractionsService
 * - Comments → CommentService
 */
import { logger } from '@/shared/utils/logger';
import { InteractionError } from "../../../services/interaction/types";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import { commentService } from "@/core/comments/services";
import type { Comment } from "@/core/comments/types";
class InteractionService {
  /**
   * ✅ SSOT - Delega para SocialInteractionsService
   */
  async likePost(postId: string, profileId: string): Promise<void> {
    try {
      const result = await SocialInteractionsService.likePost(
        postId,
        profileId,
      );
      if (!result.success) {
        throw new InteractionError(
          result.error || "Erro ao curtir post",
          "LIKE_FAILED",
        );
      }
    } catch (error) {
      if (error instanceof InteractionError) throw error;
      throw new InteractionError(
        "Unexpected error liking post",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * ✅ SSOT - Delega para SocialInteractionsService
   */
  async unlikePost(postId: string, profileId: string): Promise<void> {
    try {
      const result = await SocialInteractionsService.unlikePost(
        postId,
        profileId,
      );
      if (!result.success) {
        throw new InteractionError(
          result.error || "Erro ao descurtir post",
          "UNLIKE_FAILED",
        );
      }
    } catch (error) {
      if (error instanceof InteractionError) throw error;
      throw new InteractionError(
        "Unexpected error unliking post",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * ✅ GATE 4A FASE 2 - Delega para CommentService
   * @deprecated Use commentService.createComment() instead. Will be removed in v2.0.0
   */
  async addComment(
    postId: string,
    profileId: string,
    data: { content: string },
  ): Promise<Comment | null> {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        '⚠️  InteractionService.addComment() is deprecated.\n' +
        '   Use commentService.createComment() instead.\n' +
        '   This method will be removed in v2.0.0'
      );
    }
    return (await commentService.createComment({
      post_id: postId,
      author_profile_id: profileId,
      content: data.content,
    })) as any;
  }

  /**
   * ✅ GATE 4A FASE 2 - Delega para CommentService
   * @deprecated Use commentService.deleteComment() instead. Will be removed in v2.0.0
   */
  async deleteComment(commentId: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        '⚠️  InteractionService.deleteComment() is deprecated.\n' +
        '   Use commentService.deleteComment() instead.\n' +
        '   This method will be removed in v2.0.0'
      );
    }
    await commentService.deleteComment(commentId);
  }

  /**
   * ✅ SSOT - Delega para SocialInteractionsService
   */
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
        "Unexpected error saving post",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * ✅ SSOT - Delega para SocialInteractionsService
   */
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
        "Unexpected error unsaving post",
        "UNKNOWN_ERROR",
      );
    }
  }
}

export const interactionService = new InteractionService();
