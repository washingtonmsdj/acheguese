/**
 * Profile Identity Adapter
 * Implementação específica para profile
 * 
 * RESPONSABILIDADE: Boundary específica - toda persistência e consulta de profile
 * Entity ID Canônico: profiles.id (PK da tabela)
 * 
 * ✅ SSOT COMPLIANT: Delega todas as queries para ProfileService
 */

import { ProfileIdentityPolicy } from '../policies/ProfileIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type { 
  EntityType,
  EntityId,
  ChangeReason, 
  IdentityChangeRecord, 
  CooldownResult 
} from '../domain/types';
import { logger } from '@/shared/utils/logger';

export class ProfileIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'profile';
  readonly policy = new ProfileIdentityPolicy();

  /**
   * Verifica se username já existe (checagem exata de unicidade)
   * Compatível com constraint real do banco
   * 
   * IMPORTANTE: Normaliza antes de comparar para garantir unicidade real
   * Usa comparação exata (eq) após normalização
   * 
   * ✅ SSOT: Delega para ProfileService.checkUsernameExists()
   * 
   * @throws Error se infraestrutura falhar
   */
  async identifierExists(username: string, excludeEntityId?: EntityId): Promise<boolean> {
    // Normaliza o username antes de checar (mesma normalização da policy)
    const normalizedUsername = this.policy.normalize(username);

    // ✅ SSOT: Delega para ProfileService
    const { ProfileService } = await import('@/core/profiles/services/ProfileService');
    return await ProfileService.checkUsernameExists(normalizedUsername, excludeEntityId);
  }

  /**
   * Busca usernames similares para sugestão (busca frouxa)
   * Usado apenas para gerar sugestões, não para decisão de disponibilidade
   * 
   * ✅ SSOT: Delega para ProfileService.getSimilarUsernames()
   * 
   * @throws Error se infraestrutura falhar
   */
  async getExistingSimilar(username: string): Promise<string[]> {
    // ✅ SSOT: Delega para ProfileService
    const { ProfileService } = await import('@/core/profiles/services/ProfileService');
    return await ProfileService.getSimilarUsernames(username, 20);
  }

  /**
   * Registra mudança de username
   * Trigger do banco faz o registro automático em profile_username_history
   */
  async recordChange(params: {
    entityId: EntityId;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void> {
    // Trigger automático registra em profile_username_history
    logger.info('[ProfileIdentityAdapter] Change will be recorded by trigger', params);
  }

  /**
   * Obtém histórico de mudanças
   * 
   * ✅ SSOT: Delega para ProfileService.getUsernameHistory()
   * 
   * @throws Error se falhar
   */
  async getHistory(entityId: EntityId): Promise<IdentityChangeRecord[]> {
    // ✅ SSOT: Delega para ProfileService
    const { ProfileService } = await import('@/core/profiles/services/ProfileService');
    const history = await ProfileService.getUsernameHistory(entityId);

    return history.map((record) => ({
      id: record.id,
      entityType: 'profile' as EntityType,
      entityId: record.profile_id,
      oldIdentifier: record.old_username,
      newIdentifier: record.new_username,
      reason: record.change_reason as ChangeReason,
      changedAt: new Date(record.changed_at),
    }));
  }

  /**
   * Calcula se pode trocar username (cooldown do histórico - SSOT)
   * @throws Error se falhar
   */
  async canChange(entityId: EntityId): Promise<CooldownResult> {
    try {
      const history = await this.getHistory(entityId);

      if (history.length === 0) {
        return {
          canChange: true,
          reason: 'first_change',
        };
      }

      const lastChange = history[0];
      const cooldownDays = this.policy.cooldownDays;
      const nextAllowedDate = new Date(lastChange.changedAt);
      nextAllowedDate.setDate(nextAllowedDate.getDate() + cooldownDays);

      const now = new Date();
      const canChange = now >= nextAllowedDate;

      if (!canChange) {
        const daysRemaining = Math.ceil(
          (nextAllowedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          canChange: false,
          reason: 'cooldown_active',
          nextAllowedDate,
          daysRemaining,
        };
      }

      return { canChange: true };
    } catch (error) {
      logger.error('[ProfileIdentityAdapter] canChange error:', error);
      throw error;
    }
  }

  /**
   * Resolve username antigo (SEM resolução pública)
   * Profile NÃO faz redirect de username antigo
   * Histórico é apenas para auditoria e cooldown
   */
  async resolveOldIdentifier(_oldUsername: string): Promise<{
    entityId: EntityId;
    currentIdentifier: string;
  } | null> {
    // Profile não resolve username antigo publicamente
    return null;
  }
}
