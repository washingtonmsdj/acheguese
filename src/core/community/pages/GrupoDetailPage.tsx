import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks"; // SSOT URLs
import { useSessionContext } from "@/core/session";
import { useGroupDetail } from "@/core/community/hooks/useGroups";
import { useJoinGroup, useLeaveGroup, useUpdateGroupMemberRole } from "@/core/community/hooks/useGroupQueries";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, Copy, Info, Loader2, Lock, MessageCircle, UserMinus, UserPlus, Users } from "lucide-react";
import { GrupoDetailChat } from "./GrupoDetailChat";
import { GrupoDetailInfoPanel } from "./GrupoDetailInfoPanel";
import { GrupoDetailMembersPanel } from "./GrupoDetailMembersPanel";
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
  const canModerate = ["admin", "moderator"].includes(userRole || "");
  const canPost =
    isMember &&
    (group?.posting_policy === "members" ||
      (group?.posting_policy === "moderators" && ["admin", "moderator"].includes(userRole || "")) ||
      (group?.posting_policy === "admins" && userRole === "admin"));
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
      toast.error("Não foi possível compartilhar o link do grupo");
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
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroupMutation.mutateAsync(id!);
      toast.success("Você saiu do grupo");
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao sair");
    }
  };

  const handleRoleChange = async (
    memberProfileId: string,
    role: "admin" | "moderator" | "member",
  ) => {
    if (!id) return;
    await updateRoleMutation.mutateAsync({ groupId: id, memberProfileId, role });
    toast.success("Função atualizada");
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
            <GrupoDetailChat
              groupId={id!}
              isMember={isMember}
              canPost={!!canPost}
              canModerate={canModerate}
            />
          </div>
        )}
        {activeTab === "membros" && (
          <GrupoDetailMembersPanel
            members={members}
            canManageRoles={["admin", "moderator"].includes(userRole || "")}
            currentProfileId={activeProfile?.id}
            onRoleChange={handleRoleChange}
          />
        )}
        {activeTab === "info" && (
          <GrupoDetailInfoPanel
            groupId={id}
            group={group}
            membersCount={members.length}
            canModerate={canModerate}
            onCopyShareLink={handleCopyShareLink}
          />
        )}
      </div>
    </div>
  );
}
