import React from "react";
import { memo } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Heart,
  ThumbsUp,
  MessageCircle,
  Send,
  Bookmark,
  Share2,
} from "lucide-react";
import { type PostType } from "@/shared/constants/postTypeConfig";
interface PostActionsProps {
  postType: PostType;
  postId: string;
  authorName: string;

  // Estados
  isLiked: boolean;
  isSaved: boolean;
  isProcessing: boolean;

  // Contadores
  likesCount: number;
  upvotesCount?: number;
  commentsCount: number;

  // Flags
  showMessageButton: boolean;

  // Handlers
  onLike: () => void;
  onUpvote?: () => void;
  onComment: () => void;
  onSendMessage?: () => void;
  onSave: () => void;
  onShare: () => void;
}

/**
 * Barra de ações do post
 * Inclui botões de like, comentar, mensagem, save e compartilhar
 *
 * @component
 */
export const PostActions = memo<PostActionsProps>(
  ({
    postType,
    postId,
    authorName,
    isLiked,
    isSaved,
    isProcessing,
    likesCount,
    upvotesCount = 0,
    commentsCount,
    showMessageButton,
    onLike,
    onUpvote,
    onComment,
    onSendMessage,
    onSave,
    onShare,
  }) => {
    const isCivicReport = String(postType) === "civic_report";
    const likeCount = isCivicReport ? upvotesCount : likesCount;
    const isLikeActive = isCivicReport ? upvotesCount > 0 : isLiked;

    return (
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
              isLikeActive
                ? "bg-orange-500/10 text-orange-400"
                : "text-gray-400 hover:text-orange-400 hover:bg-orange-500/5"
            }`}
            aria-label={
              isCivicReport
                ? `Apoiar problema cívico. ${likeCount} apoios`
                : isLiked
                  ? `Remover curtida. ${likeCount} curtidas`
                  : `Curtir post. ${likeCount} curtidas`
            }
            aria-pressed={isLikeActive}
          >
            {isCivicReport ? (
              <>
                <ThumbsUp
                  className={`w-4 h-4 mr-1 ${isLikeActive ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
                <span aria-hidden="true">{likeCount}</span>
              </>
            ) : (
              <>
                <Heart
                  className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
                <span aria-hidden="true">{likeCount}</span>
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
    );
  },
);

PostActions.displayName = "PostActions";
