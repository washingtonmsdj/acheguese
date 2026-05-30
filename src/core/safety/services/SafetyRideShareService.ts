import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { SAFETY_RIDE_SHARE_STATUS } from "@/core/safety/constants/status";
import { secureRandomString } from "@/shared/utils/secureRandom";
import type {
  CreateRideShareInput,
  RideShare,
  SafetyAuditEntry,
  SafetyResult,
  SharedRideData,
} from "../types";

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

export class SafetyRideShareService {
  constructor(private readonly deps: RideShareDeps) {}

  async createRideShare(input: CreateRideShareInput): Promise<SafetyResult<RideShare>> {
    try {
      const token = this.generateShareToken();
      const expirationHours = input.expiresInHours || this.deps.getShareExpirationHours();
      const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

      const { data, error } = await (supabase as any)
        .from("ride_shares")
        .insert({
          ride_id: input.rideId,
          share_token: token,
          status: SAFETY_RIDE_SHARE_STATUS.ACTIVE,
          created_by: input.createdBy,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/track/${token}`;
      const rideShare: RideShare = {
        id: data.id,
        rideId: data.ride_id,
        shareToken: data.share_token,
        shareUrl,
        status: data.status,
        createdBy: data.created_by,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      };

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
        "🔗 Compartilhamento de Viagem Criado",
        `Link de rastreamento criado com sucesso. Expira em ${expirationHours}h.`,
        { shareId: data.id, shareUrl },
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
      const { data: shareData, error: shareError } = await (supabase as any)
        .from("ride_shares")
        .select("ride_id, expires_at, status")
        .eq("share_token", shareToken)
        .eq("status", SAFETY_RIDE_SHARE_STATUS.ACTIVE)
        .maybeSingle();

      if (shareError) throw shareError;
      if (!shareData) return null;

      if (new Date(shareData.expires_at) < new Date()) {
        return null;
      }

      const { MobilityService: MS } = await import("@/core/mobility/services/runtime");
      const rideData = (await MS.getRideById(shareData.ride_id)) as
        | {
            id?: string | null;
            status?: string | null;
            origin?: string | null;
            destination?: string | null;
            driver_profile_id?: string | null;
            passenger_profile_id?: string | null;
          }
        | null;
      if (!rideData) return null;

      let driverName;
      let vehicleModel;
      let vehiclePlate;
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

      let currentLocation;
      if (rideData.driver_profile_id) {
        const { data: locationData } = await (supabase as any)
          .from("driver_locations")
          .select("latitude, longitude, updated_at")
          .eq("driver_profile_id", rideData.driver_profile_id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (locationData) {
          currentLocation = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: locationData.updated_at,
          };
        }
      }

      return {
        rideId: rideData.id ?? shareData.ride_id,
        status: rideData.status ?? null,
        origin: rideData.origin ?? null,
        destination: rideData.destination ?? null,
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
      const { error } = await (supabase as any)
        .from("ride_shares")
        .update({
          status: SAFETY_RIDE_SHARE_STATUS.REVOKED,
          revoked_at: new Date().toISOString(),
        })
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
