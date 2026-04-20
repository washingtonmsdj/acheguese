import React from "react";

import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAppUrls } from "@/core/routing/hooks"; // âœ… SSOT URLs
import { useSessionContext } from "@/core/session";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useGroupDetail } from "@/core/community/hooks/useGroups";
import { useGroupChat } from "@/core/community/hooks/useGroupChat";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
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
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useGroups,
  useGroup,
  useGroupMessages,
  useGroupMembers,
  useIsGroupMember,
  useSendGroupMessage,
  useJoinGroup,
  useLeaveGroup,
} from "@/core/community/hooks/useGroupQueries";
import { USER_ROLE } from "@/shared/types/constants";
const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

function GroupChat({
  groupId,
  isMember,
}: {
  groupId: string;
  isMember: boolean;
}) {
  const { user } = useAuth();
  const { data: messages, isLoading, error } = useGroupMessages(groupId);
  const [text, setText] = useState("");
  const sendMessageMutation = useSendGroupMessage();
  const sending = sendMessageMutation.isPending;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await sendMessageMutation.mutateAsync({ groupId, content: text });
      setText("");
    } catch {
      toast.error("Error send mensagem");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] md:h-[calc(100vh-260px)]">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhuma mensagem ainda</p>
            <p className="text-xs text-gray-500 mt-1">
              Seja o primeiro a dizer olÃ¡!
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn =
            (msg as any).user_id === user?.id ||
            msg.sender_profile_id === user?.id;
          const showAvatar =
            i === 0 ||
            ((messages[i - 1] as any)?.user_id ||
              messages[i - 1]?.sender_profile_id) !==
              ((msg as any).user_id || msg.sender_profile_id);

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {showAvatar ? (
                <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                  <AvatarImage src={msg.profile?.avatar_url || ""} />
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                    {getInitials(msg.profile?.name)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8 flex-shrink-0" />
              )}
              <div
                className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}
              >
                {showAvatar && (
                  <p
                    className={`text-[10px] text-gray-500 mb-0.5 ${isOwn ? "text-right" : ""}`}
                  >
                    {msg.profile?.name || "UsuÃ¡rio"}
                  </p>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm break-words ${
                    isOwn
                      ? "bg-teal-500/20 text-teal-100 rounded-tr-sm"
                      : "bg-white/5 text-gray-200 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <p
                  className={`text-[9px] text-gray-600 mt-0.5 ${isOwn ? "text-right" : ""}`}
                >
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      {isMember ? (
        <div className="border-t border-white/10 px-4 py-3 bg-[#1E2529]">
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-400/50"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-10 h-10 rounded-full bg-teal-500 hover:bg-teal-600 disabled:opacity-30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 px-4 py-4 text-center bg-[#1E2529]">
          <p className="text-sm text-gray-400">
            Entre no grupo para send mensagens
          </p>
        </div>
      )}
    </div>
  );
}

function MembersPanel({ members }: { members: any[] }) {
  return (
    <div className="px-4 py-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Membros ({members.length})
      </h3>
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 py-2">
          <Avatar className="w-9 h-9">
            <AvatarImage src={m.profile?.avatar_url || ""} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
              {getInitials(m.profile?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">
              {m.profile?.name || "UsuÃ¡rio"}
            </p>
            <p className="text-[10px] text-gray-500 capitalize">
              {m.role || "membro"}
            </p>
          </div>
          {m.role === USER_ROLE.ADMIN && (
            <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )}
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
  const appUrls = useAppUrls(); // âœ… SSOT URLs
  const { activeProfile } = useSessionContext();
  const { user } = useAuth();
  const { group, members, isMember, userRole, loading, refetch } =
    useGroupDetail(id);
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();
  const [activeTab, setActiveTab] = useState<"chat" | "membros" | "info">(
    "chat",
  );

  const handleJoin = async () => {
    if (!user) {
      toast.error("FaÃ§a login primeiro");
      return;
    }
    try {
      await joinGroupMutation.mutateAsync(id!);
      toast.success("VocÃª entrou no grupo!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Error entrar");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroupMutation.mutateAsync(id!);
      toast.success("VocÃª saiu do grupo");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Error sair");
    }
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
          Grupo nÃ£o encontrado
        </h2>
        <Button
          onClick={() => navigate(appUrls.community.groups)} // âœ… SSOT
          variant="outline"
          className="border-teal-400/30 text-teal-400"
        >
          Ver todos os grupos
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#12181B] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1E2529]/95 backdrop-blur-lg border-b border-white/10">
        <div className="h-14 px-4 flex items-center gap-3 max-w-3xl mx-auto">
          <button
            onClick={() => navigate(appUrls.community.groups)} // âœ… SSOT
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
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs"
            >
              <UserMinus className="w-3.5 h-3.5 mr-1" /> Sair
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleJoin}
              className="bg-teal-500 hover:bg-teal-600 text-white text-xs gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Entrar
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-white/5 max-w-3xl mx-auto">
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full">
        {activeTab === "chat" && (
          <GroupChat groupId={id!} isMember={isMember} />
        )}
        {activeTab === "membros" && <MembersPanel members={members} />}
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
                  "ðŸ‘¥"
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {group.name}
              </h2>
              <p className="text-sm text-gray-400">
                {group.description || "Sem descriÃ§Ã£o"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  {group.category || "Geral"}
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
                    "PÃºblico"
                  )}
                </span>
              </div>
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
          </div>
        )}
      </div>
    </div>
  );
}

