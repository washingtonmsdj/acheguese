/**
 * DriverService - canonical implementation.
 *
 * Driver aggregate over `profiles (driver)`, registration data and the
 * canonical `driver_availability` operational state.
 */

import type { Tables } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { getCompletedRidePaymentsByDriver, getDriverData, getDriverStatsDetailed } from "./mobility.queries";
import { updateDriverData, updateDriverOnlineStatus } from "./mobility.mutations";
import { DriverAvailabilityService } from "./DriverAvailabilityService";

type DriverDataRecord = Tables<"driver_data">;

export interface DriverProfile {
  id: string;
  profile_id: string;
  user_id: string;
  rating: number;
  total_rides: number;
  total_earnings: number;
  is_verified: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DriverStats {
  total_rides: number;
  total_earnings: number;
  average_rating: number;
}

export interface WeeklyEarning {
  week: string;
  total: number;
}

interface DbRideData {
  created_at: string;
  actual_fare?: number | null;
  final_price?: number | null;
}

async function sumCompletedRidePayments(driverProfileId: string): Promise<number> {
  const payments = (await getCompletedRidePaymentsByDriver(
    driverProfileId,
  )) as DbRideData[];

  return payments.reduce(
    (total, payment) => total + (payment.actual_fare ?? payment.final_price ?? 0),
    0,
  );
}

function mapDriverProfileRecord(
  userId: string,
  profileId: string,
  driverData: Partial<DriverDataRecord>,
  totalEarnings: number,
  isActive: boolean,
): DriverProfile {
  return {
    id: profileId,
    profile_id: profileId,
    user_id: userId,
    rating: driverData.rating ?? 0,
    total_rides: driverData.total_rides ?? 0,
    total_earnings: totalEarnings,
    is_verified: driverData.is_verified ?? false,
    is_active: isActive,
    created_at: driverData.created_at,
    updated_at: driverData.updated_at,
  };
}

export class DriverService {
  async getDriverProfile(userId: string): Promise<DriverProfile | null> {
    const driverProfile = await profileService.getProfileByType(userId, "driver");
    if (!driverProfile?.id) {
      return null;
    }

    const driverData = (await getDriverData(
      driverProfile.id,
    )) as DriverDataRecord | null;

    if (!driverData) {
      return null;
    }

    const [availability, totalEarnings] = await Promise.all([
      DriverAvailabilityService.getStatus(driverProfile.id),
      sumCompletedRidePayments(driverProfile.id),
    ]);

    return mapDriverProfileRecord(
      userId,
      driverProfile.id,
      driverData,
      totalEarnings,
      availability?.isOnline ?? false,
    );
  }

  async getDriverStats(driverProfileId: string): Promise<DriverStats | null> {
    const data = (await getDriverStatsDetailed(
      driverProfileId,
    )) as Partial<DriverDataRecord> | null;

    if (!data) {
      return null;
    }

    return {
      total_rides: data.total_rides ?? 0,
      total_earnings: await sumCompletedRidePayments(driverProfileId),
      average_rating: data.rating ?? 0,
    };
  }

  async getWeeklyEarnings(
    driverProfileId: string,
    weeks: number = 12,
  ): Promise<WeeklyEarning[]> {
    const sinceIso = new Date(
      Date.now() - weeks * 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const data = (await getCompletedRidePaymentsByDriver(
      driverProfileId,
      sinceIso,
    )) as DbRideData[];

    if (!data.length) {
      return [];
    }

    const totalsByWeek = new Map<string, number>();
    for (const row of data) {
      const week = new Date(row.created_at).toISOString().slice(0, 10);
      totalsByWeek.set(
        week,
        (totalsByWeek.get(week) ?? 0) + (row.actual_fare ?? row.final_price ?? 0),
      );
    }

    return Array.from(totalsByWeek.entries()).map(([week, total]) => ({
      week,
      total,
    }));
  }

  async updateDriverStatus(driverProfileId: string, isActive: boolean): Promise<void> {
    await updateDriverOnlineStatus(driverProfileId, isActive);
  }

  async updateDriverRegistration(
    driverProfileId: string,
    updates: Record<string, unknown>,
  ): Promise<unknown | null> {
    return updateDriverData(driverProfileId, updates);
  }
}

export const driverService = new DriverService();
