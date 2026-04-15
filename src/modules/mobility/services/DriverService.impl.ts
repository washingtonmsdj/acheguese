/**
 * DriverService - canonical implementation
 *
 * Compatibility facade over the canonical driver aggregate:
 * `profiles (driver)` + MobilityService.
 */

import type { Tables } from "@/integrations/supabase/types.generated";
import { profileService } from "@/core/profiles/services/ProfileService";
import { getCompletedRidePaymentsByDriver, getDriverData, getDriverStatsDetailed } from "./mobility.queries";
import { updateDriverData, updateDriverOnlineStatus } from "./mobility.mutations";

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
): DriverProfile {
  return {
    id: profileId,
    profile_id: profileId,
    user_id: userId,
    rating: driverData.rating ?? 0,
    total_rides: driverData.total_rides ?? 0,
    total_earnings: totalEarnings,
    is_verified: driverData.is_verified ?? false,
    is_active: driverData.is_online ?? false,
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

    return mapDriverProfileRecord(
      userId,
      driverProfile.id,
      driverData,
      await sumCompletedRidePayments(driverProfile.id),
    );
  }

  async createDriverProfile(
    data: Omit<
      DriverProfile,
      "id" | "created_at" | "updated_at" | "rating" | "total_rides"
    >,
  ): Promise<DriverProfile> {
    const existingDriverData = (await getDriverData(
      data.profile_id,
    )) as DriverDataRecord | null;

    if (!existingDriverData) {
      throw new Error(
        "Driver profile must be created via the canonical multi-profile flow before driver data can be updated",
      );
    }

    const updatedDriverData = (await updateDriverData(data.profile_id, {
      is_online: data.is_active ?? false,
      is_verified: data.is_verified,
    })) as DriverDataRecord | null;

    if (!updatedDriverData) {
      throw new Error("Unable to update canonical driver data");
    }

    return mapDriverProfileRecord(data.user_id, data.profile_id, updatedDriverData, 0);
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
}

export const driverService = new DriverService();
