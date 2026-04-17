/**
 * ProfileHeaderCompact - Header redesenhado, denso e responsivo
 *
 * Mobile-first. Avatar grande à esquerda, nome + badges principais visíveis,
 * badges secundários em popover, ações em menu compacto no canto.
 */

import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  Globe,
  MapPin,
  MoreHorizontal,
  Pencil,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/utils/cn";
import {
  buildProfileEditUrl,
  buildPublicProfileUrl,
} from "@/core/profiles/utils/publicProfileUrl";
import { getProfileTypeLabel } from "@/modules/profile/utils/profileDomainRules";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";

import type { Profile } from "@/core/profiles/services/multi-profile/types";
import type { ProfileAccountSnapshot } from "@/core/profiles/services/types";

interface ProfileHeaderCompactProps {
  activeProfile: Profile | null;
  profile: Profile | null;
  userEmail: string;
  accountSnapshot: ProfileAccountSnapshot;
  identity: any;
  context: any;
  notifications: { unread: number; highPriority: number; urgentPriority: number };
  isVerified: boolean;
  canOpenPublicProfile: boolean;
  handle: string;
  territoryLabel?: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

function formatPlanLabel(value?: string | null): string {
  if (!value) return "Basico";
  const map: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    delivery: "Delivery",
    basic: "Basico",
    premium: "Premium",
    enterprise: "Enterprise",
  };
  return map[value] ?? value[0].toUpperCase() + value.slice(1);
}

function getAccountTone(state: ProfileAccountSnapshot["accountState"]): string {
  switch (state) {
    case "active":
      return "border-success/30 bg-success/10 text-success";
    case "blocked":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "suspended":
      return "border-warning/30 bg-warning/10 text-warning";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getAccountStateLabel(state: ProfileAccountSnapshot["accountState"]): string {
  switch (state) {
    case "active":
      return "Ativa";
    case "blocked":
      return "Bloqueada";
    case "suspended":
      return "Suspensa";
    default:
      return "Inativa";
  }
}

function getVerificationLabel(status: string): string {
  switch (status) {
    case "approved":
      return "Residencia aprovada";
    case "rejected":
      return "Residencia rejeitada";
    case "pending":
      return "Em analise";
    default:
      return "Sem verificacao";
  }
}

function getVerificationTone(status: string): string {
  switch (status) {
    case "approved":
      return "border-success/30 bg-success/10 text-success";
    case "rejected":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "pending":
      return "border-warning/30 bg-warning/10 text-warning";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function ProfileHeaderCompact({
  activeProfile,
  profile,
  userEmail,
  accountSnapshot,
  identity,
  context,
  notifications,
  isVerified,
  canOpenPublicProfile,
  handle,
  territoryLabel,
  onAvatarChange,
}: ProfileHeaderCompactProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = activeProfile?.display_name || profile?.display_name || userEmail;
  const avatarUrl = activeProfile?.avatar_url || profile?.avatar_url;
  const bio = activeProfile?.bio || profile?.bio;

  const editorProfileId = activeProfile?.id ?? profile?.id;
  const planLabel = formatPlanLabel(identity?.plan?.type || context?.plan?.type);
  const totalAlerts = notifications.highPriority + notifications.urgentPriority;

  const openEditor = () => {
    if (!editorProfileId) return;
    navigate(buildProfileEditUrl(editorProfileId));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-4 shadow-sm sm:p-5"
    >
      {/* Topo: avatar + nome + ações */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 border-4 border-card shadow-md sm:h-24 sm:w-24">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xl font-semibold sm:text-2xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
            aria-label="Alterar foto de perfil"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
            aria-label="Upload de foto de perfil"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {displayName}
                </h1>
                {isVerified ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-label="Verificado"
                  />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                @{handle || "sem-handle"} · {getProfileTypeLabel(activeProfile)}
              </p>
            </div>

            {/* Ações: botão principal + menu dropdown */}
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                size="sm"
                className="hidden gap-1.5 sm:inline-flex"
                onClick={openEditor}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="icon"
                variant="default"
                className="sm:hidden"
                onClick={openEditor}
                aria-label="Editar perfil"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" aria-label="Mais opções">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Identidade ativa</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canOpenPublicProfile ? (
                    <DropdownMenuItem
                      onClick={() => navigate(buildPublicProfileUrl(handle))}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Abrir perfil público
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => navigate(appUrls.profile.manage)}>
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar identidades
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(appUrls.profile.settings("privacy"))}
                  >
                    Privacidade
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bio (apenas desktop, mobile fica abaixo) */}
          {bio ? (
            <p className="mt-2 hidden max-w-2xl text-sm text-muted-foreground sm:line-clamp-2">
              {bio}
            </p>
          ) : null}
        </div>
      </div>

      {/* Bio mobile (abaixo do avatar) */}
      {bio ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground sm:hidden">{bio}</p>
      ) : null}

      {/* Linha de badges + meta */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn("h-6 text-[10px] font-medium", getAccountTone(accountSnapshot.accountState))}
        >
          {getAccountStateLabel(accountSnapshot.accountState)}
        </Badge>
        <Badge variant="outline" className="h-6 text-[10px] font-medium">
          Plano {planLabel}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "h-6 text-[10px] font-medium",
            getVerificationTone(accountSnapshot.verificationStatus),
          )}
        >
          {getVerificationLabel(accountSnapshot.verificationStatus)}
        </Badge>

        {/* Popover com meta extra (desktop) */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent/40"
            >
              <MapPin className="h-3 w-3" />
              <span className="max-w-[160px] truncate">
                {territoryLabel || "Sem territorio"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Território
                </p>
                <p className="mt-1">{territoryLabel || "Não configurado"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Inbox
                </p>
                <p className="mt-1">
                  {notifications.unread > 0
                    ? `${notifications.unread} não lidas`
                    : "Em dia"}
                </p>
              </div>
              {totalAlerts > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Alertas prioritários
                  </p>
                  <p className="mt-1 text-warning">{totalAlerts}</p>
                </div>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </motion.section>
  );
}
