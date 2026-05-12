/**
 * Community Rollout Service
 * 
 * Integra o módulo community com o sistema de rollout.
 * Responsável por:
 * - Verificar se community está ativo na localização
 * - Respeitar herança de rollout
 * - Bloquear funcionalidades quando inativo
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { communityLocationService } from './CommunityLocationService';
import { ModuleKey } from '@/core/rollout/types';
import type { EffectiveRollout } from '@/core/rollout/types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export class CommunityRolloutService {
  private rolloutService: RolloutService;

  constructor() {
    this.rolloutService = new RolloutService(
      createRolloutRepository(),
      createLocationRepository()
    );
  }

  /**
   * Resolve o locationId a partir do contexto territorial ou do store.
   * Grupos usam o primeiro membro ativo como representante para verificação de rollout.
   */
  private resolveLocationId(resolved?: ResolvedTerritory): string | null {
    if (resolved) {
      if (resolved.kind === 'location') return resolved.location.id;
      if (resolved.kind === 'group') {
        // Para grupos, usa o primeiro membro ativo como representante
        const firstMember = resolved.group.members.find((m) => m.status === 'active');
        return firstMember?.id ?? resolved.group.members[0]?.id ?? null;
      }
    }
    return communityLocationService.getActiveLocationId();
  }

  /**
   * Verifica se o módulo community está ativo na localização atual
   */
  async isCommunityActive(resolved?: ResolvedTerritory): Promise<boolean> {
    const locationId = this.resolveLocationId(resolved);
    if (!locationId) return false;

    try {
      const result = await this.rolloutService.isModuleActive({
        module_key: ModuleKey.COMMUNITY,
        location_id: locationId,
      });
      return result.is_active;
    } catch {
      return false;
    }
  }

  /**
   * Obtém rollout efetivo do community na localização atual
   */
  async getCommunityRollout(resolved?: ResolvedTerritory): Promise<EffectiveRollout | null> {
    const locationId = this.resolveLocationId(resolved);
    if (!locationId) return null;

    try {
      const result = await this.rolloutService.getEffectiveRollout({
        module_key: ModuleKey.COMMUNITY,
        location_id: locationId,
      });
      return result.effective_rollout;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se funcionalidades do community devem ser bloqueadas.
   * Aceita `resolved` do contexto territorial para suportar rotas de grupo.
   */
  async checkAccess(resolved?: ResolvedTerritory): Promise<{ blocked: boolean; reason?: string }> {
    const locationId = this.resolveLocationId(resolved);

    if (!locationId) {
      return { blocked: true, reason: 'Localização não selecionada' };
    }

    const isActive = await this.isCommunityActive(resolved);
    if (!isActive) {
      return { blocked: true, reason: 'Community não está disponível nesta localização' };
    }

    return { blocked: false };
  }

  /**
   * Obtém configuração do community para a localização atual
   */
  async getCommunityConfig(
    resolved?: ResolvedTerritory,
  ): Promise<Record<string, unknown> | null> {
    const locationId = this.resolveLocationId(resolved);
    if (!locationId) return null;

    try {
      const result = await this.rolloutService.getModuleConfig({
        module_key: ModuleKey.COMMUNITY,
        location_id: locationId,
      });
      return result.config;
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const communityRolloutService = new CommunityRolloutService();
