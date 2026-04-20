import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { MessageCircle } from "lucide-react";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
interface Comment {
  id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

interface CommentPreviewProps {
  comments: Comment[];
  totalCount: number;
  onViewAll: () => void;
  maxPreview?: number;
}

export function CommentPreview({
  comments,
  totalCount,
  onViewAll,
  maxPreview = 1,
}: CommentPreviewProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  if (comments.length === 0) return null;

  const previewComments = comments.slice(0, maxPreview);
  const remainingCount = totalCount - maxPreview;

  return (
    <div className="space-y-2">
      {/* Comentários Preview */}
      {previewComments.map((comment) => (
        <div
          key={comment.id}
          className="flex gap-2 p-2 rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
          onClick={onViewAll}
        >
          {/* Avatar */}
          <Avatar className="w-7 h-7 ring-1 ring-white/10 flex-shrink-0">
            <AvatarImage
              src={comment.author_avatar}
              alt={comment.author_name}
            />
            <AvatarFallback className="bg-gradient-to-br from-teal-400/20 to-pink-400/20 text-white font-semibold text-[10px]">
              {getInitials(comment.author_name)}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="font-bold text-[11px] truncate"
                style={INLINE_STYLES.textPrimary}
              >
                {comment.author_name}
              </span>
              <span
                className="text-[9px] flex-shrink-0"
                style={INLINE_STYLES.textSecondary}
              >
                · {getRelativeTime(comment.created_at)}
              </span>
            </div>
            <p
              className="text-[12px] leading-snug line-clamp-2"
              style={INLINE_STYLES.textSecondary}
            >
              {comment.content}
            </p>
          </div>
        </div>
      ))}

      {/* Botão Ver Todos */}
      {remainingCount > 0 && (
        <Button
          onClick={onViewAll}
          variant="ghost"
          size="sm"
          className="w-full h-8 text-[11px] font-bold hover:bg-white/5 transition-colors"
          style={{ color: "#4FD1C5" }}
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
          Ver todos os {totalCount} comentários
        </Button>
      )}
    </div>
  );
}
