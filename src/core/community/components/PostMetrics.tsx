import React, { memo } from "react";
import {
  Heart,
  MessageSquare,
  CheckCircle,
  Bookmark,
  Share2,
  Flag,
  Send,
} from "lucide-react";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
/**
 * Métricas do post (curtidas, comentários, compartilhamentos, confirmações)
 * Agora são clicáveis e funcionam como botões de ação
 *
 * Design System:
 * - Texto em cinza claro (#A0AEC0)
 * - Hover com destaque
 *
 * Performance:
 * - Memoizado para evitar re-renders desnecessários
 */

interface PostMetricsProps {
  likesCount: number;
  commentsCount: number;
  sharesCount?: number;
  confirmationsCount?: number;
  showConfirmations?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  disabled?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onReport?: () => void;
}

export const PostMetrics = memo(function PostMetrics({
  likesCount,
  commentsCount,
  sharesCount = 0,
  confirmationsCount = 0,
  showConfirmations = false,
  isLiked = false,
  isSaved = false,
  disabled = false,
  onLike,
  onComment,
  onSave,
  onShare,
  onReport,
}: PostMetricsProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Métricas clicáveis à esquerda */}
      <div className="flex items-center gap-4 text-sm">
        {/* Curtidas */}
        <button
          onClick={onLike}
          disabled={disabled}
          className={`flex items-center gap-1.5 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLiked ? "text-red-500" : ""
          }`}
          style={!isLiked ? INLINE_STYLES.textSecondary : undefined}
          title="Curtir este post"
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          {likesCount > 0 ? (
            <span className="font-medium">{likesCount}</span>
          ) : (
            <span className="text-sm">Curtir</span>
          )}
        </button>

        {/* Comentários */}
        <button
          onClick={onComment}
          disabled={disabled}
          className="flex items-center gap-1.5 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={INLINE_STYLES.textSecondary}
          title="Comentar neste post"
        >
          <MessageSquare className="h-4 w-4" />
          {commentsCount > 0 ? (
            <span className="font-medium">{commentsCount}</span>
          ) : (
            <span className="text-sm">Comentar</span>
          )}
        </button>

        {/* Repostar */}
        <button
          onClick={onShare}
          disabled={disabled}
          className="flex items-center gap-1.5 hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={INLINE_STYLES.textSecondary}
          title="Repostar no seu feed"
        >
          <Share2 className="h-4 w-4" />
          {sharesCount > 0 && (
            <span className="font-medium">{sharesCount}</span>
          )}
        </button>

        {/* Confirmações (apenas para alertas) */}
        {showConfirmations && (
          <div
            className="flex items-center gap-1.5"
            style={INLINE_STYLES.textSecondary}
            title="Confirmações da comunidade"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">{confirmationsCount}</span>
          </div>
        )}
      </div>

      {/* Ações secundárias à direita */}
      <div
        className="flex items-center gap-1"
        style={INLINE_STYLES.textSecondary}
      >
        {/* Compartilhar */}
        <button
          onClick={onShare}
          disabled={disabled}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Compartilhar por mensagem"
        >
          <Send className="h-4 w-4" />
        </button>

        {/* Salvar */}
        <button
          onClick={onSave}
          disabled={disabled}
          className={`p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isSaved ? "text-primary" : ""
          }`}
          title={isSaved ? "Remover dos salvos" : "Salvar para depois"}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        </button>

        {/* Denunciar */}
        <button
          onClick={onReport}
          disabled={disabled}
          className="p-2 rounded-lg hover:bg-white/5 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Denunciar conteúdo inadequado"
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
