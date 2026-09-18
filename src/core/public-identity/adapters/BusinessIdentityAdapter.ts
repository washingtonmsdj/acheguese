/**
 * BusinessIdentityAdapter - persistencia de identidade publica de empresas.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { PAGINATION } from '@/shared/constants';
import { BusinessIdentityPolicy } from '../policies/BusinessIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type {
  EntityType,
  EntityId,
  ChangeReason,
  IdentityChangeRecord,
  CooldownResult,
} from '../domain/types';

/** Persistence owned by the public-identity boundary. */
export async function checkBusinessSlugExists(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from("business_data")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.maybeSingle();
  if (error) {
    logger.error("Error checking business slug existence:", error);
    throw error;
  }

  return Boolean(data);
}

export async function getExistingBusinessSlugs(
  slug: string,
  limit = PAGINATION.DEFAULT_LIMIT,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("business_data")
    .select("slug")
    .ilike("slug", `${slug}%`)
    .limit(limit);

  if (error) {
    logger.error("Error getting similar business slugs:", error);
    throw error;
  }

  return (data ?? [])
    .map((item) => item.slug)
    .filter((item): item is string => Boolean(item));
}

export class BusinessIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'business';
  readonly policy = new BusinessIdentityPolicy();

  async identifierExists(slug: string, excludeEntityId?: EntityId): Promise<boolean> {
    try {
      const normalizedSlug = this.policy.normalize(slug);
      return await checkBusinessSlugExists(normalizedSlug, excludeEntityId);
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] identifierExists error:', error);
      throw new Error('Infrastructure error checking identifier');
    }
  }

  async getExistingSimilar(slug: string): Promise<string[]> {
    try {
      return await getExistingBusinessSlugs(slug, 20);
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
