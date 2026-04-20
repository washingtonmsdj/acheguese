import React from "react";
import { AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { CommentItem } from "./CommentItem";
import { INLINE_STYLES } from "../styles/communityDesignSystem";

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

interface CommentsListProps {
  comments: Comment[];
  loading: boolean;
  currentUserId?: string;
  postAuthorId?: string;
  getCommentState: (id: string) => { isLiked: boolean; likesCount: number };
  isProcessing: Record<string, boolean>;
  onLike: (commentId: string) => void;
  onReply: (id: string, name: string) => void;
  onDelete: (commentId: string) => void;
}

export function CommentsList({
  comments,
  loading,
  currentUserId,
  postAuthorId,
  getCommentState,
  isProcessing,
  onLike,
  onReply,
  onDelete,
}: CommentsListProps) {
  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0,
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton
              className="w-9 h-9 rounded-full flex-shrink-0"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            />
            <div className="flex-1 space-y-2">
              <Skeleton
                className="h-3 w-24"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              />
              <Skeleton
                className="h-4 w-full"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              />
              <Skeleton
                className="h-4 w-3/4"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (totalComments === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-teal-400/10 flex items-center justify-center mb-3">
          <Send className="w-8 h-8 text-teal-400" />
        </div>
        <p
          className="text-sm font-medium mb-1"
          style={INLINE_STYLES.textPrimary}
        >
          Nenhum comentário ainda
        </p>
        <p className="text-xs" style={INLINE_STYLES.textSecondary}>
          Seja o primeiro a comentar!
        </p>
      </div>
    );
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwnComment = currentUserId === comment.author_profile_id;
    const isPostOwner = currentUserId === postAuthorId;
    const canDelete = isOwnComment || isPostOwner;
    const state = getCommentState(comment.id);

    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          isReply={isReply}
          isOwnComment={isOwnComment}
          canDelete={canDelete}
          isLiked={state.isLiked}
          likesCount={state.likesCount}
          isProcessing={isProcessing[comment.id] || false}
          currentUserId={currentUserId}
          onLike={onLike}
          onReply={!isReply ? onReply : undefined}
          onDelete={onDelete}
        />

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="space-y-4">
        {comments.map((comment) => renderComment(comment))}
      </div>
    </AnimatePresence>
  );
}
