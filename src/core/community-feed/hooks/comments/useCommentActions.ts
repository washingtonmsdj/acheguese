import { useState } from "react";
import { toast } from "sonner";

import { CommentService } from "@/core/comments/services";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";

interface CreatedCommunityComment {
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
  _legacyActorId?: string,
  userName?: string,
  userAvatar?: string,
) {
  const { user, activeProfile } = useSessionContext();
  const [submitting, setSubmitting] = useState(false);

  const submitComment = async (
    content: string,
    parentId?: string,
  ): Promise<CreatedCommunityComment | null> => {
    if (!content.trim() || !postId) return null;
    if (!user || !activeProfile?.id) {
      toast.error("Faca login para comentar");
      return null;
    }

    setSubmitting(true);
    try {
      const createdComment = await CommentService.createComment({
        content: content.trim(),
        parent_id: parentId || undefined,
        post_id: postId,
      });

      if (!createdComment) {
        toast.error("Erro ao criar comentario");
        return null;
      }

      toast.success("Comentario publicado");
      return {
        id: createdComment.id,
        post_id: createdComment.post_id,
        author_profile_id: createdComment.author_profile_id,
        author_name:
          userName || activeProfile.displayName || activeProfile.name || "Voce",
        author_avatar: userAvatar || activeProfile.avatarUrl || undefined,
        content: createdComment.content,
        parent_id: createdComment.parent_id || null,
        created_at: createdComment.created_at,
        likes_count: createdComment.likes_count,
        is_liked: false,
      };
    } catch (error) {
      logger.error("Error submitting comment:", error);
      toast.error("Erro ao publicar comentario");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      const deleted = await CommentService.deleteComment(commentId);
      if (!deleted) throw new Error("Comment deletion was rejected");
      toast.success("Comentario excluido");
      return true;
    } catch (error) {
      logger.error("Error deleting comment:", error);
      toast.error("Erro ao excluir comentario");
      return false;
    }
  };

  const updateComment = async (
    commentId: string,
    content: string,
  ): Promise<boolean> => {
    if (!content.trim()) {
      toast.error("Comentario nao pode ficar vazio");
      return false;
    }

    try {
      const updated = await CommentService.updateComment(commentId, {
        content: content.trim(),
      });
      if (!updated) throw new Error("Comment update was rejected");
      toast.success("Comentario atualizado");
      return true;
    } catch (error) {
      logger.error("Error updating comment:", error);
      toast.error("Erro ao atualizar comentario");
      return false;
    }
  };

  return { submitting, submitComment, deleteComment, updateComment };
}
