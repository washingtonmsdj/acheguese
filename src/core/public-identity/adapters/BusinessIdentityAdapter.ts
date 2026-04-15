/**
 * Business Identity Adapter
 * Implementação específica para business
 * 
 * ✅ SSOT COMPLIANCE: Delega para BusinessService
 * 
 * RESPONSABILIDADE: Boundary específica - toda persistência e consulta de business
 * Entity ID Canônico: business_data.id (PK da tabela)
 */

import { BusinessService } from '@/core/business/services/BusinessService';
import { BusinessIdentityPolicy } from '../policies/BusinessIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type { 
  EntityType,
  EntityId,
  ChangeReason, 
  IdentityChangeRecord, 
  CooldownResult 
} from '../domain/types';
import { logger } from '@/shared/utils/logger';

export class BusinessIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'business';
  readonly policy = new BusinessIdentityPolicy();

  /**
   * Verifica se slug já existe (checagem exata de unicidade)
   * Compatível com constraint real do banco
   * 
   * ✅ SSOT: Usa BusinessService
   * 
   * IMPORTANTE: Normaliza antes de comparar para garantir unicidade real
   * Usa comparação exata (eq) após normalização
   * 
   * @throws Error se infraestrutura falhar
   */
  async identifierExists(slug: string, excludeEntityId?: EntityId): Promise<boolean> {
    try {
      // Normaliza o slug antes de checar (mesma normalização da policy)
      const normalizedSlug = this.policy.normalize(slug);

      return await BusinessService.checkSlugExists(normalizedSlug, excludeEntityId);
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] identifierExists error:', error);
      throw new Error('Infrastructure error checking identifier');
    }
  }

  /**
   * Busca slugs similares para sugestão (busca frouxa)
   * Usado apenas para gerar sugestões, não para decisão de disponibilidade
   * 
   * ✅ SSOT: Usa BusinessService
   * 
   * @throws Error se infraestrutura falhar
   */
  async getExistingSimilar(slug: string): Promise<string[]> {
    try {
      return await BusinessService.getSimilarSlugs(slug, 20);
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] getExistingSimilar error:', error);
      throw new Error('Infrastructure error getting similar identifiers');
    }
  }

  /**
   * Registra mudança de slug
   * Trigger do banco faz o registro automático em business_slug_history
   */
  async recordChange(params: {
    entityId: EntityId;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void> {
    // Trigger automático registra em business_slug_history
    // Este método existe para interface, mas não precisa fazer nada
    logger.info('[BusinessIdentityAdapter] Change will be recorded by trigger', params);
  }

  /**
   * Obtém histórico de mudanças
   * 
   * ✅ SSOT: Usa BusinessService
   * 
   * @throws Error se falhar
   */
  async getHistory(entityId: EntityId): Promise<IdentityChangeRecord[]> {
    try {
      const history = await BusinessService.getSlugHistory(entityId);

      return history.map((record: any) => ({
        id: record.id,
        entityType: 'business' as EntityType,
        entityId: entityId,
        oldIdentifier: record.old_slug,
        newIdentifier: '', // Não armazenado no histórico
        reason: record.change_reason as ChangeReason,
        changedAt: new Date(record.created_at),
      }));
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] getHistory error:', error);
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
      logger.error('[BusinessIdentityAdapter] canChange error:', error);
      throw error;
    }
  }

  /**
   * Resolve slug antigo (resolução pública)
   * Business faz redirect 308 de URLs antigas
   * 
   * ✅ SSOT: Usa BusinessService
   * 
   * @throws Error se falhar
   */
  async resolveOldIdentifier(oldSlug: string): Promise<{
    entityId: EntityId;
    currentIdentifier: string;
  } | null> {
    try {
      const result = await BusinessService.resolveOldSlug(oldSlug);
      
      if (!result) {
        return null;
      }

      return {
        entityId: result.businessId,
        currentIdentifier: result.currentSlug,
      };
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] resolveOldIdentifier error:', error);
      throw new Error('Infrastructure error resolving old identifier');
    }
  }
}
