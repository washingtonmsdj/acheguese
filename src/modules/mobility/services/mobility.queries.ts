/**
 *  MOBILITY QUERIES - Leitura de dados
 *
 *  Responsabilidade nica: todas as operacoes de consulta (SELECT)
 *  - Sem escritas (INSERT/UPDATE/DELETE)
 *  - Sem lgica de negcio complexa
 */

import { supabase } from "@/core/infrastructure/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RIDE_STATUS } from "../constants";
export {
  getLastMessage,
  getMobilityConversations,
  getOperationalVerificationEntries,
  getRideAvailableSeats,
  getRideBasicInfo,
  getRideByShareToken,
  getRideStateAuditEntries,
  getRideWithAddresses,
  getUnreadCount,
} from "./mobility.ride-read-queries";
export {
  getCompletedRidePaymentsByDriver,
  getDriverCompleteProfile,
  getDriverDataByProfileIds,
  getDriverEarnings,
  getDriverOfferCapabilities,
  getDriverProfiles,
  getMobilityStats,
  getPassengerRating,
  getTopDrivers,
  type DriverOfferCapabilitiesRow,
} from "./MobilityServiceDriverQueries";

const supabaseClient = supabase as any;

export interface RideDispatchContextRow {
  ride_mode: string | null;
  source_type: string | null;
  is_scheduled: boolean | null;
  scheduled_for: string | null;
  status: string | null;
}

export interface ExclusiveOfferRideRow {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  suggested_price: number;
  payment_method: string;
  created_at: string;
  driver_assigned_at: string | null;
  ride_mode: string | null;
  passenger_profile_id: string | null;
}

export interface OpenBoardRideRow {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  suggested_price: number;
  payment_method: string;
  created_at: string;
  ride_mode: string | null;
  package_size: string | null;
  package_description: string | null;
  source_type: string | null;
  source_id: string | null;
}

export interface ReservationOfferRideRow {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  suggested_price: number;
  payment_method: string;
  created_at: string;
  scheduled_for: string;
  passenger_profile_id: string | null;
  driver_profile_id: string | null;
  status: string;
}

export interface MotoboyRuntimeDatabaseChecks {
  rideRequestsColumnsOk: boolean;
  driverDataColumnsOk: boolean;
  driverAvailabilityColumnsOk: boolean;
  motoboyPricingActive: boolean;
  motoboyEnabledDrivers: number;
  details: string[];
}

/**
 *  Buscar corridas ativas (status em andamento)
 */
export async function getActiveRides(): Promise<unknown[]> {
  try {
    const activeStatuses = [
      RIDE_STATUS.PENDING,
      RIDE_STATUS.REQUESTED,
      RIDE_STATUS.SEARCHING_DRIVER,
      RIDE_STATUS.DRIVER_ASSIGNED,
      RIDE_STATUS.DRIVER_ACCEPTED,
      RIDE_STATUS.IN_PROGRESS,
      RIDE_STATUS.DRIVER_ARRIVING,
      RIDE_STATUS.PASSENGER_BOARDED,
    ].filter(Boolean) as string[];

    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select("*")
      .in("status", activeStatuses)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("MobilityQueries.getActiveRides", error as Error);
    return [];
  }
}

/**
 *  Buscar corrida por ID
 */
export async function getRideById(id: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getRideById", error as Error);
    return null;
  }
}

/**
 *  Buscar todas as solicitaes de corrida
 */
export async function getAllRideRequests(): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select("*")
    .order("created_at");

  if (error) throw error;
  return data || [];
}

/**
 *  Buscar corridas por passageiro
 */
export async function getRidesByPassenger(passengerProfileId: string): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select("*")
    .eq("passenger_profile_id", passengerProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 *  Buscar corridas por motorista
 */
export async function getRidesByDriverProfile(driverProfileId: string): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select("*")
    .eq("driver_profile_id", driverProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 *  Buscar corrida ativa por perfil de motorista
 */
export async function getActiveRideByDriverProfile(
  driverProfileId: string,
  statuses: string[],
  excludeRideId?: string,
): Promise<unknown | null> {
  let query = supabaseClient
    .from("ride_requests" as any)
    .select("id")
    .eq("driver_profile_id", driverProfileId)
    .in("status", statuses);

  if (excludeRideId) {
    query = query.neq("id", excludeRideId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 *  Buscar corrida ativa do usurio (passageiro ou motorista)
 */
export async function getActiveRide(userProfileId: string): Promise<unknown | null> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select("*")
    .or(`passenger_profile_id.eq.${userProfileId},driver_profile_id.eq.${userProfileId}`)
    .in("status", ["pending", "accepted", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data || null;
}

/**
 *  Buscar dados de dispatch da corrida
 */
export async function getRideDispatchData(rideId: string): Promise<unknown | null> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select(`
      id,
      status,
      passenger_profile_id,
      pickup_address_id,
      pickup_location_id,
      ride_mode,
      created_at,
      pickup_address:addresses!pickup_address_id(latitude, longitude)
    `)
    .eq("id", rideId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getRideDispatchContextById(
  rideId: string,
): Promise<RideDispatchContextRow | null> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select("ride_mode, source_type, is_scheduled, scheduled_for, status")
    .eq("id", rideId)
    .maybeSingle();

  if (error) throw error;
  return (data as RideDispatchContextRow | null) ?? null;
}

export async function getExclusiveOfferRideForDriver(
  driverProfileId: string,
): Promise<ExclusiveOfferRideRow | null> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select(
      [
        "id",
        "origin",
        "destination",
        "origin_lat",
        "origin_lng",
        "destination_lat",
        "destination_lng",
        "suggested_price",
        "payment_method",
        "created_at",
        "driver_assigned_at",
        "ride_mode",
        "passenger_profile_id",
      ].join(", "),
    )
    .eq("driver_profile_id", driverProfileId)
    .eq("status", RIDE_STATUS.DRIVER_ASSIGNED)
    .is("driver_accepted_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data as ExclusiveOfferRideRow | null) ?? null;
}

export async function getOpenBoardOfferRides(params: {
  minPrice?: number;
  maxPrice?: number;
  packageSizes?: string[];
  sortBy?: "created_at" | "suggested_price";
  ascending?: boolean;
  limit?: number;
}): Promise<OpenBoardRideRow[]> {
  const {
    minPrice,
    maxPrice,
    packageSizes,
    sortBy = "created_at",
    ascending = false,
    limit = 10,
  } = params;

  let query = supabaseClient
    .from("ride_requests" as any)
    .select(
      [
        "id",
        "origin",
        "destination",
        "origin_lat",
        "origin_lng",
        "destination_lat",
        "destination_lng",
        "suggested_price",
        "payment_method",
        "created_at",
        "ride_mode",
        "package_size",
        "package_description",
        "source_type",
        "source_id",
      ].join(", "),
    )
    .in("status", [RIDE_STATUS.PENDING, RIDE_STATUS.REQUESTED, RIDE_STATUS.SEARCHING_DRIVER])
    .is("driver_profile_id", null)
    .eq("ride_mode", "motoboy");

  if (minPrice !== undefined) {
    query = query.gte("suggested_price", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("suggested_price", maxPrice);
  }
  if (packageSizes && packageSizes.length > 0) {
    query = query.in("package_size", packageSizes);
  }

  const { data, error } = await query
    .order(sortBy, { ascending })
    .limit(limit);

  if (error) throw error;
  return (data as OpenBoardRideRow[] | null) ?? [];
}

export async function getReservationOfferRides(
  limit: number = 10,
): Promise<ReservationOfferRideRow[]> {
  const { data, error } = await supabaseClient
    .from("ride_requests" as any)
    .select(
      [
        "id",
        "origin",
        "destination",
        "origin_lat",
        "origin_lng",
        "destination_lat",
        "destination_lng",
        "suggested_price",
        "payment_method",
        "created_at",
        "scheduled_for",
        "passenger_profile_id",
        "driver_profile_id",
        "status",
      ].join(", "),
    )
    .eq("is_scheduled", true)
    .gte("scheduled_for", new Date().toISOString())
    .in("status", [RIDE_STATUS.PENDING, RIDE_STATUS.REQUESTED])
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as ReservationOfferRideRow[] | null) ?? [];
}

/**
 * Generic open-board query for unassigned rides.
 *
 * Driver dashboards should use MobilityOfferService because it applies
 * dispatch strategy, eligibility and scoring.
 */
export async function getAvailableRides(limit: number = 10): Promise<unknown[]> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select(`
        * ,
        pickup_address:addresses!pickup_address_id(street, latitude, longitude),
        dropoff_address:addresses!dropoff_address_id(street, latitude, longitude)
      `)
      .in("status", [RIDE_STATUS.PENDING, RIDE_STATUS.REQUESTED, RIDE_STATUS.SEARCHING_DRIVER])
      .is("driver_profile_id", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((r: unknown) => {
      const typed = r as {
        origin?: string;
        destination?: string;
        origin_lat?: number;
        origin_lng?: number;
        destination_lat?: number;
        destination_lng?: number;
        pickup_address?: { street?: string; latitude?: number; longitude?: number };
        dropoff_address?: { street?: string; latitude?: number; longitude?: number };
      };
      return {
        ...typed,
        origin: typed.origin || typed.pickup_address?.street || "Origem nao informada",
        destination: typed.destination || typed.dropoff_address?.street || "Destino nao informado",
        origin_lat: typed.origin_lat || typed.pickup_address?.latitude,
        origin_lng: typed.origin_lng || typed.pickup_address?.longitude,
        destination_lat: typed.destination_lat || typed.dropoff_address?.latitude,
        destination_lng: typed.destination_lng || typed.dropoff_address?.longitude,
      };
    });
  } catch (error) {
    logger.error("MobilityQueries.getAvailableRides", error as Error);
    return [];
  }
}

/**
 *  Buscar corridas do usurio (passageiro ou motorista)
 */
export async function getUserRides(userId: string): Promise<unknown[]> {
  try {
    const activeProfile = await profileService.getActiveProfile(userId);
    if (!activeProfile?.id) return [];

    const { data, error } = await supabaseClient
      .from("ride_requests" as any)
      .select("*")
      .or(`passenger_profile_id.eq.${activeProfile.id},driver_profile_id.eq.${activeProfile.id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("MobilityQueries.getUserRides", error as Error);
    return [];
  }
}


/**
 *  Buscar dados do motorista por ID de perfil
 */
export async function getDriverData(profileId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("driver_data")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      logger.error("MobilityQueries.getDriverData", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("MobilityQueries.getDriverData - unexpected error", error);
    return null;
  }
}

/**
 *  Buscar Estatisticas detalhadas do motorista
 */
export async function getDriverStatsDetailed(driverProfileId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("driver_data")
      .select("*")
      .eq("profile_id", driverProfileId)
      .maybeSingle();

    if (error) {
      logger.error("MobilityQueries.getDriverStatsDetailed", error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error("MobilityQueries.getDriverStatsDetailed - unexpected error", error);
    return null;
  }
}

export async function getMotoboyRuntimeDatabaseChecks(): Promise<MotoboyRuntimeDatabaseChecks> {
  const details: string[] = [];

  const rideColumnsResult = await supabaseClient
    .from("ride_requests" as any)
    .select(
      [
        "id",
        "ride_mode",
        "source_type",
        "source_id",
        "recipient_name",
        "recipient_phone",
        "delivery_notes",
        "package_description",
        "package_size",
        "proof_of_delivery",
        "pickup_confirmed_at",
        "delivered_at",
        "failed_delivery_at",
        "failed_delivery_reason",
      ].join(", "),
    )
    .limit(1);

  const driverDataColumnsResult = await supabaseClient
    .from("driver_data")
    .select("profile_id, can_do_delivery, can_do_rides")
    .limit(1);

  const driverAvailabilityColumnsResult = await supabaseClient
    .from("driver_availability")
    .select("profile_id, active_ride_id, active_ride_mode, busy_since, last_seen_at")
    .limit(1);

  const pricingResult = await supabaseClient
    .from("pricing_rules")
    .select("id")
    .eq("mode", "motoboy")
    .eq("is_active", true)
    .limit(1);

  const motoboyDriversResult = await supabaseClient
    .from("driver_data")
    .select("profile_id", { count: "exact", head: true })
    .eq("can_do_delivery", true);

  if (rideColumnsResult.error) {
    details.push(`ride_requests columns error: ${rideColumnsResult.error.message}`);
  }
  if (driverDataColumnsResult.error) {
    details.push(`driver_data columns error: ${driverDataColumnsResult.error.message}`);
  }
  if (driverAvailabilityColumnsResult.error) {
    details.push(`driver_availability columns error: ${driverAvailabilityColumnsResult.error.message}`);
  }
  if (pricingResult.error) {
    details.push(`pricing query error: ${pricingResult.error.message}`);
  }
  if (motoboyDriversResult.error) {
    details.push(`motoboy drivers query error: ${motoboyDriversResult.error.message}`);
  }

  return {
    rideRequestsColumnsOk: !rideColumnsResult.error,
    driverDataColumnsOk: !driverDataColumnsResult.error,
    driverAvailabilityColumnsOk: !driverAvailabilityColumnsResult.error,
    motoboyPricingActive: ((pricingResult.data as { id: string }[] | null) ?? []).length > 0,
    motoboyEnabledDrivers: (motoboyDriversResult as { count?: number | null }).count ?? 0,
    details,
  };
}
