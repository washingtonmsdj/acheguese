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
import { ChevronDown, Zap } from 'lucide-react';
import { useMultiProfileContext } from '../contexts/multi-profile-runtime-context';
import { getProfileTypePresentation } from '../presentation/profileTypePresentation';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function MultiProfileSwitcher({ compact = false }: { compact?: boolean }) {
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
  const presentation = getProfileTypePresentation(effectiveProfile.profile_type);
  const Icon = presentation.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={`Trocar perfil: ${effectiveProfile.display_name}`} className="flex min-h-10 max-w-[180px] items-center gap-2 rounded-xl border border-border px-2.5 py-1.5 transition-colors hover:bg-muted/50">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={effectiveProfile.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">{getInitials(effectiveProfile.display_name)}</AvatarFallback>
          </Avatar>
          <div className={compact ? "hidden min-w-0 items-center gap-1 sm:flex" : "flex min-w-0 items-center gap-1"}>
            <Icon className={`h-3 w-3 flex-shrink-0 ${presentation.iconClassName}`} />
            <span className="truncate text-xs font-medium">{effectiveProfile.display_name}</span>
            {isContextual && (
              <Zap className="h-3 w-3 flex-shrink-0 text-warning" aria-label="Contexto automático do módulo" />
            )}
          </div>
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {compact && (
          <>
            <DropdownMenuItem asChild><Link to="/conta">Minha conta</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {isContextual && (
          <>
            <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal text-warning">
              <Zap className="h-3 w-3" />
              Contexto automático do módulo
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Trocar perfil global
        </DropdownMenuLabel>

        {allProfiles.map(profile => {
          const profilePresentation = getProfileTypePresentation(profile.profile_type);
          const PIcon = profilePresentation.icon;
          const isActive = activeProfile?.id === profile.id;

          return (
            <DropdownMenuItem
              key={profile.id}
              onClick={async () => {
                if (isActive) return;
                await switchProfile(profile.id);
                toast.success(`Perfil global: ${profile.display_name}`);
              }}
              className="cursor-pointer gap-2"
            >
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">{getInitials(profile.display_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <PIcon className={`h-3 w-3 flex-shrink-0 ${profilePresentation.iconClassName}`} />
                  <span className="truncate text-sm">{profile.display_name}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">@{profile.handle}</p>
              </div>
              {isActive && (
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
