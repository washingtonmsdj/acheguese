import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { ConversationPreview } from "@/core/messaging/types";

interface ConversationCardProps {
  conversation: ConversationPreview;
  index: number;
}

export function ConversationCard({
  conversation,
  index,
}: ConversationCardProps) {
  const navigate = useNavigate();

  const getTimeLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => navigate(`/chat/${conversation.id}`)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
        conversation.unread_count > 0 && "bg-primary/3",
      )}
    >
      {/* Photo */}
      <div className="relative h-14 w-14 rounded-xl bg-secondary overflow-hidden shrink-0">
        {conversation.classified_photo ? (
          <img
            src={conversation.classified_photo}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xl">
            📦
          </div>
        )}

        {/* Avatar overlay */}
        <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full border-2 border-card bg-secondary overflow-hidden">
          {conversation.other_user_avatar ? (
            <img
              src={conversation.other_user_avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-primary">
              {conversation.other_user_name[0]}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-sm truncate",
              conversation.unread_count > 0 ? "font-bold" : "font-medium",
            )}
          >
            {conversation.other_user_name}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {getTimeLabel(conversation.last_message_at)}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground truncate">
          {conversation.classified_title}
        </p>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              "text-xs truncate",
              conversation.unread_count > 0
                ? "text-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            {conversation.last_message_text || "Nenhuma mensagem ainda"}
          </p>

          {conversation.unread_count > 0 && (
            <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {conversation.status === "blocked" && (
        <Badge
          variant="outline"
          className="text-[9px] text-destructive border-destructive/30 shrink-0"
        >
          Bloqueado
        </Badge>
      )}
    </motion.div>
  );
}
