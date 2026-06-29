import { SAFETY_RIDE_SHARE_STATUS } from "@/core/safety/constants/status";
import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { secureRandomString } from "@/shared/utils/secureRandom";
import type {
  CreateRideShareInput,
  RideShare,
  SafetyAuditEntry,
  SafetyResult,
  SharedRideData,
} from "../types";

type RideShareRow = Database["public"]["Tables"]["ride_shares"]["Row"];
type RideShareInsert = Database["public"]["Tables"]["ride_shares"]["Insert"];
type RideShareUpdate = Database["public"]["Tables"]["ride_shares"]["Update"];
type DriverLocationRow = Database["public"]["Tables"]["driver_locations"]["Row"];

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QueryResult<TRow>>;
  single: () => Promise<QueryResult<TRow>>;
}

interface SafetyRideShareDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

type RideShareDeps = {
  getShareExpirationHours: () => number;
  createAuditEntry: (entry: Omit<SafetyAuditEntry, "id" | "createdAt">) => Promise<void>;
  sendSafetyNotification: (
    profileId: string,
    type: "alert" | "share" | "incident",
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ) => Promise<void>;
};

type SharedRideRow = Pick<RideShareRow, "ride_id" | "expires_at" | "status">;

type RideData = {
  id?: string | null;
  status?: string | null;
  origin?: string | null;
  destination?: string | null;
  driver_profile_id?: string | null;
  passenger_profile_id?: string | null;
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
      const token = this.generateShareToken();
      const expirationHours = input.expiresInHours || this.deps.getShareExpirationHours();
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

      const insertPayload: RideShareInsert = {
        ride_id: input.rideId,
        share_token: token,
        status: SAFETY_RIDE_SHARE_STATUS.ACTIVE,
        created_by: input.createdBy,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await safetyRideShareDb
        .from<RideShareRow>("ride_shares")
        .insert(insertPayload)
        .select()
        .single();

      if (error || !data) throw error ?? new Error("Failed to create ride share");

      const rideShare = toRideShare(data);

      await this.deps.createAuditEntry({
        action: "share_created",
        entityType: "share",
        entityId: data.id,
        performedBy: input.createdBy,
        metadata: { expiresAt },
      });

      await this.deps.sendSafetyNotification(
        input.createdBy,
        "share",
        "Compartilhamento de Viagem Criado",
        `Link de rastreamento criado com sucesso. Expira em ${expirationHours}h.`,
        { shareId: data.id, shareUrl: rideShare.shareUrl },
      );

      return { success: true, data: rideShare };
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
      const { data: shareData, error: shareError } = await safetyRideShareDb
        .from<SharedRideRow>("ride_shares")
        .select("ride_id, expires_at, status")
        .eq("share_token", shareToken)
        .eq("status", SAFETY_RIDE_SHARE_STATUS.ACTIVE)
        .maybeSingle();

      if (shareError) throw shareError;
      if (!shareData) return null;

      if (new Date(shareData.expires_at) < new Date()) {
        return null;
      }

      const { MobilityService: mobilityService } = await import("@/core/mobility/services/runtime");
      const rideData = (await mobilityService.getRideById(shareData.ride_id)) as RideData | null;
      if (!rideData) return null;

      let driverName: string | undefined;
      let vehicleModel: string | undefined;
      let vehiclePlate: string | undefined;

      if (rideData.driver_profile_id) {
        const { MobilityService } = await import("@/core/mobility/services/runtime");
        const { profileService } = await import("@/core/profiles");

        const [driverCompleteProfile, driverProfile] = await Promise.all([
          MobilityService.getDriverCompleteProfile(rideData.driver_profile_id),
          profileService.getProfileById(rideData.driver_profile_id),
        ]);

        driverName = driverProfile?.name;
        vehicleModel = driverCompleteProfile?.vehicle_model;
        vehiclePlate = driverCompleteProfile?.vehicle_plate;
      }

      let currentLocation:
        | {
            latitude: number;
            longitude: number;
            timestamp: string;
          }
        | undefined;

      if (rideData.driver_profile_id) {
        const { data: locationData } = await safetyRideShareDb
          .from<Pick<DriverLocationRow, "lat" | "lng" | "updated_at">>("driver_locations")
          .select("lat, lng, updated_at")
          .eq("driver_profile_id", rideData.driver_profile_id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (locationData) {
          currentLocation = {
            latitude: locationData.lat,
            longitude: locationData.lng,
            timestamp: locationData.updated_at,
          };
        }
      }

      return {
        rideId: rideData.id ?? shareData.ride_id,
        status: rideData.status ?? "",
        origin: rideData.origin ?? "",
        destination: rideData.destination ?? "",
        driverName,
        vehicleModel,
        vehiclePlate,
        currentLocation,
      };
    } catch (error) {
      logger.error("[SafetyRideShareService] Error getting shared ride data:", error);
      return null;
    }
  }

  async revokeRideShare(shareId: string, performedBy: string): Promise<SafetyResult<void>> {
    try {
      const updatePayload: Pick<RideShareUpdate, "status" | "revoked_at"> = {
        status: SAFETY_RIDE_SHARE_STATUS.REVOKED,
        revoked_at: new Date().toISOString(),
      };

      const { error } = await safetyRideShareDb
        .from<RideShareRow>("ride_shares")
        .update(updatePayload)
        .eq("id", shareId);

      if (error) throw error;

      await this.deps.createAuditEntry({
        action: "share_revoked",
        entityType: "share",
        entityId: shareId,
        performedBy,
      });

      return { success: true };
    } catch (error) {
      logger.error("[SafetyRideShareService] Error revoking ride share:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao revogar compartilhamento",
      };
    }
  }

  private generateShareToken(): string {
    return secureRandomString(32);
  }
}
