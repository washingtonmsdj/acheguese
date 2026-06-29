/**
 * Catalog Admin Service
 * 
 * Provides administrative operations for managing the commercial catalog.
 * Enforces governance rules, versioning, and impact analysis.
 * 
 * @see F5_ADMIN_MONETIZATION.md
 * @see F1_1_SANEAMENTO_MODELAGEM.md
 */

import { supabase } from '@/integrations/supabase';
import { buildSafeOrILikeFilter } from '@/shared/utils/sqlSanitization';
import type {
  CatalogItemCreateInput,
  CatalogItemUpdateInput,
  CatalogItemWithPolicies,
  CatalogEligibilityRuleInput,
  CatalogEntitlementPolicyInput,
  CatalogPricingPolicyInput,
  CatalogItemValidationResult,
  ValidationError,
} from '../types/admin.types';

type QueryError = { message?: string | null; code?: string | null };

type QueryArrayResult<T> = {
  data: T[] | null;
  error: QueryError | null;
  count?: number | null;
};

type QuerySingleResult<T> = {
  data: T | null;
  error: QueryError | null;
};

type QueryResult<T> = {
  data: T | T[] | null;
  error: QueryError | null;
};

type QueryBuilder<T extends object> = PromiseLike<QueryArrayResult<T>> & {
  select(columns?: string, options?: { count?: 'exact'; head?: boolean }): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  in(column: string, values: readonly unknown[]): QueryBuilder<T>;
  contains(column: string, value: readonly unknown[]): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  or(filter: string): QueryBuilder<T>;
  insert(values: Record<string, unknown> | Array<Record<string, unknown>>): QueryBuilder<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
  upsert(values: Record<string, unknown> | Array<Record<string, unknown>>): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  single(): Promise<QuerySingleResult<T>>;
  maybeSingle(): Promise<QuerySingleResult<T>>;
};

type CatalogAdminDbClient = {
  from<T extends object>(table: string): QueryBuilder<T>;
};

type VersionStatusRow = { status: string };
type CatalogVersionRelationRow = { commercial_catalog_version: VersionStatusRow | VersionStatusRow[] };
type CatalogItemIdRow = { id: string };
type CatalogItemCodeRow = { id?: string; item_code: string };
type CatalogItemWithVersionStatusRow = CatalogItemWithPolicies & CatalogVersionRelationRow;
type EligibilityPolicyRow = CatalogEligibilityRuleInput;
type EntitlementPolicyRow = CatalogEntitlementPolicyInput;
type PricingPolicyRow = CatalogPricingPolicyInput;

const catalogAdminDb = supabase as unknown as CatalogAdminDbClient;

function readVersionStatus(
  relation: CatalogVersionRelationRow['commercial_catalog_version'],
): string {
  return Array.isArray(relation) ? relation[0]?.status ?? '' : relation?.status ?? '';
}

export class CatalogAdminService {
  // ============================================================================
  // Catalog Item CRUD
  // ============================================================================

  /**
   * Create a new catalog item with all policies
   * 
   * @throws Error if version is not in draft status
   * @throws Error if item_code already exists in version
   */
  static async createCatalogItem(
    input: CatalogItemCreateInput,
    eligibility?: CatalogEligibilityRuleInput,
    entitlement?: CatalogEntitlementPolicyInput,
    pricing?: CatalogPricingPolicyInput
  ): Promise<CatalogItemWithPolicies> {
    // 1. Validate version is in draft
    const { data: version, error: versionError } = await catalogAdminDb
      .from<VersionStatusRow>('commercial_catalog_version')
      .select('status')
      .eq('id', input.catalog_version_id)
      .single();

    if (versionError) {
      throw new Error(`Failed to fetch catalog version: ${versionError.message}`);
    }

    if (version.status !== 'draft') {
      throw new Error(`Cannot create item in ${version.status} version. Only draft versions can be modified.`);
    }

    // 2. Validate item_code uniqueness within version
    const { data: existing, error: existingError } = await catalogAdminDb
      .from<CatalogItemIdRow>('catalog_item')
      .select('id')
      .eq('catalog_version_id', input.catalog_version_id)
      .eq('item_code', input.item_code)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to check item_code uniqueness: ${existingError.message}`);
    }

    if (existing) {
      throw new Error(`Item with code '${input.item_code}' already exists in this version`);
    }

    // 3. Validate dependencies
    if (input.requires_item_codes && input.requires_item_codes.length > 0) {
      const { data: dependencies, error: depsError } = await catalogAdminDb
        .from<CatalogItemCodeRow>('catalog_item')
        .select('item_code')
        .eq('catalog_version_id', input.catalog_version_id)
        .in('item_code', input.requires_item_codes);

      if (depsError) {
        throw new Error(`Failed to validate dependencies: ${depsError.message}`);
      }

      const foundCodes = dependencies?.map(d => d.item_code) || [];
      const missingCodes = input.requires_item_codes.filter(code => !foundCodes.includes(code));

      if (missingCodes.length > 0) {
        throw new Error(`Missing required dependencies: ${missingCodes.join(', ')}`);
      }
    }

    // 4. Create catalog item
    const { data: item, error: itemError } = await catalogAdminDb
      .from<CatalogItemWithPolicies>('catalog_item')
      .insert({
        catalog_version_id: input.catalog_version_id,
        item_type: input.item_type,
        item_code: input.item_code,
        display_name: input.display_name,
        description: input.description,
        plan_tier: input.plan_tier || null,
        entity_family: input.entity_family || null,
        vertical: input.vertical || null,
        pricing_model: input.pricing_model,
        requires_item_codes: input.requires_item_codes || [],
        is_active: input.is_active,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (itemError) {
      throw new Error(`Failed to create catalog item: ${itemError.message}`);
    }
    if (!item) {
      throw new Error('Failed to create catalog item: no item returned');
    }

    // 5. Create policies
    const policies = await this.createPolicies(item.id, eligibility, entitlement, pricing);

    return {
      ...item,
      eligibility: policies.eligibility,
      entitlement: policies.entitlement,
      pricing: policies.pricing,
    };
  }

  /**
   * Update an existing catalog item
   * 
   * @throws Error if version is published/deprecated/archived
   * @throws Error if trying to update immutable fields
   */
  static async updateCatalogItem(
    itemId: string,
    updates: CatalogItemUpdateInput
  ): Promise<CatalogItemWithPolicies> {
    // 1. Fetch item with version status
    const { data: item, error: itemError } = await catalogAdminDb
      .from<CatalogItemWithVersionStatusRow>('catalog_item')
      .select(`
        *,
        commercial_catalog_version!inner(status)
      `)
      .eq('id', itemId)
      .single();

    if (itemError) {
      throw new Error(`Failed to fetch catalog item: ${itemError.message}`);
    }
    if (!item) {
      throw new Error('Failed to fetch catalog item');
    }

    const versionStatus = readVersionStatus(item.commercial_catalog_version);

    if (versionStatus !== 'draft') {
      throw new Error(`Cannot update item in ${versionStatus} version. Only draft versions can be modified.`);
    }

    // 2. Update item
    const { data: updated, error: updateError } = await catalogAdminDb
      .from<CatalogItemWithPolicies>('catalog_item')
      .update({
        display_name: updates.display_name,
        description: updates.description,
        is_active: updates.is_active,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update catalog item: ${updateError.message}`);
    }
    if (!updated) {
      throw new Error('Failed to update catalog item: no row returned');
    }

    // 3. Fetch policies
    const policies = await this.fetchPolicies(itemId);

    return {
      ...updated,
      ...policies,
    };
  }

  /**
   * Delete a catalog item (only in draft versions)
   * 
   * @throws Error if version is not draft
   * @throws Error if item is referenced by other items
   */
  static async deleteCatalogItem(itemId: string): Promise<void> {
    // 1. Fetch item with version status
    const { data: item, error: itemError } = await catalogAdminDb
      .from<CatalogItemCodeRow & { catalog_version_id: string } & CatalogVersionRelationRow>('catalog_item')
      .select(`
        item_code,
        catalog_version_id,
        commercial_catalog_version!inner(status)
      `)
      .eq('id', itemId)
      .single();

    if (itemError) {
      throw new Error(`Failed to fetch catalog item: ${itemError.message}`);
    }
    if (!item) {
      throw new Error('Failed to fetch catalog item');
    }

    const versionStatus = readVersionStatus(item.commercial_catalog_version);

    if (versionStatus !== 'draft') {
      throw new Error(`Cannot delete item in ${versionStatus} version. Only draft versions can be modified.`);
    }

    // 2. Check if item is referenced by other items
    const { data: references, error: refsError } = await catalogAdminDb
      .from<CatalogItemCodeRow>('catalog_item')
      .select('id, item_code')
      .eq('catalog_version_id', item.catalog_version_id)
      .contains('requires_item_codes', [item.item_code]);

    if (refsError) {
      throw new Error(`Failed to check references: ${refsError.message}`);
    }

    if (references && references.length > 0) {
      const refCodes = references.map(r => r.item_code).join(', ');
      throw new Error(`Cannot delete item. Referenced by: ${refCodes}`);
    }

    // 3. Delete policies first (cascade)
    await Promise.all([
      catalogAdminDb.from('catalog_eligibility_rule').delete().eq('catalog_item_id', itemId),
      catalogAdminDb.from('catalog_entitlement_policy').delete().eq('catalog_item_id', itemId),
      catalogAdminDb.from('catalog_pricing_policy').delete().eq('catalog_item_id', itemId),
    ]);

    // 4. Delete item
    const { error: deleteError } = await catalogAdminDb
      .from('catalog_item')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      throw new Error(`Failed to delete catalog item: ${deleteError.message}`);
    }
  }

  /**
   * Get catalog item with all policies
   */
  static async getCatalogItem(itemId: string): Promise<CatalogItemWithPolicies | null> {
    const { data: item, error: itemError } = await catalogAdminDb
      .from<CatalogItemWithPolicies>('catalog_item')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError) {
      if (itemError.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch catalog item: ${itemError.message}`);
    }

    const policies = await this.fetchPolicies(itemId);

    return {
      ...item,
      ...policies,
    };
  }

  /**
   * List catalog items in a version
   */
  static async listCatalogItems(
    versionId: string,
    filters?: {
      item_type?: string;
      is_active?: boolean;
      search?: string;
    }
  ): Promise<CatalogItemWithPolicies[]> {
    let query = catalogAdminDb
      .from<CatalogItemWithPolicies>('catalog_item')
      .select('*')
      .eq('catalog_version_id', versionId)
      .order('item_type', { ascending: true })
      .order('item_code', { ascending: true });

    if (filters?.item_type) {
      query = query.eq('item_type', filters.item_type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      const searchFilter = buildSafeOrILikeFilter(['item_code', 'display_name'], filters.search);
      if (searchFilter) {
        query = query.or(searchFilter);
      }
    }

    const { data: items, error } = await query;

    if (error) {
      throw new Error(`Failed to list catalog items: ${error.message}`);
    }

    // Fetch policies for all items
    const itemsWithPolicies = await Promise.all(
      (items || []).map(async (item) => {
        const policies = await this.fetchPolicies(item.id);
        return { ...item, ...policies };
      })
    );

    return itemsWithPolicies;
  }

  // ============================================================================
  // Policy Management
  // ============================================================================

  /**
   * Update eligibility rule for a catalog item
   */
  static async updateEligibilityRule(
    itemId: string,
    rule: CatalogEligibilityRuleInput
  ): Promise<void> {
    await this.ensureDraftVersion(itemId);

    const { error } = await catalogAdminDb
      .from('catalog_eligibility_rule')
      .upsert({
        catalog_item_id: itemId,
        allowed_entity_families: rule.allowed_entity_families || null,
        allowed_verticals: rule.allowed_verticals || null,
        allowed_actor_types: rule.allowed_actor_types || null,
        min_business_age_days: rule.min_business_age_days || null,
        requires_verification: rule.requires_verification || false,
        custom_rules: rule.custom_rules || {},
      });

    if (error) {
      throw new Error(`Failed to update eligibility rule: ${error.message}`);
    }
  }

  /**
   * Update entitlement policy for a catalog item
   */
  static async updateEntitlementPolicy(
    itemId: string,
    policy: CatalogEntitlementPolicyInput
  ): Promise<void> {
    await this.ensureDraftVersion(itemId);

    const { error } = await catalogAdminDb
      .from('catalog_entitlement_policy')
      .upsert({
        catalog_item_id: itemId,
        ...policy,
      });

    if (error) {
      throw new Error(`Failed to update entitlement policy: ${error.message}`);
    }
  }

  /**
   * Update pricing policy for a catalog item
   */
  static async updatePricingPolicy(
    itemId: string,
    policy: CatalogPricingPolicyInput
  ): Promise<void> {
    await this.ensureDraftVersion(itemId);

    const { error } = await catalogAdminDb
      .from('catalog_pricing_policy')
      .upsert({
        catalog_item_id: itemId,
        price_cents: policy.price_cents,
        currency: policy.currency,
        billing_period: policy.billing_period || null,
        trial_period_days: policy.trial_period_days || null,
        setup_fee_cents: policy.setup_fee_cents || null,
        stripe_price_id: policy.stripe_price_id || null,
        stripe_lookup_key: policy.stripe_lookup_key || null,
        pricing_metadata: policy.pricing_metadata || {},
      });

    if (error) {
      throw new Error(`Failed to update pricing policy: ${error.message}`);
    }
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate a catalog item before publish
   */
  static async validateCatalogItem(itemId: string): Promise<CatalogItemValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    const item = await this.getCatalogItem(itemId);

    if (!item) {
      return {
        is_valid: false,
        errors: [{ field: 'item', message: 'Item not found', severity: 'error' }],
        warnings: [],
      };
    }

    // Validate required fields
    if (!item.display_name || item.display_name.trim() === '') {
      errors.push({ field: 'display_name', message: 'Display name is required', severity: 'error' });
    }

    if (!item.description || item.description.trim() === '') {
      errors.push({ field: 'description', message: 'Description is required', severity: 'error' });
    }

    // Validate pricing policy exists
    if (!item.pricing) {
      errors.push({ field: 'pricing', message: 'Pricing policy is required', severity: 'error' });
    } else {
      if (item.pricing.price_cents < 0) {
        errors.push({ field: 'pricing.price_cents', message: 'Price cannot be negative', severity: 'error' });
      }

      if (item.pricing_model !== 'free' && item.pricing.price_cents === 0) {
        warnings.push({ field: 'pricing.price_cents', message: 'Non-free item has zero price', severity: 'warning' });
      }

      if (item.pricing_model === 'subscription' && !item.pricing.billing_period) {
        errors.push({ field: 'pricing.billing_period', message: 'Billing period required for subscription', severity: 'error' });
      }
    }

    // Validate entitlement policy exists
    if (!item.entitlement) {
      warnings.push({ field: 'entitlement', message: 'No entitlement policy defined', severity: 'warning' });
    }

    // Validate dependencies exist
    if (item.requires_item_codes && item.requires_item_codes.length > 0) {
      const { data: deps } = await catalogAdminDb
        .from<CatalogItemCodeRow>('catalog_item')
        .select('item_code')
        .eq('catalog_version_id', item.catalog_version_id)
        .in('item_code', item.requires_item_codes);

      const foundCodes = deps?.map(d => d.item_code) || [];
      const missingCodes = item.requires_item_codes.filter(code => !foundCodes.includes(code));

      if (missingCodes.length > 0) {
        errors.push({
          field: 'requires_item_codes',
          message: `Missing dependencies: ${missingCodes.join(', ')}`,
          severity: 'error',
        });
      }
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static async createPolicies(
    itemId: string,
    eligibility?: CatalogEligibilityRuleInput,
    entitlement?: CatalogEntitlementPolicyInput,
    pricing?: CatalogPricingPolicyInput
  ) {
    const results: {
      eligibility?: CatalogEligibilityRuleInput;
      entitlement?: CatalogEntitlementPolicyInput;
      pricing?: CatalogPricingPolicyInput;
    } = {};

    if (eligibility) {
      await catalogAdminDb.from('catalog_eligibility_rule').insert({
        catalog_item_id: itemId,
        ...eligibility,
      });
      results.eligibility = eligibility;
    }

    if (entitlement) {
      await catalogAdminDb.from<EntitlementPolicyRow>('catalog_entitlement_policy').insert({
        catalog_item_id: itemId,
        ...entitlement,
      });
      results.entitlement = entitlement;
    }

    if (pricing) {
      await catalogAdminDb.from<PricingPolicyRow>('catalog_pricing_policy').insert({
        catalog_item_id: itemId,
        ...pricing,
      });
      results.pricing = pricing;
    }

    return results;
  }

  private static async fetchPolicies(itemId: string) {
    const [eligibilityRes, entitlementRes, pricingRes] = await Promise.all([
      catalogAdminDb.from<EligibilityPolicyRow>('catalog_eligibility_rule').select('*').eq('catalog_item_id', itemId).maybeSingle(),
      catalogAdminDb.from<EntitlementPolicyRow>('catalog_entitlement_policy').select('*').eq('catalog_item_id', itemId).maybeSingle(),
      catalogAdminDb.from<PricingPolicyRow>('catalog_pricing_policy').select('*').eq('catalog_item_id', itemId).maybeSingle(),
    ]);

    return {
      eligibility: eligibilityRes.data || undefined,
      entitlement: entitlementRes.data || undefined,
      pricing: pricingRes.data || undefined,
    };
  }

  private static async ensureDraftVersion(itemId: string): Promise<void> {
    const { data: item, error } = await catalogAdminDb
      .from<CatalogVersionRelationRow>('catalog_item')
      .select(`
        commercial_catalog_version!inner(status)
      `)
      .eq('id', itemId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch item: ${error.message}`);
    }
    if (!item) {
      throw new Error('Failed to fetch item');
    }

    const versionStatus = readVersionStatus(item.commercial_catalog_version);

    if (versionStatus !== 'draft') {
      throw new Error(`Cannot modify policies in ${versionStatus} version. Only draft versions can be modified.`);
    }
  }
}
