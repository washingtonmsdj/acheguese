import { useEffect, useState } from "react";
import { adminMobilityService } from "@/core/admin";
import { RIDE_STATUS } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";
import type {
  AnalyticsRide,
  DailyData,
  DriverProfileLite,
  MobilidadeStats,
  TopDriverAnalytics,
} from "./AdminMobilityAnalytics.types";

type DriverAggregation = {
  driver?: TopDriverAnalytics["driver"];
  count: number;
  revenue: number;
};

type RideRating = { rating: number };

const getRideRevenue = (ride: AnalyticsRide) =>
  ride.final_price || ride.suggested_price || 0;

const buildDailyData = (rides: AnalyticsRide[], days: number): DailyData[] => {
  const dailyMap = new Map<string, DailyData>();

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const key = date.toISOString().split("T")[0];
    dailyMap.set(key, {
      date: key,
      rides: 0,
      revenue: 0,
      completed: 0,
      cancelled: 0,
    });
  }

  rides.forEach((ride) => {
    const key = ride.created_at?.split("T")[0];
    const daily = dailyMap.get(key);
    if (!daily) return;

    daily.rides += 1;
    if (ride.status === RIDE_STATUS.COMPLETED) {
      daily.completed += 1;
      daily.revenue += getRideRevenue(ride);
    }
    if (ride.status === RIDE_STATUS.CANCELLED) {
      daily.cancelled += 1;
    }
  });

  return Array.from(dailyMap.values());
};

const buildTopDrivers = (
  completedRides: AnalyticsRide[],
  drivers: DriverProfileLite[],
): TopDriverAnalytics[] => {
  const driverRideCount = new Map<string, DriverAggregation>();

  completedRides.forEach((ride) => {
    const driverProfileId = ride.driver_profile_id;
    if (!driverProfileId) return;

    if (!driverRideCount.has(driverProfileId)) {
      const driver = drivers.find((item) => item.id === driverProfileId);
      driverRideCount.set(driverProfileId, {
        driver: driver
          ? { id: driver.id, name: driver.name, profile: driver.profile }
          : undefined,
        count: 0,
        revenue: 0,
      });
    }

    const entry = driverRideCount.get(driverProfileId);
    if (!entry) return;

    entry.count += 1;
    entry.revenue += getRideRevenue(ride);
  });

  return Array.from(driverRideCount.values())
    .filter((entry): entry is TopDriverAnalytics => Boolean(entry.driver))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

const buildStats = (
  rides: AnalyticsRide[],
  drivers: DriverProfileLite[],
  ratings: RideRating[],
): { stats: MobilidadeStats; completedRides: AnalyticsRide[] } => {
  const completedRides = rides.filter((ride) => ride.status === RIDE_STATUS.COMPLETED);
  const cancelled = rides.filter((ride) => ride.status === RIDE_STATUS.CANCELLED);
  const pending = rides.filter((ride) => ride.status === RIDE_STATUS.PENDING);
  const inProgress = rides.filter(
    (ride) =>
      ride.status === RIDE_STATUS.IN_PROGRESS || ride.status === "driver_assigned",
  );
  const verified = drivers.filter((driver) => driver.is_verified === true);
  const pendingDrivers = drivers.filter((driver) => driver.is_verified === false);
  const totalRevenue = completedRides.reduce(
    (sum, ride) => sum + getRideRevenue(ride),
    0,
  );
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0;

  return {
    completedRides,
    stats: {
      totalRides: rides.length,
      completedRides: completedRides.length,
      cancelledRides: cancelled.length,
      pendingRides: pending.length,
      inProgressRides: inProgress.length,
      totalDrivers: drivers.length,
      verifiedDrivers: verified.length,
      pendingDrivers: pendingDrivers.length,
      rejectedDrivers: 0,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      approvalRate:
        drivers.length > 0 ? Math.round((verified.length / drivers.length) * 100) : 0,
      completionRate:
        rides.length > 0 ? Math.round((completedRides.length / rides.length) * 100) : 0,
    },
  };
};

export function useAdminMobilityAnalytics(days: number, enabled: boolean) {
  const [stats, setStats] = useState<MobilidadeStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDriverAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startISO = startDate.toISOString();

        const rides = await adminMobilityService.getAllRides();
        const allRides = ((rides || []) as unknown as AnalyticsRide[]).filter(
          (ride) => ride.created_at >= startISO,
        );
        const allDrivers =
          (await adminMobilityService.getAllDriversComplete()) as DriverProfileLite[];
        const allRatings =
          (await adminMobilityService.getAllRideRatings()) as RideRating[];
        const { stats: nextStats, completedRides } = buildStats(
          allRides,
          allDrivers,
          allRatings,
        );

        if (!isMounted) return;

        setStats(nextStats);
        setDailyData(buildDailyData(allRides, days));
        setTopDrivers(buildTopDrivers(completedRides, allDrivers));
      } catch (error) {
        logger.error("Error loading mobilidade analytics:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [days, enabled]);

  return { stats, dailyData, topDrivers, loading };
}
