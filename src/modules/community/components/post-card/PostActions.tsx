import React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Heart,
  ThumbsUp,
  MessageCircle,
  Send,
  Bookmark,
  Share2,
} from "lucide-react";
import { SPACING } from "../styles/communityDesignSystem";

interface PostActionsProps {
  isCivicReport: boolean;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  upvotesCount?: number;
  commentsCount: number;
  isProcessing: boolean;
  showMessageButton: boolean;
  authorName: string;
  onLike: () => void;
  onUpvote?: () => void;
  onComment: () => void;
  onSendMessage?: () => void;
  onSave: () => void;
  onShare: () => void;
}

export function PostActions({
  isCivicReport,
  isLiked,
  isSaved,
  likesCount,
  upvotesCount = 0,
  commentsCount,
  isProcessing,
  showMessageButton,
  authorName,
  onLike,
  onUpvote,
  onComment,
  onSendMessage,
  onSave,
  onShare,
}: PostActionsProps) {
  return (
    <div className={`${SPACING.cardPadding} pt-0`}>
      <div
        className="flex items-center justify-between w-full pt-2"
        style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
        role="group"
        aria-label="Ações do post"
      >
        <div className="flex items-center gap-4">
          {/* Like/Upvote */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (isCivicReport) {
                onUpvote?.();
              } else {
                onLike();
              }
            }}
            disabled={isProcessing}
            className={`h-8 px-3 text-xs transition-colors ${
              (isCivicReport ? upvotesCount > 0 : isLiked)
                ? "bg-orange-500/10 text-orange-400"
                : "text-gray-400 hover:text-orange-400 hover:bg-orange-500/5"
            }`}
            aria-label={
              isCivicReport
                ? `Apoiar problema cívico. ${upvotesCount} apoios`
                : isLiked
                  ? `Remover curtida. ${likesCount} curtidas`
                  : `Curtir post. ${likesCount} curtidas`
            }
            aria-pressed={isCivicReport ? upvotesCount > 0 : isLiked}
          >
            {isCivicReport ? (
              <>
                <ThumbsUp
                  className={`w-4 h-4 mr-1 ${upvotesCount > 0 ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
                <span aria-hidden="true">{upvotesCount}</span>
              </>
            ) : (
              <>
                <Heart
                  className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
                <span aria-hidden="true">{likesCount}</span>
              </>
            )}
          </Button>

          {/* Comentar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onComment();
            }}
            className="h-8 px-3 text-xs text-gray-400 hover:text-blue-400 hover:bg-blue-500/5 transition-colors"
            aria-label={`Comentar no post. ${commentsCount} comentários`}
          >
            <MessageCircle className="w-4 h-4 mr-1" aria-hidden="true" />
            <span aria-hidden="true">{commentsCount}</span>
          </Button>

          {/* Enviar Mensagem */}
          {showMessageButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSendMessage?.();
              }}
              className="h-8 px-3 text-xs text-gray-400 hover:text-orange-400 hover:bg-orange-500/5 transition-colors"
              aria-label={`Enviar mensagem privada para ${authorName}`}
            >
              <Send className="w-4 h-4 mr-1" aria-hidden="true" />
              <span aria-hidden="true">Mensagem</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Salvar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            disabled={isProcessing}
            className={`h-8 w-8 p-0 transition-colors ${
              isSaved
                ? "text-yellow-400"
                : "text-gray-400 hover:text-yellow-400"
            }`}
            aria-label={isSaved ? "Remover dos salvos" : "Salvar post"}
            aria-pressed={isSaved}
          >
            <Bookmark
              className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
              aria-hidden="true"
            />
          </Button>

          {/* Compartilhar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="h-8 w-8 p-0 text-gray-400 hover:text-green-400 hover:bg-green-500/5 transition-colors"
            aria-label="Compartilhar post"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
