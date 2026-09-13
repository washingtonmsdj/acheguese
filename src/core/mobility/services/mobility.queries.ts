/**
 * MOBILITY QUERIES - leitura de dados.
 *
 * Responsabilidade unica: consultas do dominio de mobilidade.
 * Escritas e transicoes permanecem nos comandos/RPCs canonicos.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { RideRequest } from "@/core/mobility/types/types";
import {
  DRIVER_OWNED_OPEN_RIDE_STATUSES,
  QUERYABLE_OPEN_RIDE_STATUSES,
} from "@/core/mobility/core/RideLifecycleStatus";
import { MobilityDispatchConfigService } from "./MobilityDispatchConfigService";
import {
  DriverRideHistoryReadService,
  type DriverRideHistoryRow,
} from "./DriverRideHistoryReadService";
import {
  RIDE_REQUEST_READ_SELECT,
  toRideRequestReadModel,
  type RideRequestReadRow,
} from "./RideRequestReadModel";

export {
  getMobilityConversations,
  getOperationalVerificationEntries,
  getRideAvailableSeats,
  getRideBasicInfo,
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

export type DriverRideListItem = RideRequest | DriverRideHistoryRow;

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

/** Buscar corrida por ID no contrato bounded de runtime/UI. */
export async function getRideById(id: string): Promise<RideRequest | null> {
  try {
    const { data, error } = await supabaseClient
      .from<RideRequestReadRow>("ride_requests")
      .select(RIDE_REQUEST_READ_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toRideRequestReadModel(data) : null;
  } catch (error) {
    logger.error("MobilityQueries.getRideById", error as Error);
    return null;
  }
}

/** Buscar corridas por passageiro. O passageiro e dono da solicitacao. */
export async function getRidesByPassenger(
  passengerProfileId: string,
): Promise<RideRequest[]> {
  const { data, error } = await supabaseClient
    .from<RideRequestReadRow>("ride_requests")
    .select(RIDE_REQUEST_READ_SELECT)
    .eq("passenger_profile_id", passengerProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(toRideRequestReadModel);
}

/**
 * Buscar corridas do motorista sem manter PII terminal no browser.
 *
 * - ride_requests: apenas estados em que o motorista ja e participante ativo;
 * - get_driver_ride_history: historico terminal redigido e escopado ao owner.
 *
 * Oferta pre-aceite pertence exclusivamente ao MobilityOfferService.
 */
export async function getRidesByDriverProfile(
  driverProfileId: string,
): Promise<DriverRideListItem[]> {
  const [activeResult, history] = await Promise.all([
    supabaseClient
      .from<RideRequestReadRow>("ride_requests")
      .select(RIDE_REQUEST_READ_SELECT)
      .eq("driver_profile_id", driverProfileId)
      .in("status", DRIVER_OWNED_OPEN_RIDE_STATUSES)
      .order("created_at", { ascending: false }),
    DriverRideHistoryReadService.list(driverProfileId),
  ]);

  if (activeResult.error) throw activeResult.error;

  const activeRides = (activeResult.data || []).map(toRideRequestReadModel);
  const rides: DriverRideListItem[] = [...activeRides, ...history];
  return rides.sort(
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
export async function getActiveRide(userProfileId: string): Promise<RideRequest | null> {
  const { data, error } = await supabaseClient
    .from<RideRequestReadRow>("ride_requests")
    .select(RIDE_REQUEST_READ_SELECT)
    .or(`passenger_profile_id.eq.${userProfileId},driver_profile_id.eq.${userProfileId}`)
    .in("status", QUERYABLE_OPEN_RIDE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("MobilityQueries.getActiveRide", error as Error, { userProfileId });
    return null;
  }
  return data ? toRideRequestReadModel(data) : null;
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

/** Normaliza perfil do motorista para shape esperado. */
export function normalizeDriverProfile(profile: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!profile) return null;
  return {
    ...profile,
    profile_id: profile.id,
    user_id: profile.user_id,
    name: profile.name || "Motorista",
    avatar_url: profile.avatar_url,
    rating: profile.rating || 5.0,
  };
}

/** Buscar perfil do passageiro por profile_id. */
export async function getPassengerProfile(passengerId: string): Promise<Record<string, unknown> | null> {
  return profileService.getAccessibleProfileById(passengerId);
}

/** Buscar corridas do usuario - alias para compatibilidade. */
export async function getUserRides(userId: string): Promise<RideRequest[]> {
  const { profile } = await profileService.getCurrentUserWithProfile();
  if (!profile) return [];
  return getRidesByPassenger(profile.id);
}

/** Buscar dados basicos de corrida para verificacao. */
export async function getRideBasic(rideId: string): Promise<{
  id: string;
  status: string | null;
  driver_profile_id: string | null;
  passenger_profile_id: string | null;
} | null> {
  const { data, error } = await supabaseClient
    .from<{
      id: string;
      status: string | null;
      driver_profile_id: string | null;
      passenger_profile_id: string | null;
    }>("ride_requests")
    .select("id, status, driver_profile_id, passenger_profile_id")
    .eq("id", rideId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/** Verificar se viagem esta finalizada. */
export async function isRideCompleted(rideId: string): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from<{ status: string | null }>("ride_requests")
    .select("status")
    .eq("id", rideId)
    .maybeSingle();
  if (error) return false;
  return data?.status === "completed";
}

/** Buscar dados da corrida para pricing (sem joins). */
export async function getRideForPricing(rideId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabaseClient
    .from<Record<string, unknown>>("ride_requests")
    .select("id, ride_mode, delivery_type, delivery_size, distance_km")
    .eq("id", rideId)
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Compatibilidade: preço aceito e campos de distância. */
export async function getRidePricingFields(rideId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabaseClient
    .from<Record<string, unknown>>("ride_requests")
    .select("id, accepted_price, suggested_price, final_price, actual_fare, distance_km")
    .eq("id", rideId)
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Verificar se entregador esta disponivel para nova entrega. */
export async function getDriverAvailability(profileId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabaseClient
    .from<Record<string, unknown>>("driver_availability")
    .select("profile_id, is_available, online_since, last_activity_at, active_ride_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) return null;
  return data;
}

/** Verificacoes de banco do modulo motoboy. */
export async function verifyMotoboyRuntimeDatabase(): Promise<MotoboyRuntimeDatabaseChecks> {
  const details: string[] = [];

  try {
    const rideCheck = await supabaseClient
      .from<Record<string, unknown>>("ride_requests")
      .select("ride_mode, delivery_type, delivery_size, volume_m3")
      .limit(1);
    const driverCheck = await supabaseClient
      .from<Record<string, unknown>>("driver_data")
      .select("vehicle_type, vehicle_subtype, can_do_delivery, can_do_rides")
      .limit(1);
    const availabilityCheck = await supabaseClient
      .from<Record<string, unknown>>("driver_availability")
      .select("profile_id, is_available, active_ride_id")
      .limit(1);
    const pricingCheck = await supabaseClient
      .from<Record<string, unknown>>("mobility_pricing_config")
      .select("ride_mode, is_active")
      .eq("ride_mode", "motoboy")
      .eq("is_active", true)
      .limit(1);
    const driverCapabilityCheck = await supabaseClient
      .from<Record<string, unknown>>("driver_data")
      .select("profile_id")
      .eq("can_do_delivery", true)
      .limit(100);

    const checks = [rideCheck, driverCheck, availabilityCheck, pricingCheck];
    for (const result of checks) {
      if (result.error) details.push(result.error.message ?? "database check failed");
    }

    return {
      rideRequestsColumnsOk: !rideCheck.error,
      driverDataColumnsOk: !driverCheck.error,
      driverAvailabilityColumnsOk: !availabilityCheck.error,
      motoboyPricingActive: !pricingCheck.error && Boolean(pricingCheck.data?.length),
      motoboyEnabledDrivers: driverCapabilityCheck.data?.length ?? 0,
      details,
    };
  } catch (error) {
    details.push(error instanceof Error ? error.message : "database verification failed");
    return {
      rideRequestsColumnsOk: false,
      driverDataColumnsOk: false,
      driverAvailabilityColumnsOk: false,
      motoboyPricingActive: false,
      motoboyEnabledDrivers: 0,
      details,
    };
  }
}
