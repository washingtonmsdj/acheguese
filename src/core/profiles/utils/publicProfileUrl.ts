import type { Profile } from '@/core/profiles/types';

/**
 * Constrói URL pública para perfil PESSOAL
 * 
 * @param username - Username do perfil pessoal
 * @returns URL pública: /u/:username
 * 
 * ⚠️ IMPORTANTE: Usar APENAS para perfil personal
 * - Business usa BusinessUrlService
 * - Professional usa ProfessionalUrlService
 * - Driver não tem página pública
 */
export function buildPublicProfileUrl(username: string): string {
  return `/u/${username}`;
}

/**
 * Constrói URL pública canônica baseada no tipo de perfil
 * 
 * @param profile - Perfil completo
 * @returns URL pública canônica ou null se não aplicável
 * 
 * ✅ SSOT: Função centralizada para determinar URL pública
 * 
 * ⚠️ NOTA: Para business e professional, esta função retorna null.
 * Use os services específicos para construir URLs completas:
 * - BusinessUrlService.getCanonicalUrl(ctx)
 * - ProfessionalUrlService.getCanonicalUrl(ctx)
 */
export function buildCanonicalPublicUrl(profile: Profile): string | null {
  switch (profile.profile_type) {
    case 'personal':
      return profile.username ? `/u/${profile.username}` : null;
    
    case 'business':
      // Business usa rota territorial
      // URL será construída por BusinessUrlService.getCanonicalUrl()
      // Requer: geographic_path (uf/cidade/bairro)
      return null;
    
    case 'professional':
      // Professional usa rota territorial
      // URL será construída por ProfessionalUrlService.getCanonicalUrl()
      // Requer: state, city (extraídos de location_id)
      return null;
    
    case 'driver':
      // Driver não tem página pública
      return null;
    
    default:
      return null;
  }
}

/**
 * Verifica se um perfil pode ter URL pública via /u/:username
 * 
 * @param profile - Perfil a verificar
 * @returns true se o perfil pode ter URL pública /u/:username
 */
export function canHavePublicUrl(profile: Profile): boolean {
  return profile.profile_type === 'personal' && Boolean(profile.username);
}

export function buildProfileEditUrl(profileId: string): string {
  return `/perfil/editar/${profileId}`;
}

export function buildProfileSettingsUrl(
  tab?: "privacy" | "links" | "members",
): string {
  return tab ? `/perfil/configuracoes?tab=${tab}` : "/perfil/configuracoes";
}
