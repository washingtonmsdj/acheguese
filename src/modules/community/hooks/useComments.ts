import { useState } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { commentService } from "@/core/comments/services";

export interface Comment {
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

interface CommentProfile {
  name?: string | null;
  avatar_url?: string | null;
}

interface RawComment {
  id: string;
  post_id: string;
  author_profile_id?: string | null;
  profile_id?: string | null;
  profile?: CommentProfile | null;
  content: string;
  parent_id: string | null;
  created_at: string;
  likes_count: number;
  replies?: RawComment[];
}

function mapRawComment(raw: RawComment): Comment {
  return {
    id: raw.id,
    post_id: raw.post_id,
    author_profile_id: raw.author_profile_id || raw.profile_id || "",
    author_name: raw.profile?.name || "Usuário",
    author_avatar: raw.profile?.avatar_url ?? undefined,
    content: raw.content,
    parent_id: raw.parent_id,
    created_at: raw.created_at,
    likes_count: raw.likes_count,
    is_liked: false,
    replies: (raw.replies || []).map(mapRawComment),
  };
}

export function useComments(postId: string | null, _userId?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const commentsWithReplies = await commentService.getCommentsByPost(postId);
      const formattedComments = (commentsWithReplies as RawComment[]).map(mapRawComment);

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
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== commentId),
        })),
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
