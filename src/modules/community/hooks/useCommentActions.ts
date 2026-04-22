/**
 * Use useAddComment ou useDeleteComment do core/comments/hooks em novos fluxos.
 * Este hook segue exposto para estabilidade da API publica do modulo.
 */

import { useState } from "react";
import { toast } from "sonner";
import { useCommunityInteractions } from "@/core/community/hooks/useCommunityInteractions";
import { logger } from "@/shared/utils/logger";
import { commentService } from "@/core/comments/services";
import { profileService } from "@/core/profiles/services/ProfileService";

interface Comment {
  id: string;
  post_id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
}

export function useCommentActions(
  postId: string,
  userId?: string,
  userName?: string,
  userAvatar?: string,
) {
  const [submitting, setSubmitting] = useState(false);
  const { recordInteraction } = useCommunityInteractions();

  const submitComment = async (
    content: string,
    parentId?: string,
  ): Promise<Comment | null> => {
    if (!content.trim() || !userId || !postId) {
      if (!userId) toast.error("Faça login para comentar");
      return null;
    }

    setSubmitting(true);
    try {
      const context = await profileService.getProfileContext(userId);
      if (!context) {
        toast.error("Profile não encontrado");
        return null;
      }

      const createdComment = await commentService.createComment({
        content: content.trim(),
        parent_id: parentId || undefined,
        post_id: postId,
        author_profile_id: context.id,
      });

      if (!createdComment) {
        toast.error("Erro ao criar comentário");
        return null;
      }

      const newComment: Comment = {
        id: createdComment.id,
        post_id: createdComment.post_id,
        author_profile_id: createdComment.author_profile_id,
        author_name: userName || "Você",
        author_avatar: userAvatar,
        content: createdComment.content,
        parent_id: createdComment.parent_id || null,
        created_at: createdComment.created_at,
        likes_count: createdComment.likes_count,
        is_liked: false,
      };

      recordInteraction(
        "comment_added",
        "comment",
        createdComment.id,
        {},
        {
          showToast: true,
        },
      );

      toast.success("Comentário publicado!");
      return newComment;
    } catch (error) {
      logger.error("Error submitting comment:", error);
      toast.error("Erro ao publicar comentário");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!confirm("Tem certeza que deseja excluir este comentário?"))
      return false;

    try {
      await commentService.deleteComment(commentId);
      toast.success("Comentário excluído");
      return true;
    } catch (error) {
      logger.error("Error deleting comment:", error);
      toast.error("Erro ao excluir comentário");
      return false;
    }
  };

  return { submitting, submitComment, deleteComment };
}
