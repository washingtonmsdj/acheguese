/**
 * ProfileHeaderCompact - Header redesenhado, denso e responsivo
 *
 * Mobile-first. Avatar grande à esquerda, nome + badges principais visíveis,
 * badges secundários em popover, ações em menu compacto no canto.
 */

import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Camera,
  CheckCircle2,
  Globe,
  MapPin,
  MoreHorizontal,
  Pencil,
  Star,
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
import { ProfileCompletenessWidget } from "@/modules/profile/components/ProfileCompletenessWidget";

import type { MultiProfileRecord } from "@/core/profiles/services/multi-profile/types";
import type { ProfileAccountSnapshot } from "@/core/profiles/views/ProfileAccountSnapshot";
import type { Context, Identity } from "@/modules/profile/sections/types";

interface ProfileHeaderCompactProps {
  activeProfile: MultiProfileRecord | null;
  profile: MultiProfileRecord | null;
  allProfiles?: MultiProfileRecord[];
  userEmail: string;
  accountSnapshot: ProfileAccountSnapshot;
  identity: Identity | null;
  context: Context | null;
  notifications: { unread: number; highPriority: number; urgentPriority: number };
  isVerified: boolean;
  canOpenPublicProfile: boolean;
  handle: string;
  territoryLabel?: string;
  reputation?: {
    score: number;
    level: number;
    rank?: string;
  };
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigate?: (path: string) => void;
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
  allProfiles,
  userEmail,
  accountSnapshot,
  identity,
  context,
  notifications,
  isVerified,
  canOpenPublicProfile,
  handle,
  territoryLabel,
  reputation,
  onAvatarChange,
  onNavigate,
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
    if (onNavigate) {
      onNavigate(buildProfileEditUrl(editorProfileId));
    } else {
      navigate(buildProfileEditUrl(editorProfileId));
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-3 shadow-sm sm:rounded-3xl sm:p-5"
    >
      {/* Topo: avatar + nome + ações */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 border-2 border-card shadow-md sm:h-20 sm:w-20 md:h-24 md:w-24 md:border-4">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-lg font-semibold sm:text-xl md:text-2xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 sm:h-7 sm:w-7"
            aria-label="Alterar foto de perfil"
          >
            <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
                  {displayName}
                </h1>
                {isVerified ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5"
                    aria-label="Verificado"
                  />
                ) : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:mt-1 sm:gap-1.5 sm:text-sm">
                {canOpenPublicProfile ? (
                  <button
                    type="button"
                    onClick={() => navigate(buildPublicProfileUrl(handle))}
                    className="font-medium text-primary hover:underline"
                  >
                    @{handle || "sem-handle"}
                  </button>
                ) : (
                  <span className="font-medium">@{handle || "sem-handle"}</span>
                )}
                <span className="text-border">·</span>
                <Badge variant="secondary" className="h-4 text-[9px] font-medium sm:h-5 sm:text-[10px]">
                  {getProfileTypeLabel(activeProfile)}
                </Badge>
              </div>
              {/* Bio ou sugestão - apenas desktop */}
              {bio ? (
                <p className="mt-2 hidden max-w-2xl text-sm text-muted-foreground md:line-clamp-2">
                  {bio}
                </p>
              ) : (
                <p className="mt-2 hidden max-w-2xl text-sm italic text-muted-foreground/70 md:block">
                  Adicione uma bio para se apresentar
                </p>
              )}
            </div>

            {/* Ações: botão principal + menu dropdown */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <Button
                size="sm"
                className="hidden gap-1.5 md:inline-flex"
                onClick={openEditor}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                size="icon"
                variant="default"
                className="h-8 w-8 md:hidden"
                onClick={openEditor}
                aria-label="Editar perfil"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Mais opções">
                    <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  <DropdownMenuItem
                    onClick={() => navigate(appUrls.profile.settings("privacy"))}
                  >
                    Privacidade
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Bio mobile (abaixo do avatar) */}
      {bio ? (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm md:hidden">{bio}</p>
      ) : (
        <p className="mt-2 text-xs italic text-muted-foreground/70 md:hidden">
          Adicione uma bio para se apresentar
        </p>
      )}

      {/* Linha de badges + meta - Responsiva e compacta */}
      <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
        {/* Primeira linha: Status, Plano, Verificação, Reputação */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs">
          {/* Status da conta */}
          <div className="flex items-center gap-1">
            <span className="hidden font-medium text-muted-foreground sm:inline">Status:</span>
            <Badge
              variant="outline"
              className={cn("h-5 text-[9px] font-semibold sm:h-6 sm:text-[10px]", getAccountTone(accountSnapshot.accountState))}
            >
              {getAccountStateLabel(accountSnapshot.accountState)}
            </Badge>
          </div>

          <span className="text-muted-foreground/30">|</span>

          {/* Plano */}
          <div className="flex items-center gap-1">
            <span className="hidden font-medium text-muted-foreground sm:inline">Plano:</span>
            <Badge 
              variant="outline" 
              className={cn(
                "h-5 text-[9px] font-semibold sm:h-6 sm:text-[10px]",
                (identity?.plan?.isPremium || context?.plan?.isPremium) 
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : ""
              )}
            >
              {planLabel}
              {(identity?.plan?.isPremium || context?.plan?.isPremium) ? " ⭐" : ""}
            </Badge>
          </div>

          <span className="hidden text-muted-foreground/30 sm:inline">|</span>

          {/* Verificação - oculta em mobile muito pequeno */}
          <div className="hidden items-center gap-1 xs:flex">
            <span className="hidden font-medium text-muted-foreground sm:inline">Verificação:</span>
            <Badge
              variant="outline"
              className={cn(
                "h-5 text-[9px] font-semibold sm:h-6 sm:text-[10px]",
                getVerificationTone(accountSnapshot.verificationStatus),
              )}
            >
              {getVerificationLabel(accountSnapshot.verificationStatus)}
            </Badge>
          </div>

          {/* Reputação (se houver) */}
          {reputation ? (
            <>
              <span className="hidden text-muted-foreground/30 md:inline">|</span>
              <div className="hidden items-center gap-1 md:flex">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500 sm:h-3.5 sm:w-3.5" />
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-amber-500/30 bg-amber-500/10 text-[9px] font-semibold text-amber-700 dark:text-amber-400 sm:h-6 sm:text-[10px]"
                >
                  Nível {reputation.level} · {reputation.score} pts
                </Badge>
              </div>
            </>
          ) : null}

          {/* Território - compacto em mobile */}
          {territoryLabel ? (
            <>
              <span className="hidden text-muted-foreground/30 lg:inline">|</span>
              <div className="hidden items-center gap-1 lg:flex">
                <MapPin className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                <span className="text-[10px] font-medium text-foreground sm:text-xs">
                  {territoryLabel}
                </span>
              </div>
            </>
          ) : null}

          {/* Botão "Mais detalhes" - sempre visível */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-1 text-[9px] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px]"
              >
                <MoreHorizontal className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden xs:inline">Mais</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 sm:w-80" align="end">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Território
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {territoryLabel || "Não configurado"}
                  </p>
                </div>
                
                {(identity?.reputation || context?.reputation) ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Reputação completa
                    </p>
                    <div className="mt-1 space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Score:</span>{" "}
                        {identity?.reputation?.score ?? context?.reputation?.score ?? 0}
                      </p>
                      <p>
                        <span className="font-medium">Nível:</span>{" "}
                        {identity?.reputation?.level ?? context?.reputation?.level ?? 1}
                      </p>
                      {(identity?.reputation?.rank || context?.reputation?.rank) ? (
                        <p>
                          <span className="font-medium">Rank:</span>{" "}
                          {identity?.reputation?.rank ?? context?.reputation?.rank}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notificações
                  </p>
                  <div className="mt-1 space-y-1 text-sm">
                    <p>
                      {notifications.unread > 0 ? (
                        <span className="font-semibold text-warning">
                          {notifications.unread} não lidas
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Em dia</span>
                      )}
                    </p>
                    {notifications.highPriority > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {notifications.highPriority} de alta prioridade
                      </p>
                    ) : null}
                  </div>
                </div>

                {totalAlerts > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Alertas prioritários
                    </p>
                    <p className="mt-1 text-sm font-semibold text-destructive">
                      {totalAlerts} alertas urgentes
                    </p>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {userEmail}
                  </p>
                </div>

                {(identity?.plan?.expiresAt || context?.plan?.expiresAt) ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Plano expira em
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(identity?.plan?.expiresAt || context?.plan?.expiresAt || "").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Segunda linha: Informações adicionais - apenas desktop */}
        <div className="hidden flex-wrap items-center gap-2 text-xs md:flex">
          {/* Total de perfis */}
          {activeProfile && (
            <>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {allProfiles?.length ?? 1} {(allProfiles?.length ?? 1) === 1 ? "perfil" : "perfis"}
                </span>
              </div>
              <span className="text-muted-foreground/30">|</span>
            </>
          )}

          {/* Notificações não lidas */}
          {notifications.unread > 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-warning" />
                <span className="font-semibold text-warning">
                  {notifications.unread} {notifications.unread === 1 ? "notificação" : "notificações"}
                </span>
              </div>
              <span className="text-muted-foreground/30">|</span>
            </>
          ) : null}

          {/* Alertas prioritários */}
          {totalAlerts > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-destructive">
                ⚠️ {totalAlerts} {totalAlerts === 1 ? "alerta" : "alertas"} prioritário{totalAlerts === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Widget de Completude do Perfil - Responsivo */}
      {activeProfile && (
        <div className="mt-3 sm:mt-4">
          <ProfileCompletenessWidget profile={activeProfile} />
        </div>
      )}
    </motion.section>
  );
}
