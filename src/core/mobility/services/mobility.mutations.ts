/**
 * Mobility Mutations (Core Facade)
 *
 * SSOT: este módulo delega para o serviço canônico de mobilidade.
 */

import { logger } from "@/shared/utils/logger";
import { MobilityService } from "@/modules/mobility/services/MobilityService.impl";
import { RIDE_STATUS } from "./mobility.constants";

export async function createRide(data: Record<string, unknown>): Promise<unknown> {
  return MobilityService.createRide(data);
}

export async function createRideRequest(data: Record<string, unknown>): Promise<unknown> {
  return createRide({ ...data, status: RIDE_STATUS.PENDING });
}

export async function updateRide(rideId: string, updates: Record<string, unknown>): Promise<unknown> {
  return MobilityService.updateRide(rideId, updates);
}

export async function updateRideWithGuards(
  rideId: string,
  updates: Record<string, unknown>,
  guards: {
    statusEq?: string;
    driverProfileIdEq?: string;
  } = {},
): Promise<boolean> {
  return MobilityService.updateRideWithGuards(rideId, updates, guards);
}

export async function updateRideIfStatusIn(
  rideId: string,
  updates: Record<string, unknown>,
  allowedStatuses: string[],
): Promise<boolean> {
  return MobilityService.updateRideIfStatusIn(rideId, updates, allowedStatuses);
}

export async function acceptRide(rideId: string, driverProfileId: string): Promise<void> {
  await updateRide(rideId, {
    driver_profile_id: driverProfileId,
    status: RIDE_STATUS.DRIVER_ACCEPTED,
  });
}

export async function startRide(rideId: string): Promise<void> {
  await updateRide(rideId, { status: RIDE_STATUS.IN_PROGRESS });
}

export async function completeRide(
  rideId: string,
  actualFare?: number,
  distanceKm?: number,
  durationMinutes?: number,
): Promise<void> {
  const updates: Record<string, unknown> = { status: RIDE_STATUS.COMPLETED };
  if (actualFare !== undefined) updates.actual_fare = actualFare;
  if (distanceKm !== undefined) updates.distance_km = distanceKm;
  if (durationMinutes !== undefined) updates.duration_minutes = durationMinutes;
  await updateRide(rideId, updates);
}

export async function confirmRide(rideId: string): Promise<void> {
  await updateRide(rideId, { status: RIDE_STATUS.CONFIRMED });
}

export async function cancelRide(rideId: string): Promise<void> {
  await updateRide(rideId, { status: RIDE_STATUS.CANCELLED });
}

export async function createEmergencyAlert(
  rideId: string,
  userId: string,
  location: { lat: number; lng: number },
): Promise<void> {
  return MobilityService.createEmergencyAlert(rideId, userId, location);
}

export async function incrementRideViewCount(rideId: string): Promise<void> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  await dynamic.mobilityService.incrementRideViewCount(rideId);
}

export async function decrementRideSeats(rideId: string): Promise<void> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  await dynamic.mobilityService.decrementRideSeats(rideId);
}

export async function deleteDriverNeighborhood(id: string): Promise<{ success: boolean; error?: unknown }> {
  return MobilityService.deleteDriverNeighborhood(id);
}

export async function deleteDriverServiceArea(
  table: string,
  id: string,
): Promise<{ success: boolean; error?: unknown }> {
  return MobilityService.deleteDriverServiceArea(table, id);
}

export async function createAdminDriverProfile(userId: string): Promise<unknown | null> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.createAdminDriverProfile(userId);
}

export async function updateDriverOnlineStatus(driverProfileId: string, isOnline: boolean): Promise<void> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  await dynamic.mobilityService.updateDriverOnlineStatus(driverProfileId, isOnline);
}

export async function updateDriverData(
  identifier: string,
  updates: Record<string, unknown>,
): Promise<unknown | null> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.updateDriverData(identifier, updates);
}

export async function checkSuspensionExpiry(profileId: string): Promise<void> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  await dynamic.mobilityService.checkSuspensionExpiry(profileId);
}

export async function updateDriverLocation(
  _driverProfileId: string,
  _location: { latitude: number; longitude: number },
): Promise<void> {
  logger.warn("MobilityMutations.updateDriverLocation - nao implementado, usar GPS tracking");
}
