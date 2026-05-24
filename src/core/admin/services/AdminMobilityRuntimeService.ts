import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { RolloutService } from "@/core/rollout/services/RolloutService";
import { createRolloutRepository } from "@/core/rollout/repositories/createRolloutRepository";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { ModuleKey, RolloutStatus } from "@/core/rollout/types";
import { profileService } from "@/core/profiles/services/ProfileService";
import { mobilityService } from "@/core/mobility/services/runtime";
import { DriverAvailabilityService } from "@/core/mobility/services/runtime";

const MOTOBOY_ENABLED_CONFIG_KEY = "motoboy_enabled";
const DEFAULT_MOTOBOY_ENABLED = true;
const MISSING_TABLE_ERROR_CODES = new Set(["42P01", "PGRST116", "PGRST205"]);

export type DriverModerationAction =
  | "approved"
  | "rejected"
  | "suspended"
  | "reactivated"
  | "set_online"
  | "set_offline";

export interface DriverModerationEvent {
  id: string;
  driver_profile_id: string;
  admin_profile_id: string | null;
  action: DriverModerationAction;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin_name?: string;
}

function isObjectRecord(value: Record<string, unknown> | null): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string; details?: string };
  if (candidate.code && MISSING_TABLE_ERROR_CODES.has(candidate.code)) return true;
  const haystack = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();
  return haystack.includes("does not exist") || haystack.includes("relation");
}

async function hydrateAdminNames(events: DriverModerationEvent[]): Promise<DriverModerationEvent[]> {
  const adminProfileIds = Array.from(
    new Set(events.map((event) => event.admin_profile_id).filter((id): id is string => Boolean(id))),
  );

  if (adminProfileIds.length === 0) {
    return events.map((event) => ({ ...event, admin_name: "Admin" }));
  }

  const adminMap = new Map<string, string>();
  try {
    const profiles = await profileService.getProfilesByIds(adminProfileIds);
    for (const profile of profiles) {
      adminMap.set(profile.id, profile.name || "Admin");
    }
  } catch (error) {
    logger.warn("AdminMobilityRuntimeService.hydrateAdminNames", error);
    return events.map((event) => ({ ...event, admin_name: "Admin" }));
  }

  return events.map((event) => ({
    ...event,
    admin_name: (event.admin_profile_id && adminMap.get(event.admin_profile_id)) || "Admin",
  }));
}

export class AdminMobilityRuntimeService {
  private readonly db = supabase as any;
  private rolloutService = new RolloutService(createRolloutRepository(), createLocationRepository());

  async getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
    try {
      const { data, error } = await this.db
        .from("driver_complete_profile")
        .select("*")
        .order("created_at", { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      logger.error("AdminMobilityRuntimeService.getDriverProfiles", error as Error);
      return { data: [], error };
    }
  }

  async getTopDrivers(opts: { minRides?: number; limit?: number } = {}): Promise<unknown[]> {
    try {
      const { minRides = 1, limit = 10 } = opts;
      const { data, error } = await this.db
        .from("driver_complete_profile")
        .select("profile_id, display_name, avg_rating, total_rides, avatar_url")
        .gte("total_rides", minRides)
        .order("avg_rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((driver) => ({
        id: driver.profile_id,
        name: driver.display_name,
        rating: driver.avg_rating,
        total_rides: driver.total_rides,
        profile: { avatar_url: driver.avatar_url },
      }));
    } catch (error) {
      logger.error("AdminMobilityRuntimeService.getTopDrivers", error as Error);
      return [];
    }
  }

  async updateDriverOnlineStatus(driverProfileId: string, isOnline: boolean): Promise<void> {
    await mobilityService.updateDriverOnlineStatus(driverProfileId, isOnline);
    if (!isOnline) {
      const result = await DriverAvailabilityService.goOffline(driverProfileId);
      if (!result.success) {
        logger.warn("AdminMobilityRuntimeService.updateDriverOnlineStatus.availability", {
          driverProfileId,
          error: result.error,
        });
      }
    }
  }

  async createDriverModerationEvent(input: {
    driverProfileId: string;
    adminProfileId?: string | null;
    action: DriverModerationAction;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.db.from("driver_moderation_events").insert({
      driver_profile_id: input.driverProfileId,
      admin_profile_id: input.adminProfileId ?? null,
      action: input.action,
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
    } as any);

    if (error && !isMissingTableError(error)) {
      logger.warn("AdminMobilityRuntimeService.createDriverModerationEvent", error);
    }
  }

  async listDriverModerationEvents(driverProfileId: string): Promise<DriverModerationEvent[]> {
    const { data, error } = await this.db
      .from("driver_moderation_events")
      .select("id, driver_profile_id, admin_profile_id, action, reason, metadata, created_at")
      .eq("driver_profile_id", driverProfileId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return [];
      logger.warn("AdminMobilityRuntimeService.listDriverModerationEvents", error);
      return [];
    }

    return hydrateAdminNames((data || []) as DriverModerationEvent[]);
  }

  async isMotoboyEnabled(locationId: string | null | undefined): Promise<boolean> {
    if (!locationId) return false;
    const config = await this.getMobilityConfigForLocation(locationId);
    if (!config) return DEFAULT_MOTOBOY_ENABLED;
    const rawValue = config[MOTOBOY_ENABLED_CONFIG_KEY];
    return typeof rawValue === "boolean" ? rawValue : DEFAULT_MOTOBOY_ENABLED;
  }

  async setMotoboyEnabled(locationId: string, enabled: boolean): Promise<void> {
    const effective = await this.rolloutService.getEffectiveRollout({
      module_key: ModuleKey.MOBILITY,
      location_id: locationId,
    });

    const currentConfig = isObjectRecord(effective.effective_rollout.config)
      ? effective.effective_rollout.config
      : {};

    await this.rolloutService.setModuleRollout({
      module_key: ModuleKey.MOBILITY,
      location_id: locationId,
      status: effective.effective_rollout.status,
      config: {
        ...currentConfig,
        [MOTOBOY_ENABLED_CONFIG_KEY]: enabled,
      },
    });
  }

  async setMobilityEnabled(locationId: string, enabled: boolean): Promise<void> {
    const effective = await this.rolloutService.getEffectiveRollout({
      module_key: ModuleKey.MOBILITY,
      location_id: locationId,
    });

    const currentConfig = isObjectRecord(effective.effective_rollout.config)
      ? effective.effective_rollout.config
      : {};

    await this.rolloutService.setModuleRollout({
      module_key: ModuleKey.MOBILITY,
      location_id: locationId,
      status: enabled ? RolloutStatus.ACTIVE : RolloutStatus.INACTIVE,
      config: currentConfig,
    });
  }

  private async getMobilityConfigForLocation(locationId: string): Promise<Record<string, unknown> | null> {
    try {
      const result = await this.rolloutService.getModuleConfig({
        module_key: ModuleKey.MOBILITY,
        location_id: locationId,
      });
      return isObjectRecord(result.config) ? result.config : null;
    } catch {
      return null;
    }
  }
}

export const adminMobilityRuntimeService = new AdminMobilityRuntimeService();
