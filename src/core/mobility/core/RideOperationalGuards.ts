/**
 * Ride operational guards and validation rules.
 */

import { profileService } from "@/core/profiles/services/ProfileService";
import { MotoboyAuthorizationService } from "../services/MotoboyAuthorizationService";
import type {
  FailedDeliveryMetadata,
  FailedDeliveryResolutionUpdate,
  FailedDeliverySnapshotInput,
} from "../types/FailedDeliveryMetadata";
import {
  VALID_FAILURE_REASONS,
  VALID_ITEM_DESTINATIONS,
} from "../types/FailedDeliveryMetadata";
import type { CreateRideInput, TransitionResult } from "./RideOperationalTypes";

const FAILED_DELIVERY_SERVER_OWNED_FIELDS = new Set([
  "next_ride_id",
  "handoff_requested",
  "handoff_driver_profile_id",
  "manual_resolution_owner_profile_id",
  "resolved_at",
  "resolution_action_notes",
  "resolution_item_holder",
  "redelivery_pickup_confirmed_at",
  "resolution_plan",
  "handoff_requested_driver_profile_id",
  "handoff_requested_at",
  "handoff_request_expires_at",
  "handoff_request_distance_m",
  "resolution_action",
  "handoff_from_driver_profile_id",
  "handoff_confirmed_at",
  "handoff_distance_m",
  "handoff_evidence",
  "handoff_accepted_at",
  "handoff_acceptance_source",
  "courier_settlement_allocation_required",
  "custody_handoff_history",
]);

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

export async function ensureMotoboyCanOperate(
  driverProfileId: string,
  activeRideId?: string,
): Promise<TransitionResult | null> {
  const authorization = await MotoboyAuthorizationService.canOperateDelivery(driverProfileId, activeRideId);
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

export function validateFailedDeliverySnapshot(
  metadata: FailedDeliverySnapshotInput | FailedDeliveryMetadata,
): void {
  const rawMetadata = metadata as unknown as Record<string, unknown>;

  if (!metadata.failure_reason || !metadata.item_destination || !metadata.timestamp) {
    throw new Error("Campos obrigatorios do snapshot ausentes: failure_reason, item_destination, timestamp");
  }

  if (!VALID_FAILURE_REASONS.includes(metadata.failure_reason)) {
    throw new Error(`failure_reason invalido: ${metadata.failure_reason}`);
  }

  if (!VALID_ITEM_DESTINATIONS.includes(metadata.item_destination)) {
    throw new Error(`item_destination invalido: ${metadata.item_destination}`);
  }

  if (metadata.item_current_holder !== "driver") {
    throw new Error("item_current_holder deve permanecer driver no snapshot inicial.");
  }

  if (metadata.resolution_status !== "pending") {
    throw new Error("resolution_status deve iniciar como pending.");
  }

  const timestamp = new Date(metadata.timestamp);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("timestamp invalido no snapshot de falha.");
  }

  for (const field of FAILED_DELIVERY_SERVER_OWNED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(rawMetadata, field)) {
      throw new Error(`Campo server-owned nao permitido no snapshot inicial: ${field}`);
    }
  }

  if (metadata.failure_reason === "other" && !metadata.resolution_notes?.trim()) {
    throw new Error("resolution_notes obrigatorio quando failure_reason = other");
  }

  if (metadata.resolution_notes && metadata.resolution_notes.length > 2000) {
    throw new Error("resolution_notes excede o limite permitido.");
  }

  if (metadata.failed_at_location) {
    if (
      !isValidLatitude(metadata.failed_at_location.lat) ||
      !isValidLongitude(metadata.failed_at_location.lng) ||
      typeof metadata.failed_at_location.address !== "string" ||
      metadata.failed_at_location.address.trim().length === 0
    ) {
      throw new Error("failed_at_location invalido.");
    }
  }

  if (
    metadata.photos &&
    (!Array.isArray(metadata.photos) || metadata.photos.some((photo) => typeof photo !== "string" || !photo.trim()))
  ) {
    throw new Error("photos invalido no snapshot de falha.");
  }

  for (const [field, value] of [
    ["attempt_number", metadata.attempt_number],
    ["attempted_delivery_count", metadata.attempted_delivery_count],
  ] as const) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      throw new Error(`${field} deve ser inteiro nao negativo.`);
    }
  }
}

export function validateFailedDeliveryResolution(
  resolutionUpdate: FailedDeliveryResolutionUpdate,
): void {
  if (
    resolutionUpdate.resolution_status === "escalated" &&
    !resolutionUpdate.manual_resolution_owner_profile_id
  ) {
    throw new Error(
      "manual_resolution_owner_profile_id obrigatorio quando resolution_status = escalated",
    );
  }

  const hasHandoffTarget = Boolean(resolutionUpdate.handoff_driver_profile_id?.trim());
  if (hasHandoffTarget && resolutionUpdate.handoff_requested !== true) {
    throw new Error(
      "handoff_driver_profile_id exige handoff_requested=true; custodia nao pode ser transferida por resolucao administrativa direta.",
    );
  }

  if (resolutionUpdate.handoff_requested === true) {
    if (!hasHandoffTarget) {
      throw new Error("handoff_driver_profile_id obrigatorio para solicitar handoff.");
    }
    if (!resolutionUpdate.resolution_action_notes?.trim()) {
      throw new Error("resolution_action_notes obrigatorio para solicitar handoff.");
    }
    if (
      resolutionUpdate.resolution_status !== undefined &&
      resolutionUpdate.resolution_status !== "in_progress"
    ) {
      throw new Error("resolution_status do handoff deve ser in_progress.");
    }
    if (resolutionUpdate.next_ride_id || resolutionUpdate.manual_resolution_owner_profile_id) {
      throw new Error("handoff nao pode ser combinado com reentrega ou escalonamento manual.");
    }
  }
}
