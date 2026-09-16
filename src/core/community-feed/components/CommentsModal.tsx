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
      <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground shadow-lg">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            Comentários
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {postAuthorName
              ? `Publicação de ${postAuthorName}`
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
