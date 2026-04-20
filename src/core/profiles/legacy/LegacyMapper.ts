/**
 * LegacyMapper — Mappers de Compatibilidade
 * 
 * Converte entre tipos legados e tipos canônicos.
 * 
 * ⚠️ DEPRECATED: Não use em código novo!
 * Use os mappers canônicos em src/core/profiles/persistence/
 * 
 * Este arquivo será REMOVIDO após migração completa.
 * 
 * @deprecated Use ProfileRowMapper de src/core/profiles/persistence/ProfileRowMapper.ts
 * @version 2.0.0
 */

import type { Profile } from '../domain/Profile';
import type { LegacyProfile, LegacyUpdateProfileData } from './LegacyProfile';
import type { UpdateProfileInput } from '../operations/UpdateProfileInput';

/**
 * Converte Profile canônico para LegacyProfile
 * 
 * @deprecated Use Profile diretamente
 */
export function toLegacyProfile(profile: Profile): LegacyProfile {
  return {
    id: profile.id,
    user_id: profile.userId,
    profile_type: profile.profileType,
    name: profile.displayName, // Legacy usa 'name' como display_name
    display_name: profile.displayName,
    username: profile.username ?? '',
    bio: profile.bio ?? undefined,
    avatar_url: profile.avatarUrl ?? undefined,
    cover_url: profile.coverUrl ?? undefined,
    city: '', // Legacy requer city (resolver de location_id)
    neighborhood: undefined,
    state: undefined,
    location_id: profile.locationId ?? undefined,
    verified: profile.verified,
    is_verified: profile.verified, // Alias legado
    reputation: profile.reputation,
    is_active: profile.isActive,
    is_suspended: profile.isSuspended,
    suspended: profile.isSuspended, // Alias legado
    suspended_at: profile.suspendedAt ?? undefined,
    suspension_reason: profile.suspensionReason ?? undefined,
    suspended_until: profile.suspendedUntil ?? undefined,
    verified_at: profile.verifiedAt ?? undefined,
    phone: profile.phone ?? undefined,
    whatsapp: profile.whatsapp ?? undefined,
    metadata: profile.metadata,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

/**
 * Converte LegacyProfile para Profile canônico
 * 
 * @deprecated Use ProfileRowMapper.toDomain()
 */
export function fromLegacyProfile(legacy: LegacyProfile): Profile {
  return {
    id: legacy.id,
    userId: legacy.user_id,
    profileType: legacy.profile_type,
    slug: legacy.username, // Legacy não tem slug separado
    username: legacy.username || null,
    displayName: legacy.display_name || legacy.name,
    bio: legacy.bio ?? null,
    avatarUrl: legacy.avatar_url ?? null,
    coverUrl: legacy.cover_url ?? null,
    locationId: legacy.location_id ?? null,
    phone: legacy.phone ?? legacy.telefone ?? null,
    whatsapp: legacy.whatsapp ?? null,
    isActive: legacy.is_active,
    isSuspended: legacy.is_suspended ?? legacy.suspended ?? false,
    suspendedAt: legacy.suspended_at ?? null,
    suspendedUntil: legacy.suspended_until ?? null,
    suspensionReason: legacy.suspension_reason ?? null,
    verified: legacy.verified || legacy.is_verified || false,
    verifiedAt: legacy.verified_at ?? null,
    reputation: legacy.reputation ?? legacy.pontos ?? 0,
    createdAt: legacy.created_at,
    updatedAt: legacy.updated_at,
    metadata: legacy.metadata ?? {},
  };
}

/**
 * Converte LegacyUpdateProfileData para UpdateProfileInput
 * 
 * @deprecated Use UpdateProfileInput diretamente
 */
export function fromLegacyUpdateData(
  legacy: LegacyUpdateProfileData
): UpdateProfileInput {
  return {
    display_name: legacy.display_name ?? legacy.name,
    username: legacy.username,
    bio: legacy.bio,
    avatar_url: legacy.avatar_url,
    cover_url: legacy.cover_url,
    location_id: legacy.location_id,
    phone: legacy.phone ?? legacy.telefone,
    whatsapp: legacy.whatsapp,
    is_active: legacy.is_active,
    metadata: legacy.metadata,
  };
}
