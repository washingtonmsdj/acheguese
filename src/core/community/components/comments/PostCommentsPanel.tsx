import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { useCommentActions } from "@/core/community/hooks/useCommentActions";
import { useCommentInteractions } from "@/core/community/hooks/useCommentInteractions";
import {
  useComments,
  type CommunityComment,
} from "@/core/community/hooks/useComments";
import { useModeration } from "@/core/community/hooks/useModeration";
import { useSessionContext } from "@/core/session";
import {
  COMMUNITY_REPORT_REASON_OPTIONS,
  ReportReasonDialog,
  type CommunityReportReason,
} from "@/core/moderation";
import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

import { CommentsList } from "./CommentsList";
import { CommentsModalComposer } from "./CommentsModalComposer";

interface PostCommentsPanelProps {
  postId: string;
  postAuthorId?: string;
  currentUserId?: string;
  canComment?: boolean;
  commentBlockedMessage?: string;
  scrollable?: boolean;
}

function visitComments(
  comments: CommunityComment[],
  callback: (comment: CommunityComment) => void,
) {
  comments.forEach((comment) => {
    callback(comment);
    if (comment.replies?.length) visitComments(comment.replies, callback);
  });
}

function countComments(comments: CommunityComment[]): number {
  let count = 0;
  visitComments(comments, () => {
    count += 1;
  });
  return count;
}

export function PostCommentsPanel({
  postId,
  postAuthorId,
  currentUserId,
  canComment = true,
  commentBlockedMessage = "Confirme seu bairro pra responder por aqui.",
  scrollable = false,
}: PostCommentsPanelProps) {
  const { user, activeProfile } = useSessionContext();
  const { comments, loading, fetchComments, addComment, removeComment } =
    useComments(postId, activeProfile?.id);
  const { handleLike, getCommentState, initializeComment, isProcessing } =
    useCommentInteractions(postId);
  const { submitting, submitComment, deleteComment } = useCommentActions(
    postId,
    undefined,
    activeProfile?.name || undefined,
    activeProfile?.avatarUrl || undefined,
  );
  const { reportCommentAsync } = useModeration();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  const refreshComments = useCallback(async () => {
    const fetched = await fetchComments();
    visitComments(fetched, (comment) => {
      initializeComment(comment.id, comment.is_liked, comment.likes_count);
    });
  }, [fetchComments, initializeComment]);

  useEffect(() => {
    void refreshComments();
  }, [refreshComments]);

  const handleSubmitComment = async () => {
    if (!canComment) {
      toast.info(commentBlockedMessage);
      return;
    }

    const comment = await submitComment(newComment, replyTo?.id);
    if (!comment) return;

    addComment(comment, replyTo?.id);
    initializeComment(comment.id, false, 0);
    setNewComment("");
    setReplyTo(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteCommentId) return;
    const deleted = await deleteComment(deleteCommentId);
    if (!deleted) return;
    removeComment(deleteCommentId);
    setDeleteCommentId(null);
  };

  const handleReport = async (
    reason: CommunityReportReason,
    details?: string,
  ) => {
    if (!reportCommentId) return;
    await reportCommentAsync({
      commentId: reportCommentId,
      postId,
      reason,
      description: details,
    });
    setReportCommentId(null);
  };

  const list = (
    <CommentsList
      comments={comments}
      loading={loading}
      currentUserId={currentUserId ?? activeProfile?.id}
      postAuthorId={postAuthorId}
      getCommentState={getCommentState}
      isProcessing={isProcessing}
      onLike={handleLike}
      onReply={(id, name) => {
        if (!canComment) {
          toast.info(commentBlockedMessage);
          return;
        }
        setReplyTo({ id, name });
      }}
      onDelete={setDeleteCommentId}
      onReport={setReportCommentId}
    />
  );

  return (
    <>
      <div className="flex min-h-0 flex-col" data-post-comments-panel="true">
        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">
            Conversa no post
          </h3>
          <p className="mt-0.5 text-xs text-white/60">
            {(() => {
              const n = countComments(comments);
              if (n === 0) return "Ainda ninguém comentou · seja o primeiro";
              if (n === 1) return "1 vizinho comentou";
              return `${n} vizinhos comentaram`;
            })()}
          </p>
        </div>

        {scrollable ? (
          <ScrollArea className="min-h-0 flex-1 px-4 py-4">{list}</ScrollArea>
        ) : (
          <div className="px-1 py-4">{list}</div>
        )}

        <CommentsModalComposer
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleSubmitComment}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          submitting={submitting}
          userAvatar={activeProfile?.avatarUrl}
          userName={activeProfile?.name}
          isLoggedIn={Boolean(user)}
          canComment={canComment}
          blockedMessage={commentBlockedMessage}
        />
      </div>

      <ConfirmActionDialog
        open={Boolean(deleteCommentId)}
        onOpenChange={(open) => {
          if (!open) setDeleteCommentId(null);
        }}
        title="Excluir comentario?"
        description="Esta acao remove o comentario e as respostas vinculadas. Nao e possivel desfazer."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
      />

      <ReportReasonDialog
        open={Boolean(reportCommentId)}
        onOpenChange={(open) => {
          if (!open) setReportCommentId(null);
        }}
        contentLabel="comentario"
        reasonOptions={COMMUNITY_REPORT_REASON_OPTIONS}
        onSubmit={handleReport}
      />
    </>
  );
}
