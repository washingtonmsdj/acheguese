import { RolloutService } from "@/core/rollout/services/RolloutService";
import { createRolloutRepository } from "@/core/rollout/repositories/createRolloutRepository";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { ModuleKey, RolloutStatus } from "@/core/rollout/types";
import { MobilityService } from "@/core/mobility/services/runtime";
import { DriverModerationEventsService } from "@/core/mobility/services/runtime";
import type { DriverModerationAction, DriverModerationEvent } from "@/core/mobility/services/runtime";
import { AdminDriverPresenceReadService } from "@/core/admin/services/AdminDriverPresenceReadService";
import { getRecordValue } from "@/shared/utils/recordLookup";

const MOTOBOY_ENABLED_CONFIG_KEY = "motoboy_enabled";
const DEFAULT_MOTOBOY_ENABLED = true;
export type { DriverModerationAction, DriverModerationEvent };

function isObjectRecord(value: Record<string, unknown> | null): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getProfileId(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const profileId = (value as { profile_id?: unknown }).profile_id;
  return typeof profileId === "string" ? profileId : null;
}

export class AdminMobilityRuntimeService {
  private rolloutService = new RolloutService(createRolloutRepository(), createLocationRepository());

  async getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
    const result = await MobilityService.getDriverProfiles();
    if (result.error || result.data.length === 0) return result;

    const profileIds = result.data
      .map(getProfileId)
      .filter((profileId): profileId is string => Boolean(profileId));
    const presence = await AdminDriverPresenceReadService.list(profileIds);
    const presenceByProfile = new Map(presence.map((row) => [row.profile_id, row]));

    return {
      ...result,
      data: result.data.map((row) => {
        const profileId = getProfileId(row);
        if (!profileId || !row || typeof row !== "object" || Array.isArray(row)) {
          return row;
        }
        const operational = presenceByProfile.get(profileId);
        return {
          ...(row as Record<string, unknown>),
          is_online: operational?.is_online ?? false,
          is_available: operational?.is_available ?? false,
          last_location_update: operational?.last_location_update ?? null,
        };
      }),
    };
  }

  async getTopDrivers(opts: { minRides?: number; limit?: number } = {}): Promise<unknown[]> {
    return MobilityService.getTopDrivers(opts);
  }

  async createDriverModerationEvent(input: {
    driverProfileId: string;
    action: DriverModerationAction;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await DriverModerationEventsService.createEvent(input);
  }

  async listDriverModerationEvents(driverProfileId: string): Promise<DriverModerationEvent[]> {
    return DriverModerationEventsService.listByDriverProfile(driverProfileId);
  }

  async isMotoboyEnabled(locationId: string | null | undefined): Promise<boolean> {
    if (!locationId) return false;
    const config = await this.getMobilityConfigForLocation(locationId);
    if (!config) return DEFAULT_MOTOBOY_ENABLED;
    const rawValue = getRecordValue(config, MOTOBOY_ENABLED_CONFIG_KEY);
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