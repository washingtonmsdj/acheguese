import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { commentService } from "@/core/comments/services";

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
  replies?: Comment[];
}

export function useComments(postId: string | null, _userId?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const commentsWithReplies =
        await commentService.getCommentsByPost(postId);

      const formattedComments: Comment[] = commentsWithReplies.map(
        (comment: any) => ({
          id: comment.id,
          post_id: comment.post_id,
          author_profile_id: comment.author_profile_id || comment.profile_id,
          author_name: comment.profile?.name || "Usuário",
          author_avatar: comment.profile?.avatar_url,
          content: comment.content,
          parent_id: comment.parent_id,
          created_at: comment.created_at,
          likes_count: comment.likes_count,
          is_liked: false,
          replies: (comment.replies || []).map((reply: any) => ({
            id: reply.id,
            post_id: reply.post_id,
            author_profile_id: reply.author_profile_id || reply.profile_id,
            author_name: reply.profile?.name || "Usuário",
            author_avatar: reply.profile?.avatar_url,
            content: reply.content,
            parent_id: reply.parent_id,
            created_at: reply.created_at,
            likes_count: reply.likes_count,
            is_liked: false,
          })),
        }),
      );

      setComments(formattedComments);
      return formattedComments;
    } catch (error) {
      logger.error("Error fetching comments:", error);
      toast.error("Erro ao carregar comentários");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addComment = (comment: Comment, parentId?: string) => {
    if (parentId) {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), comment] };
          }
          return c;
        }),
      );
    } else {
      setComments((prev) => [comment, ...prev]);
    }
  };

  const removeComment = (commentId: string) => {
    setComments((prev) =>
      prev.filter((c) => {
        if (c.id === commentId) return false;
        if (c.replies) {
          c.replies = c.replies.filter((r) => r.id !== commentId);
        }
        return true;
      }),
    );
  };

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    removeComment,
    setComments,
  };
}
