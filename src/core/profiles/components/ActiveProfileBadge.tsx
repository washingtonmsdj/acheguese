/**
 * ActiveProfileBadge
 *
 * Mostra claramente qual identidade está operando em uma ação.
 * Uso: dentro de formulários, modais de publicação, ações críticas.
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import type { Profile } from '../services/multi-profile/types';
import { getProfileTypePresentation } from '../presentation/profileTypePresentation';

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface ActiveProfileBadgeProps {
  profile: Profile;
  action?: string;
  className?: string;
}

export function ActiveProfileBadge({
  profile,
  action = 'atuando como',
  className = '',
}: ActiveProfileBadgeProps) {
  const presentation = getProfileTypePresentation(profile.profile_type);
  const Icon = presentation.icon;

  return (
    <div className={`flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm ${className}`}>
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">{getInitials(profile.display_name)}</AvatarFallback>
      </Avatar>
      <span className="capitalize text-muted-foreground">{action}</span>
      <div className="flex items-center gap-1 font-medium">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${presentation.iconClassName}`} />
        <span className="truncate">{profile.display_name}</span>
      </div>
    </div>
  );
}
