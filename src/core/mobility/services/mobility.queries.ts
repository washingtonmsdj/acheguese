/**
 *  MOBILITY QUERIES - Leitura de dados
 *
 *  Responsabilidade nica: todas as operacoes de consulta (SELECT)
 *  - Sem escritas (INSERT/UPDATE/DELETE)
 *  - Sem lgica de negcio complexa
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RIDE_STATUS } from "../constants";
import { MobilityDispatchConfigService } from "./MobilityDispatchConfigService";
export {  getMobilityConversations,
  getOperationalVerificationEntries,
  getRideAvailableSeats,
  getRideBasicInfo,
  getRideStateAuditEntries,
  getRideWithAddresses,} from "./mobility.ride-read-queries";
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
  neq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  is(column: string, value: null): TableClient<TRow>;
  not(column: string, operator: string, value: unknown): TableClient<TRow>;
  or(filter: string): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type MobilityQueriesDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const supabaseClient = supabase as unknown as MobilityQueriesDbClient;

export interface RideDispatchContextRow {
  ride_mode: string | null;
  source_type: string | null;
  is_scheduled: boolean;
  scheduled_for: string | null;
  status: string | null;
}

interface RideDispatchContextDbRow {
  ride_mode: string | null;
  source_type: string | null;
  departure_time: string | null;
  status: string | null;
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
      .from("ride_requests")
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
      .from("ride_requests")
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
    .from("ride_requests")
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
    .from("ride_requests")
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
    .from("ride_requests")
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
    .from("ride_requests")
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
    .from("ride_requests")
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
    .from("ride_requests")
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
    .from<RideDispatchContextDbRow>("ride_requests")
    .select("ride_mode, source_type, departure_time, status")
    .eq("id", rideId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const scheduledFor = data.departure_time;
  const minAdvanceHours =
    MobilityDispatchConfigService.getGlobalConfig().reservationBoard.minAdvanceHours;
  const isScheduled =
    Boolean(scheduledFor) &&
    new Date(scheduledFor as string).getTime() >=
      Date.now() + minAdvanceHours * 60 * 60 * 1000;

  return {
    ride_mode: data.ride_mode,
    source_type: data.source_type,
    is_scheduled: isScheduled,
    scheduled_for: isScheduled ? scheduledFor : null,
    status: data.status,
  };
}

/**
 * Generic open-board query for unassigned rides.
 *
 * Driver dashboards should use MobilityOfferService because it applies
 * dispatch strategy, eligibility and scoring.
 */
/**
 *  Buscar corridas do usurio (passageiro ou motorista)
 */
export async function getUserRides(userId: string): Promise<unknown[]> {
  try {
    const activeProfile = await profileService.getActiveProfile(userId);
    if (!activeProfile?.id) return [];

    const { data, error } = await supabaseClient
      .from("ride_requests")
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
export async function getDriverDataIdByProfileId(
  profileId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from<{ id: string }>("driver_data")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      logger.error("MobilityQueries.getDriverDataIdByProfileId", error);
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    logger.error(
      "MobilityQueries.getDriverDataIdByProfileId - unexpected error",
      error,
    );
    return null;
  }
}

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
    .from("ride_requests")
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
