import React from "react";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Heart, MessageSquare, Edit, Trash2, Flag, MoreVertical } from "lucide-react";
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
 * Item de comentário (recursivo)
 *
 * Requirement 6: Sistema de Comentários
 * Requirement 12: Sistema de Moderação
 * Requirement 16: Estrutura recursiva (máximo 5 níveis)
 *
 * Funcionalidades:
 * - Avatar e name do autor
 * - Conteúdo do comentário
 * - Timestamp relactive
 * - Indicador de "editado"
 * - Botão de curtir
 * - Botão de responder
 * - Botão de edit (apenas autor, dentro de 24h)
 * - Botão de excluir (apenas autor)
 * - Botão de denunciar
 * - Renderizar respostas recursivamente
 * - Indentação visual por nível
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
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    aria-label="Abrir ações do comentário"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px]">
                  {canReply && (
                    <DropdownMenuItem
                      onClick={() => setIsReplying(!isReplying)}
                      className="text-xs"
                    >
                      <MessageSquare className="mr-2 h-3.5 w-3.5" />
                      Responder
                    </DropdownMenuItem>
                  )}
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs"
                    >
                      <Edit className="mr-2 h-3.5 w-3.5" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {(canReply || canEdit) && (
                    <DropdownMenuSeparator />
                  )}
                  {isAuthor && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                  {!isAuthor && (
                    <DropdownMenuItem
                      onClick={() => setShowReportModal(true)}
                      className="text-xs text-destructive focus:text-destructive"
                    >
                      <Flag className="mr-2 h-3.5 w-3.5" />
                      Denunciar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2">
              {/* TODO: Implementar edição inline */}
              <p className="text-sm">Edição em desenvolvimento...</p>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-1">
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

