/**
 * GroupAvailabilityService
 *
 * Determina a disponibilidade de um módulo em contexto de grupo territorial.
 *
 * Regras:
 *   - Avalia rollout de cada membro ativo do grupo via batch (1 query)
 *   - Herança: se membro não tem rollout LOCAL, resolve via ancestors
 *   - full    → todos os membros ativos têm o módulo ativo
 *   - partial → pelo menos um membro ativo tem o módulo ativo (OR)
 *   - none    → nenhum membro ativo tem o módulo ativo
 *   - active_member_ids → apenas os membros com rollout ativo (usado no TerritoryFilter)
 *
 * Performance:
 *   - Usa findByModuleAndLocations (batch) para buscar rollouts explícitos em 1 query
 *   - Membros sem rollout LOCAL resolvem herança via RolloutService individualmente
 *   - Na prática, com herança de Salvador ativa, todos os bairros resolvem via
 *     ancestor lookup — o batch elimina N queries para o caso comum (rollout explícito)
 *
 * NÃO adiciona group_id em module_rollouts.
 * NÃO cria atalho estrutural fora do SSOT.
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { createTerritorialGroupRepository } from '@/core/location/repositories/createTerritorialGroupRepository';
import { RolloutStatus } from '@/core/rollout/types';
import type { ModuleKey } from '@/core/rollout/types';
import type {
  GroupAvailabilityResult,
  MemberRolloutStatus,
} from './types';

export class GroupAvailabilityService {
  private rolloutService: RolloutService;
  private rolloutRepo = createRolloutRepository();
  private groupRepo = createTerritorialGroupRepository();

  constructor() {
    this.rolloutService = new RolloutService(
      createRolloutRepository(),
      createLocationRepository(),
    );
  }

  /**
   * Resolve a disponibilidade de um módulo para um grupo territorial.
   *
   * Estratégia batch:
   *   1. Busca rollouts explícitos de todos os membros em 1 query (findByModuleAndLocations)
   *   2. Membros com rollout LOCAL → usa diretamente (sem query adicional)
   *   3. Membros sem rollout LOCAL → resolve herança via RolloutService (ancestor lookup)
   *      Estes são os casos que ainda fazem queries individuais, mas são a minoria
   *      quando a herança de cidade está configurada.
   */
  async getGroupModuleAvailability(
    groupId: string,
    moduleKey: ModuleKey,
  ): Promise<GroupAvailabilityResult> {
    const group = await this.groupRepo.findWithMembers(groupId);

    if (!group) {
      return emptyResult(groupId, moduleKey);
    }

    const activeMembers = group.members.filter((m) => m.status === 'active');

    if (activeMembers.length === 0) {
      return emptyResult(groupId, moduleKey);
    }

    const activeMemberIds = activeMembers.map((m) => m.id);

    // Batch: busca rollouts explícitos de todos os membros em 1 query
    const explicitRollouts = await this.rolloutRepo.findByModuleAndLocations(
      moduleKey,
      activeMemberIds,
    );

    // Resolve status de cada membro
    const statuses: MemberRolloutStatus[] = await Promise.all(
      activeMembers.map(async (location) => {
        const explicit = explicitRollouts.get(location.id);

        if (explicit) {
          // Rollout LOCAL encontrado — sem query adicional
          return { location, is_active: explicit.status === RolloutStatus.ACTIVE };
        }

        // Sem rollout LOCAL — resolve herança (ancestor lookup)
        try {
          const result = await this.rolloutService.isModuleActive({
            module_key: moduleKey,
            location_id: location.id,
          });
          return { location, is_active: result.is_active };
        } catch {
          return { location, is_active: false };
        }
      }),
    );

    const activeModuleMembers = statuses.filter((s) => s.is_active);
    const activeMemberIdsWithRollout = activeModuleMembers.map((s) => s.location.id);

    return {
      module_key: moduleKey,
      group_id: groupId,
      availability: resolveAvailability(activeModuleMembers.length, activeMembers.length),
      active_member_ids: activeMemberIdsWithRollout,
      member_statuses: statuses,
      total_active_members: activeMembers.length,
      active_module_members: activeModuleMembers.length,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyResult(groupId: string, moduleKey: ModuleKey): GroupAvailabilityResult {
  return {
    module_key: moduleKey,
    group_id: groupId,
    availability: 'none',
    active_member_ids: [],
    member_statuses: [],
    total_active_members: 0,
    active_module_members: 0,
  };
}

function resolveAvailability(
  activeModuleCount: number,
  totalActiveMembers: number,
): 'full' | 'partial' | 'none' {
  if (activeModuleCount === 0) return 'none';
  if (activeModuleCount === totalActiveMembers) return 'full';
  return 'partial';
}

export const groupAvailabilityService = new GroupAvailabilityService();
