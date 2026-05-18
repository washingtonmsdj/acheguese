/**
 * ProfileRowMapper — Mapper entre Persistência e Domínio
 * 
 * Converte entre ProfileRow (snake_case do banco) e Profile (camelCase do domínio).
 * 
 * ── NORMALIZAÇÃO DE INVARIANTES ──────────────────────────────────────────
 * 
 * O banco permite null em vários campos que o domain trata como não-null.
 * Este mapper é responsável por garantir as invariantes do domain:
 * 
 * - displayName: string  → row.display_name ?? row.name
 *   (display_name é nullable; name é NOT NULL — garante fallback)
 * 
 * - name: string         → row.name
 *   (NOT NULL no banco — sempre presente)
 * 
 * - slug: string         → row.slug ?? row.username ?? row.id
 *   (slug pode ser null em perfis legados)
 * 
 * - handle: string|null  → row.handle
 *   (null permitido — perfis pessoais legados podem não ter)
 * 
 * - username: string|null → row.username
 *   (null permitido — opcional)
 * 
 * ── CAMPOS NÃO MAPEADOS PARA O DOMAIN ───────────────────────────────────
 * 
 * Snapshots territoriais (desnormalizados de location_id):
 *   city, neighborhood, state, street, country, location
 *   → ficam em ProfileRow, não entram no domain
 *   → populados pelo service ao persistir (não pelo mapper)
 * 
 * Aliases legados (mesmo valor, nome diferente):
 *   telefone → phone, suspended → is_suspended,
 *   reputation_score/pontos → reputation, is_verified → verified
 *   → mapper lê o campo canônico, ignora o alias
 * 
 * Campos de outros domínios:
 *   active_ride_id (Mobility), requires_pin_for_* (Delivery/Mobility)
 *   → ficam em ProfileRow, não entram no domain
 * 
 * Derived-persisted:
 *   trust_score → calculado por trigger SQL, não gerenciado pelo domain
 * 
 * @version 3.0.0
 */

import type { Profile } from '../domain/Profile';
import type { ProfileRow, ProfileInsert } from './ProfileRow';
import type { ProfileType } from '../domain/ProfileType';

/**
 * Converte ProfileRow (banco) para Profile (domínio)
 * 
 * Normaliza invariantes: display_name ?? name, slug ?? username ?? id, etc.
 */
export function rowToDomain(row: ProfileRow): Profile {
  const legacyRow = row as any;
  return {
    id: row.id,
    userId: row.user_id,
    profileType: row.profile_type as ProfileType,

    // Slug: normalizado — slug ?? username ?? id (nunca null no domain)
    slug: row.slug ?? row.username ?? row.id,

    // Identificadores públicos
    username: row.username ?? null,
    handle: row.handle ?? null,

    // Nome: displayName normalizado — display_name ?? name (nunca null no domain)
    displayName: row.display_name ?? row.name,
    name: row.name,

    // Informações básicas
    bio: row.bio ?? null,
    avatarUrl: row.avatar_url ?? null,
    coverUrl: legacyRow.cover_url ?? null,

    // Localização
    locationId: row.location_id ?? null,

    // Contato
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    contactEmail: row.contact_email ?? null,
    website: row.website ?? null,

    // Privacidade (defaults seguros se null no banco)
    isPublic: row.is_public ?? true,
    showContactEmail: row.show_contact_email ?? false,
    showPhone: row.show_phone ?? false,
    showLinkedProfiles: row.show_linked_profiles ?? true,
    showBusinessLinks: row.show_business_links ?? true,
    showProfessionalLinks: row.show_professional_links ?? true,
    shareActivityDefault: row.share_activity_default ?? true,

    // Status
    isActive: row.is_active,
    isSuspended: row.is_suspended,
    suspendedAt: row.suspended_at ?? null,
    suspendedUntil: row.suspended_until ?? null,
    suspensionReason: row.suspension_reason ?? null,

    // Verificação
    verified: row.verified,
    verifiedAt: row.verified_at ?? null,

    // Gamificação
    reputation: row.reputation,

    // Auditoria
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // Metadata
    metadata: (legacyRow.metadata as Record<string, unknown>) ?? {},
  };
}

/**
 * Converte Profile (domínio) para ProfileInsert (banco)
 * 
 * Snapshots territoriais (city, neighborhood, etc.) NÃO são populados aqui.
 * Use domainToInsertWithSnapshots() quando precisar persistir snapshots.
 */
export function domainToInsert(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): ProfileInsert {
  return {
    user_id: profile.userId,
    profile_type: profile.profileType,
    slug: profile.slug,
    username: profile.username,
    handle: profile.handle,
    display_name: profile.displayName,
    name: profile.name,
    bio: profile.bio,
    avatar_url: profile.avatarUrl,
    cover_url: profile.coverUrl,
    location_id: profile.locationId,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    contact_email: profile.contactEmail,
    website: profile.website,
    is_public: profile.isPublic,
    show_contact_email: profile.showContactEmail,
    show_phone: profile.showPhone,
    show_linked_profiles: profile.showLinkedProfiles,
    show_business_links: profile.showBusinessLinks,
    show_professional_links: profile.showProfessionalLinks,
    share_activity_default: profile.shareActivityDefault,
    is_active: profile.isActive,
    is_suspended: profile.isSuspended,
    suspended_at: profile.suspendedAt,
    suspended_until: profile.suspendedUntil,
    suspension_reason: profile.suspensionReason,
    verified: profile.verified,
    verified_at: profile.verifiedAt,
    reputation: profile.reputation,
    metadata: profile.metadata as any,
  } as ProfileInsert;
}

/**
 * Converte Profile (domínio) para ProfileInsert com snapshots territoriais
 * 
 * Responsabilidade do service — não do mapper puro.
 * Snapshots são desnormalizados de location_id para performance.
 */
export function domainToInsertWithSnapshots(
  profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>,
  snapshots?: {
    city?: string | null;
    neighborhood?: string | null;
    state?: string | null;
    street?: string | null;
    country?: string | null;
    location?: string | null;
  }
): ProfileInsert {
  return {
    ...domainToInsert(profile),
    city: snapshots?.city ?? null,
    neighborhood: snapshots?.neighborhood ?? null,
    state: snapshots?.state ?? null,
    street: snapshots?.street ?? null,
    country: snapshots?.country ?? null,
    location: snapshots?.location ?? null,
  };
}

/**
 * Converte Profile parcial (domínio) para ProfileUpdate (banco)
 */
export function domainToUpdate(profile: Partial<Profile>): Partial<ProfileRow> {
  const update: Partial<ProfileRow> & Record<string, unknown> = {};

  if (profile.profileType !== undefined) update.profile_type = profile.profileType;
  if (profile.slug !== undefined) update.slug = profile.slug;
  if (profile.username !== undefined) update.username = profile.username;
  if (profile.handle !== undefined) update.handle = profile.handle;
  if (profile.displayName !== undefined) update.display_name = profile.displayName;
  if (profile.name !== undefined) update.name = profile.name;
  if (profile.bio !== undefined) update.bio = profile.bio;
  if (profile.avatarUrl !== undefined) update.avatar_url = profile.avatarUrl;
  if (profile.coverUrl !== undefined) update.cover_url = profile.coverUrl;
  if (profile.locationId !== undefined) update.location_id = profile.locationId;
  if (profile.phone !== undefined) update.phone = profile.phone;
  if (profile.whatsapp !== undefined) update.whatsapp = profile.whatsapp;
  if (profile.contactEmail !== undefined) update.contact_email = profile.contactEmail;
  if (profile.website !== undefined) update.website = profile.website;
  if (profile.isPublic !== undefined) update.is_public = profile.isPublic;
  if (profile.showContactEmail !== undefined) update.show_contact_email = profile.showContactEmail;
  if (profile.showPhone !== undefined) update.show_phone = profile.showPhone;
  if (profile.showLinkedProfiles !== undefined) update.show_linked_profiles = profile.showLinkedProfiles;
  if (profile.showBusinessLinks !== undefined) update.show_business_links = profile.showBusinessLinks;
  if (profile.showProfessionalLinks !== undefined) update.show_professional_links = profile.showProfessionalLinks;
  if (profile.shareActivityDefault !== undefined) update.share_activity_default = profile.shareActivityDefault;
  if (profile.isActive !== undefined) update.is_active = profile.isActive;
  if (profile.isSuspended !== undefined) update.is_suspended = profile.isSuspended;
  if (profile.suspendedAt !== undefined) update.suspended_at = profile.suspendedAt;
  if (profile.suspendedUntil !== undefined) update.suspended_until = profile.suspendedUntil;
  if (profile.suspensionReason !== undefined) update.suspension_reason = profile.suspensionReason;
  if (profile.verified !== undefined) update.verified = profile.verified;
  if (profile.verifiedAt !== undefined) update.verified_at = profile.verifiedAt;
  if (profile.reputation !== undefined) update.reputation = profile.reputation;
  if (profile.metadata !== undefined) update.metadata = profile.metadata as any;

  return update;
}

/**
 * Converte array de ProfileRow para array de Profile
 */
export function rowsToDomain(rows: ProfileRow[]): Profile[] {
  return rows.map(rowToDomain);
}

/**
 * @deprecated Use as funções exportadas diretamente.
 * Mantido para compatibilidade com código que usa ProfileRowMapper.toDomain() etc.
 */
export const ProfileRowMapper = {
  toDomain: rowToDomain,
  toDomains: rowsToDomain,
  toInsert: domainToInsert,
  toInsertWithSnapshots: domainToInsertWithSnapshots,
  toUpdate: domainToUpdate,
};
