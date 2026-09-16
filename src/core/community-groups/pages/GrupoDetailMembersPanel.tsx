import { Crown } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { USER_ROLE } from "@/shared/types/constants";
import { getInitials } from "./GrupoDetailShared";
import type { GroupMemberItem } from "./GrupoDetailShared";

export function GrupoDetailMembersPanel({
  members,
  canManageRoles,
  currentProfileId,
  onRoleChange,
}: {
  members: GroupMemberItem[];
  canManageRoles: boolean;
  currentProfileId?: string;
  onRoleChange: (
    memberProfileId: string,
    role: "admin" | "moderator" | "member",
  ) => void;
}) {
  return (
    <div className="space-y-2 px-4 py-4 text-foreground">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Membros ({members.length})
      </h3>
      {members.map((member) => (
        <div
          key={member.member_profile_id}
          className="flex items-center gap-2.5 rounded-lg py-2"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={member.profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
              {getInitials(member.profile?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">
              {member.profile?.name || "Usuário"}
            </p>
            <p className="text-[10px] capitalize text-muted-foreground">
              {member.role || "membro"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {member.role === USER_ROLE.ADMIN ? (
              <Crown
                className="h-4 w-4 shrink-0 text-warning"
                aria-label="Administrador do grupo"
              />
            ) : null}
            {canManageRoles && member.member_profile_id !== currentProfileId ? (
              <select
                value={member.role || "member"}
                onChange={(event) =>
                  onRoleChange(
                    member.member_profile_id,
                    event.target.value as "admin" | "moderator" | "member",
                  )
                }
                className="w-[108px] rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Alterar função de ${member.profile?.name || "membro"}`}
              >
                <option value="member">Membro</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Admin</option>
              </select>
            ) : null}
          </div>
        </div>
      ))}
      {members.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum membro ainda
        </p>
      ) : null}
    </div>
  );
}
