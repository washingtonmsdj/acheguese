import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
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
  onRoleChange: (memberProfileId: string, role: "admin" | "moderator" | "member") => void;
}) {
  return (
    <div className="px-4 py-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Membros ({members.length})
      </h3>
      {members.map((m) => (
        <div key={m.member_profile_id} className="flex items-center gap-2.5 py-2">
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
