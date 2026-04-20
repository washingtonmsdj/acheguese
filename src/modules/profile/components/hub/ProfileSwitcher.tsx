/**
 * ProfileSwitcher - Seletor de perfis
 * 
 * Permite trocar entre múltiplos perfis do usuário
 */

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { getProfileTypeIcon, getProfileTypeLabel } from '@/modules/profile/utils/profileDomainRules';

import type { MultiProfileRecord } from '@/core/profiles/services/multi-profile/types';

interface ProfileSwitcherProps {
  profiles: MultiProfileRecord[];
  activeProfileId: string | null;
  onSwitch: (profileId: string) => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.04 },
  },
};

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function ProfileSwitcherCard({
  profile,
  isActive,
  onSwitch,
}: {
  profile: MultiProfileRecord;
  isActive: boolean;
  onSwitch: (profileId: string) => void;
}) {
  const Icon = getProfileTypeIcon(profile);
  return (
    <button
      type="button"
      onClick={() => onSwitch(profile.id)}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all',
        isActive
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-background hover:border-primary/20 hover:bg-accent/30',
      )}
      aria-label={`Trocar para perfil ${profile.display_name}`}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{profile.display_name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Icon className="h-3 w-3" />
          {getProfileTypeLabel(profile)}
        </p>
      </div>
      {isActive ? <Badge className="h-5 bg-primary px-2 text-[10px]">Ativo</Badge> : null}
    </button>
  );
}

export function ProfileSwitcher({ profiles, activeProfileId, onSwitch }: ProfileSwitcherProps) {
  if (profiles.length <= 1) {
    return null;
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="mt-6 grid gap-3 lg:grid-cols-3">
      {profiles.map((profile) => (
        <motion.div key={profile.id} variants={fadeUp}>
          <ProfileSwitcherCard
            profile={profile}
            isActive={activeProfileId === profile.id}
            onSwitch={onSwitch}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
