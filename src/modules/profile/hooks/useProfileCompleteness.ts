import { buildProfileEditUrl } from '@/core/profiles';
import { buildProfileSettingsUrl } from '@/core/profiles/utils/publicProfileUrl';
import type { MultiProfileRecord } from '@/core/profiles/services/multi-profile/types';

export interface CompletenessItem {
  id: string;
  label: string;
  done: boolean;
  path: string;
  weight: number; // pontos que vale
}

export interface ProfileCompleteness {
  score: number;       // 0–100
  items: CompletenessItem[];
  total: number;
  completed: number;
}

export function useProfileCompleteness(profile: MultiProfileRecord | null): ProfileCompleteness {
  if (!profile) {
    return { score: 0, items: [], total: 0, completed: 0 };
  }

  const editPath = buildProfileEditUrl(profile.id);

  const items: CompletenessItem[] = [
    {
      id: 'display_name',
      label: 'Nome de exibição',
      done: !!profile.display_name?.trim(),
      path: editPath,
      weight: 15,
    },
    {
      id: 'avatar',
      label: 'Foto de perfil',
      done: !!profile.avatar_url,
      path: editPath,
      weight: 20,
    },
    {
      id: 'bio',
      label: 'Biografia',
      done: !!profile.bio?.trim(),
      path: editPath,
      weight: 15,
    },
    {
      id: 'location',
      label: 'Localização',
      done: !!(profile.location_id || profile.location?.trim()),
      path: editPath,
      weight: 15,
    },
    {
      id: 'contact',
      label: 'Contato (email ou telefone)',
      done: !!(profile.contact_email?.trim() || profile.phone?.trim()),
      path: editPath,
      weight: 15,
    },
    {
      id: 'website',
      label: 'Site ou link externo',
      done: !!profile.website?.trim(),
      path: editPath,
      weight: 10,
    },
    {
      id: 'public',
      label: 'Perfil público',
      done: profile.is_public,
      path: buildProfileSettingsUrl('privacy'),
      weight: 10,
    },
  ];

  const totalWeight = items.reduce((acc, i) => acc + i.weight, 0);
  const earnedWeight = items.filter(i => i.done).reduce((acc, i) => acc + i.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);
  const completed = items.filter(i => i.done).length;

  return { score, items, total: items.length, completed };
}
