/**
 * Business Rollout Service
 * 
 * Integra o módulo business com o sistema de rollout.
 * Responsável por:
 * - Verificar se business está ativo na localização
 * - Bloquear funcionalidades quando inativo
 * - Fornecer configuração do módulo
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { businessLocationService } from './BusinessLocationService';
import type { EffectiveRollout } from '@/core/rollout/types';
import { ModuleKey } from '@/core/rollout/types';

export class BusinessRolloutService {
  private rolloutService: RolloutService;

  constructor() {
    this.rolloutService = new RolloutService(
      createRolloutRepository(),
      createLocationRepository()
    );
  }

  /**
   * Verifica se o módulo business está ativo na localização atual
   * @returns Promise<boolean> indicando se está ativo
   */
  async isBusinessActive(): Promise<boolean> {
    const locationId = businessLocationService.getActiveLocationId();
    
    if (!locationId) {
      // Sem localização ativa, business não está disponível
      return false;
    }

    try {
      const result = await this.rolloutService.isModuleActive({
        module_key: ModuleKey.BUSINESS,
        location_id: locationId
      });
      
      return result.is_active;
    } catch {
      // Em caso de erro, assumir inativo por segurança
      return false;
    }
  }

  /**
   * Obtém rollout efetivo do business na localização atual
   * @returns Promise<EffectiveRollout | null> rollout efetivo ou null se sem localização
   */
  async getBusinessRollout(): Promise<EffectiveRollout | null> {
    const locationId = businessLocationService.getActiveLocationId();
    
    if (!locationId) {
      return null;
    }

    try {
      const result = await this.rolloutService.getEffectiveRollout({
        module_key: ModuleKey.BUSINESS,
        location_id: locationId
      });
      
      return result.effective_rollout;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se funcionalidades do business devem ser bloqueadas
   * @returns Promise<{ blocked: boolean; reason?: string }> status de bloqueio
   */
  async checkAccess(): Promise<{ blocked: boolean; reason?: string }> {
    // Verificar se há localização ativa
    if (!businessLocationService.hasActiveLocation()) {
      return {
        blocked: true,
        reason: 'Localização não selecionada'
      };
    }

    // Verificar rollout
    const isActive = await this.isBusinessActive();
    if (!isActive) {
      return {
        blocked: true,
        reason: 'Módulo de negócios não está disponível nesta localização'
      };
    }

    return { blocked: false };
  }

  /**
   * Obtém configuração do business para a localização atual
   * @returns Promise<Record<string, any> | null> configuração ou null
   */
  async getBusinessConfig(): Promise<Record<string, any> | null> {
    const locationId = businessLocationService.getActiveLocationId();
    
    if (!locationId) {
      return null;
    }

    try {
      const result = await this.rolloutService.getModuleConfig({
        module_key: ModuleKey.BUSINESS,
        location_id: locationId
      });
      
      return result.config;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se funcionalidade específica está habilitada
   * @param feature - Nome da funcionalidade
   * @returns Promise<boolean> indicando se está habilitada
   */
  async isFeatureEnabled(feature: string): Promise<boolean> {
    const config = await this.getBusinessConfig();
    
    if (!config || !config.features) {
      return false;
    }

    return Array.isArray(config.features) && config.features.includes(feature);
  }

  /**
   * Obtém limites de uso para a localização
   * @returns Promise<Record<string, number> | null> limites ou null
   */
  async getUsageLimits(): Promise<Record<string, number> | null> {
    const config = await this.getBusinessConfig();
    
    if (!config || !config.limits) {
      return null;
    }

    return config.limits as Record<string, number>;
  }
}

// Singleton instance
export const businessRolloutService = new BusinessRolloutService();
