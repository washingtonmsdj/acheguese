import { logger } from "@/shared/utils/logger";
import { RolloutService } from "@/core/rollout/services/RolloutService";
import { createRolloutRepository } from "@/core/rollout/repositories/createRolloutRepository";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { ModuleKey, RolloutStatus } from "@/core/rollout/types";
import { MobilityService } from "@/core/mobility/services/runtime";
import { mobilityService } from "@/core/mobility/services/runtime";
import { DriverAvailabilityService } from "@/core/mobility/services/runtime";
import { DriverModerationEventsService } from "@/core/mobility/services/runtime";
import type { DriverModerationAction, DriverModerationEvent } from "@/core/mobility/services/runtime";
import { getRecordValue } from "@/shared/utils/recordLookup";

const MOTOBOY_ENABLED_CONFIG_KEY = "motoboy_enabled";
const DEFAULT_MOTOBOY_ENABLED = true;
export type { DriverModerationAction, DriverModerationEvent };

function isObjectRecord(value: Record<string, unknown> | null): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export class AdminMobilityRuntimeService {
  private rolloutService = new RolloutService(createRolloutRepository(), createLocationRepository());

  async getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
    return MobilityService.getDriverProfiles();
  }

  async getTopDrivers(opts: { minRides?: number; limit?: number } = {}): Promise<unknown[]> {
    return MobilityService.getTopDrivers(opts);
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
