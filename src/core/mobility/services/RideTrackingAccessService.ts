import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { TrackingPosition } from "@/core/tracking";

export interface RideScopedTrackingAccess {
  trackingAllowed: boolean;
  driverProfileId: string | null;
  rideStatus: string;
  position: TrackingPosition | null;
}

export interface RideTrackingAccessResult {
  success: boolean;
  data?: RideScopedTrackingAccess;
  error?: string;
}

type RideTrackingRpcPayload = {
  tracking_allowed?: unknown;
  driver_profile_id?: unknown;
  ride_status?: unknown;
  location?: unknown;
};

type RideTrackingLocationPayload = {
  latitude?: unknown;
  longitude?: unknown;
  accuracy?: unknown;
  heading?: unknown;
  speed?: unknown;
  timestamp?: unknown;
};

type RpcError = { message?: string | null } | null;
type RideTrackingRpcClient = {
  rpc<T = unknown>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<{ data: T | null; error: RpcError }>;
};

const trackingRpc = supabase as unknown as RideTrackingRpcClient;

function optionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parsePosition(value: unknown): TrackingPosition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const raw = value as RideTrackingLocationPayload;
  if (
    typeof raw.latitude !== "number" ||
    !Number.isFinite(raw.latitude) ||
    typeof raw.longitude !== "number" ||
    !Number.isFinite(raw.longitude) ||
    typeof raw.timestamp !== "string"
  ) {
    return null;
  }

  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    accuracy: optionalFiniteNumber(raw.accuracy) ?? 0,
    heading: optionalFiniteNumber(raw.heading),
    speed: optionalFiniteNumber(raw.speed),
    timestamp: raw.timestamp,
  };
}

/**
 * Passenger/ride-facing precise tracking access.
 *
 * The caller supplies only a ride id. Participant authorization, driver
 * binding and lifecycle eligibility are derived in Postgres by
 * mobility_get_driver_location_for_ride. This is intentionally separate from
 * TrackingService.getCurrentPosition(driverProfileId), which remains useful for
 * driver self-observation and non-passenger operational tooling.
 */
export class RideTrackingAccessService {
  static async getDriverPositionForRide(
    rideId: string,
  ): Promise<RideTrackingAccessResult> {
    try {
      const { data, error } = await trackingRpc.rpc<RideTrackingRpcPayload>(
        "mobility_get_driver_location_for_ride",
        { p_ride_id: rideId },
      );

      if (error) {
        throw new Error(error.message || "Ride tracking access denied");
      }
      if (!data || typeof data.tracking_allowed !== "boolean") {
        throw new Error("Invalid ride tracking access response");
      }

      return {
        success: true,
        data: {
          trackingAllowed: data.tracking_allowed,
          driverProfileId:
            typeof data.driver_profile_id === "string"
              ? data.driver_profile_id
              : null,
          rideStatus:
            typeof data.ride_status === "string" ? data.ride_status : "unknown",
          position: parsePosition(data.location),
        },
      };
    } catch (error) {
      logger.error("RideTrackingAccessService.getDriverPositionForRide", error as Error, {
        rideId,
      });
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ride tracking access unavailable",
      };
    }
  }
}
