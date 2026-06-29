import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { CommentService } from "@/core/comments/services";
import type { Comment as CommentModel } from "@/core/comments/types";

interface CommentWithReplies {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
  parent_id: string | null;
  replies?: CommentWithReplies[];
}

type CommentThreadItem = CommentModel & {
  author_name?: string;
  author_avatar?: string;
  replies?: CommentThreadItem[];
};

export const useComments = (
  postId: string | null,
  open: boolean,
  userId?: string,
) => {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    avatar_url: string;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    profileService.getProfilesSummary([userId]).then((profiles) => {
      if (profiles.length === 0) {
        logger.warn("Profile not found for userId:", userId);
        return;
      }
      const p = profiles[0];
      setProfile({ name: p.displayName, avatar_url: p.avatarUrl || "" });
    });
  }, [userId]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const commentsData = await CommentService.getCommentsByPost(postId);

      const formattedComments: CommentWithReplies[] = (commentsData as CommentThreadItem[]).map(
        (comment) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          author_name:
            comment.profile?.displayName || comment.author_name || "Usuário",
          author_avatar:
            comment.profile?.avatarUrl || comment.author_avatar || "",
          parent_id: comment.parent_id || null,
          replies: (comment.replies || []).map((reply) => ({
            id: reply.id,
            content: reply.content,
            created_at: reply.created_at,
            author_name: reply.profile?.displayName || reply.author_name || "Usuário",
            author_avatar:
              reply.profile?.avatarUrl || reply.author_avatar || "",
            parent_id: reply.parent_id || null,
          })),
        }),
      );

      setComments(formattedComments);
    } catch (err) {
      logger.error("Error fetching comments:", err);
      toast.error("Erro ao carregar comentários");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (open && postId) fetchComments();
    if (!open) setComments([]);
  }, [open, postId, fetchComments]);

  const addComment = useCallback(
    async (content: string, parentId: string | null = null) => {
      if (!content.trim() || !postId || !userId) {
        if (!userId) toast.error("Faça login para comentar");
        return false;
      }

      try {
        const context = await profileService.getProfileContext(userId);
        if (!context) {
          toast.error("Profile não encontrado");
          return false;
        }

        await CommentService.createComment({
          post_id: postId,
          author_profile_id: context.id,
          content: content.trim(),
          parent_id: parentId ?? undefined,
        });

        await fetchComments();
        toast.success("Comentário adicionado!");
        return true;
      } catch (error) {
        logger.error("Error adding comment:", error);
        toast.error("Erro ao comentar");
        return false;
      }
    },
    [postId, userId, fetchComments],
  );

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length ?? 0),
    0,
  );

  return {
    comments,
    loading,
    profile,
    totalCount,
    addComment,
    refetch: fetchComments,
  };
};
