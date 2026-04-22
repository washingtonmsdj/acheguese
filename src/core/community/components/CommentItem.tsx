import React from "react";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Heart, MessageSquare, Edit, Trash2, Flag } from "lucide-react";
import { Comment, canEditComment } from "@/shared/utils/commentTree";
import { formatRelativeTime } from "@/shared/utils/textUtils";
import { useCommentActions } from "@/core/community/hooks/useCommentActions";
import { useModeration } from "@/core/community/hooks/useModeration";
import { useSessionContext } from "@/core/session";
import { CommentForm } from "./CommentForm";
import { ReportModal } from "./ReportModal";
import { ReportReason } from "@/core/community/types";
import { cn } from "@/shared/utils/cn";
/**
 * Item de comentÃ¡rio (recursivo)
 *
 * Requirement 6: Sistema de ComentÃ¡rios
 * Requirement 12: Sistema de ModeraÃ§Ã£o
 * Requirement 16: Estrutura recursiva (mÃ¡ximo 5 nÃ­veis)
 *
 * Funcionalidades:
 * - Avatar e name do autor
 * - ConteÃºdo do comentÃ¡rio
 * - Timestamp relactive
 * - Indicador de "editado"
 * - BotÃ£o de curtir
 * - BotÃ£o de responder
 * - BotÃ£o de edit (apenas autor, dentro de 24h)
 * - BotÃ£o de excluir (apenas autor)
 * - BotÃ£o de denunciar
 * - Renderizar respostas recursivamente
 * - IndentaÃ§Ã£o visual por nÃ­vel
 */

interface CommentItemProps {
  comment: Comment;
  maxDepth?: number;
}

export function CommentItem({ comment, maxDepth = 5 }: CommentItemProps) {
  const { user, activeProfile } = useSessionContext();
  const { deleteComment } = useCommentActions(comment.post_id);
  const { reportComment, isReportingComment } = useModeration();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const isAuthor = activeProfile?.id === comment.author_profile_id;
  const canEdit =
    isAuthor &&
    canEditComment(
      comment.created_at,
      activeProfile?.id || "",
      comment.author_profile_id,
    );
  const canReply = comment.depth < maxDepth - 1;

  // Gerar iniciais para avatar
  const initials = comment.author_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLike = () => {
    // Like functionality not yet implemented in useCommentActions
  };

  const handleDelete = () => {
    deleteComment(comment.id);
  };

  const handleReport = (reason: ReportReason, description?: string) => {
    reportComment({
      commentId: comment.id,
      postId: comment.post_id,
      reason,
      description,
    });
    setShowReportModal(false);
  };

  return (
    <div className={cn("space-y-2", comment.depth > 0 && "ml-8")}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author_avatar} alt={comment.author_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{comment.author_name}</span>
            <span className="text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground">(editado)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2">
              {/* TODO: Implementar ediÃ§Ã£o inline */}
              <p className="text-sm">EdiÃ§Ã£o em desenvolvimento...</p>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 flex-wrap pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "h-9 min-h-[44px] min-w-[44px] gap-1 text-xs",
                comment.is_liked && "text-red-500",
              )}
            >
              <Heart
                className={cn("h-3 w-3", comment.is_liked && "fill-current")}
              />
              <span className="hidden sm:inline">
                {comment.likes_count > 0 && comment.likes_count}
              </span>
            </Button>

            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-9 min-h-[44px] min-w-[44px] gap-1 text-xs"
              >
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">Responder</span>
              </Button>
            )}

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-9 min-h-[44px] min-w-[44px] gap-1 text-xs"
              >
                <Edit className="h-3 w-3" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            )}

            {isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-9 min-h-[44px] min-w-[44px] gap-1 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            )}

            {/* Denunciar (apenas se nÃ£o for o autor) */}
            {!isAuthor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="h-9 min-h-[44px] min-w-[44px] gap-1 text-xs text-muted-foreground hover:text-destructive"
              >
                <Flag className="h-3 w-3" />
                <span className="hidden sm:inline">Denunciar</span>
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-2">
              <CommentForm
                postId={comment.post_id}
                parentCommentId={comment.id}
                placeholder={`Responder para ${comment.author_name}...`}
                autoFocus
                onSuccess={() => setIsReplying(false)}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies (recursivo) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} maxDepth={maxDepth} />
          ))}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        onSubmit={handleReport}
        isSubmitting={isReportingComment}
        contentType="comment"
      />
    </div>
  );
}

