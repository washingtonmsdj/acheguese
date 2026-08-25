import { supabase } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import { RIDE_STATUS } from "../constants";
import { RideRatingService } from "./RideRatingService";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type MobilityDriverQueriesDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<TRow = Record<string, unknown>>(
    fn: string,
    params?: Record<string, unknown>,
  ): Promise<QueryPayload<TRow>>;
};

const mobilityDriverQueriesDb = supabase as unknown as MobilityDriverQueriesDbClient;

function isProfileSuspended(profile: Record<string, unknown> | null): boolean {
  const suspended = Boolean(profile?.is_suspended ?? profile?.suspended ?? false);
  if (!suspended) return false;

  const suspendedUntil = typeof profile?.suspended_until === "string" ? profile.suspended_until : null;
  if (!suspendedUntil) return true;

  const until = new Date(suspendedUntil);
  return Number.isNaN(until.getTime()) || until > new Date();
}

export interface DriverOfferCapabilitiesRow {
  is_verified: boolean | null;
  is_suspended: boolean | null;
  subscription_active: boolean | null;
  can_do_delivery: boolean | null;
  can_do_rides: boolean | null;
}

type DriverCompleteProfileRow = {
  profile_id: string;
  display_name: string;
  avg_rating: number;
  total_rides: number;
  avatar_url?: string | null;
  created_at?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate?: string;
};

type DriverDataSummaryRow = {
  profile_id: string;
  rating: number | null;
  can_do_delivery: boolean | null;
  can_do_rides: boolean | null;
  is_verified: boolean | null;
  subscription_active: boolean | null;
};

type DriverEarningsRow = {
  final_price?: number | null;
  completed_at?: string | null;
  updated_at?: string | null;
};

type CompletedRidePaymentRow = {
  created_at: string;
  actual_fare?: number | null;
  final_price?: number | null;
};

export async function getDriverOfferCapabilities(
  driverProfileId: string,
): Promise<DriverOfferCapabilitiesRow | null> {
  const profilePromise = profileService.getProfileById(driverProfileId).catch(() => null);

  const query = await mobilityDriverQueriesDb
    .from<Omit<DriverOfferCapabilitiesRow, "is_suspended">>("driver_data")
    .select("is_verified, subscription_active, can_do_delivery, can_do_rides")
    .eq("profile_id", driverProfileId)
    .maybeSingle();

  if (query.error) throw query.error;
  if (!query.data) return null;

  const profile = await profilePromise;
  return {
    ...query.data,
    is_suspended: isProfileSuspended(profile as Record<string, unknown> | null),
  };
}

export async function getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
  try {
    const { data, error } = await mobilityDriverQueriesDb
      .from<DriverCompleteProfileRow>("driver_complete_profile")
      .select("*")
      .order("created_at", { ascending: false });
    return { data: data ?? [], error };
  } catch (error) {
    logger.error("MobilityQueries.getDriverProfiles", error as Error);
    return { data: [], error };
  }
}

export async function getDriverDataByProfileIds(profileIds: string[]): Promise<unknown[]> {
  if (!profileIds.length) return [];

  const query = await mobilityDriverQueriesDb.rpc<DriverDataSummaryRow>(
    "get_driver_dispatch_summaries",
    { p_profile_ids: profileIds },
  );

  if (query.error) throw query.error;

  const profiles = await Promise.all(
    profileIds.map((profileId) => profileService.getProfileById(profileId).catch(() => null)),
  );
  const suspensionMap = new Map(
    profileIds.map((profileId, index) => [
      profileId,
      isProfileSuspended(profiles.at(index) as Record<string, unknown> | null),
    ]),
  );

  return (query.data ?? []).map((row) => ({
    ...row,
    is_suspended: suspensionMap.get(row.profile_id) ?? false,
  }));
}

export async function getTopDrivers(
  opts: { minRides?: number; limit?: number } = {},
): Promise<unknown[]> {
  try {
    const { minRides = 1, limit = 10 } = opts;
    const { data, error } = await mobilityDriverQueriesDb
      .from<DriverCompleteProfileRow>("driver_complete_profile")
      .select("profile_id, display_name, avg_rating, total_rides, avatar_url")
      .gte("total_rides", minRides)
      .order("avg_rating", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.profile_id,
      name: row.display_name,
      rating: row.avg_rating,
      total_rides: row.total_rides,
      profile: { avatar_url: row.avatar_url },
    }));
  } catch (error) {
    logger.error("MobilityQueries.getTopDrivers", error as Error);
    return [];
  }
}

export async function getMobilityStats(): Promise<{ total_drivers: number; total_rides: number }> {
  try {
    const [driversResult, ridesResult] = await Promise.all([
      mobilityDriverQueriesDb.from<{ id: string }>("driver_data").select("id", { count: "exact", head: true }),
      mobilityDriverQueriesDb.from<{ id: string }>("ride_requests").select("id", { count: "exact", head: true }),
    ]);

    return {
      total_drivers: driversResult.count ?? 0,
      total_rides: ridesResult.count ?? 0,
    };
  } catch (error) {
    logger.error("MobilityQueries.getMobilityStats", error as Error);
    return { total_drivers: 0, total_rides: 0 };
  }
}

export async function getDriverEarnings(driverProfileId: string): Promise<unknown[]> {
  try {
    const { data, error } = await mobilityDriverQueriesDb
      .from<DriverEarningsRow>("ride_requests")
      .select("final_price, completed_at, updated_at")
      .eq("driver_profile_id", driverProfileId)
      .eq("status", RIDE_STATUS.COMPLETED)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      completed_at: row.completed_at || row.updated_at,
    }));
  } catch (error) {
    logger.error("MobilityQueries.getDriverEarnings", error as Error);
    return [];
  }
}

export async function getCompletedRidePaymentsByDriver(
  driverProfileId: string,
  sinceIso?: string,
): Promise<unknown[]> {
  let query = mobilityDriverQueriesDb
    .from<CompletedRidePaymentRow>("ride_requests")
    .select("created_at, actual_fare, final_price")
    .eq("driver_profile_id", driverProfileId)
    .eq("status", RIDE_STATUS.COMPLETED);

  if (sinceIso) {
    query = query.gte("created_at", sinceIso);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getDriverCompleteProfile(profileId: string): Promise<{
  display_name: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plate: string;
  avg_rating: number;
} | null> {
  try {
    const { data, error } = await mobilityDriverQueriesDb
      .from<Pick<DriverCompleteProfileRow, "display_name" | "vehicle_model" | "vehicle_color" | "vehicle_plate" | "avg_rating">>("driver_complete_profile")
      .select("display_name, vehicle_model, vehicle_color, vehicle_plate, avg_rating")
      .eq("profile_id", profileId)
      .single();

    if (error) throw error;
    return {
      display_name: data.display_name,
      vehicle_model: data.vehicle_model ?? "",
      vehicle_color: data.vehicle_color ?? "",
      vehicle_plate: data.vehicle_plate ?? "",
      avg_rating: data.avg_rating,
    };
  } catch (error) {
    logger.error("MobilityQueries.getDriverCompleteProfile", { profileId, error });
    return null;
  }
}

export async function getPassengerRating(profileId: string): Promise<number> {
  try {
    const summary = await RideRatingService.getSummary(profileId);
    return summary.totalRatings > 0
      ? Number(summary.averageRating.toFixed(1))
      : 5.0;
  } catch (error) {
    logger.error("MobilityQueries.getPassengerRating", error as Error, { profileId });
    return 5.0;
  }
}
