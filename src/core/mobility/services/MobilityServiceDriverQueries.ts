import { supabase } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import { RIDE_STATUS } from "../constants";

const supabaseClient = supabase as any;

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

export async function getDriverOfferCapabilities(
  driverProfileId: string,
): Promise<DriverOfferCapabilitiesRow | null> {
  const profilePromise = profileService.getProfileById(driverProfileId).catch(() => null);

  const queryWithRideCapability = await supabaseClient
    .from("driver_data")
    .select("is_verified, subscription_active, can_do_delivery, can_do_rides")
    .eq("profile_id", driverProfileId)
    .maybeSingle();

  if (queryWithRideCapability.error) throw queryWithRideCapability.error;
  if (!queryWithRideCapability.data) return null;

  const profile = await profilePromise;
  return {
    ...(queryWithRideCapability.data as Omit<DriverOfferCapabilitiesRow, "is_suspended">),
    is_suspended: isProfileSuspended(profile as Record<string, unknown> | null),
  };
}

/**
 *  Buscar perfis de motoristas
 */
export async function getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
  try {
    const { data, error } = await supabaseClient
      .from("driver_complete_profile")
      .select("*")
      .order("created_at", { ascending: false });
    return { data: data || [], error };
  } catch (error) {
    logger.error("MobilityQueries.getDriverProfiles", error as Error);
    return { data: [], error };
  }
}

/**
 *  Buscar dados de motorista por IDs de perfil
 */
export async function getDriverDataByProfileIds(profileIds: string[]): Promise<unknown[]> {
  if (!profileIds.length) return [];

  const queryWithRideCapability = await supabaseClient
    .from("driver_data")
    .select("profile_id, rating, can_do_delivery, can_do_rides, is_verified, subscription_active")
    .in("profile_id", profileIds);

  if (queryWithRideCapability.error) throw queryWithRideCapability.error;

  const profiles = await Promise.all(
    profileIds.map((profileId) => profileService.getProfileById(profileId).catch(() => null)),
  );
  const suspensionMap = new Map(
    profileIds.map((profileId, index) => [
      profileId,
      isProfileSuspended(profiles.at(index) as Record<string, unknown> | null),
    ]),
  );

  return (queryWithRideCapability.data || []).map((row: { [key: string]: unknown }) => ({
    ...row,
    is_suspended: suspensionMap.get(String(row.profile_id)) ?? false,
  }));
}

/**
 *  Buscar top motoristas
 */
export async function getTopDrivers(opts: { minRides?: number; limit?: number } = {}): Promise<unknown[]> {
  try {
    const { minRides = 1, limit = 10 } = opts;
    const { data, error } = await supabaseClient
      .from("driver_complete_profile")
      .select("profile_id, display_name, avg_rating, total_rides, avatar_url")
      .gte("total_rides", minRides)
      .order("avg_rating", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((d: unknown) => {
      const typed = d as { profile_id: string; display_name: string; avg_rating: number; total_rides: number; avatar_url?: string };
      return {
        id: typed.profile_id,
        name: typed.display_name,
        rating: typed.avg_rating,
        total_rides: typed.total_rides,
        profile: { avatar_url: typed.avatar_url },
      };
    });
  } catch (error) {
    logger.error("MobilityQueries.getTopDrivers", error as Error);
    return [];
  }
}

/**
 *  Estatisticas de mobilidade
 */
export async function getMobilityStats(): Promise<{ total_drivers: number; total_rides: number }> {
  try {
    const [driversResult, ridesResult] = await Promise.all([
      supabaseClient.from("driver_data").select("id", { count: "exact", head: true }),
      supabaseClient.from("ride_requests" as any).select("id", { count: "exact", head: true }),
    ]);

    return {
      total_drivers: (driversResult as { count?: number }).count || 0,
      total_rides: (ridesResult as { count?: number }).count || 0,
    };
  } catch (error) {
    logger.error("MobilityQueries.getMobilityStats", error as Error);
    return { total_drivers: 0, total_rides: 0 };
  }
}

/**
 *  Ganhos do motorista (corridas concludas)
 */
export async function getDriverEarnings(driverProfileId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select("final_price, completed_at, updated_at")
      .eq("driver_profile_id", driverProfileId)
      .eq("status", RIDE_STATUS.COMPLETED)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((r: unknown) => {
      const typed = r as { final_price?: number; completed_at?: string; updated_at?: string; [key: string]: unknown };
      return {
        ...typed,
        completed_at: typed.completed_at || typed.updated_at,
      };
    });
  } catch (error) {
    logger.error("MobilityQueries.getDriverEarnings", error as Error);
    return [];
  }
}

/**
 *  Pagamentos de corridas concludas por motorista
 */
export async function getCompletedRidePaymentsByDriver(
  driverProfileId: string,
  sinceIso?: string,
): Promise<unknown[]> {
  let query = supabaseClient
    .from("ride_requests" as any)
    .select("created_at, actual_fare, final_price")
    .eq("driver_profile_id", driverProfileId)
    .eq("status", RIDE_STATUS.COMPLETED);

  if (sinceIso) {
    query = query.gte("created_at", sinceIso);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 *  Perfil completo do motorista
 */
export async function getDriverCompleteProfile(profileId: string): Promise<{
  display_name: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plate: string;
  avg_rating: number;
} | null> {
  try {
    const { data, error } = await supabaseClient
      .from("driver_complete_profile")
      .select("display_name, vehicle_model, vehicle_color, vehicle_plate, avg_rating")
      .eq("profile_id", profileId)
      .single();

    if (error) throw error;
    return data as { display_name: string; vehicle_model: string; vehicle_color: string; vehicle_plate: string; avg_rating: number } | null;
  } catch (error) {
    logger.error("MobilityQueries.getDriverCompleteProfile", { profileId, error });
    return null;
  }
}

/**
 *  Rating medio do passageiro
 */
export async function getPassengerRating(profileId: string): Promise<number> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_ratings")
      .select("rating")
      .eq("rated_id", profileId);

    if (error) {
      logger.warn("MobilityQueries.getPassengerRating - query error", { profileId, error });
      return 5.0;
    }

    if (!data || data.length === 0) {
      return 5.0;
    }

    const ratings = data
      .map((row) => Number((row as { rating?: unknown }).rating))
      .filter((value) => Number.isFinite(value));

    if (ratings.length === 0) {
      return 5.0;
    }

    const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    return Number(avg.toFixed(1));
  } catch (error) {
    logger.error("MobilityQueries.getPassengerRating", error as Error, { profileId });
    return 5.0;
  }
}
