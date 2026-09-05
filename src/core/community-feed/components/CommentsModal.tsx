import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import { PostCommentsPanel } from "@/core/community-feed/components/comments/PostCommentsPanel";

interface CommentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  postAuthorId?: string;
  postAuthorName?: string;
  currentUserId?: string;
  canComment?: boolean;
  commentBlockedMessage?: string;
}

export function CommentsModal({
  open,
  onOpenChange,
  postId,
  postAuthorId,
  postAuthorName,
  currentUserId,
  canComment = true,
  commentBlockedMessage,
}: CommentsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-white/10 bg-[#1E2529] p-0 text-white">
        <DialogHeader className="shrink-0 border-b border-white/10 px-5 py-4">
          <DialogTitle className="text-base font-semibold">Comentarios</DialogTitle>
          <DialogDescription className="text-xs text-white/55">
            {postAuthorName
              ? `Publicacao de ${postAuthorName}`
              : "Converse com a comunidade"}
          </DialogDescription>
        </DialogHeader>

        {postId ? (
          <PostCommentsPanel
            postId={postId}
            postAuthorId={postAuthorId}
            currentUserId={currentUserId}
            canComment={canComment}
            commentBlockedMessage={commentBlockedMessage}
            scrollable
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
