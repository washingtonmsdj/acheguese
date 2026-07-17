import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
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
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import {
  useDeleteGroupMessage,
  useGroupMessages,
  useReportGroupMessage,
  useSendGroupMessage,
  useToggleGroupMessageLike,
  useUpdateGroupMessage,
} from "@/core/community/hooks/useGroupQueries";
import { getInitials } from "./GrupoDetailShared";
import type { GroupMessageItem } from "./GrupoDetailShared";
import {
  COMMUNITY_REPORT_REASON_OPTIONS,
  ReportReasonDialog,
  type CommunityReportReason,
} from "@/core/moderation";

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
  const sending = sendMessageMutation.isPending;
  const scrollRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [text]);

  const handleSend = async () => {
    if (!canPost) {
      toast.error("Este grupo limita postagens para sua funcao");
      return;
    }
    if (!text.trim()) return;
    try {
      if (editingMessageId) {
        await updateMessageMutation.mutateAsync({
          groupId,
          messageId: editingMessageId,
          content: text,
        });
      } else {
        await sendMessageMutation.mutateAsync({
          groupId,
          content: text,
          metadata: replyTo
            ? {
                reply_to_message_id: replyTo.id,
              }
            : undefined,
        });
      }
      setText("");
      setReplyTo(null);
      setEditingMessageId(null);
    } catch {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessageMutation.mutateAsync({ groupId, messageId });
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

  const handleCopyMessage = async (msg: GroupMessageItem) => {
    try {
      await navigator.clipboard.writeText(msg.content || "");
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 1500);
      toast.success("Mensagem copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleReplyMessage = (msg: GroupMessageItem) => {
    setEditingMessageId(null);
    setReplyTo(msg);
    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 0);
  };

  const handleEditMessage = (msg: GroupMessageItem) => {
    setReplyTo(null);
    setEditingMessageId(msg.id);
    setText(msg.content || "");
    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 0);
  };

  const renderMessageContent = (msg: GroupMessageItem, isOwn: boolean) => {
    const repliedMessage = msg.metadata?.reply_to_message_id
      ? (messages as GroupMessageItem[]).find(
          (candidate) => candidate.id === msg.metadata?.reply_to_message_id,
        )
      : undefined;
    const bubbleClass = isOwn
      ? "bg-teal-500/20 text-teal-100 rounded-tr-sm"
      : "bg-white/5 text-gray-100 rounded-tl-sm";

    if (msg.message_type === "image" && msg.media_url) {
      return (
        <div
          className={`max-w-full overflow-hidden rounded-2xl border border-white/10 ${bubbleClass}`}
        >
          <img
            src={msg.media_url}
            alt={msg.content || "Imagem do grupo"}
            className="h-auto max-h-[280px] w-full object-cover"
            loading="lazy"
          />
          {msg.content ? (
            <div className="px-2.5 py-1.5 text-[13px] leading-relaxed">
              {msg.content}
            </div>
          ) : null}
        </div>
      );
    }

    if (msg.message_type === "audio" && msg.media_url) {
      return (
        <div className={`max-w-full rounded-2xl px-2.5 py-1.5 ${bubbleClass}`}>
          <p className="mb-1.5 text-[11px] text-white/75">
            {msg.content || "Mensagem de audio"}
          </p>
          <audio controls preload="none" className="w-full max-w-[250px]">
            <source
              src={msg.media_url}
              type={msg.media_mime_type || "audio/mpeg"}
            />
          </audio>
          {msg.audio_duration_seconds ? (
            <p className="mt-1 text-[10px] text-white/55">
              {msg.audio_duration_seconds}s
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div
        className={`max-w-full px-2.5 py-1.5 rounded-2xl text-[13px] break-words ${bubbleClass}`}
      >
        {msg?.metadata?.reply_to_message_id ? (
          <div className="mb-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
            <p className="text-[10px] text-teal-200">
              Resposta para {repliedMessage?.profile?.name || "mensagem"}
            </p>
            <p className="line-clamp-2 text-[10px] text-gray-300">
              {repliedMessage?.content || "Mensagem anterior"}
            </p>
          </div>
        ) : null}
        {msg.content}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 space-y-2"
      >
        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
            <p className="text-xs text-gray-500 mt-1">
              Seja o primeiro a dizer ola!
            </p>
          </div>
        )}
        {(messages as GroupMessageItem[]).map((msg, i) => {
          const isOwn =
            msg.user_id === user?.id ||
            msg.sender_profile_id === user?.id ||
            msg.sender_profile_id === activeProfile?.id;
          const showAvatar =
            i === 0 ||
            ((messages as GroupMessageItem[])[i - 1]?.user_id ||
              (messages as GroupMessageItem[])[i - 1]?.sender_profile_id) !==
              (msg.user_id || msg.sender_profile_id);

          return (
            <div
              key={msg.id}
              className={`flex min-w-0 gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {showAvatar ? (
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarImage src={msg.profile?.avatar_url || ""} />
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                    {getInitials(msg.profile?.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8 flex-shrink-0" />
              )}
              <div
                className={`flex min-w-0 max-w-[78%] flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                {showAvatar && (
                  <p
                    className={`mb-0.5 text-[9px] text-gray-500 ${isOwn ? "text-right" : ""}`}
                  >
                    {msg.profile?.name || "Usuario"}
                  </p>
                )}
                <div
                  className={`mt-0.5 flex w-full min-w-0 items-end gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  {isOwn ? null : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-300 hover:bg-white/10"
                          aria-label="Abrir acoes da mensagem"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-44 border-white/10 bg-[#152026] text-gray-100"
                      >
                        <DropdownMenuItem
                          onClick={() => handleReplyMessage(msg)}
                          className="gap-2 text-xs"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          Responder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyMessage(msg)}
                          className="gap-2 text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedMessageId === msg.id ? "Copiado" : "Copiar"}
                        </DropdownMenuItem>
                        {canReport ? (
                          <DropdownMenuItem
                            onClick={() => setReportMessageId(msg.id)}
                            disabled={reportMessageMutation.isPending}
                            className="gap-2 text-xs"
                          >
                            <Flag className="h-3.5 w-3.5" />
                            Denunciar
                          </DropdownMenuItem>
                        ) : null}
                        {canModerate ? (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="gap-2 text-xs text-red-300 focus:text-red-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remover
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {renderMessageContent(msg, isOwn)}
                  {isOwn ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-300 hover:bg-white/10"
                          aria-label="Abrir acoes da mensagem"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 border-white/10 bg-[#152026] text-gray-100"
                      >
                        <DropdownMenuItem
                          onClick={() => handleReplyMessage(msg)}
                          className="gap-2 text-xs"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          Responder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyMessage(msg)}
                          className="gap-2 text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedMessageId === msg.id ? "Copiado" : "Copiar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditMessage(msg)}
                          className="gap-2 text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </DropdownMenuItem>
                        <>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="gap-2 text-xs text-red-300 focus:text-red-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </DropdownMenuItem>
                        </>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
                <div
                  className={`mt-0.5 flex w-full min-w-0 items-center gap-2 ${isOwn ? "flex-row-reverse justify-start" : "justify-start"}`}
                >
                  {canReact ? (
                    <button
                      type="button"
                      onClick={() => likeMessageMutation.mutate(msg.id)}
                      disabled={likeMessageMutation.isPending}
                      aria-label={
                        msg.is_liked ? "Remover curtida" : "Curtir mensagem"
                      }
                      aria-pressed={Boolean(msg.is_liked)}
                      className={`inline-flex min-h-7 min-w-7 items-center gap-1 rounded-full px-1.5 text-[10px] transition-colors disabled:opacity-50 ${
                        msg.is_liked
                          ? "bg-rose-400/12 text-rose-300"
                          : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                      }`}
                    >
                      <Heart
                        className={`h-3 w-3 ${msg.is_liked ? "fill-current" : ""}`}
                      />
                      {(msg.likes_count ?? 0) > 0 ? msg.likes_count : null}
                    </button>
                  ) : null}
                  <p
                    className={`min-w-0 truncate text-[9px] text-gray-600 ${isOwn ? "text-right" : ""}`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), {
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

      {/* Input */}
      {isMember ? (
        <div className="sticky bottom-0 border-t border-white/10 bg-[#1E2529] px-3 py-2 sm:px-4 pb-[max(8px,env(safe-area-inset-bottom))]">
          {replyTo || editingMessageId ? (
            <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
              <div className="min-w-0">
                {editingMessageId ? (
                  <>
                    <p className="text-[10px] text-amber-300">
                      Editando mensagem
                    </p>
                    <p className="truncate text-xs text-gray-300">
                      Altere o texto e envie para salvar
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-teal-300">
                      Respondendo {replyTo.profile?.name || "Usuario"}
                    </p>
                    <p className="truncate text-xs text-gray-300">
                      {replyTo.content || "Mensagem"}
                    </p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setEditingMessageId(null);
                  setText("");
                }}
                className="text-[10px] text-gray-300 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          ) : null}
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-1.5 sm:gap-2">
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={() => textAreaRef.current?.focus()}
              onTouchStart={() => textAreaRef.current?.focus()}
              placeholder="Digite mensagem..."
              rows={1}
              inputMode="text"
              enterKeyHint="send"
              autoCapitalize="sentences"
              autoCorrect="on"
              className="min-h-[38px] max-h-[92px] min-w-0 w-full resize-none overflow-y-auto rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[14px] leading-5 text-white placeholder:text-[12px] placeholder:text-gray-500 focus:border-teal-400/50 focus:outline-none touch-manipulation"
              disabled={sending || !canPost}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || sending || !canPost}
              className="h-9 w-9 flex-shrink-0 rounded-full bg-teal-500 transition-colors hover:bg-teal-600 disabled:opacity-30 sm:h-10 sm:w-10"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : editingMessageId ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          {!canPost ? (
            <p className="mt-2 text-xs text-amber-300/90">
              Este grupo permite postagem apenas para o papel configurado na
              governanca.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="border-t border-white/10 px-4 py-4 text-center bg-[#1E2529]">
          <p className="text-sm text-gray-400">
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
