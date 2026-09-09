/**
 * MOBILITY MUTATIONS - Operações de escrita
 *
 * Responsabilidade única: criar, atualizar e deletar dados
 * - Sem queries de leitura (exceto necessárias para validação)
 * - Orquestração de múltiplas tabelas quando necessário
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { DriverAvailabilityService } from "@/core/mobility/services/DriverAvailabilityService";

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
  insert(values: Record<string, unknown> | Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  delete(): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  single(): Promise<SingleQueryPayload<TRow>>;
  throwOnError(): Promise<void>;
};

type MobilityMutationsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

const mobilityDb = supabase as unknown as MobilityMutationsDbClient;


/**
 * Incrementar contador de visualizações
 */
export async function incrementRideViewCount(rideId: string): Promise<void> {
  try {
    await mobilityDb.rpc("increment_ride_view_count", { ride_id: rideId });
  } catch (error) {
    logger.warn("MobilityMutations.incrementRideViewCount", error);
  }
}

/**
 * Decrementar assentos disponíveis
 */
export async function decrementRideSeats(rideId: string): Promise<void> {
  const { error } = await mobilityDb.rpc("decrement_ride_seats", { ride_id: rideId });
  if (error) {
    logger.error("MobilityMutations.decrementRideSeats", error);
    throw error;
  }
}

/**
 * Remover bairro aceito pelo motorista
 */
export async function deleteDriverNeighborhood(id: string): Promise<{ success: boolean; error?: unknown }> {
  try {
    const { error } = await mobilityDb
      .from("driver_accepted_neighborhoods")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("MobilityMutations.deleteDriverNeighborhood", { id, error });
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    logger.error("MobilityMutations.deleteDriverNeighborhood", { id, error });
    return { success: false, error };
  }
}

/**
 * Remover área de serviço do motorista
 */
export async function deleteDriverServiceArea(
  table: string,
  id: string,
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const { error } = await mobilityDb.from(table).delete().eq("id", id);

    if (error) {
      logger.error("MobilityMutations.deleteDriverServiceArea", { table, id, error });
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    logger.error("MobilityMutations.deleteDriverServiceArea", { table, id, error });
    return { success: false, error };
  }
}

/**
 * Criar perfil de motorista via admin
 */
export async function createAdminDriverProfile(userId: string): Promise<unknown | null> {
  try {
    const driverProfile = await profileService.ensureDriverProfileForUser(userId);
    if (!driverProfile?.id) return null;

    const { data: existing } = await mobilityDb
      .from("driver_data")
      .select("*")
      .eq("profile_id", driverProfile.id)
      .maybeSingle();

    if (existing) return existing;

    const { data: driverData, error: driverError } = await mobilityDb
      .from("driver_data")
      .insert({
        profile_id: driverProfile.id,
        is_online: false,
        is_verified: true,
        subscription_active: true,
        rating: 5.0,
        total_rides: 0,
        total_rides_completed: 0,
        total_rides_cancelled: 0,
        acceptance_rate: 100.0,
        cancellation_rate: 0.0,
      })
      .select("*")
      .single();

    if (driverError) throw driverError;

    logger.info("MobilityMutations.createAdminDriverProfile - created", { userId, profileId: driverProfile.id });
    return driverData;
  } catch (error) {
    logger.error("MobilityMutations.createAdminDriverProfile", error as Error);
    return null;
  }
}

/**
 * Atualizar status online do motorista
 */
export async function updateDriverOnlineStatus(driverProfileId: string, isOnline: boolean): Promise<void> {
  await updateDriverData(driverProfileId, {
    is_online: isOnline,
    is_available: isOnline ? undefined : false,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Atualizar dados do motorista
 */
export async function updateDriverData(
  identifier: string,
  updates: Record<string, unknown>,
): Promise<unknown | null> {
  try {
    // Resolver profile_id se necessário
    let driverProfileId = identifier;
    const profile = await profileService.getProfileById(identifier);
    if (profile?.profile_type === "driver") {
      driverProfileId = profile.id;
    } else {
      const driverProfile = await profileService.getProfileByType(identifier, "driver");
      if (!driverProfile?.id) {
        throw new Error("Driver profile not found");
      }
      driverProfileId = driverProfile.id;
    }

    const { data, error } = await mobilityDb
      .from("driver_data")
      .update(updates)
      .eq("profile_id", driverProfileId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("MobilityMutations.updateDriverData", error as Error, { identifier, updates });
    throw error;
  }
}

/**
 * Verificar expiração de suspensão
 */
export async function checkSuspensionExpiry(profileId: string): Promise<void> {
  try {
    const profile = await profileService.getProfileById(profileId);

    if (!profile?.is_suspended || !profile?.suspended_until) return;

    const suspendedUntil = new Date(profile.suspended_until);
    if (suspendedUntil < new Date()) {
      await profileService.updateProfile(profileId, {
        is_suspended: false,
        suspended: false,
        suspended_until: null,
      });

      logger.info("MobilityMutations.checkSuspensionExpiry - suspension lifted", { profileId });
    }
  } catch (error) {
    logger.error("MobilityMutations.checkSuspensionExpiry", error as Error);
  }
}

