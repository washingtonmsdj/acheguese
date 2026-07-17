import { useCallback, useState } from "react";
import { toast } from "sonner";

import { CommentService } from "@/core/comments/services";
import type { CommentWithReplies } from "@/core/comments/types";
import { logger } from "@/shared/utils/logger";

export interface CommunityComment {
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
  replies?: CommunityComment[];
}

function mapComment(raw: CommentWithReplies): CommunityComment {
  return {
    id: raw.id,
    post_id: raw.post_id,
    author_profile_id: raw.author_profile_id,
    author_name: raw.profile?.displayName || "Usuario",
    author_avatar: raw.profile?.avatarUrl ?? undefined,
    content: raw.content,
    parent_id: raw.parent_id ?? null,
    created_at: raw.created_at,
    likes_count: raw.likes_count,
    is_liked: Boolean(raw.is_liked),
    replies: raw.replies.map(mapComment),
  };
}

function appendReply(
  comments: CommunityComment[],
  parentId: string,
  reply: CommunityComment,
): CommunityComment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...(comment.replies ?? []), reply] };
    }

    if (!comment.replies?.length) return comment;
    return {
      ...comment,
      replies: appendReply(comment.replies, parentId, reply),
    };
  });
}

function removeFromTree(
  comments: CommunityComment[],
  commentId: string,
): CommunityComment[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies
        ? removeFromTree(comment.replies, commentId)
        : undefined,
    }));
}

export function useComments(postId: string | null, _userId?: string) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return [];

    setLoading(true);
    try {
      const result = await CommentService.getCommentsByPost(postId);
      const formattedComments = result.map(mapComment);
      setComments(formattedComments);
      return formattedComments;
    } catch (error) {
      logger.error("Error fetching comments:", error);
      toast.error("Erro ao carregar comentarios");
      return [];
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = (comment: CommunityComment, parentId?: string) => {
    setComments((current) =>
      parentId
        ? appendReply(current, parentId, comment)
        : [comment, ...current],
    );
  };

  const removeComment = (commentId: string) => {
    setComments((current) => removeFromTree(current, commentId));
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
