/**
 * MULTI-PROFILE SWITCHER
 *
 * Seletor de perfil no header — recurso auxiliar de troca manual.
 * Mostra o perfil efetivo atual (contextual de módulo ou global).
 * Quando o contexto foi assumido automaticamente pelo módulo,
 * exibe um indicador visual para deixar claro ao usuário.
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Building2, Briefcase, Car, User, ChevronDown, Zap } from 'lucide-react';
import { useMultiProfileContext } from '../contexts/multi-profile-runtime-context';
import { toast } from 'sonner';
import type { ProfileType } from '../services/multi-profile/types';

function typeIcon(t: ProfileType) {
  switch (t) {
    case "personal":
      return User;
    case "business":
      return Building2;
    case "professional":
      return Briefcase;
    case "driver":
      return Car;
    default:
      return User;
  }
}

function typeColor(t: ProfileType): string {
  switch (t) {
    case "personal":
      return "text-blue-500";
    case "business":
      return "text-emerald-500";
    case "professional":
      return "text-violet-500";
    case "driver":
      return "text-orange-500";
    default:
      return "text-muted-foreground";
  }
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function MultiProfileSwitcher() {
  const {
    activeProfile,
    contextualProfile,
    effectiveProfile,
    allProfiles,
    switchProfile,
    loading,
  } = useMultiProfileContext();

  if (loading || !effectiveProfile) return null;
  if (allProfiles.length === 0) return null;

  const isContextual = !!contextualProfile;
  const Icon = typeIcon(effectiveProfile.profile_type);
  const color = typeColor(effectiveProfile.profile_type);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border hover:bg-muted/50 transition-colors max-w-[180px]">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={effectiveProfile.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">{getInitials(effectiveProfile.display_name)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 min-w-0">
            <Icon className={`h-3 w-3 flex-shrink-0 ${color}`} />
            <span className="text-xs font-medium truncate">{effectiveProfile.display_name}</span>
            {/* Indicador de contexto automático */}
            {isContextual && (
              <Zap className="h-3 w-3 text-amber-500 flex-shrink-0" aria-label="Contexto automático do módulo" />
            )}
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {isContextual && (
          <>
            <DropdownMenuLabel className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-normal">
              <Zap className="h-3 w-3" />
              Contexto automático do módulo
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Trocar perfil global
        </DropdownMenuLabel>

        {allProfiles.map(profile => {
          const PIcon = typeIcon(profile.profile_type);
          const pColor = typeColor(profile.profile_type);
          const isActive = activeProfile?.id === profile.id;

          return (
            <DropdownMenuItem
              key={profile.id}
              onClick={async () => {
                if (isActive) return;
                await switchProfile(profile.id);
                toast.success(`Perfil global: ${profile.display_name}`);
              }}
              className="gap-2 cursor-pointer"
            >
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">{getInitials(profile.display_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <PIcon className={`h-3 w-3 flex-shrink-0 ${pColor}`} />
                  <span className="text-sm truncate">{profile.display_name}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">@{profile.handle}</p>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

