/**
 * TerritorialRolloutService
 *
 * Operações administrativas de rollout e reconcile por grupo territorial.
 *
 * Regras:
 *   - NÃO adiciona group_id em module_rollouts
 *   - Expande para location_ids membros e usa RolloutService existente
 *   - Membros inativos são ignorados (skipped)
 *   - reconcileGroupRollout: aplica rollout apenas nos membros SEM rollout explícito
 *     (novos membros adicionados depois da ativação inicial)
 *   - Drift policy: novos membros NÃO herdam rollout automaticamente —
 *     chamar reconcileGroupRollout explicitamente
 */

import { RolloutService } from '@/core/rollout/services/RolloutService';
import { createRolloutRepository } from '@/core/rollout/repositories/createRolloutRepository';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { createTerritorialGroupRepository } from '@/core/territorial/repositories/createTerritorialGroupRepository';
import { RolloutStatus } from '@/core/rollout/types';
import type { ModuleKey } from '@/core/rollout/types';
import type {
  ActivateRolloutForGroupInput,
  ActivateRolloutForGroupOutput,
  ReconcileGroupRolloutInput,
  ReconcileGroupRolloutOutput,
} from './types';

export class TerritorialRolloutService {
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
   * Ativa (ou desativa) um módulo para todos os membros ativos de um grupo.
   *
   * Uso administrativo: ligar/desligar um módulo para o grupo inteiro de uma vez.
   * Membros inativos são ignorados (skipped).
   *
   * Drift policy: membros adicionados DEPOIS desta chamada NÃO recebem rollout
   * automaticamente. Chamar reconcileGroupRollout para sincronizar.
   */
  async activateRolloutForGroup(
    input: ActivateRolloutForGroupInput,
  ): Promise<ActivateRolloutForGroupOutput> {
    const { group_id, module_key, status, config } = input;

    const group = await this.groupRepo.findWithMembers(group_id);
    if (!group) {
      throw new Error(`Group not found: ${group_id}`);
    }

    const applied: string[] = [];
    const skipped: string[] = [];

    for (const member of group.members) {
      // Ignorar membros inativos — sem fallback silencioso
      if (member.status !== 'active') {
        skipped.push(member.id);
        continue;
      }

      try {
        await this.rolloutService.setModuleRollout({
          module_key,
          location_id: member.id,
          status,
          config,
        });
        applied.push(member.id);
      } catch {
        // Erro individual não aborta o batch — registra como skipped
        skipped.push(member.id);
      }
    }

    return { group_id, module_key, applied_to: applied, skipped };
  }

  /**
   * Reconcilia rollout de um grupo após mudança de membros.
   *
   * Aplica `default_status` apenas nos membros que NÃO têm rollout explícito.
   * Membros que já têm rollout configurado NÃO são alterados.
   *
   * Chamar quando:
   *   - Um novo bairro é adicionado ao grupo
   *   - Um bairro é removido do grupo (o rollout individual permanece — decisão explícita)
   *
   * Drift policy: sem automação escondida. Reconcile é sempre explícito.
   */
  async reconcileGroupRollout(
    input: ReconcileGroupRolloutInput,
  ): Promise<ReconcileGroupRolloutOutput> {
    const { group_id, module_key, default_status } = input;

    const group = await this.groupRepo.findWithMembers(group_id);
    if (!group) {
      throw new Error(`Group not found: ${group_id}`);
    }

    const newlyApplied: string[] = [];
    const alreadyConfigured: string[] = [];

    for (const member of group.members) {
      if (member.status !== 'active') continue;

      // Verifica se já tem rollout explícito (LOCAL)
      const existing = await this.rolloutRepo.findByModuleAndLocation(
        module_key,
        member.id,
      );

      if (existing) {
        // Já configurado — não alterar
        alreadyConfigured.push(member.id);
        continue;
      }

      // Novo membro sem rollout — aplica default
      try {
        await this.rolloutService.setModuleRollout({
          module_key,
          location_id: member.id,
          status: default_status,
        });
        newlyApplied.push(member.id);
      } catch {
        // Erro individual não aborta — membro fica sem rollout explícito
      }
    }

    return {
      group_id,
      module_key,
      newly_applied: newlyApplied,
      already_configured: alreadyConfigured,
    };
  }
}

export const territorialRolloutService = new TerritorialRolloutService();
