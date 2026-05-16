import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppUrls } from "@/core/routing/hooks"; // SSOT URLs
import { useSessionContext } from "@/core/session";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useGroupDetail } from "@/core/community/hooks/useGroups";
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
import {
  Users,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Send,
  Loader2,
  Crown,
  MessageCircle,
  Info,
  Lock,
  MoreVertical,
  Trash2,
  Copy,
  Image,
  Flag,
  Reply,
  BarChart3,
  ShieldCheck,
  EyeOff,
  Mic,
  UserCog,
  Filter,
  Pencil,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useGroupMessages,
  useSendGroupMessage,
  useJoinGroup,
  useLeaveGroup,
  useUpdateGroupMemberRole,
  useDeleteGroupMessage,
  useUpdateGroupMessage,
  useReportGroupMessage,
  useGroupMessageReports,
  useUpdateGroupMessageReportStatus,
} from "@/core/community/hooks/useGroupQueries";
import { USER_ROLE } from "@/shared/types/constants";
import { DEFAULT_GROUP_RULES, GROUP_CAPABILITY_LABELS, getGroupCategory } from "@/shared/constants/groupTaxonomy";
const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

interface GroupMessageItem {
  id: string;
  content?: string | null;
  message_type?: "text" | "image" | "audio" | "poll" | "system";
  media_url?: string | null;
  media_mime_type?: string | null;
  audio_duration_seconds?: number | null;
  created_at: string;
  sender_profile_id?: string | null;
  user_id?: string | null;
  profile?: { name?: string | null; avatar_url?: string | null } | null;
  metadata?: {
    reply_to_message_id?: string;
    reply_preview?: string;
    reply_author_name?: string;
  } | null;
}

interface GroupMemberItem {
  member_profile_id: string;
  role: string;
  profile?: { name?: string | null; avatar_url?: string | null } | null;
}

interface GroupMessageReportItem {
  id: string;
  message_id: string;
  reason: string;
  details?: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
  message?: {
    content?: string | null;
    message_type?: string | null;
    profile?: { name?: string | null } | null;
  } | null;
  moderation_history?: Array<{ at: string; status: string }> | null;
}

function GroupChat({
  groupId,
  isMember,
  canPost,
  canModerate,
}: {
  groupId: string;
  isMember: boolean;
  canPost: boolean;
  canModerate: boolean;
}) {
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const { data: messages, isLoading } = useGroupMessages(groupId);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<GroupMessageItem | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const sendMessageMutation = useSendGroupMessage();
  const deleteMessageMutation = useDeleteGroupMessage();
  const updateMessageMutation = useUpdateGroupMessage();
  const reportMessageMutation = useReportGroupMessage();
  const sending = sendMessageMutation.isPending;
  const scrollRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showEmojiPicker) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!emojiPickerRef.current) return;
      if (!emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showEmojiPicker]);

  const handleSend = async () => {
    if (!canPost) {
      toast.error("Este grupo limita postagens para sua função");
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
                reply_preview: (replyTo.content || "").slice(0, 120),
                reply_author_name: replyTo.profile?.name || "Usuario",
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessageMutation.mutateAsync({ groupId, messageId });
  };

  const handleReportMessage = async (messageId: string) => {
    if (reportingMessageId === messageId) return;
    setReportingMessageId(messageId);
    try {
      await reportMessageMutation.mutateAsync({
        messageId,
        reason: "Conteudo inadequado para o grupo",
      });
    } finally {
      setReportingMessageId(null);
    }
  };

  const handleSendMockImage = async () => {
    try {
      await sendMessageMutation.mutateAsync({
        groupId,
        content: text.trim() || "Imagem compartilhada no grupo",
        messageType: "image",
        mediaUrl:
          "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=1200&q=80&auto=format&fit=crop",
        mediaMimeType: "image/jpeg",
      });
      setText("");
    } catch {
      toast.error("Nao foi possivel enviar imagem");
    }
  };

  const handleSendMockAudio = async () => {
    try {
      await sendMessageMutation.mutateAsync({
        groupId,
        content: text.trim() || "Audio da comunidade",
        messageType: "audio",
        mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        mediaMimeType: "audio/mpeg",
        audioDurationSeconds: 23,
      });
      setText("");
    } catch {
      toast.error("Nao foi possivel enviar audio");
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 0);
  };

  const handleCopyMessage = async (msg: GroupMessageItem) => {
    try {
      await navigator.clipboard.writeText(msg.content || "");
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 1500);
      toast.success("Mensagem copiada");
    } catch {
      toast.error("Nao foi possivel copiar");
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
    const bubbleClass = isOwn
      ? "bg-teal-500/20 text-teal-100 rounded-tr-sm"
      : "bg-white/5 text-gray-100 rounded-tl-sm";

    if (msg.message_type === "image" && msg.media_url) {
      return (
        <div className={`max-w-full overflow-hidden rounded-2xl border border-white/10 ${bubbleClass}`}>
          <img
            src={msg.media_url}
            alt={msg.content || "Imagem do grupo"}
            className="h-auto max-h-[280px] w-full object-cover"
            loading="lazy"
          />
          {msg.content ? (
            <div className="px-2.5 py-1.5 text-[13px] leading-relaxed">{msg.content}</div>
          ) : null}
        </div>
      );
    }

    if (msg.message_type === "audio" && msg.media_url) {
      return (
        <div className={`max-w-full rounded-2xl px-2.5 py-1.5 ${bubbleClass}`}>
          <p className="mb-1.5 text-[11px] text-white/75">{msg.content || "Mensagem de audio"}</p>
          <audio controls preload="none" className="w-full max-w-[250px]">
            <source src={msg.media_url} type={msg.media_mime_type || "audio/mpeg"} />
          </audio>
          {msg.audio_duration_seconds ? (
            <p className="mt-1 text-[10px] text-white/55">{msg.audio_duration_seconds}s</p>
          ) : null}
        </div>
      );
    }

    return (
      <div className={`max-w-full px-2.5 py-1.5 rounded-2xl text-[13px] break-words ${bubbleClass}`}>
        {msg?.metadata?.reply_to_message_id ? (
          <div className="mb-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
            <p className="text-[10px] text-teal-200">
              Resposta para {msg?.metadata?.reply_author_name || "mensagem"}
            </p>
            <p className="line-clamp-2 text-[10px] text-gray-300">
              {msg?.metadata?.reply_preview || "Mensagem anterior"}
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
              Seja o primeiro a dizer olá!
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
            (((messages as GroupMessageItem[])[i - 1]?.user_id ||
              (messages as GroupMessageItem[])[i - 1]?.sender_profile_id) !==
              (msg.user_id || msg.sender_profile_id));

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
                    {msg.profile?.name || "Usuário"}
                  </p>
                )}
                <div className={`mt-0.5 flex w-full min-w-0 items-end gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                  {isOwn ? null : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-300 hover:bg-white/10"
                          aria-label="Abrir ações da mensagem"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-44 border-white/10 bg-[#152026] text-gray-100">
                        <DropdownMenuItem onClick={() => handleReplyMessage(msg)} className="gap-2 text-xs">
                          <Reply className="h-3.5 w-3.5" />
                          Responder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyMessage(msg)} className="gap-2 text-xs">
                          <Copy className="h-3.5 w-3.5" />
                          {copiedMessageId === msg.id ? "Copiado" : "Copiar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReportMessage(msg.id)}
                          disabled={reportingMessageId === msg.id}
                          className="gap-2 text-xs"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          Denunciar
                        </DropdownMenuItem>
                        {canModerate ? (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="gap-2 text-xs text-red-300 focus:text-red-200">
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
                          aria-label="Abrir ações da mensagem"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 border-white/10 bg-[#152026] text-gray-100">
                        <DropdownMenuItem onClick={() => handleReplyMessage(msg)} className="gap-2 text-xs">
                          <Reply className="h-3.5 w-3.5" />
                          Responder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyMessage(msg)} className="gap-2 text-xs">
                          <Copy className="h-3.5 w-3.5" />
                          {copiedMessageId === msg.id ? "Copiado" : "Copiar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMessage(msg)} className="gap-2 text-xs">
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </DropdownMenuItem>
                        <>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="gap-2 text-xs text-red-300 focus:text-red-200">
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </DropdownMenuItem>
                        </>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
                <div className={`mt-0.5 flex w-full min-w-0 ${isOwn ? "justify-end" : "justify-start"}`}>
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
                    <p className="text-[10px] text-amber-300">Editando mensagem</p>
                    <p className="truncate text-xs text-gray-300">Altere o texto e envie para salvar</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-teal-300">
                      Respondendo {replyTo.profile?.name || "Usuário"}
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
          <div className="relative grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-end gap-1.5 sm:gap-2">
            <button
              type="button"
              title="Enviar imagem"
              onClick={handleSendMockImage}
              disabled={sending}
              className="h-8 w-8 flex-shrink-0 rounded-full bg-white/5 transition-colors hover:bg-white/10 sm:h-9 sm:w-9"
            >
              <Image className="w-4 h-4 text-gray-300" />
            </button>
            <button
              type="button"
              title="Emoji"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="h-8 w-8 flex-shrink-0 rounded-full bg-white/5 text-sm transition-colors hover:bg-white/10 sm:h-9 sm:w-9 sm:text-base"
            >
              ??
            </button>
            {showEmojiPicker ? (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-11 left-10 z-20 w-[220px] rounded-xl border border-white/10 bg-[#11181D] p-2 shadow-xl"
              >
                <div className="grid grid-cols-8 gap-1">
                  {["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "?", "??"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="h-7 w-7 rounded-md text-base hover:bg-white/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
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
              title="Gravar audio"
              onClick={handleSendMockAudio}
              className="h-9 w-9 flex-shrink-0 rounded-full bg-white/5 transition-colors hover:bg-white/10 sm:h-10 sm:w-10"
            >
              <Mic className="w-4 h-4 text-gray-300" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || sending || !canPost}
              className="h-9 w-9 flex-shrink-0 rounded-full bg-teal-500 transition-colors hover:bg-teal-600 disabled:opacity-30 sm:h-10 sm:w-10"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                editingMessageId ? <Check className="w-4 h-4 text-white" /> : <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          {!canPost ? (
            <p className="mt-2 text-xs text-amber-300/90">
              Este grupo permite postagem apenas para o papel configurado na governança.
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
    </div>
  );
}

function MembersPanel({
  members,
  canManageRoles,
  currentProfileId,
  onRoleChange,
}: {
  members: GroupMemberItem[];
  canManageRoles: boolean;
  currentProfileId?: string;
  onRoleChange: (memberProfileId: string, role: "admin" | "moderator" | "member") => void;
}) {
  return (
    <div className="px-4 py-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Membros ({members.length})
      </h3>
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-2.5 py-2">
          <Avatar className="w-9 h-9">
            <AvatarImage src={m.profile?.avatar_url || ""} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
              {getInitials(m.profile?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">
              {m.profile?.name || "Usuário"}
            </p>
            <p className="text-[10px] text-gray-500 capitalize">
              {m.role || "membro"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {m.role === USER_ROLE.ADMIN && (
              <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            )}
            {canManageRoles && m.member_profile_id !== currentProfileId && (
              <select
                value={m.role || "member"}
                onChange={(event) =>
                  onRoleChange(
                    m.member_profile_id,
                    event.target.value as "admin" | "moderator" | "member",
                  )
                }
                className="w-[108px] rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none"
                aria-label={`Alterar função de ${m.profile?.name || "membro"}`}
              >
                <option className="bg-[#1E2529]" value="member">Membro</option>
                <option className="bg-[#1E2529]" value="moderator">Moderador</option>
                <option className="bg-[#1E2529]" value="admin">Admin</option>
              </select>
            )}
          </div>
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          Nenhum membro ainda
        </p>
      )}
    </div>
  );
}

export default function GrupoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // SSOT URLs
  const { activeProfile } = useSessionContext();
  const { user } = useAuth();
  const { group, members, isMember, userRole, loading, refetch } =
    useGroupDetail(id);
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();
  const updateRoleMutation = useUpdateGroupMemberRole();
  const [activeTab, setActiveTab] = useState<"chat" | "membros" | "info">(
    "chat",
  );
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "reviewing" | "resolved" | "dismissed">("pending");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const categoryInfo = getGroupCategory(group?.category || "geral");
  const canModerate = ["admin", "moderator"].includes(userRole || "");
  const canPost =
    isMember &&
    (group?.posting_policy === "members" ||
      (group?.posting_policy === "moderators" && ["admin", "moderator"].includes(userRole || "")) ||
      (group?.posting_policy === "admins" && userRole === "admin"));
  const { data: messageReports = [] } = useGroupMessageReports(id, canModerate);
  const updateReportStatusMutation = useUpdateGroupMessageReportStatus();
  const pendingReportsCount = messageReports.filter((report) => report.status === "pending").length;
  const filteredReports = (messageReports as GroupMessageReportItem[]).filter((report) =>
    reportFilter === "all" ? true : report.status === reportFilter,
  );
  const selectedReport = filteredReports.find((report) => report.id === selectedReportId) || null;
  const handleUpdateReportStatus = async (
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed",
  ) => {
    if (!id) return;
    await updateReportStatusMutation.mutateAsync({ groupId: id, reportId, status });
  };
  const ruleLines = (group?.rules || DEFAULT_GROUP_RULES.join("\n"))
    .split("\n")
    .map((rule) => rule.trim())
    .filter(Boolean);
  const capabilities = {
    text: true,
    images: group?.media_policy !== "text_only" && group?.capabilities?.images !== false,
    audio: group?.capabilities?.audio !== false,
    polls: group?.capabilities?.polls !== false,
    chat: group?.capabilities?.chat !== false,
    reactions: group?.capabilities?.reactions !== false,
    reports: group?.capabilities?.reports !== false,
    share_link: group?.capabilities?.share_link !== false,
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}${appUrls.community.groupDetail(id || "")}`;
    try {
      if (navigator.share && capabilities.share_link) {
        await navigator.share({
          title: `Grupo ${group?.name || "Comunidade"}`,
          text: "Participe deste grupo na comunidade",
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link do grupo copiado");
    } catch {
      toast.error("Nao foi possivel compartilhar o link do grupo");
    }
  };

  const handleJoin = async () => {
    if (!user) {
      toast.error("Faça login primeiro");
      return;
    }
    try {
      await joinGroupMutation.mutateAsync(id!);
      toast.success("Você entrou no grupo!");
      refetch();
    } catch (err: unknown) {
      toast.error(err.message || "Error entrar");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroupMutation.mutateAsync(id!);
      toast.success("Você saiu do grupo");
      refetch();
    } catch (err: unknown) {
      toast.error(err.message || "Error sair");
    }
  };

  const handleRoleChange = async (
    memberProfileId: string,
    role: "admin" | "moderator" | "member",
  ) => {
    if (!id) return;
    await updateRoleMutation.mutateAsync({ groupId: id, memberProfileId, role });
    toast.success("Funcao atualizada");
    refetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12181B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#12181B] flex flex-col items-center justify-center gap-4">
        <Users className="w-16 h-16 text-gray-600" />
        <h2 className="text-lg font-semibold text-white">
          Grupo não encontrado
        </h2>
        <Button
          onClick={() => navigate(appUrls.community.groups)} // SSOT
          variant="outline"
          className="border-teal-400/30 text-teal-400"
        >
          Ver todos os grupos
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#12181B] flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1E2529]/95 backdrop-blur-lg border-b border-white/10">
        <div className="h-14 px-2.5 sm:px-4 flex items-center gap-2 sm:gap-3 max-w-3xl mx-auto min-w-0">
          <button
            onClick={() => navigate(appUrls.community.groups)} // SSOT
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white truncate">
                {group.name}
              </h1>
              {group.is_private && (
                <Lock className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              {members.length} membros
            </p>
          </div>

          {isMember ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLeave}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-[11px] px-2 sm:text-xs sm:px-3"
            >
              <UserMinus className="w-3.5 h-3.5 mr-1" /> Sair
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleJoin}
              className="bg-teal-500 hover:bg-teal-600 text-white text-[11px] px-2 gap-1 sm:text-xs sm:px-3"
            >
              <UserPlus className="w-3.5 h-3.5" /> Entrar
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyShareLink}
            className="hidden text-gray-400 hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 border-t border-white/5 max-w-3xl mx-auto">
          {(
            [
              { key: "chat", label: "Chat", icon: MessageCircle },
              {
                key: "membros",
                label: `Membros (${members.length})`,
                icon: Users,
              },
              { key: "info", label: "Info", icon: Info },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`min-w-0 flex items-center justify-center gap-1 py-3 px-0.5 text-[10px] sm:text-xs font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full min-h-0 flex flex-col overflow-hidden">
        {activeTab === "chat" && (
          <div className="flex-1 min-h-0">
            <GroupChat
              groupId={id!}
              isMember={isMember}
              canPost={!!canPost}
              canModerate={canModerate}
            />
          </div>
        )}
        {activeTab === "membros" && (
          <MembersPanel
            members={members}
            canManageRoles={["admin", "moderator"].includes(userRole || "")}
            currentProfileId={activeProfile?.id}
            onRoleChange={handleRoleChange}
          />
        )}
        {activeTab === "info" && (
          <div className="px-4 py-6 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/10 flex items-center justify-center text-4xl mx-auto mb-4 border-2 border-teal-400/20">
                {group.avatar_url ? (
                  <img
                    src={group.avatar_url}
                    alt={`Avatar do grupo ${group.name}`}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  "👥"
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {group.name}
              </h2>
              <p className="text-sm text-gray-400">
                {group.description || "Sem descrição"}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  capabilities.chat && { label: GROUP_CAPABILITY_LABELS.chat, icon: MessageCircle },
                  capabilities.images && { label: GROUP_CAPABILITY_LABELS.images, icon: Image },
                  capabilities.audio && { label: GROUP_CAPABILITY_LABELS.audio, icon: Mic },
                  capabilities.polls && { label: GROUP_CAPABILITY_LABELS.polls, icon: BarChart3 },
                  capabilities.reports && { label: GROUP_CAPABILITY_LABELS.reports, icon: ShieldCheck },
                ].filter(Boolean) .map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-300">
                    <item.icon className="h-3 w-3 text-teal-300" />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-teal-400">
                  {members.length}
                </p>
                <p className="text-xs text-gray-400">Membros</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-cyan-400">
                  {group.posts_count || 0}
                </p>
                <p className="text-xs text-gray-400">Posts</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Categoria</span>
                <span className="text-sm text-white capitalize">
                  {categoryInfo.label}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Visibilidade</span>
                <span className="text-sm text-white flex items-center gap-1">
                  {group.is_private ? (
                    <>
                      <Lock className="w-3 h-3" /> Privado
                    </>
                  ) : (
                    "Público"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-gray-400">Entrada</span>
                <span className="min-w-0 text-right text-xs sm:text-sm text-white">
                  {group.join_policy === "approval"
                    ? "Por aprovação"
                    : group.join_policy === "invite"
                      ? "Por convite"
                      : "Livre para moradores"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-gray-400">Postagens</span>
                <span className="min-w-0 text-right text-xs sm:text-sm text-white">
                  {group.posting_policy === "admins"
                    ? "Somente admins"
                    : group.posting_policy === "moderators"
                      ? "Admins e moderadores"
                      : "Membros"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-gray-400">Membros</span>
                <span className="min-w-0 flex items-center gap-1 text-right text-xs sm:text-sm text-white">
                  {group.member_visibility === "hidden" ? <EyeOff className="h-3 w-3" /> : null}
                  {group.member_visibility === "public"
                    ? "Lista publica"
                    : group.member_visibility === "members"
                      ? "Visivel para membros"
                      : group.member_visibility === "hidden"
                        ? "Oculto"
                        : "Mostra apenas quantidade"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-sm font-semibold text-teal-200"
              >
                <Copy className="h-4 w-4" />
                Copiar link de compartilhamento
              </button>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <UserCog className="h-4 w-4 text-teal-300" />
                  Admins
                </span>
                <span className="text-right text-sm text-white">
                  Promovidos na aba membros
                </span>
              </div>
              {canModerate ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-amber-200">
                    <ShieldCheck className="h-4 w-4" />
                    Fila de moderação
                  </span>
                  <span className="text-right text-sm text-amber-100">
                    {pendingReportsCount} denúncia(s) pendente(s)
                  </span>
                </div>
              ) : null}
              {canModerate ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">Denúncias recentes</p>
                    <span className="text-xs text-gray-400">{messageReports.length} no total</span>
                  </div>
                  <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {(
                      [
                        { key: "pending", label: "Pendentes" },
                        { key: "reviewing", label: "Em análise" },
                        { key: "resolved", label: "Resolvidas" },
                        { key: "dismissed", label: "Dispensadas" },
                        { key: "all", label: "Todas" },
                      ] as const
                    ).map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setReportFilter(filter.key)}
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${
                          reportFilter === filter.key
                            ? "border-teal-400/40 bg-teal-400/10 text-teal-200"
                            : "border-white/10 bg-white/5 text-gray-300"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {filteredReports.slice(0, 8).map((report) => (
                      <div
                        key={report.id}
                        className={`rounded-lg border bg-black/10 p-2 ${
                          selectedReportId === report.id ? "border-teal-400/40" : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-gray-200">{report.reason}</p>
                          <span className="shrink-0 text-[10px] uppercase text-amber-200">{report.status}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500">
                          {new Date(report.created_at).toLocaleString("pt-BR")}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedReportId(report.id)}
                          className="mt-1 text-[10px] text-teal-300 hover:text-teal-200"
                        >
                          Ver detalhe
                        </button>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(report.id, "reviewing")}
                            className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-gray-200"
                          >
                            Em análise
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(report.id, "resolved")}
                            className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200"
                          >
                            Resolver
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateReportStatus(report.id, "dismissed")}
                            className="rounded-full border border-slate-400/30 bg-slate-400/10 px-2 py-0.5 text-[10px] text-slate-200"
                          >
                            Dispensar
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredReports.length === 0 ? (
                      <p className="text-xs text-gray-500">Sem denúncias no momento.</p>
                    ) : null}
                  </div>
                  {selectedReport ? (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs text-gray-300">
                        <Filter className="h-3.5 w-3.5 text-teal-300" />
                        Detalhe da denúncia
                      </div>
                      <p className="text-xs text-white">{selectedReport.reason}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        ID da mensagem: {selectedReport.message_id}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Criada em {new Date(selectedReport.created_at).toLocaleString("pt-BR")}
                      </p>
                      {selectedReport.details ? (
                        <p className="mt-1 text-[11px] text-gray-300">
                          Detalhes: {selectedReport.details}
                        </p>
                      ) : null}
                      {selectedReport.message ? (
                        <div className="mt-2 rounded-md border border-white/10 bg-white/5 p-2">
                          <p className="text-[10px] uppercase text-gray-400">Mensagem original</p>
                          <p className="mt-1 text-xs text-white">
                            {selectedReport.message.content || "(sem texto)"}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            Autor: {selectedReport.message.profile?.name || "Usuário"}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Tipo: {selectedReport.message.message_type || "text"}
                          </p>
                        </div>
                      ) : null}
                      <div className="mt-2">
                        <p className="text-[10px] uppercase text-gray-400">Histórico de moderação</p>
                        <div className="mt-1 space-y-1">
                          {(selectedReport.moderation_history || []).length === 0 ? (
                            <p className="text-[11px] text-gray-500">Sem ações registradas.</p>
                          ) : (
                            (selectedReport.moderation_history || []).map((event, idx: number) => (
                              <p key={`${event.at}-${idx}`} className="text-[11px] text-gray-300">
                                {new Date(event.at).toLocaleString("pt-BR")} - {event.status}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Criado por</span>
                <span className="text-sm text-white">
                  {group.creator?.name || "Desconhecido"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Criado em</span>
                <span className="text-sm text-white">
                  {new Date(group.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-300" />
                <h3 className="text-sm font-semibold text-white">Regras e moderação</h3>
              </div>
              <ol className="space-y-2">
                {ruleLines.map((rule, index) => (
                  <li key={`${rule}-${index}`} className="flex gap-2 text-sm leading-relaxed text-gray-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[11px] text-teal-300">
                      {index + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
