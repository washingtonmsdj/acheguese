/**
 * BusinessIdentityAdapter - persistencia de identidade publica de empresas.
 */
import { logger } from '@/shared/utils/logger';
import { BusinessService } from '@/core/business/services/BusinessService';
import { BusinessIdentityPolicy } from '../policies/BusinessIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type {
  EntityType,
  EntityId,
  ChangeReason,
  IdentityChangeRecord,
  CooldownResult,
} from '../domain/types';

export class BusinessIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'business';
  readonly policy = new BusinessIdentityPolicy();

  async identifierExists(slug: string, excludeEntityId?: EntityId): Promise<boolean> {
    try {
      const normalizedSlug = this.policy.normalize(slug);
      return await BusinessService.checkSlugExists(normalizedSlug, excludeEntityId);
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] identifierExists error:', error);
      throw new Error('Infrastructure error checking identifier');
    }
  }

  async getExistingSimilar(slug: string): Promise<string[]> {
    try {
      return await BusinessService.getSimilarSlugs(slug, 20);
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] getExistingSimilar error:', error);
      throw new Error('Infrastructure error getting similar identifiers');
    }
  }

  async recordChange(params: {
    entityId: EntityId;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void> {
    logger.info('[BusinessIdentityAdapter] Slug change handled by business_data update flow', params);
  }

  async getHistory(_entityId: EntityId): Promise<IdentityChangeRecord[]> {
    return [];
  }

  async canChange(_entityId: EntityId): Promise<CooldownResult> {
    return { canChange: true };
  }

  async resolveOldIdentifier(_oldSlug: string): Promise<{
    entityId: EntityId;
    currentIdentifier: string;
  } | null> {
    return null;
  }
}
