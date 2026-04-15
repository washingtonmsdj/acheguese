import React from "react";
import { motion } from "framer-motion";
import { CornerDownRight, Flag, MoreHorizontal } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

interface Comment {
  id: string;
  texto?: string;
  content?: string;
  created_at: string;
  autor_name?: string;
  author_name?: string;
  autor_avatar?: string;
  author_avatar?: string;
  parent_id: string | null;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  canReply?: boolean;
  userId?: string;
  onReply: (id: string, name: string) => void;
  onReport: (id: string) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export const CommentItem = ({
  comment,
  isReply = false,
  canReply = true,
  userId,
  onReply,
  onReport,
}: CommentItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isReply ? "ml-10" : ""}`}
    >
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarImage src={comment.autor_avatar || comment.author_avatar} />
        <AvatarFallback>
          {(comment.autor_name || comment.author_name || "?")[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 relative group">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold">
              {comment.autor_name || comment.author_name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(comment.created_at)}
            </span>
            {userId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-background/50">
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px]">
                  <DropdownMenuItem
                    onClick={() => onReport(comment.id)}
                    className="text-destructive text-xs gap-1.5"
                  >
                    <Flag className="h-3 w-3" /> Denunciar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className="text-sm leading-relaxed">
            {comment.texto || comment.content}
          </p>
        </div>
        {!isReply && canReply && userId && (
          <button
            onClick={() =>
              onReply(
                comment.id,
                comment.autor_name || comment.author_name || "",
              )
            }
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary ml-3 mt-1 transition-colors"
          >
            <CornerDownRight className="h-2.5 w-2.5" /> Responder
          </button>
        )}
      </div>
    </motion.div>
  );
};
