/**
 * ActiveProfileBadge
 *
 * Mostra claramente qual identidade está operando em uma ação.
 * Uso: dentro de formulários, modais de publicação, ações críticas.
 *
 * Exemplos:
 *   <ActiveProfileBadge profile={profile} action="publicando como" />
 *   → "Publicando como Padaria Central"
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Building2, Briefcase, Car, User } from 'lucide-react';
import type { Profile, ProfileType } from '../services/multi-profile/types';

function typeIcon(t: ProfileType) {
  return { personal: User, business: Building2, professional: Briefcase, driver: Car }[t] ?? User;
}

function typeColor(t: ProfileType): string {
  return {
    personal: 'text-blue-500',
    business: 'text-emerald-500',
    professional: 'text-violet-500',
    driver: 'text-orange-500',
  }[t] ?? 'text-muted-foreground';
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface ActiveProfileBadgeProps {
  profile: Profile;
  action?: string; // ex: "publicando como", "editando como", "operando como"
  className?: string;
}

export function ActiveProfileBadge({
  profile,
  action = 'atuando como',
  className = '',
}: ActiveProfileBadgeProps) {
  const Icon = typeIcon(profile.profile_type);
  const color = typeColor(profile.profile_type);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm ${className}`}>
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">{getInitials(profile.display_name)}</AvatarFallback>
      </Avatar>
      <span className="text-muted-foreground capitalize">{action}</span>
      <div className="flex items-center gap-1 font-medium">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
        <span className="truncate">{profile.display_name}</span>
      </div>
    </div>
  );
}
