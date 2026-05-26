import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { INLINE_STYLES } from "../styles/communityDesignSystem";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";

interface Comment {
  id: string;
  author_name?: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_liked?: boolean;
  profile?: {
    name: string;
    avatar_url?: string;
  };
}

interface CommentsListProps {
  comments: Comment[];
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: ptBR,
  });
};

export const CommentsList = ({ comments }: CommentsListProps) => {
  if (comments.length === 0) {
    return (
      <p
        className="text-sm text-center py-4"
        style={INLINE_STYLES.textSecondary}
      >
        Nenhum comentário ainda. Seja o primeiro!
      </p>
    );
  }

  return (
    <div className="space-y-3 pb-2">
      <h3 className="font-bold text-sm" style={INLINE_STYLES.textPrimary}>
        Comentários ({comments.length})
      </h3>

      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-3 rounded-lg"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <div className="flex items-start gap-3">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage
                src={comment.author_avatar || comment.profile?.avatar_url}
              />
              <AvatarFallback className="text-xs">
                {getInitials(comment.author_name || comment.profile?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-bold text-sm"
                  style={INLINE_STYLES.textPrimary}
                >
                  {comment.author_name || comment.profile?.name}
                </span>
                <span className="text-xs" style={INLINE_STYLES.textMuted}>
                  {getRelativeTime(comment.created_at)}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={INLINE_STYLES.textPrimary}
              >
                {comment.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
