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
import { sanitizeDriverSelfServiceUpdate } from "./driverDataSelfService";

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

    const safeUpdates = sanitizeDriverSelfServiceUpdate(updates);
    if (Object.keys(safeUpdates).length === 0) {
      const { data, error } = await mobilityDb
        .from("driver_data")
        .select("*")
        .eq("profile_id", driverProfileId)
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await mobilityDb.rpc<Record<string, unknown>>(
      "update_owned_driver_data",
      {
        p_profile_id: driverProfileId,
        p_updates: safeUpdates,
      },
    );

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
      await profileService.clearExpiredSuspension(profileId);

      logger.info("MobilityMutations.checkSuspensionExpiry - suspension lifted", { profileId });
    }
  } catch (error) {
    logger.error("MobilityMutations.checkSuspensionExpiry", error as Error);
  }
}
