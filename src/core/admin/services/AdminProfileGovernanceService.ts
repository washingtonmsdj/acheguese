/**
 * AdminProfileGovernanceService
 *
 * Cobertura administrativa oficial da governanca de identidade de profile.
 * Agrega leitura de identidade publica/privada, plano, roles, preferencias
 * e entidades vinculadas sem espalhar acesso ao banco por pages e hooks.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService, ProfileService } from "@/core/profiles/services/ProfileService";
import { ProfileMembersService } from "@/core/profiles/services/multi-profile/profileMembersService";
import { getProfessionalLinkedEntityByProfileId } from "@/core/professional/services/professional.linked-entity";
import { adminNotificationsService } from "./AdminNotificationsService";
import type {
  AdminProfileIdentityDetail,
  AdminProfileIdentityFilters,
  AdminProfileIdentityListResult,
  AdminProfileIdentityRecord,
  AdminProfileIdentityStats,
  RawRecord,
} from "./AdminProfileGovernanceTypes";
import {
  buildIdentityRecord,
  buildPreferenceScopes,
  buildReputationSources,
  buildResidenceSummary,
  countConfiguredScopes,
  countTrackedReputationOrigins,
  loadActiveSubscriptionsByUserId,
  loadAuthSummary,
  loadDriverReputationMap,
  loadEffectiveContext,
  loadEntityMaps,
  loadFamilySummary,
  loadNotificationSettingsUserIds,
  loadCapabilityPreview,
  loadPrimaryResidenceMap,
  loadProfileMembersCountMap,
  loadReviewAggregateMaps,
  loadRolesByUserId,
  loadUserProfileCountMap,
  loadUsernameHistoryCountMap,
} from "./AdminProfileGovernanceInternals";
import {
  buildLinkedEntities,
  normalizeText,
  requiredText,
  resolveProfileSuspended,
  resolveProfileVisibility,
  unique,
} from "./AdminProfileGovernanceUtils";
export type * from "./AdminProfileGovernanceTypes";
// ✅ Fronteira de camada correta: service importa de contracts/, não de views/



class AdminProfileGovernanceService {
  async getStats(): Promise<AdminProfileIdentityStats> {
    try {
      // ✅ SSOT: Usar profileService para buscar profiles
      const allIds = await profileService.getAllProfileIds() as string[];
      const profiles = await profileService.getAccessibleProfilesByIds(allIds);
      
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
        const profileId = requiredText(profile.id, "");
        const userId = requiredText(profile.user_id, "");
        const username = normalizeText(profile.username);
        const isPublic = resolveProfileVisibility(profile);
        const residence = primaryResidenceMap.get(userId) ?? null;
        const linkedEntities = buildLinkedEntities({
          business: entityMaps.businessMap.get(profileId),
          professional: entityMaps.professionalMap.get(profileId),
          driver: entityMaps.driverMap.get(profileId),
        });
        const preferenceScopes = buildPreferenceScopes({
          profile,
          linkedEntities,
          notificationSettings: notificationSettingsUserIds.has(userId)
            ? { email_notifications: true }
            : null,
        });
        const reputationSources = buildReputationSources({
          profile,
          linkedEntities,
          driverReputation: driverReputationMap.get(profileId),
          businessReviews: reviewAggregateMaps.businessReviewMap.get(profileId) ?? null,
          professionalReviews:
            reviewAggregateMaps.professionalReviewMap.get(profileId) ?? null,
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
          entityMaps.businessMap.has(profileId) ||
          entityMaps.professionalMap.has(profileId) ||
          entityMaps.driverMap.has(profileId)
        ) {
          withLinkedEntities += 1;
        }

        if ((usernameHistoryCountMap.get(profileId) ?? 0) > 0) {
          withUsernameHistory += 1;
        }

        if (notificationSettingsUserIds.has(userId)) {
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
      const profiles = await profileService.getAccessibleProfilesByIds(profileIds);
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
      const profileData = await profileService.getAccessibleProfileById(profileId);
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
        ProfileMembersService.getProfileMembersResult(profileId).then((result) => ({
          data: (result.data ?? []) as unknown as RawRecord[],
          error: result.success
            ? null
            : new Error(result.error ?? "Failed to fetch profile members"),
        })),
        // ✅ SSOT: Usar profileService.getProfilesByUserId
        profileService.getProfilesByUserId(userId).then((data: unknown[]) => ({ data, error: null })),
        supabase.from("business_data").select("*").eq("profile_id", profileId).maybeSingle(),
        getProfessionalLinkedEntityByProfileId(profileId),
        // ✅ SSOT: Usar profileService.getDriverData
        profileService.getDriverData(profileId).then((data: unknown) => ({ data, error: null })),
        adminNotificationsService.getUserSettings(userId),
        ProfileService.getUsernameHistory(profileId),
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
      
      const roles = ((rolesData.data as RawRecord[]) ?? []).map((row) => ({
        id: typeof row === 'string' ? row : requiredText(row.id, "role"),
        role: typeof row === 'string' ? row : (normalizeText(row.role) ?? "member"),
        isActive: typeof row === 'string' ? true : (row.is_active !== false),
        grantedAt: typeof row === 'string' ? null : normalizeText(row.granted_at),
        expiresAt: typeof row === 'string' ? null : normalizeText(row.expires_at),
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
        id: requiredText(row.id, "member"),
        userId: requiredText(row.user_id, "unknown-user"),
        role: normalizeText(row.role) ?? "member",
        joinedAt: normalizeText(row.joined_at) ?? normalizeText(row.created_at),
        invitedBy: normalizeText(row.invited_by),
      }));

      const siblingProfiles = ((siblingProfilesData.data as RawRecord[]) ?? []).map((row) => ({
        id: requiredText(row.id, "sibling"),
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
      const capabilityPreview = await loadCapabilityPreview({
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
        capabilityPreview,
      };
    } catch (error) {
      logger.error("AdminProfileGovernanceService.getProfileDetail", error);
      return null;
    }
  }
}

export const adminProfileGovernanceService = new AdminProfileGovernanceService();