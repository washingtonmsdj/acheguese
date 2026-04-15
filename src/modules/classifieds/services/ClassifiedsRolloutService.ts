 
/**
 * ClassifiedsRolloutService
 *
 * Integra o módulo classifieds com o sistema de rollout.
 * Responsável por:
 * - Verificar se o módulo classifieds está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { classifiedsLocationService } from './ClassifiedsLocationService';
import type { EffectiveRollout } from '@/core/rollout/types';

export class ClassifiedsRolloutService {
  private rolloutService: RolloutService;

  constructor() {
    this.rolloutService = new RolloutService(
      createRolloutRepository(),
      createLocationRepository()
    );
  }

  async isClassifiedsActive(): Promise<boolean> {
    const locationId = classifiedsLocationService.getActiveLocationId();
    if (!locationId) return false;

    try {
      const result = await this.rolloutService.isModuleActive({
        module_key: 'classifieds',
        location_id: locationId,
      });
      return result.is_active;
    } catch {
      return false;
    }
  }

  async getClassifiedsRollout(): Promise<EffectiveRollout | null> {
    const locationId = classifiedsLocationService.getActiveLocationId();
    if (!locationId) return null;

    try {
      const result = await this.rolloutService.getEffectiveRollout({
        module_key: 'classifieds',
        location_id: locationId,
      });
      return result.effective_rollout;
    } catch {
      return null;
    }
  }

  async checkAccess(): Promise<{ blocked: boolean; reason?: string }> {
    if (!classifiedsLocationService.hasActiveLocation()) {
      return { blocked: true, reason: 'Localização não selecionada' };
    }
    const isActive = await this.isClassifiedsActive();
    if (!isActive) {
      return { blocked: true, reason: 'Módulo de classificados não está disponível nesta localização' };
    }
    return { blocked: false };
  }

  async getClassifiedsConfig(): Promise<Record<string, unknown> | null> {
    const locationId = classifiedsLocationService.getActiveLocationId();
    if (!locationId) return null;

    try {
      const result = await this.rolloutService.getModuleConfig({
        module_key: 'classifieds',
        location_id: locationId,
      });
      return result.config;
    } catch {
      return null;
    }
  }

  async isFeatureEnabled(feature: string): Promise<boolean> {
    const config = await this.getClassifiedsConfig();
    if (!config || !config.features) return false;
    return Array.isArray(config.features) && config.features.includes(feature);
  }
}

export const classifiedsRolloutService = new ClassifiedsRolloutService();
