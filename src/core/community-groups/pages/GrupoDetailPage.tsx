import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks"; // SSOT URLs
import { useSessionContext } from "@/core/session";
import { CommunityPortalGate, useCommunityAccess } from "@/core/community-experience/access";
import { useGroupDetail } from "@/core/community-groups/hooks/useGroups";
import { useJoinGroup, useLeaveGroup, useUpdateGroupMemberRole } from "@/core/community-groups/hooks/useGroupQueries";
import { useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, Copy, Info, Loader2, Lock, MessageCircle, UserMinus, UserPlus, Users } from "lucide-react";
import { GrupoDetailChat } from "./GrupoDetailChat";
import { GrupoDetailInfoPanel } from "./GrupoDetailInfoPanel";
import { GrupoDetailMembersPanel } from "./GrupoDetailMembersPanel";

export default function GrupoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // SSOT URLs
  const territorialContext = useTerritorialContext();
  const { activeProfile } = useSessionContext();
  const { user } = useAuth();
  const communityAccess = useCommunityAccess({
    resolved: territorialContext.resolved,
    activeMemberIds: territorialContext.activeMemberIds,
  });
  const { group, members, isMember, userRole, loading, refetch } =
    useGroupDetail(id);
  const joinGroupMutation = useJoinGroup();
  const leaveGroupMutation = useLeaveGroup();
  const updateRoleMutation = useUpdateGroupMemberRole();
  const [activeTab, setActiveTab] = useState<"chat" | "membros" | "info">(
    "chat",
  );
  const canModerate =
    communityAccess.can.moderate && ["admin", "moderator"].includes(userRole || "");
  const canPost =
    communityAccess.can.send_message &&
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
    if (!communityAccess.can.join_group) {
      toast.info("Entrar em grupos exige participação ativa nesta comunidade.");
      return;
    }

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
    if (!canModerate) {
      toast.info("Apenas moderadores do grupo podem alterar funções.");
      return;
    }

    await updateRoleMutation.mutateAsync({ groupId: id, memberProfileId, role });
    toast.success("Função atualizada");
    refetch();
  };

  if (communityAccess.isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-territory-canvas text-territory-ink">
        <Loader2 className="h-8 w-8 animate-spin text-territory-brand motion-reduce:animate-none" aria-label="Carregando grupo" />
      </div>
    );
  }

  if (!communityAccess.can.join_group) {
    return (
      <div className="min-h-screen bg-territory-canvas text-territory-ink">
        <CommunityPortalGate
          resolved={territorialContext.resolved}
          activeMemberIds={territorialContext.activeMemberIds}
          action="join_group"
        />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-territory-canvas px-6 text-center text-territory-ink">
        <Users className="h-16 w-16 text-territory-muted" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-territory-ink">
          Grupo não encontrado
        </h2>
        <Button
          onClick={() => navigate(appUrls.community.groups)} // SSOT
          variant="outline"
          className="border-territory-brand/35 text-territory-brand hover:bg-territory-raised"
        >
          Ver todos os grupos
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden bg-territory-canvas pb-[env(safe-area-inset-bottom)] text-territory-ink">
      <div className="sticky top-0 z-50 border-b border-territory-border bg-territory-surface/95 backdrop-blur-lg">
        <div className="mx-auto flex h-14 min-w-0 max-w-3xl items-center gap-2 px-2.5 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => navigate(appUrls.community.groups)} // SSOT
            className="rounded-lg p-1 text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-focus"
            aria-label="Voltar para grupos"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold text-territory-ink">
                {group.name}
              </h1>
              {group.is_private && (
                <Lock className="h-3 w-3 flex-shrink-0 text-territory-warning" aria-label="Grupo privado" />
              )}
            </div>
            <p className="text-[10px] text-territory-muted">
              {members.length} membros
            </p>
          </div>

          {isMember ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLeave}
              className="px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive sm:px-3 sm:text-xs"
            >
              <UserMinus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Sair
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleJoin}
              className="gap-1 bg-territory-brand px-2 text-[11px] text-[hsl(var(--territory-on-image))] hover:bg-territory-brand-strong sm:px-3 sm:text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Entrar
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyShareLink}
            className="hidden text-territory-muted hover:bg-territory-raised hover:text-territory-ink sm:inline-flex"
            aria-label="Compartilhar grupo"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-3 border-t border-territory-border/70">
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
              type="button"
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex min-w-0 items-center justify-center gap-1 border-b-2 px-0.5 py-3 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-territory-focus sm:text-xs ${
                activeTab === t.key
                  ? "border-territory-brand text-territory-brand"
                  : "border-transparent text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-hidden">
        {activeTab === "chat" && (
          <div className="min-h-0 flex-1">
            <GrupoDetailChat
              groupId={id!}
              isMember={isMember}
              canPost={!!canPost}
              canModerate={canModerate}
              canReact={capabilities.reactions}
              canReport={capabilities.reports}
            />
          </div>
        )}
        {activeTab === "membros" && (
          <GrupoDetailMembersPanel
            members={members}
            canManageRoles={canModerate}
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
