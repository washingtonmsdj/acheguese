import { useEffect, useState } from "react";

import { adminMobilityService } from "@/core/admin";
import {
  isCancelledRideStatus,
  isClosedRideStatus,
  isDriverOwnedOpenRideStatus,
  isOpenRideStatus,
  isPreAcceptRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
import { RIDE_STATE } from "@/core/mobility/core/RideStateMachine";
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
  completedValue: number;
};

type RideRating = { rating: number };

const getRideCompletedValue = (ride: AnalyticsRide) =>
  ride.final_price ?? ride.actual_fare ?? 0;

const getResolutionTimestamp = (ride: AnalyticsRide): string => {
  if (ride.status === RIDE_STATE.COMPLETED) {
    return ride.completed_at ?? ride.updated_at ?? ride.created_at;
  }

  if (isCancelledRideStatus(ride.status)) {
    return ride.cancelled_at ?? ride.updated_at ?? ride.created_at;
  }

  return ride.updated_at ?? ride.created_at;
};

const toDateKey = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().split("T")[0];
};

const isOnOrAfter = (value: string | null | undefined, startIso: string): boolean => {
  if (!value) return false;
  const timestamp = Date.parse(value);
  const start = Date.parse(startIso);
  return Number.isFinite(timestamp) && Number.isFinite(start) && timestamp >= start;
};

const buildDailyData = (rides: AnalyticsRide[], days: number): DailyData[] => {
  const dailyMap = new Map<string, DailyData>();

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - i));
    const key = date.toISOString().split("T")[0];
    dailyMap.set(key, {
      date: key,
      ridesCreated: 0,
      completedValue: 0,
      completed: 0,
      cancelled: 0,
    });
  }

  rides.forEach((ride) => {
    const createdDay = dailyMap.get(toDateKey(ride.created_at) ?? "");
    if (createdDay) {
      createdDay.ridesCreated += 1;
    }

    const resolutionDay = dailyMap.get(toDateKey(getResolutionTimestamp(ride)) ?? "");
    if (!resolutionDay) return;

    if (ride.status === RIDE_STATE.COMPLETED) {
      resolutionDay.completed += 1;
      resolutionDay.completedValue += getRideCompletedValue(ride);
    } else if (isCancelledRideStatus(ride.status)) {
      resolutionDay.cancelled += 1;
    }
  });

  return Array.from(dailyMap.values());
};

const buildTopDrivers = (
  completedRides: AnalyticsRide[],
  drivers: DriverProfileLite[],
): TopDriverAnalytics[] => {
  const driverRideCount = new Map<string, DriverAggregation>();
  const driverById = new Map(drivers.map((driver) => [driver.id, driver]));

  completedRides.forEach((ride) => {
    const driverProfileId = ride.driver_profile_id;
    if (!driverProfileId) return;

    if (!driverRideCount.has(driverProfileId)) {
      const driver = driverById.get(driverProfileId);
      driverRideCount.set(driverProfileId, {
        driver: driver
          ? { id: driver.id, name: driver.name, profile: driver.profile }
          : undefined,
        count: 0,
        completedValue: 0,
      });
    }

    const entry = driverRideCount.get(driverProfileId);
    if (!entry) return;

    entry.count += 1;
    entry.completedValue += getRideCompletedValue(ride);
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
  startIso: string,
): { stats: MobilidadeStats; completedRides: AnalyticsRide[] } => {
  const createdRides = rides.filter((ride) => isOnOrAfter(ride.created_at, startIso));
  const openRides = createdRides.filter((ride) => isOpenRideStatus(ride.status));
  const resolvedRides = rides.filter(
    (ride) =>
      isClosedRideStatus(ride.status) &&
      isOnOrAfter(getResolutionTimestamp(ride), startIso),
  );
  const completedRides = resolvedRides.filter(
    (ride) => ride.status === RIDE_STATE.COMPLETED,
  );
  const cancelledRides = resolvedRides.filter((ride) =>
    isCancelledRideStatus(ride.status),
  );
  const failedRides = resolvedRides.filter((ride) => ride.status === RIDE_STATE.FAILED);
  const expiredRides = resolvedRides.filter((ride) => ride.status === RIDE_STATE.EXPIRED);
  const verified = drivers.filter((driver) => driver.is_verified === true);
  const unverified = drivers.filter((driver) => driver.is_verified !== true);
  const completedValue = completedRides.reduce(
    (sum, ride) => sum + getRideCompletedValue(ride),
    0,
  );
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0;
  const resolutionCount = resolvedRides.length;

  return {
    completedRides,
    stats: {
      totalRides: createdRides.length,
      openRides: openRides.length,
      preAcceptRides: openRides.filter((ride) => isPreAcceptRideStatus(ride.status)).length,
      driverOwnedOpenRides: openRides.filter((ride) =>
        isDriverOwnedOpenRideStatus(ride.status),
      ).length,
      resolvedRides: resolutionCount,
      completedRides: completedRides.length,
      cancelledRides: cancelledRides.length,
      failedRides: failedRides.length,
      expiredRides: expiredRides.length,
      totalDrivers: drivers.length,
      verifiedDrivers: verified.length,
      unverifiedDrivers: unverified.length,
      completedValue,
      avgRating: Math.round(avgRating * 10) / 10,
      verificationRate:
        drivers.length > 0 ? Math.round((verified.length / drivers.length) * 100) : 0,
      completionRate:
        resolutionCount > 0
          ? Math.round((completedRides.length / resolutionCount) * 100)
          : 0,
      cancellationRate:
        resolutionCount > 0
          ? Math.round((cancelledRides.length / resolutionCount) * 100)
          : 0,
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
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - (days - 1));
        const startISO = startDate.toISOString();

        const [rides, allDrivers, allRatings] = await Promise.all([
          adminMobilityService.getAllRides(),
          adminMobilityService.getAllDriversComplete() as Promise<DriverProfileLite[]>,
          adminMobilityService.getAllRideRatings() as Promise<RideRating[]>,
        ]);
        const allRides = (rides || []) as unknown as AnalyticsRide[];
        const { stats: nextStats, completedRides } = buildStats(
          allRides,
          allDrivers,
          allRatings,
          startISO,
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
