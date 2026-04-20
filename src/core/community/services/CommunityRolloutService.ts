/**
 * Community Rollout Service
 *
 * Integra o módulo community ao sistema de rollout.
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
    this.rolloutService = new RolloutService(createRolloutRepository(), createLocationRepository());
  }

  private resolveLocationId(resolved?: ResolvedTerritory): string | null {
    if (resolved) {
      if (resolved.kind === 'location') return resolved.location.id;
      if (resolved.kind === 'group') {
        const firstMember = resolved.group.members.find((m) => m.status === 'active');
        return firstMember?.id ?? resolved.group.members[0]?.id ?? null;
      }
    }
    return communityLocationService.getActiveLocationId();
  }

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

  async getCommunityConfig(resolved?: ResolvedTerritory): Promise<Record<string, any> | null> {
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

export const communityRolloutService = new CommunityRolloutService();
