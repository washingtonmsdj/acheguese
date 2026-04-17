/**
 * ProfileChipsBar - Chips horizontais de perfis sempre visíveis
 *
 * Mostra todos os perfis como chips roláveis no topo da página.
 * Funciona em mobile e desktop. Estilo "stories do Instagram".
 */

import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/utils/cn";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { getProfileTypeIcon, getProfileTypeLabel } from "@/modules/profile/utils/profileDomainRules";

import type { Profile } from "@/core/profiles/services/multi-profile/types";

interface ProfileChipsBarProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSwitch: (profileId: string) => void;
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

export function ProfileChipsBar({ profiles, activeProfileId, onSwitch }: ProfileChipsBarProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  if (profiles.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Suas identidades · {profiles.length}
        </p>
        <button
          type="button"
          onClick={() => navigate(appUrls.profile.manage)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Gerenciar
        </button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {profiles.map((profile) => {
            const Icon = getProfileTypeIcon(profile);
            const isActive = profile.id === activeProfileId;

            return (
              <motion.button
                key={profile.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onSwitch(profile.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-full border px-3 py-2 text-left transition-all",
                  isActive
                    ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-background hover:border-primary/30 hover:bg-accent/40",
                )}
                aria-label={`Trocar para ${profile.display_name}`}
                aria-pressed={isActive}
              >
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(profile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  {isActive ? (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col leading-tight">
                  <span className="max-w-[140px] truncate text-sm font-medium text-foreground">
                    {profile.display_name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Icon className="h-2.5 w-2.5" />
                    {getProfileTypeLabel(profile)}
                  </span>
                </div>
              </motion.button>
            );
          })}

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(appUrls.profile.manage)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            aria-label="Adicionar novo perfil"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Plus className="h-4 w-4" />
            </span>
            <span className="pr-1 text-xs font-medium">Novo perfil</span>
          </motion.button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
