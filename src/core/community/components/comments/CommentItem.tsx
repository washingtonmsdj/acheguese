import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  CornerDownRight,
  MoreVertical,
  Flag,
  Trash2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { INLINE_STYLES } from "../styles/communityDesignSystem";
import { getInitials, getRelativeTime } from "@/shared/utils/formatters";

interface CommentItemProps {
  comment: {
    id: string;
    author_profile_id: string;
    author_name: string;
    author_avatar?: string;
    content: string;
    created_at: string;
  };
  isReply?: boolean;
  isOwnComment: boolean;
  canDelete: boolean;
  isLiked: boolean;
  likesCount: number;
  isProcessing: boolean;
  currentUserId?: string;
  onLike: (commentId: string) => void;
  onReply?: (id: string, name: string) => void;
  onDelete: (commentId: string) => void;
}

export function CommentItem({
  comment,
  isReply = false,
  isOwnComment,
  canDelete,
  isLiked,
  likesCount,
  isProcessing,
  currentUserId,
  onLike,
  onReply,
  onDelete,
}: CommentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? "ml-12" : ""}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="w-9 h-9 ring-2 ring-teal-400/20 flex-shrink-0">
          <AvatarImage src={comment.author_avatar} alt={comment.author_name} />
          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-pink-400 text-white font-semibold text-xs">
            {getInitials(comment.author_name)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-bold text-xs"
              style={INLINE_STYLES.textPrimary}
            >
              {comment.author_name}
            </span>
            <span className="text-[10px]" style={INLINE_STYLES.textSecondary}>
              {getRelativeTime(comment.created_at)}
            </span>

            {/* Menu */}
            {currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-auto p-1 rounded hover:bg-white/5 transition-colors">
                    <MoreVertical
                      className="w-3.5 h-3.5"
                      style={{ color: "#9CA3AF" }}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-lg border"
                  style={{
                    backgroundColor: "#1E2529",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(comment.id)}
                      className="text-xs gap-2 focus:bg-white/10 cursor-pointer"
                      style={{ color: "#EF4444" }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir comentário
                    </DropdownMenuItem>
                  )}
                  {!isOwnComment && (
                    <>
                      {canDelete && (
                        <DropdownMenuSeparator
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          }}
                        />
                      )}
                      <DropdownMenuItem
                        className="text-xs gap-2 focus:bg-white/10 cursor-pointer"
                        style={{ color: "#F59E0B" }}
                      >
                        <Flag className="w-3 h-3" />
                        Denunciar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment text */}
          <p
            className="text-sm leading-relaxed mb-2"
            style={INLINE_STYLES.textPrimary}
          >
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(comment.id)}
              disabled={isProcessing}
              className="flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
              style={{ color: isLiked ? "#EC4899" : "#9CA3AF" }}
            >
              <Heart
                className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`}
              />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>

            {!isReply && onReply && currentUserId && (
              <button
                onClick={() => onReply(comment.id, comment.author_name)}
                className="flex items-center gap-1 text-xs hover:text-teal-400 transition-colors"
                style={{ color: "#9CA3AF" }}
              >
                <CornerDownRight className="w-3 h-3" />
                Responder
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
