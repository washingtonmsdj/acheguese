import { supabase } from "@/integrations/supabase";
import { AuthorizationEngine } from "@/core/authorization/services/AuthorizationEngine";
import { FamilyService, FAMILY_TABLES } from "@/core/family";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import { adminNotificationsService } from "./AdminNotificationsService";
import {
  createCountMap,
  normalizeText,
  unique,
} from "./AdminProfileGovernanceUtils";
import type {
  AdminProfileFamilySummary,
  AdminProfileIdentityEffectiveContext,
  AdminProfileIdentityMemberSummary,
  AdminProfileIdentityRoleSummary,
  AdminProfilePermissionGovernanceSummary,
  RawRecord,
} from "./AdminProfileGovernanceTypes";
import type { ReviewAggregateSummary } from "./AdminProfileGovernanceReviewTypes";

export async function loadRolesByUserId(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();

  const map = new Map<string, string[]>();

  try {
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
      }),
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
      }),
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

  const [businessResult, professionalResult] = await Promise.all([
    supabase.from("business_data").select("*").in("profile_id", profileIds),
    supabase.from("professional_data").select("*").in("profile_id", profileIds),
  ]);

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
    }),
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
    driverMap,
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
    const summary = await FamilyService.getCoverageSummaryByUserId(userId, supabase as any);
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
      notes: hasAnyFamilyRecord ? [] : ["sem vinculos familiares registrados no agregado atual"],
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

    logger.error("AdminProfileGovernanceService.loadFamilySummary", error, { userId });
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
