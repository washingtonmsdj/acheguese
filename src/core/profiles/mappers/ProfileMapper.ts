/**
 * ProfileMapper - Conversão entre shapes de Profile
 *
 * Converte Profile (snake_case do banco) para CanonicalProfile (camelCase de domínio)
 * Garante contrato unificado em toda a aplicação
 */

import type { ProfileRow as Profile } from "../services/types";

const CANONICAL_PROFILE_TYPES = new Set<CanonicalProfile["profileType"]>([
  "personal",
  "driver",
  "business",
  "professional",
  "community",
]);

function toCanonicalProfileType(type: Profile["profile_type"]): CanonicalProfile["profileType"] {
  return CANONICAL_PROFILE_TYPES.has(type as CanonicalProfile["profileType"])
    ? (type as CanonicalProfile["profileType"])
    : "personal";
}

/**
 * Shape canônico de Profile — camelCase unificado
 * Usado em activeProfile e profiles[]
 */
export interface CanonicalProfile {
  id: string;
  userId: string;
  profileType:
    | "personal"
    | "driver"
    | "business"
    | "professional"
    | "community";
  name: string;
  displayName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  city: string;
  neighborhood?: string;
  street?: string;
  verified: boolean;
  reputation: number;
  isActive: boolean;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  suspendedUntil?: string;
  alertBanned?: boolean;
  isVerifiedResident?: boolean;
  verifiedAt?: string;
  pontos?: number;
  telefone?: string;
  phone?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converte Profile (snake_case) para CanonicalProfile (camelCase)
 */
export function toCanonicalProfile(profile: Profile): CanonicalProfile {
  return {
    id: profile.id,
    userId: profile.user_id,
    profileType: toCanonicalProfileType(profile.profile_type),
    name: profile.name,
    displayName: profile.display_name,
    username: profile.username,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    coverUrl: profile.cover_url,
    city: profile.city,
    neighborhood: profile.neighborhood,
    street: profile.street,
    verified: profile.verified,
    reputation: profile.reputation,
    isActive: profile.is_active,
    isSuspended: profile.is_suspended || profile.suspended,
    suspendedAt: profile.suspended_at,
    suspensionReason: profile.suspension_reason,
    suspendedUntil: profile.suspended_until,
    alertBanned: profile.alert_banned,
    isVerifiedResident: profile.is_verified_resident,
    verifiedAt: profile.verified_at,
    pontos: profile.pontos,
    telefone: profile.telefone,
    phone: profile.phone,
    metadata: profile.metadata,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

/**
 * Converte array de Profiles para CanonicalProfiles
 */
export function toCanonicalProfiles(profiles: Profile[]): CanonicalProfile[] {
  return profiles.map(toCanonicalProfile);
}
