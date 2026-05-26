import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { getFavoriteStats } from "@/core/favorites/services";
import { getServicesByProfile } from "@/core/professional/services/professional.queries";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { getEligibleVerticals } from "@/core/verticals/config";
import type {
  Profile,
  ProfileContext,
  ProfilePrivateWorkspace,
  ProfileStats,
} from "./types";
import type { ProfilePermissions } from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type { BusinessRow } from "./profile.service.types";
import { mapBusinessRecords, resolveVerificationStatus } from "./profile.service.rules";
import {
  buildPermissionMatrix,
  buildManagedAssets,
  buildWorkspaceOperations,
  countActiveRides,
  mapRecentNotifications,
  normalizeNotificationPayload,
} from "./profile.workspace.rules";
import { buildBusinessModuleSnapshot } from "./profile.workspace.business-modules";

interface PrivateWorkspaceDependencies {
  userId: string;
  getActiveProfile: (userId: string) => Promise<Profile | null>;
  getProfileContext: (userId: string) => Promise<ProfileContext | null>;
  getProfilesByUserId: (userId: string) => Promise<Profile[]>;
  getUserRoles: (userId: string) => Promise<string[]>;
  getUserLikesCount: (profileId: string) => Promise<number>;
  getUserBusinessesByProfiles: (profileIds: string[]) => Promise<BusinessRow[]>;
  resolvePermissions: (profileContext: ProfileContext | null) => ProfilePermissions;
}

async function getGastronomyProfileByBusinessId(businessId: string): Promise<{
  cuisine_type?: string | null;
  delivery_enabled?: boolean | null;
  dine_in_enabled?: boolean | null;
  takeout_enabled?: boolean | null;
} | null> {
  const { data, error } = await supabase
    .from("gastronomy_profiles")
    .select("cuisine_type, delivery_enabled, dine_in_enabled, takeout_enabled")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data || null) as
    | {
        cuisine_type?: string | null;
        delivery_enabled?: boolean | null;
        dine_in_enabled?: boolean | null;
        takeout_enabled?: boolean | null;
      }
    | null;
}

export async function getPrivateWorkspaceAggregate(
  deps: PrivateWorkspaceDependencies,
): Promise<ProfilePrivateWorkspace> {
  const emptyWorkspace: ProfilePrivateWorkspace = {
    profile: null,
    context: null,
    identity: null,
    account: {
      accountState: "inactive",
      isBlocked: false,
      isSuspended: false,
      verificationStatus: "not_requested",
    },
    stats: {
      posts: 0,
      likes: 0,
      favorites: 0,
      businesses: 0,
    },
    operations: {
      managedProfiles: 0,
      businesses: 0,
      services: 0,
      classifieds: 0,
      posts: 0,
      events: 0,
      alerts: 0,
      issues: 0,
      favoritesGiven: 0,
      favoritesReceived: 0,
      notificationsTotal: 0,
      notificationsUnread: 0,
      ridesTotal: 0,
      activeRides: 0,
    },
    managedAssets: [],
    notifications: {
      total: 0,
      unread: 0,
      highPriority: 0,
      urgentPriority: 0,
      recent: [],
    },
    roles: [],
    businesses: [],
    businessModules: [],
    activeRide: null,
    hasActiveRide: false,
    verificationStatus: "not_requested",
  };

  try {
    const activeProfile = await deps.getActiveProfile(deps.userId);
    if (!activeProfile) {
      return emptyWorkspace;
    }

    const { postService } = await import("@/core/posts/services");
    const { mobilityService, MobilityService } = await import("@/core/mobility/services/runtime");
    const { VerificationService } = await import(
      "@/core/verification/services/VerificationService"
    );
    const { getUserClassifieds } = await import("@/core/classifieds/services");
    const { eventService } = await import(
      "@/core/community/services/CommunityEventsRuntimeService"
    );
    const { communityAlertService } = await import("@/core/community/alerts");
    const { communityIssueService } = await import(
      "@/core/community/issues/services/CommunityIssueService"
    );
    const { notificationService } = await import("@/core/notifications/services");

    const profileContextPromise = deps.getProfileContext(deps.userId);
    const profilesPromise = deps.getProfilesByUserId(deps.userId);
    const rolesPromise = deps.getUserRoles(deps.userId);
    const postsPromise = postService.getPostsCountByProfile(activeProfile.id).catch(() => 0);
    const likesPromise = deps.getUserLikesCount(activeProfile.id);
    const favoritesPromise = getFavoriteStats(activeProfile.id);
    const activeRidePromise = MobilityService.getActiveRide(activeProfile.id).catch(() => null);
    const verificationPromise = VerificationService.getVerification(
      activeProfile.id,
      "resident",
    );
    const servicesPromise = getServicesByProfile(activeProfile.id).catch(() => []);
    const classifiedsPromise = getUserClassifieds(activeProfile.id).catch(() => []);
    const eventsPromise = eventService
      .getEventsByOrganizerProfile(activeProfile.id, 20)
      .catch(() => []);
    const alertsCountPromise = communityAlertService.getCountByProfile(activeProfile.id).catch(() => 0);
    const issuesCountPromise = communityIssueService.getCountByProfile(activeProfile.id).catch(() => 0);
    const notificationStatsPromise = notificationService.getStats(deps.userId).catch(() => null);
    const notificationFeedPromise = notificationService
      .fetchNotifications(deps.userId, { limit: 5 })
      .catch(() => []);
    const ridesPromise = mobilityService.getUserRides(deps.userId).catch(() => []);

    const [
      profileContext,
      profiles,
      roles,
      postsCount,
      likesCount,
      favoritesResult,
      activeRide,
      verification,
      services,
      classifieds,
      events,
      alertsCount,
      issuesCount,
      notificationStats,
      recentNotifications,
      rides,
    ] = await Promise.all([
      profileContextPromise,
      profilesPromise,
      rolesPromise,
      postsPromise,
      likesPromise,
      favoritesPromise,
      activeRidePromise,
      verificationPromise,
      servicesPromise,
      classifiedsPromise,
      eventsPromise,
      alertsCountPromise,
      issuesCountPromise,
      notificationStatsPromise,
      notificationFeedPromise,
      ridesPromise,
    ]);

    const businesses = mapBusinessRecords(
      await deps.getUserBusinessesByProfiles(
        profiles.length ? profiles.map((profile) => profile.id) : [activeProfile.id],
      ),
    );
    const businessModules = await Promise.all(
      businesses.map(async (business) => {
        const [
          { SubscriptionService, EntitlementsService, PlanTier },
          { QrCodeService },
          { QrEntityType },
        ] = await Promise.all([
          import("@/core/billing"),
          import("@/core/qr"),
          import("@/core/qr/types"),
        ]);

        const [subscriptionResult, gastronomyResult, qrCodeResult] = await Promise.all([
          SubscriptionService.getByBusinessId(business.id),
          getGastronomyProfileByBusinessId(business.id),
          QrCodeService.getByEntity(QrEntityType.BUSINESS, business.id),
        ]);

        const subscription = subscriptionResult.data;
        const gastronomyProfile = gastronomyResult;
        const qrCode = qrCodeResult.data;
        const planTier = subscription?.plan_tier ?? PlanTier.FREE;
        const entitlements = EntitlementsService.getAll(planTier);
        const gastronomyEligible = Boolean(
          business.category && getEligibleVerticals(business.category as never).length > 0,
        );
        return buildBusinessModuleSnapshot({
          business,
          planTier,
          subscription,
          entitlements,
          gastronomyEligible,
          gastronomyProfile,
          qrCode,
          getCanonicalUrl: BusinessUrlService.getCanonicalUrl,
          getShareUrl: BusinessUrlService.getShareUrl,
        });
      }),
    );

    const activeRideStatuses = new Set([
      "pending",
      "requested",
      "searching_driver",
      "driver_assigned",
      "driver_accepted",
      "driver_on_the_way",
      "driver_arrived",
      "passenger_on_board",
      "in_progress",
    ]);

    const ridesList = Array.isArray(rides) ? rides : [];
    const activeRidesFromHistory = countActiveRides(ridesList, activeRideStatuses);

    const notificationPayload = normalizeNotificationPayload(notificationStats);

    const profileStatus = profileContext?.status || {
      isActive: Boolean(activeProfile.is_active),
      isBlocked: false,
      isSuspended: Boolean(activeProfile.is_suspended),
      suspendedAt: activeProfile.suspended_at,
      suspensionReason: activeProfile.suspension_reason,
      suspendedUntil: activeProfile.suspended_until,
    };

    const profilePlan = profileContext?.plan || {
      type: "basic",
      isPremium: false,
    };

    const profileReputation = profileContext?.reputation || {
      level: Math.floor((activeProfile.reputation || 0) / 100) + 1,
      score: activeProfile.reputation || 0,
    };

    const permissions = deps.resolvePermissions(profileContext);

    const permissionMatrix = buildPermissionMatrix(permissions);

    let territoryLabel: string | null = null;
    if (activeProfile.location_id) {
      const { data: locationRow } = await supabase
        .from("locations")
        .select("full_name")
        .eq("id", activeProfile.location_id)
        .maybeSingle();
      territoryLabel =
        typeof locationRow?.full_name === "string" && locationRow.full_name.trim().length > 0
          ? locationRow.full_name
          : null;
    }

    const verificationSummary = resolveVerificationStatus(verification);
    const stats: ProfileStats = {
      posts: postsCount || 0,
      likes: likesCount || 0,
      favorites: favoritesResult.total_favorites_given || 0,
      businesses: businesses.length,
    };

    const managedAssets = buildManagedAssets({
      businesses,
      services: services as Array<{
        id: string;
        name?: string;
        updated_at?: string;
        is_accepting_clients?: boolean;
      }>,
      classifieds: classifieds as Array<{
        id: string;
        title?: string;
        updated_at?: string;
        is_active?: boolean;
      }>,
      events: events as Array<{ id: string; title?: string; status?: string; updated_at?: string }>,
    });

    const operations = buildWorkspaceOperations({
      profilesCount: profiles.length,
      businessesCount: businesses.length,
      servicesCount: Array.isArray(services) ? services.length : 0,
      classifiedsCount: Array.isArray(classifieds) ? classifieds.length : 0,
      postsCount: postsCount || 0,
      eventsCount: Array.isArray(events) ? events.length : 0,
      alertsCount: alertsCount || 0,
      issuesCount: issuesCount || 0,
      favoritesGiven: favoritesResult.total_favorites_given || 0,
      favoritesReceived: favoritesResult.total_favorites_received || 0,
      notificationsTotal: notificationPayload.total,
      notificationsUnread: notificationPayload.unread,
      ridesTotal: ridesList.length,
      activeRides: Math.max(activeRidesFromHistory, activeRide ? 1 : 0),
    });

    return {
      profile: activeProfile,
      context: profileContext,
      identity: {
        profileId: activeProfile.id,
        profileType: activeProfile.profile_type,
        displayName: activeProfile.display_name || activeProfile.name,
        username: activeProfile.username || "",
        isPublic: activeProfile.is_public !== false,
        verified: profileContext?.verified || Boolean(activeProfile.verified),
        territoryLabel,
        locationId: activeProfile.location_id,
        status: profileStatus,
        plan: profilePlan,
        reputation: profileReputation,
        permissions: permissionMatrix,
      },
      account: {
        accountState: profileStatus.isBlocked
          ? "blocked"
          : profileStatus.isSuspended
            ? "suspended"
            : profileStatus.isActive
              ? "active"
              : "inactive",
        isBlocked: profileStatus.isBlocked,
        isSuspended: profileStatus.isSuspended,
        suspendedAt: profileStatus.suspendedAt,
        suspendedUntil: profileStatus.suspendedUntil,
        suspensionReason: profileStatus.suspensionReason,
        verificationStatus: verificationSummary.status,
        verificationRejectionReason: verificationSummary.rejectionReason,
      },
      stats,
      operations,
      managedAssets,
      notifications: {
        total: notificationPayload.total,
        unread: notificationPayload.unread,
        highPriority: notificationPayload.by_priority.high || 0,
        urgentPriority: notificationPayload.by_priority.urgent || 0,
        recent: mapRecentNotifications(
          recentNotifications as Array<{
            id: string;
            type?: string;
            title?: string;
            priority?: "low" | "medium" | "high" | "urgent";
            read?: boolean;
            created_at?: string;
          }>,
        ),
      },
      roles,
      businesses,
      businessModules,
      activeRide: activeRide || null,
      hasActiveRide: Boolean(activeRide),
      verificationStatus: verificationSummary.status,
      verificationRejectionReason: verificationSummary.rejectionReason,
    };
  } catch (error) {
    logger.error("Error in getPrivateWorkspaceAggregate:", error);
    return emptyWorkspace;
  }
}
