/**
 * Mobility Rollout Service
 *
 * Verifica se o módulo mobility está ativo na localização de contexto atual.
 *
 * DECISÃO CANÔNICA:
 * - Rollout é binário por cidade nesta etapa: mobility ativo ou não na cidade
 * - Rollout por tipo de serviço (corrida individual vs rota compartilhada) fica para depois
 * - Sem localização ativa → mobility indisponível (não há fallback global)
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { mobilityLocationService } from './MobilityLocationService';
import { ModuleKey, RolloutStatus } from '@/core/rollout/types';
import type { EffectiveRollout } from '@/core/rollout/types';

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
   * Verifica se o módulo mobility está ativo na localização de contexto atual.
   */
  async isMobilityActive(): Promise<boolean> {
    const locationId = mobilityLocationService.getActiveLocationId();

    if (!locationId) {
      // Sem localização de contexto → mobility indisponível
      return false;
    }

    try {
      const result = await this.rolloutService.isModuleActive({
        module_key: ModuleKey.MOBILITY,
        location_id: locationId
      });

      return result.is_active;
    } catch {
      // Em caso de erro, assumir inativo por segurança
      return false;
    }
  }

  /**
   * Obtém rollout efetivo do mobility na localização atual.
   */
  async getMobilityRollout(): Promise<EffectiveRollout | null> {
    const locationId = mobilityLocationService.getActiveLocationId();
    return this.getMobilityRolloutForLocation(locationId);
  }

  /**
   * Obtém rollout efetivo do mobility para uma localização explícita.
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
        location_id: locationId
      });

      return result.effective_rollout;
    } catch {
      return null;
    }
  }

  /**
   * Verifica acesso ao módulo mobility.
   * Retorna blocked=true se sem localização ou rollout inativo.
   */
  async checkAccess(): Promise<{ blocked: boolean; reason?: string }> {
    if (!mobilityLocationService.hasActiveLocation()) {
      return {
        blocked: true,
        reason: 'Localização não selecionada'
      };
    }

    const isActive = await this.isMobilityActive();
    if (!isActive) {
      return {
        blocked: true,
        reason: 'Mobilidade não está disponível nesta localização'
      };
    }

    return { blocked: false };
  }

  /**
   * Obtém configuração do mobility para a localização atual.
   * Reservado para rollout por tipo de serviço em etapas futuras.
   */
  async getMobilityConfig(): Promise<Record<string, unknown> | null> {
    const locationId = mobilityLocationService.getActiveLocationId();
    return this.getMobilityConfigForLocation(locationId);
  }

  /**
   * Obtém configuração do mobility para uma localização explícita.
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
        location_id: locationId
      });

      return isObjectRecord(result.config) ? result.config : null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se o modo motoboy está habilitado para a localização.
   * Sem configuração explícita, mantém default habilitado para retrocompatibilidade.
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

    const rawValue = config[MOTOBOY_ENABLED_CONFIG_KEY];
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
   * Liga/desliga o módulo de mobilidade para uma localização.
   * Mantém a configuração existente para evitar perda de parâmetros.
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
