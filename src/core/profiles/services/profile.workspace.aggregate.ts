import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type {
  ProfileContext,
  ProfilePrivateWorkspace,
  ProfileRow as Profile,
} from "./types";
import type { ProfileActivityStats } from "./ProfileOperationTypes";
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

const MVP_DISABLED_ENTITLEMENTS = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseCustomQRCode: false,
  canReceiveInternalOrders: false,
  canUseOrdersPanel: false,
  canUseMotoboyNetwork: false,
  canRequestDelivery: false,
  canTrackDelivery: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canUseOwnDelivery: false,
} as const;

async function optionalWorkspaceRead<T>(
  label: string,
  read: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    logger.warn("[profile-workspace] optional read failed", { label, error });
    return fallback;
  }
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

    const [
      profileContext,
      profiles,
      roles,
      verification,
      notificationStats,
      recentNotifications,
    ] = await Promise.all([
      optionalWorkspaceRead(
        "profile-context",
        () => deps.getProfileContext(deps.userId),
        null,
      ),
      optionalWorkspaceRead(
        "profiles",
        () => deps.getProfilesByUserId(deps.userId),
        [activeProfile],
      ),
      optionalWorkspaceRead("roles", () => deps.getUserRoles(deps.userId), []),
      optionalWorkspaceRead(
        "resident-verification",
        async () => {
          const { VerificationService } = await import(
            "@/core/verification/services/VerificationService"
          );
          return VerificationService.getVerification(activeProfile.id, "resident");
        },
        null,
      ),
      optionalWorkspaceRead(
        "notification-stats",
        async () => {
          const { notificationService } = await import(
            "@/core/notifications/services"
          );
          return notificationService.getStats(deps.userId);
        },
        null,
      ),
      optionalWorkspaceRead(
        "notification-feed",
        async () => {
          const { notificationService } = await import(
            "@/core/notifications/services"
          );
          return notificationService.fetchNotifications({ limit: 5 });
        },
        [],
      ),
    ]);

    // Paused domains never participate in the Account critical path.
    const postsCount = 0;
    const likesCount = 0;
    const services: unknown[] = [];
    const classifieds: unknown[] = [];
    const activeRide = null;
    const events: unknown[] = [];
    const alertsCount = 0;
    const issuesCount = 0;
    const rides: unknown[] = [];

    const businesses = mapBusinessRecords(
      await deps.getUserBusinessesByProfiles(
        profiles.length ? profiles.map((profile) => profile.id) : [activeProfile.id],
      ),
    );
    const businessModules = (
      await Promise.all(
        businesses.map(async (business) => {
          try {
            return await buildBusinessModuleSnapshot({
              business,
              planTier: "free",
              subscription: null,
              entitlements: MVP_DISABLED_ENTITLEMENTS,
              gastronomyEligible: false,
              gastronomyProfile: null,
              qrCode: null,
              getCanonicalUrl: (ctx) => BusinessUrlService.getCanonicalUrl(ctx),
              getShareUrl: (ctx) => BusinessUrlService.getShareUrl(ctx),
            });
          } catch (error) {
            logger.warn("[profile-workspace] business snapshot failed", {
              businessId: business.id,
              error,
            });
            return null;
          }
        }),
      )
    ).filter((module): module is NonNullable<typeof module> => module !== null);

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
    const stats: ProfileActivityStats = {
      posts: postsCount || 0,
      likes: likesCount || 0,
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
