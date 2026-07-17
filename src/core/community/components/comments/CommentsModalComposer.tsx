import React from "react";
import { Send } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { COMMENT_LIMITS } from "@/shared/constants/socialContent";
import { getInitials } from "@/shared/utils/formatters";
import { INLINE_STYLES } from "../styles/communityDesignSystem";

interface CommentsModalComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  replyTo: { id: string; name: string } | null;
  onCancelReply: () => void;
  submitting: boolean;
  userAvatar?: string;
  userName?: string;
  isLoggedIn: boolean;
  canComment?: boolean;
  blockedMessage?: string;
}

export function CommentsModalComposer({
  value,
  onChange,
  onSubmit,
  replyTo,
  onCancelReply,
  submitting,
  userAvatar,
  userName,
  isLoggedIn,
  canComment = true,
  blockedMessage = "Verifique sua residencia para comentar.",
}: CommentsModalComposerProps) {
  const isValid =
    Boolean(value.trim()) && value.length <= COMMENT_LIMITS.MAX_CONTENT_LENGTH;
  const canSubmit = isLoggedIn && canComment;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (isValid && canSubmit && !submitting) {
      onSubmit();
    }
  };

  const placeholder = !isLoggedIn
    ? "Faca login para comentar"
    : !canComment
      ? blockedMessage
      : replyTo
        ? `Responder ${replyTo.name}...`
        : "Escreva um comentario...";

  return (
    <div
      className="border-t p-4 flex-shrink-0"
      style={{
        borderColor: "rgba(255, 255, 255, 0.1)",
        backgroundColor: "#12181B",
      }}
    >
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs" style={INLINE_STYLES.textSecondary}>
            Respondendo{" "}
            <span className="font-bold text-teal-400">@{replyTo.name}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Avatar className="w-9 h-9 ring-2 ring-teal-400/20 flex-shrink-0">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-pink-400 text-white font-semibold text-xs">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 flex flex-col gap-2">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={!canSubmit || submitting}
            rows={2}
            maxLength={COMMENT_LIMITS.MAX_CONTENT_LENGTH}
            className="resize-none rounded-lg border-0 text-sm"
            style={{ backgroundColor: "#1E2529", color: "#FFFFFF" }}
          />

          <div className="flex justify-between items-center">
            <span className="text-[10px]" style={INLINE_STYLES.textSecondary}>
              {value.length}/{COMMENT_LIMITS.MAX_CONTENT_LENGTH}
            </span>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!isValid || !canSubmit || submitting}
              size="sm"
              className="rounded-lg h-8 px-4 font-bold text-xs"
              style={{
                background: isValid && canSubmit
                  ? "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)"
                  : "#2D3748",
                color: "#FFFFFF",
              }}
            >
              {submitting ? "Enviando..." : "Comentar"}
              <Send className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
