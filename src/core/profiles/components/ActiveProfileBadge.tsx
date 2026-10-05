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

function typeIcon(type: ProfileType) {
  switch (type) {
    case 'personal':
      return User;
    case 'business':
      return Building2;
    case 'professional':
      return Briefcase;
    case 'driver':
      return Car;
    default:
      return User;
  }
}

function typeColor(type: ProfileType): string {
  switch (type) {
    case 'personal':
      return 'text-territory-info';
    case 'business':
      return 'text-category-business';
    case 'professional':
      return 'text-territory-brand';
    case 'driver':
      return 'text-category-mobility';
    default:
      return 'text-territory-muted';
  }
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
  const Icon = typeIcon(profile.profile_type);
  const color = typeColor(profile.profile_type);

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-territory-border bg-territory-raised px-3 py-2 text-sm text-territory-ink ${className}`}
    >
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">
          {getInitials(profile.display_name)}
        </AvatarFallback>
      </Avatar>
      <span className="capitalize text-territory-muted">{action}</span>
      <div className="flex items-center gap-1 font-medium">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
        <span className="truncate">{profile.display_name}</span>
      </div>
    </div>
  );
}
