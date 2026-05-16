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
import { RIDE_STATUS } from "../constants";
import { DriverAvailabilityService } from "@/modules/mobility/services/DriverAvailabilityService";


/**
 * Criar nova corrida
 */
export async function createRide(data: Record<string, unknown>): Promise<unknown> {
  const { data: ride, error } = await supabase
    .from("ride_requests")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return ride;
}

/**
 * Criar solicitação de corrida (alias para createRide)
 */
export async function createRideRequest(data: Record<string, unknown>): Promise<unknown> {
  return createRide({ ...data, status: RIDE_STATUS.PENDING });
}

/**
 * Atualizar corrida
 */
export async function updateRide(rideId: string, updates: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from("ride_requests")
    .update(updates)
    .eq("id", rideId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atualizar corrida com guards (validações de estado)
 */
export async function updateRideWithGuards(
  rideId: string,
  updates: Record<string, unknown>,
  guards: {
    statusEq?: string;
    driverProfileIdEq?: string;
  } = {},
): Promise<boolean> {
  let query = supabase
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

/**
 * Atualizar corrida apenas se status permitido
 */
export async function updateRideIfStatusIn(
  rideId: string,
  updates: Record<string, unknown>,
  allowedStatuses: string[],
): Promise<boolean> {
  const { data, error } = await supabase
    .from("ride_requests")
    .update(updates)
    .eq("id", rideId)
    .in("status", allowedStatuses)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Aceitar corrida
 */
export async function acceptRide(rideId: string, driverProfileId: string): Promise<void> {
  await updateRide(rideId, {
    driver_profile_id: driverProfileId,
    status: RIDE_STATUS.DRIVER_ACCEPTED,
  });
}

/**
 * Iniciar corrida
 */
export async function startRide(rideId: string): Promise<void> {
  await updateRide(rideId, { status: RIDE_STATUS.IN_PROGRESS });
}

/**
 * Completar corrida
 */
export async function completeRide(
  rideId: string,
  actualFare?: number,
  distanceKm?: number,
  durationMinutes?: number,
): Promise<void> {
  const updates: Record<string, unknown> = {
    status: RIDE_STATUS.COMPLETED,
  };
  if (actualFare !== undefined) updates.actual_fare = actualFare;
  if (distanceKm !== undefined) updates.distance_km = distanceKm;
  if (durationMinutes !== undefined) updates.duration_minutes = durationMinutes;

  await updateRide(rideId, updates);
}

/**
 * Confirmar corrida (passageiro)
 */
export async function confirmRide(rideId: string): Promise<void> {
  await updateRide(rideId, { status: RIDE_STATUS.CONFIRMED });
}

/**
 * Cancelar corrida
 */
export async function cancelRide(rideId: string, reason?: string): Promise<void> {
  const trimmedReason = reason?.trim();
  await updateRide(rideId, {
    status: RIDE_STATUS.CANCELLED,
    cancellation_reason: trimmedReason || null,
    cancelled_at: new Date().toISOString(),
  });
}

/**
 * Criar alerta de emergência
 */
export async function createEmergencyAlert(
  rideId: string,
  userId: string,
  location: { lat: number; lng: number },
): Promise<void> {
  await supabase
    .from("emergency_alerts")
    .insert({ ride_id: rideId, user_id: userId, location })
    .throwOnError();
}

/**
 * Incrementar contador de visualizações
 */
export async function incrementRideViewCount(rideId: string): Promise<void> {
  try {
    await supabase.rpc("increment_ride_view_count", { ride_id: rideId });
  } catch (error) {
    logger.warn("MobilityMutations.incrementRideViewCount", error);
  }
}

/**
 * Decrementar assentos disponíveis
 */
export async function decrementRideSeats(rideId: string): Promise<void> {
  const { error } = await supabase.rpc("decrement_ride_seats", { ride_id: rideId });
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
    const { error } = await supabase
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
    const { error } = await supabase.from(table).delete().eq("id", id);

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

    const { data: existing } = await supabase
      .from("driver_data")
      .select("*")
      .eq("profile_id", driverProfile.id)
      .maybeSingle();

    if (existing) return existing;

    const { data: driverData, error: driverError } = await supabase
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

    const { data, error } = await supabase
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

/**
 * Atualizar localização do motorista
 * @deprecated Implementação futura - usar serviço de GPS tracking
 */
export async function updateDriverLocation(
  driverProfileId: string,
  location: { latitude: number; longitude: number },
): Promise<void> {
  const { latitude, longitude } = location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Coordenadas invalidas para updateDriverLocation");
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("driver_availability")
    .update({
      current_lat: latitude,
      current_lng: longitude,
      last_location_update: nowIso,
      last_seen_at: nowIso,
      updated_at: nowIso,
    })
    .eq("profile_id", driverProfileId);

  if (error) {
    logger.error("MobilityMutations.updateDriverLocation", error, {
      driverProfileId,
      location,
    });
    throw error;
  }

  await updateDriverData(driverProfileId, {
    last_location_update: nowIso,
    updated_at: nowIso,
  });
  await DriverAvailabilityService.markLastSeen(driverProfileId);
}
