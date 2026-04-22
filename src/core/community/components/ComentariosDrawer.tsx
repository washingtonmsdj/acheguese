import React, { useState } from "react";
import { Send } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { AnimatePresence } from "framer-motion";
import { ReportContentDialog } from "@/core/moderation/components/ReportContentDialog";
import { CommentItem } from "@/shared/components/drawer/CommentItem";
import { useComments } from "@/core/comments/hooks/useComments";

interface ComentariosDrawerProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentCountChange?: (postId: string, count: number) => void;
}

export function ComentariosDrawer({
  postId,
  open,
  onOpenChange,
  onCommentCountChange,
}: ComentariosDrawerProps) {
  const { user } = useAuth();
  const [texto, setTexto] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  const { comments, loading, profile, totalCount, addComment } = useComments(
    postId,
    open,
    user?.id,
  );

  React.useEffect(() => {
    if (postId && totalCount > 0) {
      onCommentCountChange?.(postId, totalCount);
    }
  }, [postId, totalCount, onCommentCountChange]);

  React.useEffect(() => {
    if (!open) setReplyTo(null);
  }, [open]);

  const handleEnviar = async () => {
    const success = await addComment(texto, replyTo?.id ?? null);
    if (success) {
      setTexto("");
      setReplyTo(null);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[75vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base font-display">
            Comentários {totalCount > 0 && `(${totalCount})`}
          </DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 max-h-[45vh]">
          {loading ? (
            <div className="space-y-4 pb-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : totalCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum comentário ainda. Seja o primeiro! 💬
            </p>
          ) : (
            <AnimatePresence>
              <div className="space-y-3 pb-2">
                {comments.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <CommentItem
                      comment={c}
                      userId={user?.id}
                      onReply={(id, name) => setReplyTo({ id, name })}
                      onReport={setReportCommentId}
                    />
                    {c.replies?.map((r) => (
                      <CommentItem
                        key={r.id}
                        comment={r}
                        isReply
                        canReply={false}
                        userId={user?.id}
                        onReply={() => {}}
                        onReport={setReportCommentId}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        <div className="px-4 py-3 border-t bg-card">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] text-muted-foreground">
                Respondendo a <strong>{replyTo.name}</strong>
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-[11px] text-destructive"
              >
                Cancelar
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url ?? ""} />
              <AvatarFallback>{(profile?.name ?? "U")[0]}</AvatarFallback>
            </Avatar>
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
              placeholder={
                user
                  ? replyTo
                    ? `Responder ${replyTo.name}...`
                    : "Escreva um comentário..."
                  : "Faça login para comentar"
              }
              disabled={!user}
              className="flex-1 rounded-full bg-secondary border-none text-sm h-9"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEnviar}
              disabled={!texto.trim() || !user}
              className="h-9 w-9 rounded-full text-primary"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DrawerContent>

      <ReportContentDialog
        open={!!reportCommentId}
        onOpenChange={(open) => {
          if (!open) setReportCommentId(null);
        }}
        targetId={reportCommentId}
        targetType="comment"
      />
    </Drawer>
  );
}
