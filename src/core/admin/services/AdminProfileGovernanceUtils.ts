import {
  ADMIN_PROFILE_PERMISSION_GOVERNANCE_STATUS,
} from '@/core/admin/config/profile-governance';

import type {
  AdminProfileIdentityIssue,
  AdminProfileLinkedEntitySummary,
  RawRecord,
} from './AdminProfileGovernanceTypes';

export function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function requiredText(value: unknown, fallback: string): string {
  return normalizeText(value) ?? fallback;
}

export function resolveProfileVerified(profile: RawRecord): boolean {
  return Boolean(profile.verified ?? profile.is_verified);
}

export function resolveProfileVisibility(profile: RawRecord): boolean {
  return profile.is_public !== false;
}

export function resolveProfileSuspended(profile: RawRecord): boolean {
  return Boolean(profile.is_suspended ?? profile.suspended);
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function normalizeBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function normalizeNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createCountMap(
  rows: RawRecord[] | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows ?? []) {
    const rawId = row.profile_id;
    if (typeof rawId !== 'string' || rawId.trim().length === 0) continue;
    map.set(rawId, (map.get(rawId) ?? 0) + 1);
  }

  return map;
}

export function buildLinkedEntities(payload: {
  business?: RawRecord | null;
  professional?: RawRecord | null;
  driver?: RawRecord | null;
}): AdminProfileLinkedEntitySummary[] {
  const entities: AdminProfileLinkedEntitySummary[] = [];

  if (payload.business) {
    const row = payload.business;
    entities.push({
      kind: 'business',
      id: requiredText(row.id, 'business'),
      title: normalizeText(row.business_name) ?? 'Empresa sem nome',
      subtitle: normalizeText(row.category),
      status:
        normalizeText(row.status) ??
        ADMIN_PROFILE_PERMISSION_GOVERNANCE_STATUS.ACTIVE,
      verified: Boolean(row.is_verified),
      publicUrl: normalizeText(row.slug) ? `/p/${row.slug}` : null,
      metadata: [
        row.is_premium ? 'premium' : 'standard',
        row.location_id ? 'com location_id' : 'sem location_id',
      ],
    });
  }

  if (payload.professional) {
    const row = payload.professional;
    entities.push({
      kind: 'professional',
      id: requiredText(row.id, 'professional'),
      title:
        normalizeText(row.professional_name) ??
        normalizeText(row.profession) ??
        'Profissional sem nome',
      subtitle:
        normalizeText(row.profession) ??
        normalizeText(row.service_category) ??
        null,
      status: row.is_accepting_clients === false ? 'paused' : 'accepting_clients',
      verified: Boolean(row.is_verified),
      publicUrl: null,
      metadata: [
        row.accepts_remote ? 'aceita remoto' : 'presencial',
        row.location_id ? 'com location_id' : 'sem location_id',
      ],
    });
  }

  if (payload.driver) {
    const row = payload.driver;
    entities.push({
      kind: 'driver',
      id: requiredText(row.id, 'driver'),
      title: 'Perfil de motorista',
      subtitle: row.vehicle_type ? `Veiculo: ${row.vehicle_type}` : null,
      status: row.is_online ? 'online' : 'offline',
      verified: Boolean(row.is_verified ?? row.documents_verified),
      publicUrl: null,
      metadata: [
        row.subscription_active ? 'assinatura ativa' : 'sem assinatura',
        row.is_available ? 'disponivel' : 'indisponivel',
      ],
    });
  }

  return entities;
}

export function buildIdentityIssues(payload: {
  profile: RawRecord;
  accountProfileCount: number;
  hasNotificationSettings: boolean;
}): AdminProfileIdentityIssue[] {
  const issues: AdminProfileIdentityIssue[] = [];
  const { profile, accountProfileCount, hasNotificationSettings } = payload;
  const username = normalizeText(profile.username);

  if (resolveProfileVisibility(profile) && !username) {
    issues.push('public_without_username');
  }

  if (resolveProfileVisibility(profile) && !resolveProfileVerified(profile)) {
    issues.push('public_unverified');
  }

  if (resolveProfileSuspended(profile)) {
    issues.push('suspended');
  }

  if (profile.is_active === false) {
    issues.push('inactive');
  }

  if (accountProfileCount > 1) {
    issues.push('multi_profile');
  }

  if (!hasNotificationSettings) {
    issues.push('missing_preferences');
  }

  return issues;
}
