/**
 * ProfileSidebarHeader - header da sidebar do perfil
 *
 * Exibe informacoes resumidas do perfil ativo no topo da sidebar:
 * - Avatar
 * - Nome
 * - Badge de tipo de perfil
 * - Indicadores de status
 * - Link para perfil publico
 */

import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { getProfileTypeLabel } from "@/core/profile/utils/profileDomainRules";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";
import type {
  MultiProfileRecord,
  Profile as RuntimeProfile,
} from "@/core/profiles/services/multi-profile/types";

interface ProfileSidebarHeaderProps {
  profile: MultiProfileRecord | RuntimeProfile | null;
  isVerified?: boolean;
  handle?: string;
  canOpenPublicProfile?: boolean;
  className?: string;
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileSidebarHeader({
  profile,
  isVerified,
  handle,
  canOpenPublicProfile,
  className,
}: ProfileSidebarHeaderProps) {
  const navigate = useNavigate();

  if (!profile) return null;

  const displayName = profile.display_name || "Usuario";
  const avatarUrl = profile.avatar_url;
  const profileType = getProfileTypeLabel(profile);

  return (
    <div className={cn("flex items-center gap-3 px-2 py-3", className)}>
      <Avatar className="h-10 w-10 shrink-0 border-2 border-border">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="text-sm font-semibold">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          {isVerified ? (
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-primary"
              aria-label="Verificado"
            />
          ) : null}
        </div>
        {canOpenPublicProfile && handle ? (
          <button
            type="button"
            onClick={() => navigate(buildPublicProfileUrl(handle))}
            className="mt-1 truncate text-xs text-primary hover:underline"
          >
            @{handle}
          </button>
        ) : (
          <Badge variant="secondary" className="mt-1 h-5 text-[10px]">
            {profileType}
          </Badge>
        )}
      </div>
    </div>
  );
}
