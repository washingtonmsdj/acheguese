/**
 * Ride operational guards and validation rules.
 */

import { profileService } from "@/core/profiles/services/ProfileService";
import { MotoboyAuthorizationService } from "../services/MotoboyAuthorizationService";
import type { FailedDeliveryMetadata, ResolutionStatus } from "../types/FailedDeliveryMetadata";
import { VALID_FAILURE_REASONS, VALID_ITEM_DESTINATIONS, VALID_ITEM_HOLDERS } from "../types/FailedDeliveryMetadata";
import type { CreateRideInput, TransitionResult } from "./RideOperationalTypes";

export function isProfileSuspended(profile: Record<string, unknown> | null): boolean {
  const suspended = Boolean(profile?.is_suspended ?? profile?.suspended ?? false);
  if (!suspended) return false;

  const suspendedUntil = typeof profile?.suspended_until === "string" ? profile.suspended_until : null;
  if (!suspendedUntil) return true;

  const until = new Date(suspendedUntil);
  return Number.isNaN(until.getTime()) || until > new Date();
}

export async function ensureProfileCanRequest(profileId: string): Promise<TransitionResult | null> {
  const profile = await profileService.getProfileById(profileId).catch(() => null);
  if (!profile) return { success: false, error: "Perfil solicitante nao encontrado." };
  if (isProfileSuspended(profile as Record<string, unknown> | null)) {
    return { success: false, error: "Perfil solicitante suspenso." };
  }
  return null;
}

export async function ensureMotoboyCanOperate(driverProfileId: string): Promise<TransitionResult | null> {
  const authorization = await MotoboyAuthorizationService.canOperateDelivery(driverProfileId);
  if (!authorization.allowed) {
    return { success: false, error: authorization.reason ?? "Motoboy nao autorizado para operar." };
  }
  return null;
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function hasValidRouteCoordinates(input: Pick<CreateRideInput, "originLat" | "originLng" | "destinationLat" | "destinationLng">): boolean {
  return (
    isValidLatitude(input.originLat) &&
    isValidLongitude(input.originLng) &&
    isValidLatitude(input.destinationLat) &&
    isValidLongitude(input.destinationLng)
  );
}

export function validateFailedDeliverySnapshot(metadata: FailedDeliveryMetadata): void {
  if (!metadata.failure_reason || !metadata.item_destination || !metadata.item_current_holder || !metadata.timestamp) {
    throw new Error("Campos obrigatorios do snaposhot ausentes: failure_reason, item_destination, item_current_holder, timestamp");
  }

  if (!VALID_FAILURE_REASONS.includes(metadata.failure_reason)) {
    throw new Error(`failure_reason invalido: ${metadata.failure_reason}`);
  }

  if (!VALID_ITEM_DESTINATIONS.includes(metadata.item_destination)) {
    throw new Error(`item_destination invalido: ${metadata.item_destination}`);
  }

  if (!VALID_ITEM_HOLDERS.includes(metadata.item_current_holder)) {
    throw new Error(`item_current_holder invalido: ${metadata.item_current_holder}`);
  }

  if (metadata.failure_reason === "other" && !metadata.resolution_notes) {
    throw new Error("resolution_notes obrigatorio quando failure_reason = other");
  }

  if (String(metadata.item_current_holder) === "recipient") {
    throw new Error("item_current_holder no pode ser recipient em failed_delivery");
  }
}

export function validateFailedDeliveryResolution(
  resolutionUpdate: {
    resolution_status?: ResolutionStatus;
    resolved_at?: string;
    manual_resolution_owner_profile_id?: string;
  },
): void {
  if (resolutionUpdate.resolution_status === "resolved" && !resolutionUpdate.resolved_at) {
    throw new Error("resolved_at obrigatorio quando resolution_status = resolved");
  }

  if (resolutionUpdate.resolution_status === "escalated" && !resolutionUpdate.manual_resolution_owner_profile_id) {
    throw new Error("manual_resolution_owner_profile_id obrigatorio quando resolution_status = escalated");
  }
}
