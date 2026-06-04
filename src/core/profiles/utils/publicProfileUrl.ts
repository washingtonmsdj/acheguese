import type { Profile } from '@/core/profiles/types';

/**
 * Constroi URL publica para perfil pessoal.
 *
 * Importante: usar apenas para profile_type personal.
 * - Business usa BusinessUrlService
 * - Professional usa ProfessionalUrlService
 * - Driver nao tem pagina publica
 */
export function buildPublicProfileUrl(username: string): string {
  return `/u/${username}`;
}

/**
 * Constroi URL publica canonica baseada no tipo de perfil.
 *
 * Para business e professional, esta funcao retorna null. Use os services
 * especificos para construir URLs completas.
 */
export function buildCanonicalPublicUrl(profile: Profile): string | null {
  switch (profile.profile_type) {
    case 'personal':
      return profile.username ? buildPublicProfileUrl(profile.username) : null;

    case 'business':
    case 'professional':
    case 'driver':
      return null;

    default:
      return null;
  }
}

export function canHavePublicUrl(profile: Profile): boolean {
  return profile.profile_type === 'personal' && Boolean(profile.username);
}

export function buildProfileEditUrl(profileId: string): string {
  return `/conta/editar/${profileId}`;
}

export function buildProfileSettingsUrl(
  tab?: "privacy" | "links" | "members",
): string {
  return tab ? `/conta/preferencias?tab=${tab}` : "/conta/preferencias";
}
