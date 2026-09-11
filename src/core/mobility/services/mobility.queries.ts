/**
 * MOBILITY QUERIES - leitura de dados.
 *
 * Responsabilidade unica: consultas do dominio de mobilidade.
 * Escritas e transicoes permanecem nos comandos/RPCs canonicos.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import {
  DRIVER_OWNED_OPEN_RIDE_STATUSES,
  QUERYABLE_OPEN_RIDE_STATUSES,
} from "@/core/mobility/core/RideLifecycleStatus";
import { MobilityDispatchConfigService } from "./MobilityDispatchConfigService";
import { DriverRideHistoryReadService } from "./DriverRideHistoryReadService";

export {
  getMobilityConversations,
  getOperationalVerificationEntries,
  getRideAvailableSeats,
  getRideBasicInfo,
  getRideStateAuditEntries,
  getRideWithAddresses,
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

function rideSortTimestamp(ride: unknown): number {
  if (!ride || typeof ride !== "object" || Array.isArray(ride)) return 0;
  const row = ride as Record<string, unknown>;
  for (const field of ["completed_at", "delivered_at", "updated_at", "created_at"]) {
    const value = row[field];
    if (typeof value !== "string") continue;
    const timestamp = new Date(value).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return 0;
}

/**
 * Buscar corridas com ciclo operacional ainda aberto.
 * A lista pertence ao state machine; nao replique subconjuntos locais aqui.
 */
export async function getActiveRides(): Promise<unknown[]> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests")
      .select("*")
      .in("status", QUERYABLE_OPEN_RIDE_STATUSES)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("MobilityQueries.getActiveRides", error as Error);
    return [];
  }
}

/** Buscar corrida por ID. */
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

/** Buscar todas as solicitacoes de corrida. */
export async function getAllRideRequests(): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("ride_requests")
    .select("*")
    .order("created_at");

  if (error) throw error;
  return data || [];
}

/** Buscar corridas por passageiro. O passageiro e dono da solicitacao. */
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
 * Buscar corridas do motorista sem manter PII terminal no browser.
 *
 * - ride_requests: apenas estados em que o motorista ja e participante ativo;
 * - get_driver_ride_history: historico terminal redigido e escopado ao owner.
 *
 * Oferta pre-aceite pertence exclusivamente ao MobilityOfferService.
 */
export async function getRidesByDriverProfile(driverProfileId: string): Promise<unknown[]> {
  const [activeResult, history] = await Promise.all([
    supabaseClient
      .from("ride_requests")
      .select("*")
      .eq("driver_profile_id", driverProfileId)
      .in("status", DRIVER_OWNED_OPEN_RIDE_STATUSES)
      .order("created_at", { ascending: false }),
    DriverRideHistoryReadService.list(driverProfileId),
  ]);

  if (activeResult.error) throw activeResult.error;

  return [...(activeResult.data || []), ...history].sort(
    (left, right) => rideSortTimestamp(right) - rideSortTimestamp(left),
  );
}

/** Buscar corrida ativa por perfil de motorista. */
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

/** Buscar a corrida aberta mais recente do usuario (passageiro ou motorista). */
export async function getActiveRide(userProfileId: string): Promise<unknown | null> {
  const { data, error } = await supabaseClient
    .from("ride_requests")
    .select("*")
    .or(`passenger_profile_id.eq.${userProfileId},driver_profile_id.eq.${userProfileId}`)
    .in("status", QUERYABLE_OPEN_RIDE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("MobilityQueries.getActiveRide", error as Error, { userProfileId });
    return null;
  }
  return data || null;
}

/** Buscar dados de dispatch da corrida. */
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

/** Buscar corridas do usuario (passageiro ou motorista) pelo perfil ativo. */
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

/** Buscar dados do motorista por ID de perfil. */
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

/** Buscar estatisticas detalhadas do motorista. */
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
