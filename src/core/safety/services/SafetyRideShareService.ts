import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
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
        !Number.isInteger(expirationHours)
        || expirationHours < 1
        || expirationHours > 168
      ) {
        throw new Error("A validade do compartilhamento deve ficar entre 1 e 168 horas.");
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
        error: error instanceof Error ? error.message : "Erro ao criar compartilhamento",
      };
    }
  }

  async getSharedRideData(shareToken: string): Promise<SharedRideData | null> {
    try {
      const { data: rows, error } = await safetyRideShareDb.rpc<SharedRideRpcRow[]>(
        "get_shared_ride_safety_data",
        { p_share_token: shareToken },
      );

      if (error) throw error;
      const data = rows?.[0];
      if (!data) return null;

      const currentLocation =
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
        driverName: data.driver_name ?? undefined,
        vehicleModel: data.vehicle_model ?? undefined,
        vehiclePlate: data.vehicle_plate ?? undefined,
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
        error: error instanceof Error ? error.message : "Erro ao revogar compartilhamento",
      };
    }
  }

}
