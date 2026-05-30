/**
 * Mobility Rollout Service
 *
 * Verifica se o modulo mobility esta ativo no territorio corrente.
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { mobilityLocationService } from './MobilityLocationService';
import { ModuleKey, RolloutStatus } from '@/core/rollout/types';
import type { EffectiveRollout } from '@/core/rollout/types';
import { getRecordValue } from '@/shared/utils/recordLookup';

const MOTOBOY_ENABLED_CONFIG_KEY = 'motoboy_enabled';
const DEFAULT_MOTOBOY_ENABLED = true;

function isObjectRecord(
  value: Record<string, unknown> | null
): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export class MobilityRolloutService {
  private rolloutService: RolloutService;

  constructor() {
    this.rolloutService = new RolloutService(
      createRolloutRepository(),
      createLocationRepository()
    );
  }

  /**
   * Verifica se o modulo mobility esta ativo para o location informado.
   * Se nao for informado, usa o contexto de localizacao ativo.
   */
  async isMobilityActive(locationId?: string | null): Promise<boolean> {
    const targetLocationId = locationId ?? mobilityLocationService.getActiveLocationId();

    if (!targetLocationId) {
      return false;
    }

    try {
      const result = await this.rolloutService.isModuleActive({
        module_key: ModuleKey.MOBILITY,
        location_id: targetLocationId,
      });

      return result.is_active;
    } catch {
      return false;
    }
  }

  /**
   * Obtem rollout efetivo do mobility na localizacao atual.
   */
  async getMobilityRollout(): Promise<EffectiveRollout | null> {
    const locationId = mobilityLocationService.getActiveLocationId();
    return this.getMobilityRolloutForLocation(locationId);
  }

  /**
   * Obtem rollout efetivo do mobility para uma localizacao explicita.
   */
  async getMobilityRolloutForLocation(
    locationId: string | null | undefined
  ): Promise<EffectiveRollout | null> {
    if (!locationId) {
      return null;
    }

    try {
      const result = await this.rolloutService.getEffectiveRollout({
        module_key: ModuleKey.MOBILITY,
        location_id: locationId,
      });

      return result.effective_rollout;
    } catch {
      return null;
    }
  }

  /**
   * Verifica acesso ao modulo mobility.
   */
  async checkAccess(): Promise<{ blocked: boolean; reason?: string }> {
    if (!mobilityLocationService.hasActiveLocation()) {
      return {
        blocked: true,
        reason: 'Localizacao nao selecionada',
      };
    }

    const isActive = await this.isMobilityActive();
    if (!isActive) {
      return {
        blocked: true,
        reason: 'Mobilidade nao esta disponivel nesta localizacao',
      };
    }

    return { blocked: false };
  }

  /**
   * Obtem configuracao do mobility para a localizacao atual.
   */
  async getMobilityConfig(): Promise<Record<string, unknown> | null> {
    const locationId = mobilityLocationService.getActiveLocationId();
    return this.getMobilityConfigForLocation(locationId);
  }

  /**
   * Obtem configuracao do mobility para uma localizacao explicita.
   */
  async getMobilityConfigForLocation(
    locationId: string | null | undefined
  ): Promise<Record<string, unknown> | null> {
    if (!locationId) {
      return null;
    }

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

  /**
   * Verifica se o modo motoboy esta habilitado para a localizacao.
   */
  async isMotoboyEnabled(locationId?: string | null): Promise<boolean> {
    const targetLocationId = locationId ?? mobilityLocationService.getActiveLocationId();

    if (!targetLocationId) {
      return false;
    }

    const config = await this.getMobilityConfigForLocation(targetLocationId);
    if (!config) {
      return DEFAULT_MOTOBOY_ENABLED;
    }

    const rawValue = getRecordValue(config, MOTOBOY_ENABLED_CONFIG_KEY);
    if (typeof rawValue !== 'boolean') {
      return DEFAULT_MOTOBOY_ENABLED;
    }

    return rawValue;
  }

  /**
   * Define o toggle de motoboy no config oficial do rollout mobility.
   */
  async setMotoboyEnabled(locationId: string, enabled: boolean): Promise<void> {
    const effective = await this.rolloutService.getEffectiveRollout({
      module_key: ModuleKey.MOBILITY,
      location_id: locationId,
    });

    const currentConfig = isObjectRecord(effective.effective_rollout.config)
      ? effective.effective_rollout.config
      : {};

    const nextConfig = {
      ...currentConfig,
      [MOTOBOY_ENABLED_CONFIG_KEY]: enabled,
    };

    await this.rolloutService.setModuleRollout({
      module_key: ModuleKey.MOBILITY,
      location_id: locationId,
      status: effective.effective_rollout.status,
      config: nextConfig,
    });
  }

  /**
   * Liga/desliga o modulo de mobilidade para uma localizacao.
   */
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
}

// Singleton instance
export const mobilityRolloutService = new MobilityRolloutService();
