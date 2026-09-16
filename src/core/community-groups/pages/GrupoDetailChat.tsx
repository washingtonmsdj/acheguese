import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  Copy,
  Flag,
  Heart,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Reply,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  useDeleteGroupMessage,
  useGroupMessages,
  useReportGroupMessage,
  useSendGroupMessage,
  useToggleGroupMessageLike,
  useUpdateGroupMessage,
} from "@/core/community-groups/hooks/useGroupQueries";
import {
  COMMUNITY_REPORT_REASON_OPTIONS,
  ReportReasonDialog,
  type CommunityReportReason,
} from "@/core/moderation";
import { useSessionContext } from "@/core/session";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";
import { getInitials } from "./GrupoDetailShared";
import type { GroupMessageItem } from "./GrupoDetailShared";

export function GrupoDetailChat({
  groupId,
  isMember,
  canPost,
  canModerate,
  canReact,
  canReport,
}: {
  groupId: string;
  isMember: boolean;
  canPost: boolean;
  canModerate: boolean;
  canReact: boolean;
  canReport: boolean;
}) {
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const { data: messages, isLoading } = useGroupMessages(groupId);
  const typedMessages = messages as GroupMessageItem[];
  const [text, setText] = useState("");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<GroupMessageItem | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const sendMessageMutation = useSendGroupMessage();
  const deleteMessageMutation = useDeleteGroupMessage();
  const updateMessageMutation = useUpdateGroupMessage();
  const reportMessageMutation = useReportGroupMessage();
  const likeMessageMutation = useToggleGroupMessageLike(groupId);
  const sending = sendMessageMutation.isPending || updateMessageMutation.isPending;
  const scrollRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const element = textAreaRef.current;
    if (!element) return;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  }, [text]);

  const resetComposerContext = () => {
    setReplyTo(null);
    setEditingMessageId(null);
  };

  const handleSend = async () => {
    if (!canPost) {
      toast.error("Este grupo limita postagens para sua função");
      return;
    }

    const normalizedText = text.trim();
    if (!normalizedText) return;

    try {
      if (editingMessageId) {
        await updateMessageMutation.mutateAsync({
          groupId,
          messageId: editingMessageId,
          content: normalizedText,
        });
      } else {
        await sendMessageMutation.mutateAsync({
          groupId,
          content: normalizedText,
          metadata: replyTo
            ? { reply_to_message_id: replyTo.id }
            : undefined,
        });
      }
      setText("");
      resetComposerContext();
    } catch {
      toast.error(
        editingMessageId
          ? "Erro ao atualizar mensagem"
          : "Erro ao enviar mensagem",
      );
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync({ groupId, messageId });
    } catch {
      toast.error("Não foi possível remover a mensagem");
    }
  };

  const handleSubmitReport = async (
    reason: CommunityReportReason,
    details?: string,
  ) => {
    if (!reportMessageId) return;
    await reportMessageMutation.mutateAsync({
      messageId: reportMessageId,
      reason,
      details,
    });
    setReportMessageId(null);
  };

  const handleCopyMessage = async (message: GroupMessageItem) => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1500);
      toast.success("Mensagem copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleReplyMessage = (message: GroupMessageItem) => {
    setEditingMessageId(null);
    setReplyTo(message);
    window.setTimeout(() => textAreaRef.current?.focus(), 0);
  };

  const handleEditMessage = (message: GroupMessageItem) => {
    setReplyTo(null);
    setEditingMessageId(message.id);
    setText(message.content || "");
    window.setTimeout(() => textAreaRef.current?.focus(), 0);
  };

  const renderMessageContent = (message: GroupMessageItem, isOwn: boolean) => {
    const repliedMessage = message.metadata?.reply_to_message_id
      ? typedMessages.find(
          (candidate) =>
            candidate.id === message.metadata?.reply_to_message_id,
        )
      : undefined;
    const bubbleClass = isOwn
      ? "bg-primary/15 text-foreground rounded-tr-sm"
      : "bg-muted text-foreground rounded-tl-sm";

    if (message.message_type === "image" && message.media_url) {
      return (
        <div
          className={cn(
            "max-w-full overflow-hidden rounded-2xl border border-border",
            bubbleClass,
          )}
        >
          <img
            src={message.media_url}
            alt={message.content || "Imagem do grupo"}
            className="h-auto max-h-[280px] w-full object-cover"
            loading="lazy"
          />
          {message.content ? (
            <div className="px-2.5 py-1.5 text-[13px] leading-relaxed">
              {message.content}
            </div>
          ) : null}
        </div>
      );
    }

    if (message.message_type === "audio" && message.media_url) {
      return (
        <div className={cn("max-w-full rounded-2xl px-2.5 py-1.5", bubbleClass)}>
          <p className="mb-1.5 text-[11px] text-muted-foreground">
            {message.content || "Mensagem de áudio"}
          </p>
          <audio controls preload="none" className="w-full max-w-[250px]">
            <source
              src={message.media_url}
              type={message.media_mime_type || "audio/mpeg"}
            />
          </audio>
          {message.audio_duration_seconds ? (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {message.audio_duration_seconds}s
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "max-w-full break-words rounded-2xl px-2.5 py-1.5 text-[13px]",
          bubbleClass,
        )}
      >
        {message.metadata?.reply_to_message_id ? (
          <div className="mb-1 rounded-lg border border-border bg-background/70 px-2 py-1">
            <p className="text-[10px] text-primary">
              Resposta para {repliedMessage?.profile?.name || "mensagem"}
            </p>
            <p className="line-clamp-2 text-[10px] text-muted-foreground">
              {repliedMessage?.content || "Mensagem anterior"}
            </p>
          </div>
        ) : null}
        {message.content}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Carregando mensagens do grupo</span>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden text-foreground">
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-2.5 sm:px-4"
      >
        {typedMessages.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle
              className="mx-auto mb-3 h-12 w-12 text-muted-foreground/60"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Seja o primeiro a dizer olá!
            </p>
          </div>
        ) : null}

        {typedMessages.map((message, index) => {
          const isOwn =
            message.user_id === user?.id ||
            message.sender_profile_id === user?.id ||
            message.sender_profile_id === activeProfile?.id;
          const previousMessage = typedMessages[index - 1];
          const showAvatar =
            index === 0 ||
            (previousMessage?.user_id || previousMessage?.sender_profile_id) !==
              (message.user_id || message.sender_profile_id);

          return (
            <div
              key={message.id}
              className={cn(
                "flex min-w-0 gap-2",
                isOwn && "flex-row-reverse",
              )}
            >
              {showAvatar ? (
                <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                  <AvatarImage src={message.profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                    {getInitials(message.profile?.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8 shrink-0" />
              )}

              <div
                className={cn(
                  "flex min-w-0 max-w-[78%] flex-col",
                  isOwn ? "items-end" : "items-start",
                )}
              >
                {showAvatar ? (
                  <p
                    className={cn(
                      "mb-0.5 text-[9px] text-muted-foreground",
                      isOwn && "text-right",
                    )}
                  >
                    {message.profile?.name || "Usuário"}
                  </p>
                ) : null}

                <div
                  className={cn(
                    "mt-0.5 flex w-full min-w-0 items-end gap-1.5",
                    isOwn ? "justify-end" : "justify-start",
                  )}
                >
                  {!isOwn ? (
                    <MessageActionsMenu
                      align="start"
                      message={message}
                      copied={copiedMessageId === message.id}
                      canEdit={false}
                      canDelete={canModerate}
                      canReport={canReport}
                      reportPending={reportMessageMutation.isPending}
                      onReply={handleReplyMessage}
                      onCopy={(item) => void handleCopyMessage(item)}
                      onEdit={handleEditMessage}
                      onReport={(id) => setReportMessageId(id)}
                      onDelete={(id) => void handleDeleteMessage(id)}
                    />
                  ) : null}

                  {renderMessageContent(message, isOwn)}

                  {isOwn ? (
                    <MessageActionsMenu
                      align="end"
                      message={message}
                      copied={copiedMessageId === message.id}
                      canEdit
                      canDelete
                      canReport={false}
                      reportPending={false}
                      onReply={handleReplyMessage}
                      onCopy={(item) => void handleCopyMessage(item)}
                      onEdit={handleEditMessage}
                      onReport={(id) => setReportMessageId(id)}
                      onDelete={(id) => void handleDeleteMessage(id)}
                    />
                  ) : null}
                </div>

                <div
                  className={cn(
                    "mt-0.5 flex w-full min-w-0 items-center gap-2",
                    isOwn ? "flex-row-reverse justify-start" : "justify-start",
                  )}
                >
                  {canReact ? (
                    <button
                      type="button"
                      onClick={() => likeMessageMutation.mutate(message.id)}
                      disabled={likeMessageMutation.isPending}
                      aria-label={
                        message.is_liked ? "Remover curtida" : "Curtir mensagem"
                      }
                      aria-pressed={Boolean(message.is_liked)}
                      className={cn(
                        "inline-flex min-h-7 min-w-7 items-center gap-1 rounded-full px-1.5 text-[10px] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        message.is_liked
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Heart
                        className={cn(
                          "h-3 w-3",
                          message.is_liked && "fill-current",
                        )}
                        aria-hidden="true"
                      />
                      {(message.likes_count ?? 0) > 0
                        ? message.likes_count
                        : null}
                    </button>
                  ) : null}
                  <p
                    className={cn(
                      "min-w-0 truncate text-[9px] text-muted-foreground",
                      isOwn && "text-right",
                    )}
                  >
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isMember ? (
        <div className="sticky bottom-0 border-t border-border bg-card px-3 py-2 pb-[max(8px,env(safe-area-inset-bottom))] sm:px-4">
          {replyTo || editingMessageId ? (
            <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5">
              <div className="min-w-0">
                {editingMessageId ? (
                  <>
                    <p className="text-[10px] text-warning">Editando mensagem</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Altere o texto e envie para salvar
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-primary">
                      Respondendo {replyTo?.profile?.name || "Usuário"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {replyTo?.content || "Mensagem"}
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  resetComposerContext();
                  setText("");
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancelar
              </button>
            </div>
          ) : null}

          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-1.5 sm:gap-2">
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite mensagem..."
              rows={1}
              inputMode="text"
              enterKeyHint="send"
              autoCapitalize="sentences"
              autoCorrect="on"
              className="min-h-[38px] max-h-[92px] w-full min-w-0 resize-none overflow-y-auto rounded-xl border border-input bg-background px-3 py-2 text-[14px] leading-5 text-foreground placeholder:text-[12px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={sending || !canPost}
              aria-label="Mensagem para o grupo"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!text.trim() || sending || !canPost}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-10"
              aria-label={editingMessageId ? "Salvar mensagem" : "Enviar mensagem"}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : editingMessageId ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {!canPost ? (
            <p className="mt-2 text-xs text-warning">
              Este grupo permite postagem apenas para o papel configurado na
              governança.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="border-t border-border bg-card px-4 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Entre no grupo para enviar mensagens
          </p>
        </div>
      )}

      <ReportReasonDialog
        open={Boolean(reportMessageId)}
        onOpenChange={(open) => {
          if (!open) setReportMessageId(null);
        }}
        contentLabel="mensagem do grupo"
        reasonOptions={COMMUNITY_REPORT_REASON_OPTIONS}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}

function MessageActionsMenu({
  align,
  message,
  copied,
  canEdit,
  canDelete,
  canReport,
  reportPending,
  onReply,
  onCopy,
  onEdit,
  onReport,
  onDelete,
}: {
  align: "start" | "end";
  message: GroupMessageItem;
  copied: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
  reportPending: boolean;
  onReply: (message: GroupMessageItem) => void;
  onCopy: (message: GroupMessageItem) => void;
  onEdit: (message: GroupMessageItem) => void;
  onReport: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Abrir ações da mensagem"
        >
          <MoreVertical className="h-3 w-3" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-44 border-border bg-popover text-popover-foreground"
      >
        <DropdownMenuItem onClick={() => onReply(message)} className="gap-2 text-xs">
          <Reply className="h-3.5 w-3.5" aria-hidden="true" />
          Responder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopy(message)} className="gap-2 text-xs">
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {copied ? "Copiado" : "Copiar"}
        </DropdownMenuItem>
        {canEdit ? (
          <DropdownMenuItem onClick={() => onEdit(message)} className="gap-2 text-xs">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Editar
          </DropdownMenuItem>
        ) : null}
        {canReport ? (
          <DropdownMenuItem
            onClick={() => onReport(message.id)}
            disabled={reportPending}
            className="gap-2 text-xs"
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            Denunciar
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => onDelete(message.id)}
              className="gap-2 text-xs text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remover
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
