/**
 * PublicProfile — Read Model Público
 * 
 * Usado em páginas públicas de perfil.
 * Contém apenas dados que podem ser exibidos publicamente.
 * 
 * Casos de uso:
 * - Página pública de perfil (/u/:username)
 * - Compartilhamento de perfil
 * - Preview de perfil em cards
 * 
 * @version 2.0.0
 */

import type { ProfileType } from '../domain/ProfileType';

/**
 * PublicProfile — Read Model Público
 * 
 * Dados públicos de um perfil.
 * NÃO contém PII (phone, whatsapp, email).
 */
export interface PublicProfile {
  /** ID do perfil */
  id: string;
  
  /** Tipo de perfil */
  profileType: ProfileType;
  
  /** Slug único para URLs */
  slug: string;
  
  /** Username para @mentions */
  username: string | null;
  
  /** Nome de exibição */
  displayName: string;
  
  /** Biografia */
  bio: string | null;
  
  /** URL do avatar */
  avatarUrl: string | null;
  
  /** URL da capa */
  coverUrl: string | null;
  
  /** ID da localização */
  locationId: string | null;
  
  /** Se o perfil é verificado */
  verified: boolean;
  
  /** Pontuação de reputação */
  reputation: number;
  
  /** Data de criação */
  createdAt: string;
}

/**
 * PublicProfileExtended — Read Model Público Estendido
 * 
 * Adiciona informações de localização resolvidas.
 */
export interface PublicProfileExtended extends PublicProfile {
  /** Bairro (resolvido de location_id) */
  neighborhood: string | null;
  
  /** Cidade (resolvido de location_id) */
  city: string | null;
  
  /** Estado (resolvido de location_id) */
  state: string | null;
}

/**
 * Cria um PublicProfile a partir de dados parciais
 */
export function createPublicProfile(data: {
  id: string;
  profileType: ProfileType;
  slug: string;
  displayName: string;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  locationId?: string | null;
  verified?: boolean;
  reputation?: number;
  createdAt: string;
}): PublicProfile {
  return {
    id: data.id,
    profileType: data.profileType,
    slug: data.slug,
    username: data.username ?? null,
    displayName: data.displayName,
    bio: data.bio ?? null,
    avatarUrl: data.avatarUrl ?? null,
    coverUrl: data.coverUrl ?? null,
    locationId: data.locationId ?? null,
    verified: data.verified ?? false,
    reputation: data.reputation ?? 0,
    createdAt: data.createdAt,
  };
}
