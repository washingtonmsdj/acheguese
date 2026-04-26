/**
 * AdminProfileGovernanceService
 *
 * Cobertura administrativa oficial da governanca de identidade de profile.
 * Agrega leitura de identidade publica/privada, plano, roles, preferencias
 * e entidades vinculadas sem espalhar acesso ao banco por pages e hooks.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService, ProfileServiceLegacy } from "@/core/profiles/services/ProfileService";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";
import { AuthorizationEngine } from "@/core/authorization/services/AuthorizationEngine";
import { FamilyService, FAMILY_TABLES } from "@/core/family";
import { adminNotificationsService } from "./AdminNotificationsService";
import {
  ADMIN_PROFILE_PERMISSION_GOVERNANCE_STATUS,
  type AdminProfilePermissionGovernanceStatus,
} from "@/core/admin/config/profile-governance";
import type {
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";
// ✅ Fronteira de camada correta: service importa de contracts/, não de views/

type RawRecord = Record<string, any>;

export type AdminProfileIdentityIssue =
  | "public_without_username"
  | "public_unverified"
  | "suspended"
  | "inactive"
  | "multi_profile"
  | "missing_preferences";

export type AdminProfileVisibilityFilter = "all" | "public" | "private";

export interface AdminProfileIdentityFilters {
  search?: string;
  profileType?: string;
  visibility?: AdminProfileVisibilityFilter;
  page?: number;
  limit?: number;
}

export interface AdminProfileIdentityStats {
  totalProfiles: number;
  publicProfiles: number;
  privateProfiles: number;
  suspendedProfiles: number;
  missingUsername: number;
  publicWithoutUsername: number;
  multiProfileUsers: number;
  withLinkedEntities: number;
  withUsernameHistory: number;
  withPreferences: number;
  withScopedPreferences: number;
  withNotificationScope: number;
  withExternalReputation: number;
  withMultiOriginReputation: number;
  withResidence: number;
  withVerifiedResidence: number;
}

export interface AdminProfileIdentityRecord {
  id: string;
  userId: string;
  name: string;
  displayName: string | null;
  username: string | null;
  publicUrl: string | null;
  profileType: string;
  city: string | null;
  neighborhood: string | null;
  isPublic: boolean;
  isActive: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  reputation: number;
  createdAt: string | null;
  accountProfileCount: number;
  roles: string[];
  activePlan: string;
  subscriptionStatus: string;
  linkedEntityKinds: string[];
  linkedEntityCount: number;
  memberCount: number;
  hasNotificationSettings: boolean;
  usernameHistoryCount: number;
  issues: AdminProfileIdentityIssue[];
}

export interface AdminProfileIdentityListResult {
  data: AdminProfileIdentityRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminProfileLinkedEntitySummary {
  kind: "business" | "professional" | "driver";
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  verified: boolean;
  publicUrl: string | null;
  metadata: string[];
}

export interface AdminProfileIdentitySiblingProfile {
  id: string;
  name: string;
  username: string | null;
  profileType: string;
  isPublic: boolean;
  isActive: boolean;
  isSuspended: boolean;
}

export interface AdminProfileIdentityRoleSummary {
  id: string;
  role: string;
  isActive: boolean;
  grantedAt: string | null;
  expiresAt: string | null;
}

export interface AdminProfileIdentitySubscriptionSummary {
  id: string;
  planType: string;
  status: string;
  active: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  amountCents: number;
}

export interface AdminProfileIdentityMemberSummary {
  id: string;
  userId: string;
  role: string;
  joinedAt: string | null;
  invitedBy: string | null;
}

export interface AdminProfileIdentityAuthSummary {
  email: string | null;
  phone: string | null;
  emailConfirmed: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export interface AdminProfileIdentityEffectiveContext {
  profileId: string;
  status: ProfileStatus;
  permissions: ProfilePermissions;
  plan: ProfilePlan;
  reputation: ProfileReputation;
  verified: boolean;
}

export interface AdminProfileResidenceSummary {
  id: string;
  locationId: string;
  locationName: string | null;
  addressLine: string | null;
  postalCode: string | null;
  country: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  verificationRequestedAt: string | null;
  status: "verified" | "pending_verification" | "unverified";
}

export type AdminProfileFamilyCoverageStatus =
  | "available"
  | "empty"
  | "untracked";

export interface AdminProfileFamilySummary {
  status: AdminProfileFamilyCoverageStatus;
  activeChildrenCount: number;
  activeParentsCount: number;
  pendingInvitesCount: number;
  relationshipTypes: string[];
  notes: string[];
}

export type AdminProfilePreferenceScope =
  | "public_profile"
  | "linked_entities"
  | "reputation_visibility"
  | "notifications";

export type AdminProfilePreferenceFieldState =
  | "enabled"
  | "disabled"
  | "unset"
  | "not_applicable";

export interface AdminProfilePreferenceFieldSummary {
  key: string;
  label: string;
  value: boolean | null;
  state: AdminProfilePreferenceFieldState;
}

export interface AdminProfilePreferenceScopeSummary {
  scope: AdminProfilePreferenceScope;
  label: string;
  status: "configured" | "partial" | "missing";
  configuredFields: number;
  applicableFields: number;
  totalFields: number;
  fields: AdminProfilePreferenceFieldSummary[];
}

export type AdminProfileReputationOrigin =
  | "profile_aggregate"
  | "passenger_mobility"
  | "driver_mobility"
  | "business_reviews"
  | "professional_reviews";

export type AdminProfileReputationStatus =
  | "canonical"
  | "derived"
  | "legacy"
  | "missing";

export interface AdminProfileReputationSourceSummary {
  origin: AdminProfileReputationOrigin;
  label: string;
  status: AdminProfileReputationStatus;
  score: number | null;
  volume: number;
  visibility: "public" | "private" | "internal";
  notes: string[];
}

export interface AdminProfilePermissionActionSummary {
  action: string;
  status: "allowed" | "denied" | "requiresTarget";
}

export interface AdminProfilePermissionGovernanceSummary {
  status: AdminProfilePermissionGovernanceStatus;
  sourceRoles: string[];
  sourceMembershipRoles: string[];
  allowedActions: number;
  deniedActions: number;
  targetDependentActions: number;
  actionMatrix: AdminProfilePermissionActionSummary[];
  notes: string[];
}

export interface AdminProfileIdentityDetail {
  profile: AdminProfileIdentityRecord;
  auth: AdminProfileIdentityAuthSummary | null;
  roles: AdminProfileIdentityRoleSummary[];
  subscription: AdminProfileIdentitySubscriptionSummary | null;
  usernameHistory: Array<{
    id: string;
    old_username: string;
    new_username: string;
    change_reason: string;
    changed_at: string;
  }>;
  members: AdminProfileIdentityMemberSummary[];
  linkedEntities: AdminProfileLinkedEntitySummary[];
  siblingProfiles: AdminProfileIdentitySiblingProfile[];
  notificationSettings: Record<string, unknown> | null;
  effectiveContext: AdminProfileIdentityEffectiveContext | null;
  preferenceScopes: AdminProfilePreferenceScopeSummary[];
  reputationSources: AdminProfileReputationSourceSummary[];
  residence: AdminProfileResidenceSummary | null;
  family: AdminProfileFamilySummary;
  permissionGovernance: AdminProfilePermissionGovernanceSummary | null;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveProfileVerified(profile: RawRecord): boolean {
  return Boolean(profile.verified ?? profile.is_verified);
}

function resolveProfileVisibility(profile: RawRecord): boolean {
  return profile.is_public !== false;
}

function resolveProfileSuspended(profile: RawRecord): boolean {
  return Boolean(profile.is_suspended ?? profile.suspended);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalizeBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createCountMap(
  rows: RawRecord[] | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows ?? []) {
    const rawId = row.profile_id;
    if (typeof rawId !== "string" || rawId.trim().length === 0) continue;
    map.set(rawId, (map.get(rawId) ?? 0) + 1);
  }

  return map;
}

function buildLinkedEntities(payload: {
  business?: RawRecord | null;
  professional?: RawRecord | null;
  driver?: RawRecord | null;
}): AdminProfileLinkedEntitySummary[] {
  const entities: AdminProfileLinkedEntitySummary[] = [];

  if (payload.business) {
    const row = payload.business;
    entities.push({
      kind: "business",
      id: row.id,
      title: normalizeText(row.business_name) ?? "Empresa sem nome",
      subtitle: normalizeText(row.category),
      status:
        normalizeText(row.status) ??
        ADMIN_PROFILE_PERMISSION_GOVERNANCE_STATUS.ACTIVE,
      verified: Boolean(row.is_verified),
      publicUrl: normalizeText(row.slug) ? `/p/${row.slug}` : null,
      metadata: [
        row.is_premium ? "premium" : "standard",
        row.location_id ? "com location_id" : "sem location_id",
      ],
    });
  }

  if (payload.professional) {
    const row = payload.professional;
    entities.push({
      kind: "professional",
      id: row.id,
      title:
        normalizeText(row.professional_name) ??
        normalizeText(row.profession) ??
        "Profissional sem nome",
      subtitle:
        normalizeText(row.profession) ??
        normalizeText(row.service_category) ??
        null,
      status: row.is_accepting_clients === false ? "paused" : "accepting_clients",
      verified: Boolean(row.is_verified),
      publicUrl: null,
      metadata: [
        row.accepts_remote ? "aceita remoto" : "presencial",
        row.location_id ? "com location_id" : "sem location_id",
      ],
    });
  }

  if (payload.driver) {
    const row = payload.driver;
    entities.push({
      kind: "driver",
      id: row.id,
      title: "Perfil de motorista",
      subtitle: row.vehicle_type ? `Veiculo: ${row.vehicle_type}` : null,
      status: row.is_online ? "online" : "offline",
      verified: Boolean(row.is_verified ?? row.documents_verified),
      publicUrl: null,
      metadata: [
        row.subscription_active ? "assinatura ativa" : "sem assinatura",
        row.is_available ? "disponivel" : "indisponivel",
      ],
    });
  }

  return entities;
}

function buildIdentityIssues(payload: {
  profile: RawRecord;
  accountProfileCount: number;
  hasNotificationSettings: boolean;
}): AdminProfileIdentityIssue[] {
  const issues: AdminProfileIdentityIssue[] = [];
  const { profile, accountProfileCount, hasNotificationSettings } = payload;
  const username = normalizeText(profile.username);

  if (resolveProfileVisibility(profile) && !username) {
    issues.push("public_without_username");
  }

  if (resolveProfileVisibility(profile) && !resolveProfileVerified(profile)) {
    issues.push("public_unverified");
  }

  if (resolveProfileSuspended(profile)) {
    issues.push("suspended");
  }

  if (profile.is_active === false) {
    issues.push("inactive");
  }

  if (accountProfileCount > 1) {
    issues.push("multi_profile");
  }

  if (!hasNotificationSettings) {
    issues.push("missing_preferences");
  }

  return issues;
}

function createPreferenceField(payload: {
  key: string;
  label: string;
  value: unknown;
  applicable?: boolean;
}): AdminProfilePreferenceFieldSummary {
  const { key, label, value, applicable = true } = payload;

  if (!applicable) {
    return {
      key,
      label,
      value: null,
      state: "not_applicable",
    };
  }

  const normalized = normalizeBoolean(value);

  if (normalized === null) {
    return {
      key,
      label,
      value: null,
      state: "unset",
    };
  }

  return {
    key,
    label,
    value: normalized,
    state: normalized ? "enabled" : "disabled",
  };
}

function createPreferenceScope(payload: {
  scope: AdminProfilePreferenceScope;
  label: string;
  fields: AdminProfilePreferenceFieldSummary[];
}): AdminProfilePreferenceScopeSummary {
  const { scope, label, fields } = payload;
  const applicableFields = fields.filter((field) => field.state !== "not_applicable");
  const configuredFields = applicableFields.filter(
    (field) => field.state === "enabled" || field.state === "disabled",
  ).length;

  let status: AdminProfilePreferenceScopeSummary["status"] = "configured";

  if (applicableFields.length > 0) {
    if (configuredFields === 0) {
      status = "missing";
    } else if (configuredFields < applicableFields.length) {
      status = "partial";
    }
  }

  return {
    scope,
    label,
    status,
    configuredFields,
    applicableFields: applicableFields.length,
    totalFields: fields.length,
    fields,
  };
}

function buildPreferenceScopes(payload: {
  profile: RawRecord;
  linkedEntities: AdminProfileLinkedEntitySummary[];
  notificationSettings: Record<string, unknown> | null;
}): AdminProfilePreferenceScopeSummary[] {
  const { profile, linkedEntities, notificationSettings } = payload;
  const profileType = normalizeText(profile.profile_type) ?? "personal";
  const hasDriverContext =
    profileType === "driver" ||
    linkedEntities.some((entity) => entity.kind === "driver");
  const supportsBusinessLinks =
    profileType === "business" || profileType === "professional";
  const supportsProfessionalLinks = profileType === "professional";

  return [
    createPreferenceScope({
      scope: "public_profile",
      label: "Perfil publico",
      fields: [
        createPreferenceField({
          key: "is_public",
          label: "Perfil publico",
          value: profile.is_public,
        }),
        createPreferenceField({
          key: "show_contact_email",
          label: "Email publico",
          value: profile.show_contact_email,
        }),
        createPreferenceField({
          key: "show_phone",
          label: "Telefone publico",
          value: profile.show_phone,
        }),
      ],
    }),
    createPreferenceScope({
      scope: "linked_entities",
      label: "Vinculos publicos",
      fields: [
        createPreferenceField({
          key: "show_linked_profiles",
          label: "Mostrar vinculos",
          value: profile.show_linked_profiles,
        }),
        createPreferenceField({
          key: "show_business_links",
          label: "Links comerciais",
          value: profile.show_business_links,
          applicable: supportsBusinessLinks,
        }),
        createPreferenceField({
          key: "show_professional_links",
          label: "Links profissionais",
          value: profile.show_professional_links,
          applicable: supportsProfessionalLinks,
        }),
      ],
    }),
    createPreferenceScope({
      scope: "reputation_visibility",
      label: "Visibilidade de reputacao",
      fields: [
        createPreferenceField({
          key: "show_passenger_rating_public",
          label: "Reputacao de passageiro publica",
          value: profile.show_passenger_rating_public,
        }),
        createPreferenceField({
          key: "show_driver_rating_public",
          label: "Reputacao de motorista publica",
          value: profile.show_driver_rating_public,
          applicable: hasDriverContext,
        }),
      ],
    }),
    createPreferenceScope({
      scope: "notifications",
      label: "Notificacoes",
      fields: [
        createPreferenceField({
          key: "email_notifications",
          label: "Email",
          value: notificationSettings?.email_notifications,
        }),
        createPreferenceField({
          key: "push_notifications",
          label: "Push",
          value: notificationSettings?.push_notifications,
        }),
        createPreferenceField({
          key: "weekly_digest",
          label: "Resumo semanal",
          value: notificationSettings?.weekly_digest,
        }),
        createPreferenceField({
          key: "new_messages",
          label: "Mensagens",
          value: notificationSettings?.new_messages,
        }),
        createPreferenceField({
          key: "community_updates",
          label: "Atualizacoes da comunidade",
          value: notificationSettings?.community_updates,
        }),
        createPreferenceField({
          key: "business_updates",
          label: "Atualizacoes de negocio",
          value: notificationSettings?.business_updates,
        }),
      ],
    }),
  ];
}

function countConfiguredScopes(scopes: AdminProfilePreferenceScopeSummary[]): number {
  return scopes.filter((scope) => scope.status === "configured").length;
}

function formatResidenceAddress(address?: RawRecord | null): string | null {
  if (!address) return null;

  const parts = [
    normalizeText(address.street),
    normalizeText(address.number),
    normalizeText(address.complement),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

function buildResidenceSummary(row?: RawRecord | null): AdminProfileResidenceSummary | null {
  if (!row) return null;

  const verificationRequestedAt =
    typeof row.verification_requested_at === "string"
      ? row.verification_requested_at
      : null;
  const isVerified = row.is_verified === true;

  return {
    id: row.id,
    locationId: row.location_id,
    locationName: normalizeText(row.location?.name),
    addressLine: formatResidenceAddress(row.address),
    postalCode: normalizeText(row.address?.postal_code),
    country: normalizeText(row.country),
    isPrimary: row.is_primary !== false,
    isVerified,
    verificationRequestedAt,
    status: isVerified
      ? "verified"
      : verificationRequestedAt
        ? "pending_verification"
        : "unverified",
  };
}

interface ReviewAggregateSummary {
  count: number;
  average: number | null;
}

function resolveReputationVisibility(
  value: unknown,
  fallback: "public" | "private" | "internal" = "internal",
): "public" | "private" | "internal" {
  const normalized = normalizeBoolean(value);
  if (normalized === true) return "public";
  if (normalized === false) return "private";
  return fallback;
}

function buildReputationSources(payload: {
  profile: RawRecord;
  linkedEntities: AdminProfileLinkedEntitySummary[];
  effectiveContext?: AdminProfileIdentityEffectiveContext | null;
  driverReputation?: RawRecord | null;
  businessReviews?: ReviewAggregateSummary | null;
  professionalReviews?: ReviewAggregateSummary | null;
}): AdminProfileReputationSourceSummary[] {
  const {
    profile,
    linkedEntities,
    effectiveContext = null,
    driverReputation = null,
    businessReviews = null,
    professionalReviews = null,
  } = payload;

  const hasDriverContext =
    (normalizeText(profile.profile_type) ?? "personal") === "driver" ||
    linkedEntities.some((entity) => entity.kind === "driver");
  const aggregateScore = effectiveContext?.reputation.score ?? Number(profile.reputation ?? 0);
  const aggregateNotes = [
    effectiveContext?.reputation.level
      ? `nivel ${effectiveContext.reputation.level}`
      : null,
    typeof effectiveContext?.reputation.rank === "number"
      ? `rank ${effectiveContext.reputation.rank}`
      : null,
  ].filter(Boolean) as string[];
  const passengerScore = normalizeNumber(profile.passenger_rating);
  const passengerCompletedRides = Number(profile.passenger_completed_rides ?? 0);
  const passengerTrustLevel = normalizeText(profile.passenger_trust_level);
  const hasPassengerSignal =
    passengerScore !== null ||
    passengerCompletedRides > 0 ||
    passengerTrustLevel !== null;
  const driverScore = normalizeNumber(driverReputation?.avg_rating);
  const driverTotalRides = Number(driverReputation?.total_rides ?? 0);
  const hasDriverSignal = driverScore !== null || driverTotalRides > 0;
  const businessReviewCount = businessReviews?.count ?? 0;
  const professionalReviewCount = professionalReviews?.count ?? 0;

  return [
    {
      origin: "profile_aggregate",
      label: "Agregado do profile",
      status: "canonical",
      score: Number.isFinite(aggregateScore) ? aggregateScore : 0,
      volume: 1,
      visibility: "internal",
      notes: aggregateNotes.length ? aggregateNotes : ["score agregado de identidade"],
    },
    {
      origin: "passenger_mobility",
      label: "Mobilidade - passageiro",
      status: hasPassengerSignal ? "legacy" : "missing",
      score: passengerScore,
      volume: passengerCompletedRides,
      visibility: resolveReputationVisibility(
        profile.show_passenger_rating_public,
        "private",
      ),
      notes: [
        passengerTrustLevel ? `trust ${passengerTrustLevel}` : null,
        profile.is_suspended ? "perfil suspenso" : null,
      ].filter(Boolean) as string[],
    },
    {
      origin: "driver_mobility",
      label: "Mobilidade - motorista",
      status: hasDriverSignal ? "derived" : "missing",
      score: driverScore,
      volume: driverTotalRides,
      visibility: hasDriverContext
        ? resolveReputationVisibility(profile.show_driver_rating_public, "private")
        : "internal",
      notes: hasDriverSignal ? [`${driverTotalRides} corrida(s)`] : [],
    },
    {
      origin: "business_reviews",
      label: "Reviews de business",
      status: businessReviewCount > 0 ? "derived" : "missing",
      score: businessReviews?.average ?? null,
      volume: businessReviewCount,
      visibility: "public",
      notes:
        businessReviewCount > 0 ? [`${businessReviewCount} review(s)`] : [],
    },
    {
      origin: "professional_reviews",
      label: "Reviews profissionais",
      status: professionalReviewCount > 0 ? "derived" : "missing",
      score: professionalReviews?.average ?? null,
      volume: professionalReviewCount,
      visibility: "public",
      notes:
        professionalReviewCount > 0 ? [`${professionalReviewCount} review(s)`] : [],
    },
  ];
}

function countTrackedReputationOrigins(
  sources: AdminProfileReputationSourceSummary[],
): number {
  return sources.filter(
    (source) =>
      source.origin !== "profile_aggregate" && source.status !== "missing",
  ).length;
}

async function loadRolesByUserId(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();

  // ✅ SSOT: Usar ProfileService em vez de acesso direto
  const map = new Map<string, string[]>();
  
  try {
    // Carregar roles para cada userId usando o serviço canônico
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const roles = await profileService.getUserRoles(userId);
          if (roles && roles.length > 0) {
            map.set(userId, roles);
          }
        } catch (error) {
          logger.error(`AdminProfileGovernanceService.loadRolesByUserId for ${userId}`, error);
        }
      })
    );
  } catch (error) {
    logger.error("AdminProfileGovernanceService.loadRolesByUserId", error);
  }

  return map;
}

async function loadActiveSubscriptionsByUserId(
  userIds: string[],
): Promise<Map<string, RawRecord>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .in("user_id", userIds)
    .eq("active", true)
    .order("started_at", { ascending: false });

  if (error) {
    logger.error("AdminProfileGovernanceService.loadActiveSubscriptionsByUserId", error);
    return new Map();
  }

  const map = new Map<string, RawRecord>();
  for (const row of (data as RawRecord[]) ?? []) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, row);
    }
  }

  return map;
}

async function loadUserProfileCountMap(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  // ✅ SSOT: Usar ProfileService em vez de acesso direto
  const map = new Map<string, number>();
  
  try {
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const profiles = await profileService.getProfilesByUserId(userId);
          map.set(userId, profiles.length);
        } catch (error) {
          logger.error(`AdminProfileGovernanceService.loadUserProfileCountMap for ${userId}`, error);
          map.set(userId, 0);
        }
      })
    );
  } catch (error) {
    logger.error("AdminProfileGovernanceService.loadUserProfileCountMap", error);
  }

  return map;
}

async function loadUsernameHistoryCountMap(
  profileIds: string[],
): Promise<Map<string, number>> {
  if (profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profile_username_history")
    .select("profile_id")
    .in("profile_id", profileIds);

  if (error) {
    logger.error("AdminProfileGovernanceService.loadUsernameHistoryCountMap", error);
    return new Map();
  }

  return createCountMap(data as RawRecord[]);
}

async function loadNotificationSettingsUserIds(userIds: string[]): Promise<Set<string>> {
  return adminNotificationsService.getSettingsUserIds(userIds);
}

async function loadProfileMembersCountMap(
  profileIds: string[],
): Promise<Map<string, number>> {
  if (profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profile_members")
    .select("profile_id")
    .in("profile_id", profileIds);

  if (error) {
    logger.error("AdminProfileGovernanceService.loadProfileMembersCountMap", error);
    return new Map();
  }

  return createCountMap(data as RawRecord[]);
}

async function loadEntityMaps(profileIds: string[]): Promise<{
  businessMap: Map<string, RawRecord>;
  professionalMap: Map<string, RawRecord>;
  driverMap: Map<string, RawRecord>;
}> {
  if (profileIds.length === 0) {
    return {
      businessMap: new Map(),
      professionalMap: new Map(),
      driverMap: new Map(),
    };
  }

  // ✅ SSOT: Usar ProfileService.getDriverData para driver_data
  // business_data e professional_data ainda precisam de serviços canônicos
  const [businessResult, professionalResult] = await Promise.all([
    supabase.from("business_data").select("*").in("profile_id", profileIds),
    supabase.from("professional_data").select("*").in("profile_id", profileIds),
  ]);

  // Carregar driver_data usando ProfileService
  const driverMap = new Map<string, RawRecord>();
  await Promise.all(
    profileIds.map(async (profileId) => {
      try {
        const driverData = await profileService.getDriverData(profileId);
        if (driverData) {
          driverMap.set(profileId, driverData);
        }
      } catch (error) {
        logger.error(`AdminProfileGovernanceService.loadEntityMaps.driver for ${profileId}`, error);
      }
    })
  );

  if (businessResult.error) {
    logger.error("AdminProfileGovernanceService.loadEntityMaps.business", businessResult.error);
  }
  if (professionalResult.error) {
    logger.error(
      "AdminProfileGovernanceService.loadEntityMaps.professional",
      professionalResult.error,
    );
  }

  return {
    businessMap: new Map(
      ((businessResult.data as RawRecord[]) ?? []).map((row) => [row.profile_id, row]),
    ),
    professionalMap: new Map(
      ((professionalResult.data as RawRecord[]) ?? []).map((row) => [row.profile_id, row]),
    ),
    driverMap, // ✅ SSOT: Já carregado usando ProfileService
  };
}

async function loadDriverReputationMap(
  profileIds: string[],
): Promise<Map<string, RawRecord>> {
  if (profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("driver_complete_profile")
    .select("profile_id, avg_rating, total_rides")
    .in("profile_id", profileIds);

  if (error) {
    logger.error("AdminProfileGovernanceService.loadDriverReputationMap", error);
    return new Map();
  }

  return new Map(
    ((data as RawRecord[]) ?? []).map((row) => [row.profile_id, row]),
  );
}

async function loadReviewAggregateMap(
  table: "business_reviews_new" | "professional_reviews_new",
  profileIds: string[],
): Promise<Map<string, ReviewAggregateSummary>> {
  if (profileIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from(table)
    .select("reviewed_profile_id, rating")
    .in("reviewed_profile_id", profileIds);

  if (error) {
    logger.error("AdminProfileGovernanceService.loadReviewAggregateMap", {
      table,
      error,
    });
    return new Map();
  }

  const aggregate = new Map<string, { count: number; sum: number }>();

  for (const row of (data as RawRecord[]) ?? []) {
    const profileId = row.reviewed_profile_id as string | undefined;
    if (!profileId) continue;

    const current = aggregate.get(profileId) ?? { count: 0, sum: 0 };
    current.count += 1;
    current.sum += Number(row.rating ?? 0);
    aggregate.set(profileId, current);
  }

  return new Map(
    [...aggregate.entries()].map(([profileId, value]) => [
      profileId,
      {
        count: value.count,
        average: value.count > 0 ? Math.round((value.sum / value.count) * 10) / 10 : null,
      },
    ]),
  );
}

async function loadReviewAggregateMaps(profileIds: string[]): Promise<{
  businessReviewMap: Map<string, ReviewAggregateSummary>;
  professionalReviewMap: Map<string, ReviewAggregateSummary>;
}> {
  const [businessReviewMap, professionalReviewMap] = await Promise.all([
    loadReviewAggregateMap("business_reviews_new", profileIds),
    loadReviewAggregateMap("professional_reviews_new", profileIds),
  ]);

  return {
    businessReviewMap,
    professionalReviewMap,
  };
}

async function loadPrimaryResidenceMap(
  userIds: string[],
): Promise<Map<string, RawRecord>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("user_residences")
    .select(`
      id,
      user_id,
      address_id,
      location_id,
      country,
      is_primary,
      is_verified,
      verification_requested_at,
      address:addresses!address_id(
        street,
        number,
        complement,
        postal_code
      ),
      location:locations!location_id(
        id,
        name
      )
    `)
    .in("user_id", userIds)
    .eq("is_primary", true);

  if (error) {
    logger.error("AdminProfileGovernanceService.loadPrimaryResidenceMap", error);
    return new Map();
  }

  const map = new Map<string, RawRecord>();
  for (const row of (data as RawRecord[]) ?? []) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, row);
    }
  }

  return map;
}

async function loadFamilySummary(userId: string): Promise<AdminProfileFamilySummary> {
  try {
    const summary = await FamilyService.getCoverageSummaryByUserId(
      userId,
      supabase,
    );
    const hasAnyFamilyRecord =
      summary.activeChildrenCount > 0 ||
      summary.activeParentsCount > 0 ||
      summary.pendingInvitesCount > 0 ||
      summary.relationshipTypes.length > 0;

    return {
      status: hasAnyFamilyRecord ? "available" : "empty",
      activeChildrenCount: summary.activeChildrenCount,
      activeParentsCount: summary.activeParentsCount,
      pendingInvitesCount: summary.pendingInvitesCount,
      relationshipTypes: unique(summary.relationshipTypes),
      notes:
        hasAnyFamilyRecord
          ? []
          : ["sem vinculos familiares registrados no agregado atual"],
    };
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : null;

    if (code === "42P01" || code === "PGRST205") {
      logger.warn("AdminProfileGovernanceService.loadFamilySummary.untracked", {
        userId,
        code,
      });
      return {
        status: "untracked",
        activeChildrenCount: 0,
        activeParentsCount: 0,
        pendingInvitesCount: 0,
        relationshipTypes: [],
        notes: [`ambiente atual sem migration aplicada de ${FAMILY_TABLES.connections}`],
      };
    }

    logger.error("AdminProfileGovernanceService.loadFamilySummary", error, {
      userId,
    });
    return {
      status: "untracked",
      activeChildrenCount: 0,
      activeParentsCount: 0,
      pendingInvitesCount: 0,
      relationshipTypes: [],
      notes: ["falha ao ler o agregado de family neste ambiente"],
    };
  }
}

async function loadPermissionGovernance(payload: {
  profileId: string;
  roles: AdminProfileIdentityRoleSummary[];
  members: AdminProfileIdentityMemberSummary[];
  effectiveContext: AdminProfileIdentityEffectiveContext | null;
}): Promise<AdminProfilePermissionGovernanceSummary | null> {
  const { profileId, roles, members, effectiveContext } = payload;

  try {
    const actionMatrix = await AuthorizationEngine.getProfilePermissions(profileId, {});
    const allowedActions = actionMatrix.filter((action) => action.status === "allowed").length;
    const deniedActions = actionMatrix.filter((action) => action.status === "denied").length;
    const targetDependentActions = actionMatrix.filter(
      (action) => action.status === "requiresTarget",
    ).length;
    const sourceRoles = unique(roles.map((role) => role.role));
    const sourceMembershipRoles = unique(members.map((member) => member.role));

    return {
      status:
        effectiveContext?.status.isBlocked || effectiveContext?.status.isSuspended
          ? "blocked"
          : deniedActions > 0
            ? "limited"
            : "active",
      sourceRoles,
      sourceMembershipRoles,
      allowedActions,
      deniedActions,
      targetDependentActions,
      actionMatrix: actionMatrix.map((action) => ({
        action: action.action,
        status: action.status,
      })),
      notes: [
        sourceRoles.length > 0 ? `roles: ${sourceRoles.join(", ")}` : "sem roles elevadas",
        sourceMembershipRoles.length > 0
          ? `memberships: ${sourceMembershipRoles.join(", ")}`
          : "sem memberships operacionais",
        effectiveContext?.verified ? "perfil verificado" : "perfil nao verificado",
      ],
    };
  } catch (error) {
    logger.error("AdminProfileGovernanceService.loadPermissionGovernance", error, {
      profileId,
    });
    return null;
  }
}

function buildIdentityRecord(payload: {
  profile: RawRecord;
  roles: string[];
  subscription?: RawRecord | null;
  accountProfileCount: number;
  usernameHistoryCount: number;
  memberCount: number;
  linkedEntities: AdminProfileLinkedEntitySummary[];
  hasNotificationSettings: boolean;
}): AdminProfileIdentityRecord {
  const {
    profile,
    roles,
    subscription,
    accountProfileCount,
    usernameHistoryCount,
    memberCount,
    linkedEntities,
    hasNotificationSettings,
  } = payload;

  const username = normalizeText(profile.username);
  const isPublic = resolveProfileVisibility(profile);
  const issues = buildIdentityIssues({
    profile,
    accountProfileCount,
    hasNotificationSettings,
  });

  return {
    id: profile.id,
    userId: profile.user_id,
    name: normalizeText(profile.name) ?? "Perfil sem nome",
    displayName: normalizeText(profile.display_name),
    username,
    publicUrl: isPublic && username ? buildPublicProfileUrl(username) : null,
    profileType: normalizeText(profile.profile_type) ?? "personal",
    city: normalizeText(profile.city),
    neighborhood: normalizeText(profile.neighborhood),
    isPublic,
    isActive: profile.is_active !== false,
    isSuspended: resolveProfileSuspended(profile),
    isVerified: resolveProfileVerified(profile),
    reputation: Number(profile.reputation ?? 0),
    createdAt: profile.created_at ?? null,
    accountProfileCount,
    roles,
    activePlan: normalizeText(subscription?.plan_type) ?? "basic",
    subscriptionStatus: normalizeText(subscription?.status) ?? "implicit_basic",
    linkedEntityKinds: linkedEntities.map((entity) => entity.kind),
    linkedEntityCount: linkedEntities.length,
    memberCount,
    hasNotificationSettings,
    usernameHistoryCount,
    issues,
  };
}

/**
 * Carregar resumo de autenticação do usuário
 * 
 * ✅ SEGURANÇA: Usa edge function admin-get-user-auth-summary
 * - Validação de role admin no servidor
 * - Acesso seguro a auth.users
 * - Audit logging automático
 */
async function loadAuthSummary(userId: string): Promise<AdminProfileIdentityAuthSummary | null> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-get-user-auth-summary', {
      body: { userId },
    });

    if (error) {
      logger.error('AdminProfileGovernanceService.loadAuthSummary', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      email: data.email ?? null,
      phone: data.phone ?? null,
      emailConfirmed: Boolean(data.email_confirmed_at),
      createdAt: data.created_at ?? null,
      lastSignInAt: data.last_sign_in_at ?? null,
    };
  } catch (error) {
    logger.error('AdminProfileGovernanceService.loadAuthSummary', error);
    return null;
  }
}

async function loadEffectiveContext(
  userId: string,
): Promise<AdminProfileIdentityEffectiveContext | null> {
  try {
    const context = await profileService.getProfileContext(userId);
    if (!context) return null;

    return {
      profileId: context.id,
      status: context.status,
      permissions: context.permissions,
      plan: context.plan,
      reputation: context.reputation,
      verified: context.verified,
    };
  } catch (error) {
    logger.error("AdminProfileGovernanceService.loadEffectiveContext", error);
    return null;
  }
}

class AdminProfileGovernanceService {
  async getStats(): Promise<AdminProfileIdentityStats> {
    try {
      // ✅ SSOT: Usar profileService para buscar profiles
      const allIds = await profileService.getAllProfileIds() as string[];
      const profiles = await profileService.getProfilesByIds(allIds);
      
      // Converter para RawRecord para manter compatibilidade com código existente
      const profilesRaw = profiles as unknown as RawRecord[];
      const profileIds = profiles.map((profile) => profile.id) as string[];
      const userIds = unique(profiles.map((profile) => profile.user_id)) as string[];

      const [
        usernameHistoryCountMap,
        notificationSettingsUserIds,
        userProfileCountMap,
        entityMaps,
        driverReputationMap,
        reviewAggregateMaps,
        primaryResidenceMap,
      ] = await Promise.all([
        loadUsernameHistoryCountMap(profileIds),
        loadNotificationSettingsUserIds(userIds),
        loadUserProfileCountMap(userIds),
        loadEntityMaps(profileIds),
        loadDriverReputationMap(profileIds),
        loadReviewAggregateMaps(profileIds),
        loadPrimaryResidenceMap(userIds),
      ]);

      let publicProfiles = 0;
      let privateProfiles = 0;
      let suspendedProfiles = 0;
      let missingUsername = 0;
      let publicWithoutUsername = 0;
      let withLinkedEntities = 0;
      let withUsernameHistory = 0;
      let withPreferences = 0;
      let withScopedPreferences = 0;
      let withNotificationScope = 0;
      let withExternalReputation = 0;
      let withMultiOriginReputation = 0;
      let withResidence = 0;
      let withVerifiedResidence = 0;

      for (const profile of profilesRaw) {
        const username = normalizeText(profile.username);
        const isPublic = resolveProfileVisibility(profile);
        const residence = primaryResidenceMap.get(profile.user_id) ?? null;
        const linkedEntities = buildLinkedEntities({
          business: entityMaps.businessMap.get(profile.id),
          professional: entityMaps.professionalMap.get(profile.id),
          driver: entityMaps.driverMap.get(profile.id),
        });
        const preferenceScopes = buildPreferenceScopes({
          profile,
          linkedEntities,
          notificationSettings: notificationSettingsUserIds.has(profile.user_id)
            ? { email_notifications: true }
            : null,
        });
        const reputationSources = buildReputationSources({
          profile,
          linkedEntities,
          driverReputation: driverReputationMap.get(profile.id),
          businessReviews: reviewAggregateMaps.businessReviewMap.get(profile.id) ?? null,
          professionalReviews:
            reviewAggregateMaps.professionalReviewMap.get(profile.id) ?? null,
        });
        const trackedOrigins = countTrackedReputationOrigins(reputationSources);

        if (isPublic) {
          publicProfiles += 1;
        } else {
          privateProfiles += 1;
        }

        if (!username) {
          missingUsername += 1;
          if (isPublic) {
            publicWithoutUsername += 1;
          }
        }

        if (resolveProfileSuspended(profile)) {
          suspendedProfiles += 1;
        }

        if (
          entityMaps.businessMap.has(profile.id) ||
          entityMaps.professionalMap.has(profile.id) ||
          entityMaps.driverMap.has(profile.id)
        ) {
          withLinkedEntities += 1;
        }

        if ((usernameHistoryCountMap.get(profile.id) ?? 0) > 0) {
          withUsernameHistory += 1;
        }

        if (notificationSettingsUserIds.has(profile.user_id)) {
          withPreferences += 1;
        }

        if (countConfiguredScopes(preferenceScopes) === preferenceScopes.length) {
          withScopedPreferences += 1;
        }

        if (
          preferenceScopes.some(
            (scope) =>
              scope.scope === "notifications" &&
              scope.status !== "missing",
          )
        ) {
          withNotificationScope += 1;
        }

        if (trackedOrigins > 0) {
          withExternalReputation += 1;
        }

        if (trackedOrigins > 1) {
          withMultiOriginReputation += 1;
        }

        if (residence) {
          withResidence += 1;
          if (residence.is_verified === true) {
            withVerifiedResidence += 1;
          }
        }
      }

      const multiProfileUsers = [...userProfileCountMap.values()].filter((count) => count > 1).length;

      return {
        totalProfiles: profilesRaw.length,
        publicProfiles,
        privateProfiles,
        suspendedProfiles,
        missingUsername,
        publicWithoutUsername,
        multiProfileUsers,
        withLinkedEntities,
        withUsernameHistory,
        withPreferences,
        withScopedPreferences,
        withNotificationScope,
        withExternalReputation,
        withMultiOriginReputation,
        withResidence,
        withVerifiedResidence,
      };
    } catch (error) {
      logger.error("AdminProfileGovernanceService.getStats", error);
      return {
        totalProfiles: 0,
        publicProfiles: 0,
        privateProfiles: 0,
        suspendedProfiles: 0,
        missingUsername: 0,
        publicWithoutUsername: 0,
        multiProfileUsers: 0,
        withLinkedEntities: 0,
        withUsernameHistory: 0,
        withPreferences: 0,
        withScopedPreferences: 0,
        withNotificationScope: 0,
        withExternalReputation: 0,
        withMultiOriginReputation: 0,
        withResidence: 0,
        withVerifiedResidence: 0,
      };
    }
  }

  async getProfiles(
    filters: AdminProfileIdentityFilters = {},
  ): Promise<AdminProfileIdentityListResult> {
    try {
      const {
        search,
        profileType,
        visibility = "all",
        page = 1,
        limit = 20,
      } = filters;

      // ✅ SSOT: Usar profileService para buscar profiles com filtros
      const { data: rawData, total: count } = await profileService.getProfilesFiltered({
        search,
        profileType,
        visibility,
        page,
        limit,
      });

      const profilesBasic = (rawData as RawRecord[]) ?? [];
      const profileIds = profilesBasic.map((profile) => profile.id) as string[];
      const userIds = unique(profilesBasic.map((profile) => profile.user_id)) as string[];
      
      // ✅ SSOT: Buscar dados completos via profileService
      const profiles = await profileService.getProfilesByIds(profileIds);
      const profilesMap = new Map(profiles.map(p => [p.id, p as unknown as RawRecord]));

      const [
        rolesByUserId,
        subscriptionsByUserId,
        userProfileCountMap,
        usernameHistoryCountMap,
        notificationSettingsUserIds,
        memberCountMap,
        entityMaps,
      ] = await Promise.all([
        loadRolesByUserId(userIds),
        loadActiveSubscriptionsByUserId(userIds),
        loadUserProfileCountMap(userIds),
        loadUsernameHistoryCountMap(profileIds),
        loadNotificationSettingsUserIds(userIds),
        loadProfileMembersCountMap(profileIds),
        loadEntityMaps(profileIds),
      ]);

      return {
        data: profilesBasic.map((profileBasic: RawRecord) => {
          const profile: RawRecord = (profilesMap.get(profileBasic.id as string) ?? profileBasic) as RawRecord;
          return buildIdentityRecord({
            profile,
            roles: rolesByUserId.get(profile.user_id as string) ?? [],
            subscription: subscriptionsByUserId.get(profile.user_id as string) ?? null,
            accountProfileCount: userProfileCountMap.get(profile.user_id as string) ?? 1,
            usernameHistoryCount: usernameHistoryCountMap.get(profile.id as string) ?? 0,
            memberCount: memberCountMap.get(profile.id as string) ?? 0,
            linkedEntities: buildLinkedEntities({
              business: entityMaps.businessMap.get(profile.id as string),
              professional: entityMaps.professionalMap.get(profile.id as string),
              driver: entityMaps.driverMap.get(profile.id as string),
            }),
            hasNotificationSettings: notificationSettingsUserIds.has(profile.user_id as string),
          });
        }),
        total: count ?? 0,
        page,
        totalPages: count ? Math.max(1, Math.ceil(count / limit)) : 1,
      };
    } catch (error) {
      logger.error("AdminProfileGovernanceService.getProfiles", error);
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }

  async getProfileDetail(profileId: string): Promise<AdminProfileIdentityDetail | null> {
    try {
      // ✅ SSOT: Usar profileService para buscar profile
      const profileData = await profileService.getProfileById(profileId);
      if (!profileData) return null;

      const profile = profileData as unknown as RawRecord;
      const userId = profile.user_id as string;

      const [
        rolesData,
        subscriptionResult,
        membersResult,
        siblingProfilesData,
        businessResult,
        professionalResult,
        driverData,
        notificationSettingsResult,
        usernameHistory,
        auth,
        effectiveContext,
        driverReputationMap,
        reviewAggregateMaps,
        primaryResidenceMap,
        family,
      ] = await Promise.all([
        // ✅ SSOT: Usar profileService.getUserRoles
        profileService.getUserRoles(userId).then((roles: string[]) => ({ data: roles.map((role: string) => ({ role, is_active: true })), error: null })),
        supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profile_members")
          .select("*")
          .eq("profile_id", profileId)
          .order("joined_at", { ascending: true }),
        // ✅ SSOT: Usar profileService.getProfilesByUserId
        profileService.getProfilesByUserId(userId).then((data: unknown[]) => ({ data, error: null })),
        supabase.from("business_data").select("*").eq("profile_id", profileId).maybeSingle(),
        supabase
          .from("professional_data")
          .select("*")
          .eq("profile_id", profileId)
          .maybeSingle(),
        // ✅ SSOT: Usar profileService.getDriverData
        profileService.getDriverData(profileId).then((data: unknown) => ({ data, error: null })),
        adminNotificationsService.getUserSettings(userId),
        ProfileServiceLegacy.getUsernameHistory(profileId),
        loadAuthSummary(userId),
        loadEffectiveContext(userId),
        loadDriverReputationMap([profileId]),
        loadReviewAggregateMaps([profileId]),
        loadPrimaryResidenceMap([userId]),
        loadFamilySummary(userId),
      ]);

      // Roles agora vem do ProfileService, não precisa verificar erro
      if (subscriptionResult.error) {
        logger.error(
          "AdminProfileGovernanceService.getProfileDetail.subscription",
          subscriptionResult.error,
        );
      }
      if (membersResult.error) {
        logger.error("AdminProfileGovernanceService.getProfileDetail.members", membersResult.error);
      }
      // Sibling profiles agora vem do ProfileService, não precisa verificar erro
      if (businessResult.error) {
        logger.error("AdminProfileGovernanceService.getProfileDetail.business", businessResult.error);
      }
      if (professionalResult.error) {
        logger.error(
          "AdminProfileGovernanceService.getProfileDetail.professional",
          professionalResult.error,
        );
      }
      // Driver data agora vem do ProfileService, não precisa verificar erro
      
      const roles = ((rolesData.data as any[]) ?? []).map((row) => ({
        id: typeof row === 'string' ? row : row.id,
        role: typeof row === 'string' ? row : row.role,
        isActive: typeof row === 'string' ? true : (row.is_active !== false),
        grantedAt: typeof row === 'string' ? null : (row.granted_at ?? null),
        expiresAt: typeof row === 'string' ? null : (row.expires_at ?? null),
      }));

      const subscription = subscriptionResult.data
        ? {
            id: subscriptionResult.data.id,
            planType: normalizeText(subscriptionResult.data.plan_type) ?? "basic",
            status: normalizeText(subscriptionResult.data.status) ?? "implicit_basic",
            active: subscriptionResult.data.active !== false,
            startedAt: subscriptionResult.data.started_at ?? null,
            expiresAt: subscriptionResult.data.expires_at ?? null,
            amountCents: Number(subscriptionResult.data.amount_cents ?? 0),
          }
        : null;

      const linkedEntities = buildLinkedEntities({
        business: businessResult.data as RawRecord | null,
        professional: professionalResult.data as RawRecord | null,
        driver: driverData.data as RawRecord | null,
      });

      const members = ((membersResult.data as RawRecord[]) ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: normalizeText(row.role) ?? "member",
        joinedAt: row.joined_at ?? row.created_at ?? null,
        invitedBy: row.invited_by ?? null,
      }));

      const siblingProfiles = ((siblingProfilesData.data as RawRecord[]) ?? []).map((row) => ({
        id: row.id,
        name: normalizeText(row.name) ?? "Perfil sem nome",
        username: normalizeText(row.username),
        profileType: normalizeText(row.profile_type) ?? "personal",
        isPublic: resolveProfileVisibility(row),
        isActive: row.is_active !== false,
        isSuspended: resolveProfileSuspended(row),
      }));

      const listRecord = buildIdentityRecord({
        profile,
        roles: roles.map((role) => role.role),
        subscription: subscriptionResult.data as RawRecord | null,
        accountProfileCount: siblingProfiles.length || 1,
        usernameHistoryCount: usernameHistory.length,
        memberCount: members.length,
        linkedEntities,
        hasNotificationSettings: Boolean(notificationSettingsResult),
      });
      const preferenceScopes = buildPreferenceScopes({
        profile,
        linkedEntities,
        notificationSettings: notificationSettingsResult,
      });
      const reputationSources = buildReputationSources({
        profile,
        linkedEntities,
        effectiveContext,
        driverReputation: driverReputationMap.get(profileId),
        businessReviews: reviewAggregateMaps.businessReviewMap.get(profileId) ?? null,
        professionalReviews:
          reviewAggregateMaps.professionalReviewMap.get(profileId) ?? null,
      });
      const permissionGovernance = await loadPermissionGovernance({
        profileId,
        roles,
        members,
        effectiveContext,
      });

      return {
        profile: listRecord,
        auth,
        roles,
        subscription,
        usernameHistory,
        members,
        linkedEntities,
        siblingProfiles,
        notificationSettings: notificationSettingsResult,
        effectiveContext,
        preferenceScopes,
        reputationSources,
        residence: buildResidenceSummary(primaryResidenceMap.get(userId) ?? null),
        family,
        permissionGovernance,
      };
    } catch (error) {
      logger.error("AdminProfileGovernanceService.getProfileDetail", error);
      return null;
    }
  }
}

export const adminProfileGovernanceService = new AdminProfileGovernanceService();
