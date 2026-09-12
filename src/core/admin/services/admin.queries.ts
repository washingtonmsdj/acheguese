/**
 * Admin Queries - SSOT v2.0
 *
 * Operações de leitura para o módulo administrativo.
 * Não contém mutações.
 */

import {
  adminCommunityAlertsService,
  adminCommunityIssuesService,
  adminNotificationsService,
} from "@/core/admin";
import { adminClassifiedsService } from "@/core/admin/services/AdminClassifiedsService";
import { AdminDriverModerationService } from "@/core/admin/services/AdminDriverModerationService";
import { AdminDriverPresenceReadService } from "@/core/admin/services/AdminDriverPresenceReadService";
import { adminMobilityService } from "@/core/admin/services/AdminMobilityService";
import { adminStatsService } from "@/core/admin/services/AdminStatsService";
import {
  LEGACY_RIDE_STATUS_ALIASES,
  QUERYABLE_CLOSED_RIDE_STATUSES,
  QUERYABLE_OPEN_RIDE_STATUSES,
} from "@/core/mobility/core/RideLifecycleStatus";
import { RIDE_STATE } from "@/core/mobility/core/RideStateMachine";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import type {
  ActiveRide,
  AdminModuleCoverage,
  AdminOperationalHealth,
  AdminOperationalOverview,
  OnlineDriver,
  RealtimeMetrics,
  ReputationStats,
} from "./types";

type RawRecord = Record<string, unknown>;

const ACTIVE_RIDE_STATUS_SET = new Set<string>(QUERYABLE_OPEN_RIDE_STATUSES);
const CLOSED_RIDE_STATUS_SET = new Set<string>(QUERYABLE_CLOSED_RIDE_STATUSES);
const AWAITING_DRIVER_TARGET_STATES = new Set<string>([
  RIDE_STATE.REQUESTED,
  RIDE_STATE.SEARCHING_DRIVER,
  RIDE_STATE.DRIVER_ASSIGNED,
]);
const AWAITING_DRIVER_STATUS_SET = new Set<string>([
  ...AWAITING_DRIVER_TARGET_STATES,
  ...Object.entries(LEGACY_RIDE_STATUS_ALIASES)
    .filter(([, canonical]) => AWAITING_DRIVER_TARGET_STATES.has(canonical))
    .map(([legacy]) => legacy),
]);

function getNumeric(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function isTruthy(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

function calcStatus(count: number, pendingCount: number): AdminOperationalHealth {
  if (count <= 0) {
    return "inactive";
  }

  if (pendingCount > Math.max(5, Math.ceil(count * 0.2))) {
    return "attention";
  }

  return "healthy";
}

function toOnlineDriver(raw: RawRecord): OnlineDriver {
  const id = getString(raw.profile_id) || getString(raw.id);
  const rating = getNumeric(raw.avg_rating, getNumeric(raw.rating, 0));
  const totalRides = getNumeric(raw.total_rides, 0);

  return {
    id,
    name: getString(raw.display_name) || getString(raw.name) || "Motorista",
    avatar_url: getString(raw.avatar_url) || undefined,
    vehicle_model: getString(raw.vehicle_model) || undefined,
    vehicle_plate: getString(raw.vehicle_plate) || undefined,
    rating: Number(rating.toFixed(2)),
    total_rides: totalRides,
    last_location_update:
      getString(raw.last_location_update) || getString(raw.last_seen_at) || undefined,
    is_available: raw.is_available === true,
    current_ride_id: getString(raw.current_ride_id) || undefined,
  };
}

function toActiveRide(raw: RawRecord, namesByProfileId: Map<string, string>): ActiveRide {
  const passengerProfileId = getString(raw.passenger_profile_id);
  const driverProfileId = getString(raw.driver_profile_id);

  return {
    id: getString(raw.id),
    status: getString(raw.status, RIDE_STATE.REQUESTED),
    passenger_name: namesByProfileId.get(passengerProfileId) || "Passageiro",
    driver_name: namesByProfileId.get(driverProfileId) || "Aguardando motorista",
    origin:
      getString(raw.origin) ||
      getString(raw.pickup_location_name) ||
      getString(raw.pickup_address) ||
      "Origem não informada",
    destination:
      getString(raw.destination) ||
      getString(raw.dropoff_location_name) ||
      getString(raw.dropoff_address) ||
      "Destino não informado",
    created_at: getString(raw.created_at),
    estimated_duration: getNumeric(raw.estimated_duration, 0) || undefined,
    current_price: getNumeric(
      raw.current_price,
      getNumeric(raw.final_price, getNumeric(raw.suggested_price, 0)),
    ),
  };
}

async function getProfileNames(profileIds: string[]): Promise<Map<string, string>> {
  if (profileIds.length === 0) {
    return new Map();
  }

  try {
    const summaries = await profileService.getProfilesSummary(profileIds);
    return new Map(
      summaries.map((profile) => [profile.id, profile.displayName || "Perfil"]),
    );
  } catch (error) {
    logger.error("admin.queries.getProfileNames", error as Error);
    return new Map();
  }
}

function getSystemHealth(metrics: {
  driversOnline: number;
  ridesPending: number;
  completionRate: number;
  resolvedRides: number;
}): RealtimeMetrics["systemHealth"] {
  if (metrics.driversOnline === 0 && metrics.ridesPending > 0) {
    return "critical";
  }

  if (metrics.ridesPending > Math.max(10, metrics.driversOnline * 2)) {
    return "warning";
  }

  if (metrics.resolvedRides > 10 && metrics.completionRate < 60) {
    return "warning";
  }

  return "healthy";
}

/**
 * Driver response latency is an event/lifecycle metric, not a driver-profile fact.
 * Dispatch writes driver_assigned_at when the offer is assigned and acceptance
 * writes driver_accepted_at. Missing or inverted timestamps are excluded rather
 * than converted into a fake zero-minute response.
 */
function getAverageDriverResponseTimeMinutes(rides: RawRecord[]): number | null {
  const samples = rides.flatMap((ride) => {
    const assignedAt = Date.parse(getString(ride.driver_assigned_at));
    const acceptedAt = Date.parse(getString(ride.driver_accepted_at));

    if (
      !Number.isFinite(assignedAt) ||
      !Number.isFinite(acceptedAt) ||
      acceptedAt < assignedAt
    ) {
      return [];
    }

    return [(acceptedAt - assignedAt) / 60_000];
  });

  if (samples.length === 0) return null;

  const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  return Number(average.toFixed(1));
}

/**
 * Snapshot operacional em tempo real.
 */
export async function getRealtimeMetrics(): Promise<{
  metrics: RealtimeMetrics;
  activeRides: ActiveRide[];
  onlineDrivers: OnlineDriver[];
}> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const startOfMonth = new Date(now);
  startOfMonth.setDate(startOfMonth.getDate() - 30);

  try {
    const [allRidesRaw, allDriversRaw, onlinePresence] = await Promise.all([
      adminMobilityService.getAllRides(),
      adminMobilityService.getAllDriversComplete(),
      AdminDriverPresenceReadService.listOnline(),
    ]);

    const rides = (allRidesRaw as unknown as RawRecord[]) || [];
    const allDrivers = (allDriversRaw as RawRecord[]) || [];
    const driverByProfileId = new Map(
      allDrivers.map((driver) => [
        getString(driver.profile_id) || getString(driver.id),
        driver,
      ]),
    );
    const onlineDrivers = onlinePresence.map((presence) =>
      toOnlineDriver({
        ...(driverByProfileId.get(presence.profile_id) ?? {}),
        profile_id: presence.profile_id,
        is_available: presence.is_available,
        last_location_update: presence.last_location_update,
        last_seen_at: presence.last_seen_at,
        current_ride_id: presence.active_ride_id,
      }),
    );

    const activeRidesRaw = rides.filter((ride) =>
      ACTIVE_RIDE_STATUS_SET.has(getString(ride.status).toLowerCase()),
    );

    const profileIds = [
      ...new Set(
        activeRidesRaw
          .flatMap((ride) => [
            getString(ride.passenger_profile_id),
            getString(ride.driver_profile_id),
          ])
          .filter(Boolean),
      ),
    ];

    const namesByProfileId = await getProfileNames(profileIds);
    const activeRides = activeRidesRaw.map((ride) => toActiveRide(ride, namesByProfileId));

    const ridesPending = rides.filter((ride) =>
      AWAITING_DRIVER_STATUS_SET.has(getString(ride.status).toLowerCase()),
    ).length;

    const ridesCompleted = rides.filter(
      (ride) => getString(ride.status).toLowerCase() === RIDE_STATE.COMPLETED,
    );
    const resolvedRidesCount = rides.filter((ride) =>
      CLOSED_RIDE_STATUS_SET.has(getString(ride.status).toLowerCase()),
    ).length;

    const ridesToday = rides.filter((ride) => {
      const createdAt = Date.parse(getString(ride.created_at));
      return Number.isFinite(createdAt) && createdAt >= startOfToday.getTime();
    }).length;

    const getCompletedValue = (startDate: Date) =>
      ridesCompleted
        .filter((ride) => {
          const completedAtRaw =
            getString(ride.completed_at) ||
            getString(ride.updated_at) ||
            getString(ride.created_at);
          const completedAt = Date.parse(completedAtRaw);
          return Number.isFinite(completedAt) && completedAt >= startDate.getTime();
        })
        .reduce(
          (sum, ride) =>
            sum + getNumeric(ride.final_price, getNumeric(ride.actual_fare, 0)),
          0,
        );

    const completedCount = ridesCompleted.length;
    const completionRate =
      resolvedRidesCount > 0
        ? Number(((completedCount / resolvedRidesCount) * 100).toFixed(1))
        : 0;

    const avgRating =
      allDrivers.length > 0
        ? Number(
            (
              allDrivers.reduce(
                (sum, driver) =>
                  sum +
                  getNumeric(
                    (driver as RawRecord).avg_rating,
                    getNumeric((driver as RawRecord).rating, 0),
                  ),
                0,
              ) / allDrivers.length
            ).toFixed(2),
          )
        : 0;

    const avgResponseTime = getAverageDriverResponseTimeMinutes(rides);
    const driversVerified = allDrivers.filter((driver) =>
      isTruthy((driver as RawRecord).is_verified),
    ).length;
    const driversTotal = allDrivers.length;
    const driversOnline = onlinePresence.length;
    const driversPending = Math.max(driversTotal - driversVerified, 0);

    const systemHealth = getSystemHealth({
      driversOnline,
      ridesPending,
      completionRate,
      resolvedRides: resolvedRidesCount,
    });

    return {
      metrics: {
        driversOnline,
        driversTotal,
        driversVerified,
        driversPending,
        ridesActive: activeRides.length,
        ridesPending,
        ridesToday,
        ridesCompleted: completedCount,
        completedValueToday: getCompletedValue(startOfToday),
        completedValueWeek: getCompletedValue(startOfWeek),
        completedValueMonth: getCompletedValue(startOfMonth),
        avgResponseTime,
        avgRating,
        completionRate,
        lastUpdate: now.toISOString(),
        systemHealth,
      },
      activeRides,
      onlineDrivers,
    };
  } catch (error) {
    logger.error("admin.queries.getRealtimeMetrics", error as Error);

    return {
      metrics: {
        driversOnline: 0,
        driversTotal: 0,
        driversVerified: 0,
        driversPending: 0,
        ridesActive: 0,
        ridesPending: 0,
        ridesToday: 0,
        ridesCompleted: 0,
        completedValueToday: 0,
        completedValueWeek: 0,
        completedValueMonth: 0,
        avgResponseTime: null,
        avgRating: 0,
        completionRate: 0,
        lastUpdate: now.toISOString(),
        systemHealth: "warning",
      },
      activeRides: [],
      onlineDrivers: [],
    };
  }
}

/**
 * Estatísticas agregadas de reputação para administração.
 */
export async function getReputationStats(): Promise<ReputationStats> {
  try {
    const [driversWithStats, verifiedProfiles, profilesTotal] = await Promise.all([
      adminMobilityService.getDriversWithStats(),
      profileService.getAdminProfilesList({ verified: true, limit: 2000 }),
      profileService.getTotalProfilesCount(),
    ]);

    const totalDrivers = driversWithStats.length;
    const avgDriverRating =
      totalDrivers > 0
        ? Number(
            (
              driversWithStats.reduce((sum, driver) => sum + (driver.rating || 0), 0) /
              totalDrivers
            ).toFixed(2),
          )
        : 0;

    const moderationRows = await AdminDriverModerationService.getModerationRows(
      driversWithStats.map((driver) => driver.profile_id),
    );
    const suspendedDrivers = [...moderationRows.values()].filter(
      (row) => row.is_suspended === true,
    ).length;

    const trustedPassengers = verifiedProfiles.length;
    const totalPassengers = Math.max(profilesTotal - totalDrivers, 0);

    return {
      totalPassengers,
      avgPassengerRating: 0,
      totalDrivers,
      avgDriverRating,
      trustedPassengers,
      suspendedDrivers,
    };
  } catch (error) {
    logger.error("admin.queries.getReputationStats", error as Error);
    return {
      totalPassengers: 0,
      avgPassengerRating: 0,
      totalDrivers: 0,
      avgDriverRating: 0,
      trustedPassengers: 0,
      suspendedDrivers: 0,
    };
  }
}

/**
 * Subscription simples para atualização de métricas.
 */
export function subscribeToMetrics(callback: () => void): () => void {
  const interval = globalThis.setInterval(() => {
    callback();
  }, 30000);

  return () => {
    globalThis.clearInterval(interval);
  };
}

function moduleCoverage(
  key: string,
  label: string,
  route: string,
  count: number,
  pendingCount: number,
  source: string,
): AdminModuleCoverage {
  return {
    key,
    label,
    route,
    count,
    pendingCount,
    status: calcStatus(count, pendingCount),
    source,
  };
}

/**
 * Visão consolidada operacional para dashboard/admin analytics.
 */
export async function getOperationalOverview(
  windowDays = 30,
): Promise<AdminOperationalOverview> {
  try {
    const [
      statsWithTrends,
      activity,
      recentActivity,
      alertStats,
      issueStats,
      notificationStats,
      pendingClassifiedReports,
      realtimeSnapshot,
    ] = await Promise.all([
      adminStatsService.getTableStatsWithTrends(windowDays),
      adminStatsService.getActivity(windowDays),
      adminStatsService.getRecentActivity(20),
      adminCommunityAlertsService.getStats(),
      adminCommunityIssuesService.getStats(),
      adminNotificationsService.getStats(),
      adminClassifiedsService.getPendingReportsCount(),
      getRealtimeMetrics(),
    ]);

    const stats = {
      profiles: statsWithTrends.stats.profiles ?? 0,
      businesses: statsWithTrends.stats.businesses ?? 0,
      professionals: statsWithTrends.stats.professionals ?? 0,
      classifieds: statsWithTrends.stats.classifieds ?? 0,
      events: statsWithTrends.stats.events ?? 0,
      posts: statsWithTrends.stats.posts ?? 0,
      comments: statsWithTrends.stats.comments ?? 0,
      drivers: statsWithTrends.stats.drivers ?? 0,
      ride_requests: statsWithTrends.stats.ride_requests ?? 0,
    };

    const totalRecords = Object.values(stats).reduce((sum, value) => sum + value, 0);

    const modules: AdminModuleCoverage[] = [
      moduleCoverage(
        "profiles",
        "Perfis e usuários",
        "/admin/usuarios",
        stats.profiles,
        0,
        "profiles + auth",
      ),
      moduleCoverage(
        "businesses",
        "Empresas",
        "/admin/empresas",
        stats.businesses,
        0,
        "business_data",
      ),
      moduleCoverage(
        "professionals",
        "Profissionais e serviços",
        "/admin/servicos",
        stats.professionals,
        0,
        "professional_services",
      ),
      moduleCoverage(
        "classifieds",
        "Classificados",
        "/admin/classificados",
        stats.classifieds,
        pendingClassifiedReports,
        "classifieds + classified_reports",
      ),
      moduleCoverage(
        "community",
        "Comunidade e feed",
        "/admin/moderacao",
        stats.posts + stats.comments,
        0,
        "posts + comments",
      ),
      moduleCoverage(
        "community-alerts",
        "Alertas comunitários",
        "/admin/community-alerts",
        alertStats.total,
        alertStats.underReview,
        "community_alerts",
      ),
      moduleCoverage(
        "community-issues",
        "Problemas urbanos",
        "/admin/community-issues",
        issueStats.total,
        issueStats.underReview,
        "community_issues",
      ),
      moduleCoverage(
        "notifications",
        "Notificações",
        "/admin/notifications",
        notificationStats.total,
        notificationStats.unread,
        "notifications",
      ),
      moduleCoverage(
        "territory-events",
        "Territórios e eventos",
        "/admin/territory-management",
        stats.events,
        0,
        "locations + events",
      ),
      moduleCoverage(
        "mobility",
        "Mobilidade",
        "/admin/analytics-mobilidade",
        stats.ride_requests + stats.drivers,
        realtimeSnapshot.metrics.ridesPending,
        "ride_requests + driver_data",
      ),
    ];

    return {
      generatedAt: new Date().toISOString(),
      windowDays,
      totalRecords,
      stats,
      trends: statsWithTrends.trends,
      modules,
      activity: activity.map((item) => ({
        date: item.date,
        posts: item.posts,
        users: item.users,
        businesses: item.businesses,
        eventos: item.eventos,
        classificados: item.classificados,
      })),
      recentActivity: recentActivity.map((item) => ({
        type: item.type,
        label: item.label,
        date: item.date,
      })),
    };
  } catch (error) {
    logger.error("admin.queries.getOperationalOverview", error as Error);

    return {
      generatedAt: new Date().toISOString(),
      windowDays,
      totalRecords: 0,
      stats: {
        profiles: 0,
        businesses: 0,
        professionals: 0,
        classifieds: 0,
        events: 0,
        posts: 0,
        comments: 0,
        drivers: 0,
        ride_requests: 0,
      },
      trends: {},
      modules: [],
      activity: [],
      recentActivity: [],
    };
  }
}
