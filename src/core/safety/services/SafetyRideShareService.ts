import { isDriverOwnedOpenRideStatus } from "@/core/mobility/core/RideLifecycleStatus";
import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { SAFETY_RIDE_SHARE_POLICY } from "../config/rideSharePolicy";
import type {
  CreateRideShareInput,
  RideShare,
  SafetyResult,
  SharedRideData,
} from "../types";

type RideShareRow = Database["public"]["Tables"]["ride_shares"]["Row"];

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface SafetyRideShareDbClient {
  rpc: <TRow = never>(
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<QueryResult<TRow>>;
}

type RideShareDeps = {
  getShareExpirationHours: () => number;
};

type SharedRideRpcRow = {
  ride_id: string;
  ride_status: string;
  origin: string;
  destination: string;
  driver_name: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
};

const safetyRideShareDb = supabase as unknown as SafetyRideShareDbClient;

function toRideShare(row: RideShareRow): RideShare {
  return {
    id: row.id,
    rideId: row.ride_id,
    shareToken: row.share_token,
    shareUrl: `${window.location.origin}/track/${row.share_token}`,
    status: row.status as RideShare["status"],
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at ?? undefined,
  };
}

export class SafetyRideShareService {
  constructor(private readonly deps: RideShareDeps) {}

  async createRideShare(input: CreateRideShareInput): Promise<SafetyResult<RideShare>> {
    try {
      const expirationHours =
        input.expiresInHours ?? this.deps.getShareExpirationHours();

      if (
        !Number.isInteger(expirationHours) ||
        expirationHours < SAFETY_RIDE_SHARE_POLICY.minExpirationHours ||
        expirationHours > SAFETY_RIDE_SHARE_POLICY.maxExpirationHours
      ) {
        throw new Error(
          `A validade do compartilhamento deve ficar entre ${SAFETY_RIDE_SHARE_POLICY.minExpirationHours} e ${SAFETY_RIDE_SHARE_POLICY.maxExpirationHours} horas.`,
        );
      }

      if (input.rideId == null || input.createdBy == null) {
        throw new Error("Corrida e perfil criador são obrigatórios.");
      }

      const { data, error } = await safetyRideShareDb.rpc<RideShareRow>(
        "create_safety_ride_share",
        {
          p_ride_id: input.rideId,
          p_created_by: input.createdBy,
          p_expires_in_hours: expirationHours,
        },
      );

      if (error || !data) {
        throw error ?? new Error("Failed to create ride share");
      }

      return { success: true, data: toRideShare(data) };
    } catch (error) {
      logger.error("[SafetyRideShareService] Error creating ride share:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao criar compartilhamento",
      };
    }
  }

  async getSharedRideData(shareToken: string): Promise<SharedRideData | null> {
    try {
      const { data: rows, error } = await safetyRideShareDb.rpc<
        SharedRideRpcRow[]
      >("get_shared_ride_safety_data", { p_share_token: shareToken });

      if (error) throw error;
      const data = rows?.[0];
      if (!data) return null;

      // G122 defense in depth: `driver_assigned` is only an offer relationship.
      // A public bearer link must not expose proposed-driver identity, vehicle or
      // exact coordinates before the driver becomes an accepted participant.
      // The database RPC remains the final authority and must enforce the same
      // boundary once the pending server-side migration can be validated/applied.
      const canExposeDriverOperationalData = isDriverOwnedOpenRideStatus(
        data.ride_status,
      );

      const currentLocation =
        canExposeDriverOperationalData &&
        data.current_lat != null &&
        data.current_lng != null &&
        data.location_updated_at
          ? {
              latitude: data.current_lat,
              longitude: data.current_lng,
              timestamp: data.location_updated_at,
            }
          : undefined;

      return {
        rideId: data.ride_id,
        status: data.ride_status,
        origin: data.origin,
        destination: data.destination,
        driverName: canExposeDriverOperationalData
          ? data.driver_name ?? undefined
          : undefined,
        vehicleModel: canExposeDriverOperationalData
          ? data.vehicle_model ?? undefined
          : undefined,
        vehiclePlate: canExposeDriverOperationalData
          ? data.vehicle_plate ?? undefined
          : undefined,
        currentLocation,
      };
    } catch (error) {
      logger.error("[SafetyRideShareService] Error getting shared ride data:", error);
      return null;
    }
  }

  async revokeRideShare(shareId: string): Promise<SafetyResult<void>> {
    try {
      const { error } = await safetyRideShareDb.rpc<boolean>(
        "revoke_safety_ride_share",
        { p_share_id: shareId },
      );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error("[SafetyRideShareService] Error revoking ride share:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao revogar compartilhamento",
      };
    }
  }
}
