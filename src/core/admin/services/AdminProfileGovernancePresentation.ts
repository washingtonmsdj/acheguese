import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";
import {
  buildIdentityIssues,
  normalizeBoolean,
  normalizeNumber,
  normalizeText,
  requiredText,
  resolveProfileSuspended,
  resolveProfileVerified,
  resolveProfileVisibility,
} from "./AdminProfileGovernanceUtils";
import type {
  AdminProfileIdentityEffectiveContext,
  AdminProfileIdentityRecord,
  AdminProfileLinkedEntitySummary,
  AdminProfilePreferenceFieldSummary,
  AdminProfilePreferenceScope,
  AdminProfilePreferenceScopeSummary,
  AdminProfileReputationSourceSummary,
  AdminProfileResidenceSummary,
  RawRecord,
} from "./AdminProfileGovernanceTypes";
import type { ReviewAggregateSummary } from "./AdminProfileGovernanceReviewTypes";

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
    profileType === "driver" || linkedEntities.some((entity) => entity.kind === "driver");
  const supportsBusinessLinks = profileType === "business" || profileType === "professional";
  const supportsProfessionalLinks = profileType === "professional";

  return [
    createPreferenceScope({
      scope: "public_profile",
      label: "Perfil publico",
      fields: [
        createPreferenceField({ key: "is_public", label: "Perfil publico", value: profile.is_public }),
        createPreferenceField({
          key: "show_contact_email",
          label: "Email publico",
          value: profile.show_contact_email,
        }),
        createPreferenceField({ key: "show_phone", label: "Telefone publico", value: profile.show_phone }),
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
    typeof row.verification_requested_at === "string" ? row.verification_requested_at : null;
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
    status: isVerified ? "verified" : verificationRequestedAt ? "pending_verification" : "unverified",
  };
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
    effectiveContext?.reputation.level ? `nivel ${effectiveContext.reputation.level}` : null,
    typeof effectiveContext?.reputation.rank === "number"
      ? `rank ${effectiveContext.reputation.rank}`
      : null,
  ].filter(Boolean) as string[];
  const passengerScore = normalizeNumber(profile.passenger_rating);
  const passengerCompletedRides = Number(profile.passenger_completed_rides ?? 0);
  const passengerTrustLevel = normalizeText(profile.passenger_trust_level);
  const hasPassengerSignal =
    passengerScore !== null || passengerCompletedRides > 0 || passengerTrustLevel !== null;
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
      status: hasPassengerSignal ? "historical" : "missing",
      score: passengerScore,
      volume: passengerCompletedRides,
      visibility: resolveReputationVisibility(profile.show_passenger_rating_public, "private"),
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
      notes: businessReviewCount > 0 ? [`${businessReviewCount} review(s)`] : [],
    },
    {
      origin: "professional_reviews",
      label: "Reviews profissionais",
      status: professionalReviewCount > 0 ? "derived" : "missing",
      score: professionalReviews?.average ?? null,
      volume: professionalReviewCount,
      visibility: "public",
      notes: professionalReviewCount > 0 ? [`${professionalReviewCount} review(s)`] : [],
    },
  ];
}

export function countTrackedReputationOrigins(
  sources: AdminProfileReputationSourceSummary[],
): number {
  return sources.filter(
    (source) => source.origin !== "profile_aggregate" && source.status !== "missing",
  ).length;
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
