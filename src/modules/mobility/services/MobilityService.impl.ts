/**
 * MobilityService - SSOT de mobilidade.
 *
 * Ponto de acesso a leituras administrativas e operacoes runtime de mobilidade.
 *
 * Exporta:
 * - MobilityService: classe estatica para leitura/admin.
 * - mobilityService: instancia singleton para escrita/runtime.
 */

import { supabase } from "@/core/infrastructure/supabase";
const db = supabase as any;
import type { Tables, TablesUpdate } from "@/core/infrastructure/supabase/types.generated";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RIDE_STATUS } from "../constants";

type DriverDataRecord = Tables<"driver_data">;
type RideRequestRecord = Tables<"ride_requests">;
type DriverCompleteProfileRecord = Tables<"driver_complete_profile">;
type MobilityConversationRecord = Record<string, unknown>;
type MobilityMessageRecord = Record<string, unknown>;

// --- Static read/admin API ---------------------------------------------------

export class MobilityService {
  static async getLatestRideBySource(sourceType: string, sourceId: string): Promise<unknown | null> {
    const { data, error } = await db
      .from("ride_requests")
      .select("*")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

  static async getRideSourceIdById(rideId: string, sourceType?: string): Promise<string | null> {
    let query = db
      .from("ride_requests")
      .select("source_id")
      .eq("id", rideId);

    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data?.source_id || null;
  }

  static async listMotoboyDeliveries(filters: {
    status?: string;
    sourceType?: string;
    limit?: number;
  }): Promise<unknown[]> {
    let query = db
      .from("ride_requests")
      .select(
        "id, status, source_type, source_id, recipient_name, package_size, suggested_price, created_at, updated_at, driver_profile_id, pickup_location_id, delivery_notes, failed_delivery_reason",
      )
      .eq("ride_mode", "motoboy")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 200);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.sourceType && filters.sourceType !== "all") {
      query = query.eq("source_type", filters.sourceType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async listMotoboyStatsRows(): Promise<Array<{ status: string; created_at: string; driver_profile_id: string | null }>> {
    const { data, error } = await db
      .from("ride_requests")
      .select("id, status, created_at, driver_profile_id")
      .eq("ride_mode", "motoboy");

    if (error) throw error;
    return (data as Array<{ status: string; created_at: string; driver_profile_id: string | null }>) || [];
  }

  static async countDeliveredBySource(sourceType: string, sourceId: string): Promise<number> {
    const { count, error } = await db
      .from("ride_requests")
      .select("id", { count: "exact", head: true })
      .eq("ride_mode", "motoboy")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .eq("status", "delivered");

    if (error) throw error;
    return count || 0;
  }

  static async countDeliveredMotoboyRides(): Promise<number> {
    const { count, error } = await db
      .from("ride_requests")
      .select("id", { count: "exact", head: true })
      .eq("ride_mode", "motoboy")
      .eq("status", "delivered");

    if (error) throw error;
    return count || 0;
  }

  static async ensureDriverDataRow(
    profileId: string,
    defaults?: { canDoDelivery?: boolean; canDoRides?: boolean },
  ): Promise<void> {
    const { data: existing, error: readError } = await db
      .from("driver_data")
      .select("profile_id")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) return;

    const payload: Record<string, unknown> = { profile_id: profileId };
    if (defaults?.canDoDelivery !== undefined) payload.can_do_delivery = defaults.canDoDelivery;
    if (defaults?.canDoRides !== undefined) payload.can_do_rides = defaults.canDoRides;

    const { error } = await db.from("driver_data").insert(payload as any);
    if (error && error.code !== "23505") throw error;
  }

  static async getDriverRideSessions(driverProfileId: string, limit = 300): Promise<Array<{ started_at: string | null; completed_at: string | null }>> {
    const { data, error } = await db
      .from("ride_requests")
      .select("started_at, completed_at")
      .eq("driver_profile_id", driverProfileId)
      .not("started_at", "is", null)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async listRecentRidePickupLocations(limit = 300): Promise<unknown[]> {
    const { data, error } = await db
      .from("ride_requests")
      .select(`
        pickup_location_id,
        pickup_location:locations!ride_requests_pickup_location_id_fkey (
          id,
          name,
          full_name,
          type,
          geographic_path
        )
      `)
      .not("pickup_location_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getActiveRides(): Promise<unknown[]> {
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

      const { data, error } = await db
        .from("ride_requests")
        .select("*")
        .in("status", activeStatuses)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("MobilityService.getActiveRides", error as Error);
      return [];
    }
  }

  static async getRideById(id: string): Promise<unknown | null> {
    try {
      const { data, error } = await db
        .from("ride_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("MobilityService.getRideById", error as Error);
      return null;
    }
  }

  static async createRide(data: Record<string, unknown>): Promise<unknown> {
    const { data: ride, error } = await db
      .from("ride_requests")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return ride;
  }

  static async getAllRideRequests(): Promise<unknown[]> {
    const { data, error } = await db
      .from("ride_requests")
      .select("*")
      .order("created_at");

    if (error) throw error;
    return data || [];
  }

  static async getRidesByPassenger(passengerProfileId: string): Promise<unknown[]> {
    const { data, error } = await db
      .from("ride_requests")
      .select("*")
      .eq("passenger_profile_id", passengerProfileId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getRidesByDriverProfile(driverProfileId: string): Promise<unknown[]> {
    const { data, error } = await db
      .from("ride_requests")
      .select("*")
      .eq("driver_profile_id", driverProfileId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getActiveRideByDriverProfile(
    driverProfileId: string,
    statuses: string[],
    excludeRideId?: string,
  ): Promise<unknown | null> {
    let query = db
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

  static async getActiveRide(userProfileId: string): Promise<unknown | null> {
    const { data, error } = await db
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

  static async updateRide(rideId: string, updates: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await db
      .from("ride_requests")
      .update(updates)
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateRideWithGuards(
    rideId: string,
    updates: Record<string, unknown>,
    guards: {
      statusEq?: string;
      driverProfileIdEq?: string;
    } = {},
  ): Promise<boolean> {
    let query = db
      .from("ride_requests")
      .update(updates)
      .eq("id", rideId);

    if (guards.statusEq) {
      query = query.eq("status", guards.statusEq);
    }

    if (guards.driverProfileIdEq) {
      query = query.eq("driver_profile_id", guards.driverProfileIdEq);
    }

    const { data, error } = await query.select("id").maybeSingle();
    if (error) throw error;
    return !!data;
  }

  static async updateRideIfStatusIn(
    rideId: string,
    updates: Record<string, unknown>,
    allowedStatuses: string[],
  ): Promise<boolean> {
    const { data, error } = await db
      .from("ride_requests")
      .update(updates)
      .eq("id", rideId)
      .in("status", allowedStatuses)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  static async getRideDispatchData(rideId: string): Promise<unknown | null> {
    const { data, error } = await db
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

  static async createEmergencyAlert(
    rideId: string,
    userId: string,
    location: { lat: number; lng: number },
  ): Promise<void> {
    await db
      .from("emergency_alerts")
      .insert({ ride_id: rideId, user_id: userId, location })
      .throwOnError();
  }

  static async getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
    try {
      const { data, error } = await db
        .from("driver_complete_profile")
        .select("*")
        .order("created_at", { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      logger.error("MobilityService.getDriverProfiles", error as Error);
      return { data: [], error };
    }
  }

  static async getDriverDataByProfileIds(profileIds: string[]): Promise<unknown[]> {
    if (!profileIds.length) return [];

    const { data, error } = await db
      .from("driver_data")
      .select("profile_id, rating, can_do_delivery")
      .in("profile_id", profileIds);

    if (error) throw error;
    return data || [];
  }

  static async getTopDrivers(opts: { minRides?: number; limit?: number } = {}): Promise<unknown[]> {
    try {
      const { minRides = 1, limit = 10 } = opts;
      const { data, error } = await db
        .from("driver_complete_profile")
        .select("profile_id, display_name, avg_rating, total_rides, avatar_url")
        .gte("total_rides", minRides)
        .order("avg_rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const rows: DriverCompleteProfileRecord[] = data || [];
      return rows.map((d) => ({
        id: d.profile_id,
        name: d.display_name,
        rating: d.avg_rating,
        total_rides: d.total_rides,
        profile: { avatar_url: d.avatar_url },
      }));
    } catch (error) {
      logger.error("MobilityService.getTopDrivers", error as Error);
      return [];
    }
  }

  static async getMobilityStats(): Promise<{ total_drivers: number; total_rides: number }> {
    try {
      const [driversResult, ridesResult] = await Promise.all([
        supabase.from("driver_data").select("id", { count: "exact", head: true }),
        supabase.from("ride_requests").select("id", { count: "exact", head: true }),
      ]);

      return {
        total_drivers: driversResult.count || 0,
        total_rides: ridesResult.count || 0,
      };
    } catch (error) {
      logger.error("MobilityService.getMobilityStats", error as Error);
      return { total_drivers: 0, total_rides: 0 };
    }
  }

  /** Retorna corridas concluídas para cálculo de ganhos (uso no WeeklyEarningsChart). */
  static async getDriverEarnings(driverProfileId: string): Promise<unknown[]> {
    try {
      const { data, error } = await db
        .from("ride_requests")
        .select("final_price, completed_at, updated_at")
        .eq("driver_profile_id", driverProfileId)
        .eq("status", RIDE_STATUS.COMPLETED)
        .order("updated_at", { ascending: false});

      if (error) throw error;
      const rows: Pick<RideRequestRecord, "final_price" | "completed_at" | "updated_at">[] = data || [];
      return rows.map((r) => ({
        ...r,
        completed_at: r.completed_at || r.updated_at,
      }));
    } catch (error) {
      logger.error("MobilityService.getDriverEarnings", error as Error);
      return [];
    }
  }

  static async getCompletedRidePaymentsByDriver(
    driverProfileId: string,
    sinceIso?: string,
  ): Promise<unknown[]> {
    let query = db
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
   * Busca perfil completo do motorista (driver_complete_profile)
   * Usado em: TrackRidePage
   */
  static async getDriverCompleteProfile(profileId: string): Promise<{
    display_name: string;
    vehicle_model: string;
    vehicle_color: string;
    vehicle_plate: string;
    avg_rating: number;
  } | null> {
    try {
      const { data, error } = await db
        .from("driver_complete_profile")
        .select("display_name, vehicle_model, vehicle_color, vehicle_plate, avg_rating")
        .eq("profile_id", profileId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("MobilityService.getDriverCompleteProfile", { profileId, error });
      return null;
    }
  }

  /**
   * Busca avaliação média do passageiro
   * Usado em: PassageiroPage
   */
  static async getPassengerRating(profileId: string): Promise<number> {
    try {
      const { data, error } = await db
        .from("ride_ratings")
        .select("rating")
        .eq("rated_id", profileId);

      if (error) {
        logger.warn("MobilityService.getPassengerRating - query error", { profileId, error });
        return 5.0;
      }

      if (!data || data.length === 0) return 5.0;

      const ratings = data
        .map((row: { rating?: unknown }) => Number(row.rating))
        .filter((value: number) => Number.isFinite(value));

      if (ratings.length === 0) return 5.0;

      const avg = ratings.reduce((sum: number, value: number) => sum + value, 0) / ratings.length;
      return Number(avg.toFixed(1));
    } catch (error) {
      logger.error("MobilityService.getPassengerRating", error as Error, { profileId });
      return 5.0;
    }
  }



  /**
   * Remove bairro aceito pelo motorista
   * Usado em: ServiceAreaSettings
   */
  static async deleteDriverNeighborhood(id: string): Promise<{ success: boolean; error?: unknown }> {
    try {
      const { error } = await db
        .from('driver_accepted_neighborhoods')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error("MobilityService.deleteDriverNeighborhood", { id, error });
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      logger.error("MobilityService.deleteDriverNeighborhood", { id, error });
      return { success: false, error };
    }
  }

  /**
   * Remove área de serviço do motorista (genérico)
   * Usado em: ServiceAreaSettings
   */
  static async deleteDriverServiceArea(table: string, id: string): Promise<{ success: boolean; error?: unknown }> {
    try {
      const { error } = await db
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error("MobilityService.deleteDriverServiceArea", { table, id, error });
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      logger.error("MobilityService.deleteDriverServiceArea", { table, id, error });
      return { success: false, error };
    }
  }

  /**
   * Busca conversas de mobilidade do perfil
   * Usado em: MobilityChatList
   */
  static async getMobilityConversations(profileId: string): Promise<MobilityConversationRecord[]> {
    try {
      const { data, error } = await db
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
      logger.error("MobilityService.getMobilityConversations", { profileId, error });
      return [];
    }
  }

  /**
   * Busca última mensagem de uma conversa
   * Usado em: MobilityChatList
   */
  static async getLastMessage(conversationId: string): Promise<Pick<MobilityMessageRecord, "message"> | null> {
    try {
      const { data, error } = await db
        .from("mobility_messages")
        .select("message")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("MobilityService.getLastMessage", { conversationId, error });
      return null;
    }
  }

  /**
   * Conta mensagens não lidas de uma conversa
   * Usado em: MobilityChatList
   */
  static async getUnreadCount(conversationId: string, profileId: string): Promise<number> {
    try {
      const { count, error } = await db
        .from("mobility_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .eq("read", false)
        .neq("sender_profile_id", profileId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("MobilityService.getUnreadCount", { conversationId, profileId, error });
      return 0;
    }
  }
}

// --- Instance (escrita / runtime) --------------------------------------------





export { mobilityService } from "./MobilityRuntimeService";
