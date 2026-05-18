/**
 * Admin profile governance query loaders and mappers.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService, ProfileServiceLegacy } from "@/core/profiles/services/ProfileService";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";
import { AuthorizationEngine } from "@/core/authorization/services/AuthorizationEngine";
import { FamilyService, FAMILY_TABLES } from "@/core/family";
import { adminNotificationsService } from "./AdminNotificationsService";
import {
  buildIdentityIssues,
  buildLinkedEntities,
  createCountMap,
  normalizeBoolean,
  normalizeNumber,
  normalizeText,
  requiredText,
  resolveProfileSuspended,
  resolveProfileVerified,
  resolveProfileVisibility,
  unique,
} from "./AdminProfileGovernanceUtils";
import {
  loadAuthSummary,
  loadEffectiveContext,
} from "./AdminProfileGovernanceAuthLoaders";
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
import type {
  AdminProfileFamilySummary,
  AdminProfileIdentityAuthSummary,
  AdminProfileIdentityEffectiveContext,
  AdminProfileIdentityIssue,
  AdminProfileIdentityMemberSummary,
  AdminProfileIdentityRecord,
  AdminProfileIdentityRoleSummary,
  AdminProfileIdentitySiblingProfile,
  AdminProfileIdentitySubscriptionSummary,
  AdminProfileLinkedEntitySummary,
  AdminProfilePermissionActionSummary,
  AdminProfilePermissionGovernanceSummary,
  AdminProfilePreferenceFieldState,
  AdminProfilePreferenceFieldSummary,
  AdminProfilePreferenceScope,
  AdminProfilePreferenceScopeSummary,
  AdminProfileReputationOrigin,
  AdminProfileReputationSourceSummary,
  AdminProfileReputationStatus,
  AdminProfileResidenceSummary,
  RawRecord,
} from "./AdminProfileGovernanceTypes";

export function createPreferenceField(payload: {
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

export function createPreferenceScope(payload: {
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

export function buildPreferenceScopes(payload: {
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

export function countConfiguredScopes(scopes: AdminProfilePreferenceScopeSummary[]): number {
  return scopes.filter((scope) => scope.status === "configured").length;
}

export function formatResidenceAddress(address?: RawRecord | null): string | null {
  if (!address) return null;

  const parts = [
    normalizeText(address.street),
    normalizeText(address.number),
    normalizeText(address.complement),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

export function buildResidenceSummary(row?: RawRecord | null): AdminProfileResidenceSummary | null {
  if (!row) return null;

  const verificationRequestedAt =
    typeof row.verification_requested_at === "string"
      ? row.verification_requested_at
      : null;
  const isVerified = row.is_verified === true;

  const address = (row.address as RawRecord | null | undefined) ?? null;

  return {
    id: requiredText(row.id, "residence"),
    locationId: requiredText(row.location_id, "unknown-location"),
    locationName: normalizeText((row.location as RawRecord | undefined)?.name),
    addressLine: formatResidenceAddress(address),
    postalCode: normalizeText(address?.postal_code),
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

export function resolveReputationVisibility(
  value: unknown,
  fallback: "public" | "private" | "internal" = "internal",
): "public" | "private" | "internal" {
  const normalized = normalizeBoolean(value);
  if (normalized === true) return "public";
  if (normalized === false) return "private";
  return fallback;
}

export function buildReputationSources(payload: {
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

export function countTrackedReputationOrigins(
  sources: AdminProfileReputationSourceSummary[],
): number {
  return sources.filter(
    (source) =>
      source.origin !== "profile_aggregate" && source.status !== "missing",
  ).length;
}

export async function loadRolesByUserId(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();

  // âœ… SSOT: Usar ProfileService em vez de acesso direto
  const map = new Map<string, string[]>();
  
  try {
    // Carregar roles para cada userId usando o serviÃ§o canÃ´nico
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

export async function loadActiveSubscriptionsByUserId(
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
    const userId = normalizeText(row.user_id);
    if (!userId) continue;
    if (!map.has(userId)) {
      map.set(userId, row);
    }
  }

  return map;
}

export async function loadUserProfileCountMap(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  // âœ… SSOT: Usar ProfileService em vez de acesso direto
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

export async function loadUsernameHistoryCountMap(
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

export async function loadNotificationSettingsUserIds(userIds: string[]): Promise<Set<string>> {
  return adminNotificationsService.getSettingsUserIds(userIds);
}

export async function loadProfileMembersCountMap(
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

export async function loadEntityMaps(profileIds: string[]): Promise<{
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

  // âœ… SSOT: Usar ProfileService.getDriverData para driver_data
  // business_data e professional_data ainda precisam de serviÃ§os canÃ´nicos
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
          driverMap.set(profileId, driverData as RawRecord);
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
      ((businessResult.data as RawRecord[]) ?? [])
        .map((row) => [normalizeText(row.profile_id), row] as const)
        .filter(([profileId]) => Boolean(profileId)) as Array<[string, RawRecord]>,
    ),
    professionalMap: new Map(
      ((professionalResult.data as RawRecord[]) ?? [])
        .map((row) => [normalizeText(row.profile_id), row] as const)
        .filter(([profileId]) => Boolean(profileId)) as Array<[string, RawRecord]>,
    ),
    driverMap, // âœ… SSOT: JÃ¡ carregado usando ProfileService
  };
}

export async function loadDriverReputationMap(
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
    ((data as RawRecord[]) ?? [])
      .map((row) => [normalizeText(row.profile_id), row] as const)
      .filter(([profileId]) => Boolean(profileId)) as Array<[string, RawRecord]>,
  );
}

export async function loadReviewAggregateMap(
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

export async function loadReviewAggregateMaps(profileIds: string[]): Promise<{
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

export async function loadPrimaryResidenceMap(
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
    const userId = normalizeText(row.user_id);
    if (!userId) continue;
    if (!map.has(userId)) {
      map.set(userId, row);
    }
  }

  return map;
}

export async function loadFamilySummary(userId: string): Promise<AdminProfileFamilySummary> {
  try {
    const summary = await FamilyService.getCoverageSummaryByUserId(
      userId,
      supabase as any,
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

export async function loadPermissionGovernance(payload: {
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

export function buildIdentityRecord(payload: {
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
    id: requiredText(profile.id, "unknown-profile"),
    userId: requiredText(profile.user_id, "unknown-user"),
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
    createdAt: normalizeText(profile.created_at),
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

export { loadAuthSummary, loadEffectiveContext };
