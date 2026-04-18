/**
 * PersonalProfileIdentityCard - Card visual da identidade do perfil personal
 *
 * Exibe informações visuais completas do perfil personal:
 * - Avatar grande
 * - Nome e username @handle
 * - Bio
 * - Badges (verificado, território, reputação)
 * - Botão de edição
 */

import { CheckCircle2, MapPin, Pencil, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { Profile } from "@/core/profiles/services/multi-profile/types";

interface PersonalProfileIdentityCardProps {
  profile: Profile | null;
  handle?: string;
  isVerified?: boolean;
  territoryLabel?: string;
  reputation?: {
    score: number;
    level: number;
    rank?: string;
  };
  onEdit: () => void;
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

export function PersonalProfileIdentityCard({
  profile,
  handle,
  isVerified,
  territoryLabel,
  reputation,
  onEdit,
  className,
}: PersonalProfileIdentityCardProps) {
  if (!profile) return null;

  const displayName = profile.display_name || profile.name || "Usuário";
  const avatarUrl = profile.avatar_url;
  const bio = profile.bio;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6 shadow-sm",
        className,
      )}
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />

      <div className="relative">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg sm:h-28 sm:w-28">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {isVerified ? (
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md">
                <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
              </div>
            ) : null}
          </div>

          {/* Informações */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {displayName}
                </h2>
                {handle ? (
                  <p className="mt-1 text-base font-medium text-primary">
                    @{handle}
                  </p>
                ) : null}
                {bio ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {bio}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-muted-foreground">
                    Adicione uma bio para se apresentar
                  </p>
                )}
              </div>

              {/* Botão de edição */}
              <Button
                size="sm"
                className="gap-2 shrink-0"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar perfil
              </Button>
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {isVerified ? (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-success/30 bg-success/10 text-success"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Verificado
                </Badge>
              ) : null}

              {territoryLabel ? (
                <Badge variant="outline" className="gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {territoryLabel}
                </Badge>
              ) : null}

              {reputation ? (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  <Star className="h-3 w-3 fill-current" />
                  Nível {reputation.level} · {reputation.score} pts
                </Badge>
              ) : null}

              <Badge variant="secondary" className="text-[10px]">
                Perfil Pessoal
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
