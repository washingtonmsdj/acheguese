/**
 * Professional Identity Adapter
 * Implementação específica para profissionais
 *
 * ✅ SSOT COMPLIANCE: Delega para ProfessionalService
 *
 * RESPONSABILIDADE: Boundary específica - toda persistência e consulta de professional
 * Entity ID Canônico: professional_data.id (PK da tabela)
 */
import { logger } from '@/shared/utils/logger';
import { ProfessionalService } from '@/core/professional/services/ProfessionalService';
import { ProfessionalIdentityPolicy } from '../policies/ProfessionalIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type {
  EntityType,
  EntityId,
  ChangeReason,
  IdentityChangeRecord,
  CooldownResult,
} from '../domain/types';

export class ProfessionalIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'professional';
  readonly policy = new ProfessionalIdentityPolicy();

  /**
   * Verifica se slug já existe (checagem exata de unicidade)
   * Normaliza antes de comparar para garantir unicidade real
   * 
   * ✅ SSOT: Usa ProfessionalService
   * 
   * @throws Error se infraestrutura falhar
   */
  async identifierExists(slug: string, excludeEntityId?: EntityId): Promise<boolean> {
    try {
      const normalizedSlug = this.policy.normalize(slug);
      return await ProfessionalService.checkSlugExists(normalizedSlug, excludeEntityId);
    } catch (error) {
      logger.error('[ProfessionalIdentityAdapter] identifierExists error:', error);
      throw new Error('Infrastructure error checking identifier');
    }
  }

  /**
   * Busca slugs similares para sugestão (busca frouxa)
   * 
   * ✅ SSOT: Usa ProfessionalService
   * 
   * @throws Error se infraestrutura falhar
   */
  async getExistingSimilar(slug: string): Promise<string[]> {
    try {
      return await ProfessionalService.getSimilarSlugs(slug, 20);
    } catch (error) {
      logger.error('[ProfessionalIdentityAdapter] getExistingSimilar error:', error);
      throw new Error('Infrastructure error getting similar identifiers');
    }
  }

  /**
   * Registra mudança de slug
   * Trigger do banco faz o registro automático em professional_slug_history
   */
  async recordChange(params: {
    entityId: EntityId;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void> {
    logger.info('[ProfessionalIdentityAdapter] Change will be recorded by trigger', params);
  }

  /**
   * Obtém histórico de mudanças de slug
   * 
   * ✅ SSOT: Usa ProfessionalService
   * 
   * @throws Error se falhar
   */
  async getHistory(entityId: EntityId): Promise<IdentityChangeRecord[]> {
    try {
      const history = await ProfessionalService.getSlugHistory(entityId);

      return history.map((record: any) => ({
        id: record.id,
        entityType: 'professional' as EntityType,
        entityId: entityId,
        oldIdentifier: record.old_slug,
        newIdentifier: record.new_slug ?? '',
        reason: record.change_reason as ChangeReason,
        changedAt: new Date(record.created_at),
      }));
    } catch (error) {
      logger.error('[ProfessionalIdentityAdapter] getHistory error:', error);
      throw new Error('Infrastructure error getting history');
    }
  }

  /**
   * Calcula se pode trocar slug (cooldown do histórico - SSOT)
   * @throws Error se falhar
   */
  async canChange(entityId: EntityId): Promise<CooldownResult> {
    try {
      const history = await this.getHistory(entityId);

      if (history.length === 0) {
        return { canChange: true, reason: 'first_change' };
      }

      const lastChange = history[0];
      const cooldownDays = this.policy.cooldownDays;
      const nextAllowedDate = new Date(lastChange.changedAt);
      nextAllowedDate.setDate(nextAllowedDate.getDate() + cooldownDays);

      const now = new Date();
      const canChange = now >= nextAllowedDate;

      if (!canChange) {
        const daysRemaining = Math.ceil(
          (nextAllowedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return { canChange: false, reason: 'cooldown_active', nextAllowedDate, daysRemaining };
      }

      return { canChange: true };
    } catch (error) {
      logger.error('[ProfessionalIdentityAdapter] canChange error:', error);
      throw error;
    }
  }

  /**
   * Resolve slug antigo — sem redirect público nesta fase
   * Histórico é apenas para auditoria e cooldown
   */
  async resolveOldIdentifier(_oldSlug: string): Promise<{
    entityId: EntityId;
    currentIdentifier: string;
  } | null> {
    return null;
  }
}
