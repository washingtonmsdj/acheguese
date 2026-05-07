import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useSessionContext } from "@/core/session";
import { useCommentInteractions } from "@/modules/community/hooks/useCommentInteractions";
import { useComments } from "@/modules/community/hooks/useComments";
import { useCommentActions } from "@/modules/community/hooks/useCommentActions";
import { CommentsList } from "./comments/CommentsList";
import { CommentForm } from "./comments/CommentForm";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
interface CommentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  postAuthorId?: string;
  postAuthorName?: string;
  currentUserId?: string;
}

export function CommentsModal({
  open,
  onOpenChange,
  postId,
  postAuthorId,
  postAuthorName,
  currentUserId,
}: CommentsModalProps) {
  const { user, activeProfile } = useSessionContext();
  const { handleLike, getCommentState, initializeComment, isProcessing } =
    useCommentInteractions(postId || "");
  const { comments, loading, fetchComments, addComment, removeComment } =
    useComments(postId, activeProfile?.id);
  const { submitting, submitComment, deleteComment } = useCommentActions(
    postId || "",
    activeProfile?.id,
    activeProfile?.name || undefined,
    activeProfile?.avatarUrl || undefined,
  );

  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const handleFetchComments = useCallback(async () => {
    const fetchedComments = await fetchComments();

    // Inicializar state de curtidas para cada comentário
    fetchedComments.forEach((comment) => {
      initializeComment(comment.id, comment.is_liked, comment.likes_count);
      comment.replies?.forEach((reply) => {
        initializeComment(reply.id, reply.is_liked, reply.likes_count);
      });
    });
  }, [fetchComments, initializeComment]);

  useEffect(() => {
    if (open && postId) {
      handleFetchComments();
    } else {
      setReplyTo(null);
      setNewComment("");
    }
  }, [open, postId, handleFetchComments]);

  const handleSubmitComment = async () => {
    const comment = await submitComment(newComment, replyTo?.id);

    if (comment) {
      addComment(comment, replyTo?.id);
      initializeComment(comment.id, false, 0);
      setNewComment("");
      setReplyTo(null);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteCommentId(commentId);
  };

  const handleConfirmDeleteComment = async () => {
    if (!deleteCommentId) return;

    const success = await deleteComment(deleteCommentId);
    if (success) {
      removeComment(deleteCommentId);
      setDeleteCommentId(null);
    }
  };

  const totalComments = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0,
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-[20px] shadow-2xl max-w-2xl max-h-[90vh] flex flex-col border-0 p-0 gap-0 overflow-hidden"
        style={{ backgroundColor: "#1E2529" }}
        aria-describedby="comments-description"
      >
        {/* Header Fixo */}
        <DialogHeader
          className="border-b pb-3 pt-4 px-5 flex-shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <DialogTitle
            className="text-base font-bold"
            style={INLINE_STYLES.textPrimary}
          >
            Comentários {totalComments > 0 && `(${totalComments})`}
          </DialogTitle>
          <p
            id="comments-description"
            className="text-xs mt-1"
            style={INLINE_STYLES.textSecondary}
          >
            {postAuthorName
              ? `Post de ${postAuthorName}`
              : "Visualize e adicione comentários"}
          </p>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Visualize e adicione comentários nesta publicação
        </DialogDescription>

        {/* Área de Comentários com Scroll */}
        <ScrollArea className="flex-1 px-5 py-4 overflow-y-auto">
          <CommentsList
            comments={comments}
            loading={loading}
            currentUserId={currentUserId}
            postAuthorId={postAuthorId}
            getCommentState={getCommentState}
            isProcessing={isProcessing}
            onLike={handleLike}
            onReply={(id, name) => setReplyTo({ id, name })}
            onDelete={handleDeleteComment}
          />
        </ScrollArea>

        {/* Input de Comentário Fixo */}
        <CommentForm
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleSubmitComment}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          submitting={submitting}
          userAvatar={activeProfile?.avatarUrl}
          userName={activeProfile?.name}
          isLoggedIn={!!user}
        />
      </DialogContent>
    </Dialog>
      <ConfirmActionDialog
        open={Boolean(deleteCommentId)}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) setDeleteCommentId(null);
        }}
        title="Excluir comentario?"
        description="Essa acao remove o comentario e suas respostas vinculadas. Nao e possivel desfazer."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDeleteComment}
      />
    </>
  );
}
