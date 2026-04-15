// @ts-nocheck
/**
 * ðŸ” MOBILITY QUERIES â€” Leitura de dados
 * 
 * Responsabilidade Ãºnica: todas as operaÃ§Ãµes de consulta (SELECT)
 * - Sem escritas (INSERT/UPDATE/DELETE)
 * - Sem lÃ³gica de negÃ³cio complexa
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RIDE_STATUS } from "../constants";

const supabaseClient = supabase;

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const typed = error as { code?: string; message?: string };
  return typed.code === "42703" || typed.message?.toLowerCase().includes("column") === true;
}

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

export interface DriverOfferCapabilitiesRow {
  is_verified: boolean | null;
  is_suspended: boolean | null;
  subscription_active: boolean | null;
  can_do_delivery: boolean | null;
  can_do_rides: boolean | null;
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
 * Buscar corridas ativas (status em andamento)
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
 * Buscar corrida por ID
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
 * Buscar todas as solicitaÃ§Ãµes de corrida
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
 * Buscar corridas por passageiro
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
 * Buscar corridas por motorista
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
 * Buscar corrida ativa por perfil de motorista
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
 * Buscar corrida ativa do usuÃ¡rio (passageiro ou motorista)
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
 * Buscar dados de dispatch da corrida
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
    .from("ride_requests")
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
    .from("ride_requests")
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
    .from("ride_requests")
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
    .from("ride_requests")
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

export async function getDriverOfferCapabilities(
  driverProfileId: string,
): Promise<DriverOfferCapabilitiesRow | null> {
  const queryWithRideCapability = await supabaseClient
    .from("driver_data")
    .select("is_verified, is_suspended, subscription_active, can_do_delivery, can_do_rides")
    .eq("profile_id", driverProfileId)
    .maybeSingle();

  if (!queryWithRideCapability.error) {
    return (queryWithRideCapability.data as DriverOfferCapabilitiesRow | null) ?? null;
  }

  if (!isMissingColumnError(queryWithRideCapability.error)) {
    throw queryWithRideCapability.error;
  }

  const legacyQuery = await supabaseClient
    .from("driver_data")
    .select("is_verified, is_suspended, subscription_active, can_do_delivery")
    .eq("profile_id", driverProfileId)
    .maybeSingle();

  if (legacyQuery.error) throw legacyQuery.error;
  if (!legacyQuery.data) return null;

  return {
    ...(legacyQuery.data as Omit<DriverOfferCapabilitiesRow, "can_do_rides">),
    can_do_rides: true,
  };
}

/**
 * Buscar perfis de motoristas
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
 * Buscar dados de motorista por IDs de perfil
 */
export async function getDriverDataByProfileIds(profileIds: string[]): Promise<unknown[]> {
  if (!profileIds.length) return [];

  const queryWithRideCapability = await supabaseClient
    .from("driver_data")
    .select("profile_id, rating, can_do_delivery, can_do_rides")
    .in("profile_id", profileIds);

  if (!queryWithRideCapability.error) {
    return queryWithRideCapability.data || [];
  }

  if (!isMissingColumnError(queryWithRideCapability.error)) {
    throw queryWithRideCapability.error;
  }

  const legacyQuery = await supabaseClient
    .from("driver_data")
    .select("profile_id, rating, can_do_delivery")
    .in("profile_id", profileIds);

  if (legacyQuery.error) throw legacyQuery.error;

  return (legacyQuery.data || []).map((row: { [key: string]: unknown }) => ({
    ...row,
    can_do_rides: true,
  }));
}

/**
 * Buscar top motoristas
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
 * EstatÃ­sticas de mobilidade
 */
export async function getMobilityStats(): Promise<{ total_drivers: number; total_rides: number }> {
  try {
    const [driversResult, ridesResult] = await Promise.all([
      supabaseClient.from("driver_data").select("id", { count: "exact", head: true }),
      supabaseClient.from("ride_requests").select("id", { count: "exact", head: true }),
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
 * Ganhos do motorista (corridas concluÃ­das)
 */
export async function getDriverEarnings(driverProfileId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests")
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
 * Pagamentos de corridas concluÃ­das por motorista
 */
export async function getCompletedRidePaymentsByDriver(
  driverProfileId: string,
  sinceIso?: string,
): Promise<unknown[]> {
  let query = supabaseClient
    .from("ride_requests")
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
 * Perfil completo do motorista
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
 * Rating do passageiro (placeholder)
 */
export async function getPassengerRating(profileId: string): Promise<number> {
  try {
    logger.info("MobilityQueries.getPassengerRating", {
      profileId,
      note: "Tabela ride_ratings nÃ£o disponÃ­vel, retornando rating padrÃ£o",
    });
    return 5.0;
  } catch (error) {
    logger.error("MobilityQueries.getPassengerRating", error as Error, { profileId });
    return 5.0;
  }
}

/**
 * Conversas de mobilidade do perfil
 */
export async function getMobilityConversations(profileId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabaseClient
      .from("mobility_conversations")
      .select(`
        id,
        ride_id,
        passenger_profile_id,
        driver_profile_id,
        created_at,
        updated_at
      `)
      .or(`passenger_profile_id.eq.${profileId},driver_profile_id.eq.${profileId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("MobilityQueries.getMobilityConversations", { profileId, error });
    return [];
  }
}

/**
 * Ãšltima mensagem de uma conversa
 */
export async function getLastMessage(conversationId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("mobility_messages")
      .select("message")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getLastMessage", { conversationId, error });
    return null;
  }
}

/**
 * Contar mensagens nÃ£o lidas
 */
export async function getUnreadCount(conversationId: string, profileId: string): Promise<number> {
  try {
    const { count, error } = await supabaseClient
      .from("mobility_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("read", false)
      .neq("sender_profile_id", profileId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error("MobilityQueries.getUnreadCount", { conversationId, profileId, error });
    return 0;
  }
}

/**
 * Corridas disponÃ­veis (para motoristas)
 * 
 * @deprecated Use MobilityOfferService ao invÃ©s desta funÃ§Ã£o genÃ©rica
 * 
 * PROBLEMA: Esta funÃ§Ã£o retorna TODAS as corridas sem considerar:
 * - EstratÃ©gia de dispatch (exclusive vs open board)
 * - Elegibilidade do motorista
 * - ProteÃ§Ã£o de dados sensÃ­veis
 * - Scoring e ordenaÃ§Ã£o
 * 
 * SOLUÃ‡ÃƒO: Use MobilityOfferService.getExclusiveOffer() ou getOpenBoardOffers()
 * 
 * Mantido apenas para compatibilidade temporÃ¡ria
 */
export async function getAvailableRides(limit: number = 10): Promise<unknown[]> {
  logger.warn('getAvailableRides is deprecated. Use MobilityOfferService instead.');
  
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests")
      .select(`
        *,
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
        origin: typed.origin || typed.pickup_address?.street || "Origem nÃ£o informada",
        destination: typed.destination || typed.dropoff_address?.street || "Destino nÃ£o informado",
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
 * Buscar corridas do usuÃ¡rio (passageiro ou motorista)
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
 * Buscar corrida com endereÃ§os completos
 */
export async function getRideWithAddresses(rideId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests")
      .select(`
        *,
        pickup_address:addresses!pickup_address_id(street, latitude, longitude),
        dropoff_address:addresses!dropoff_address_id(street, latitude, longitude),
        pickup_location:locations!pickup_location_id(name),
        dropoff_location:locations!dropoff_location_id(name)
      `)
      .eq("id", rideId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getRideWithAddresses", error as Error);
    return null;
  }
}

/**
 * InformaÃ§Ãµes bÃ¡sicas da corrida
 */
export async function getRideBasicInfo(rideId: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests")
      .select("id, origin, destination, status, final_price, suggested_price")
      .eq("id", rideId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getRideBasicInfo", error as Error);
    return null;
  }
}

/**
 * Buscar corrida por token de compartilhamento
 */
export async function getRideByShareToken(token: string): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests")
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityQueries.getRideByShareToken", error as Error);
    return null;
  }
}

/**
 * Assentos disponÃ­veis na corrida
 */
export async function getRideAvailableSeats(rideId: string): Promise<number> {
  try {
    const { data, error } = await supabaseClient
      .from("ride_requests")
      .select("available_seats")
      .eq("id", rideId)
      .maybeSingle();

    if (error) throw error;
    return (data as { available_seats?: number } | null)?.available_seats ?? 0;
  } catch (error) {
    logger.error("MobilityQueries.getRideAvailableSeats", error as Error);
    return 0;
  }
}

/**
 * Buscar dados do motorista por ID de perfil
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
 * Buscar estatÃ­sticas detalhadas do motorista
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

export async function getRideStateAuditEntries(
  rideId: string,
  limit: number = 30,
): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("ride_state_audit")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getOperationalVerificationEntries(
  rideId: string,
  limit: number = 5,
): Promise<unknown[]> {
  const { data, error } = await supabaseClient
    .from("operational_verifications")
    .select("*")
    .eq("ride_id", rideId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * HistÃ³rico de corridas do usuÃ¡rio
 * @deprecated Use getUserRides() - mesmo comportamento
 */
export async function getRideHistory(
  userId: string,
  _filters?: Record<string, unknown>,
): Promise<unknown[]> {
  // Delega para getUserRides (mesma funcionalidade)
  return getUserRides(userId);
}

/**
 * LocalizaÃ§Ã£o do motorista
 * @deprecated NÃ£o implementado - usar GPS tracking diretamente
 */
export async function getDriverLocation(_driverProfileId: string): Promise<unknown | null> {
  logger.warn("MobilityQueries.getDriverLocation - nÃ£o implementado, usar GPS tracking");
  return null;
}

