/**
 * Services Rollout Service
 *
 * Integra o módulo services com o sistema de rollout.
 * Responsável por:
 * - Verificar se o módulo services está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { servicesLocationService } from './ServicesLocationService';
import type { EffectiveRollout } from '@/core/rollout/types';
import { ModuleKey } from '@/core/rollout/types';

export class ServicesRolloutService {
  private rolloutService: RolloutService;

  constructor() {
    this.rolloutService = new RolloutService(
      createRolloutRepository(),
      createLocationRepository()
    );
  }

  async isServicesActive(): Promise<boolean> {
    const locationId = servicesLocationService.getActiveLocationId();
    if (!locationId) return false;

    try {
      const result = await this.rolloutService.isModuleActive({
        module_key: ModuleKey.SERVICES,
        location_id: locationId,
      });
      return result.is_active;
    } catch {
      return false;
    }
  }

  async getServicesRollout(): Promise<EffectiveRollout | null> {
    const locationId = servicesLocationService.getActiveLocationId();
    if (!locationId) return null;

    try {
      const result = await this.rolloutService.getEffectiveRollout({
        module_key: ModuleKey.SERVICES,
        location_id: locationId,
      });
      return result.effective_rollout;
    } catch {
      return null;
    }
  }

  async checkAccess(): Promise<{ blocked: boolean; reason?: string }> {
    if (!servicesLocationService.hasActiveLocation()) {
      return { blocked: true, reason: 'Localização não selecionada' };
    }
    const isActive = await this.isServicesActive();
    if (!isActive) {
      return { blocked: true, reason: 'Módulo de serviços não está disponível nesta localização' };
    }
    return { blocked: false };
  }

  async getServicesConfig(): Promise<Record<string, unknown> | null> {
    const locationId = servicesLocationService.getActiveLocationId();
    if (!locationId) return null;

    try {
      const result = await this.rolloutService.getModuleConfig({
        module_key: ModuleKey.SERVICES,
        location_id: locationId,
      });
      return result.config;
    } catch {
      return null;
    }
  }

  async isFeatureEnabled(feature: string): Promise<boolean> {
    const config = await this.getServicesConfig();
    if (!config || !config.features) return false;
    return Array.isArray(config.features) && config.features.includes(feature);
  }

  async getUsageLimits(): Promise<Record<string, number> | null> {
    const config = await this.getServicesConfig();
    if (!config || !config.limits) return null;
    return config.limits as Record<string, number>;
  }
}

export const servicesRolloutService = new ServicesRolloutService();
