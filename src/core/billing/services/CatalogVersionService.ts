/**
 * Catalog Version Service
 * 
 * Manages catalog version lifecycle: draft -> published -> deprecated -> archived
 * Enforces immutability rules and version transitions.
 * 
 * @see F5_ADMIN_MONETIZATION.md
 * @see F1_1_SANEAMENTO_MODELAGEM.md
 */

import { supabase } from '@/integrations/supabase';
import type {
  CatalogVersionCreateInput,
  CatalogVersionUpdateInput,
  CatalogVersionWithStats,
  CatalogVersionValidationResult,
  ValidationError,
} from '../types/admin.types';
type CatalogVersionStatus = 'draft' | 'published' | 'deprecated' | 'archived';
import { CatalogAdminService } from './CatalogAdminService';
const catalogVersionDb = supabase as any;

export class CatalogVersionService {
  // ============================================================================
  // Version CRUD
  // ============================================================================

  /**
   * Create a new catalog version in draft status
   */
  static async createVersion(input: CatalogVersionCreateInput): Promise<CatalogVersionWithStats> {
    // Validate version number format (e.g., "v1.0.0", "v2.1.3")
    const versionRegex = /^v\d+\.\d+\.\d+$/;
    if (!versionRegex.test(input.version_number)) {
      throw new Error('Invalid version number format. Expected: vX.Y.Z (e.g., v1.0.0)');
    }

    // Check if version already exists
    const { data: existing, error: existingError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .select('id')
      .eq('version_number', input.version_number)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to check version uniqueness: ${existingError.message}`);
    }

    if (existing) {
      throw new Error(`Version ${input.version_number} already exists`);
    }

    // Create version
    const { data: version, error: versionError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .insert({
        version_number: input.version_number,
        description: input.description,
        status: 'draft',
        effective_date: input.effective_date || null,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (versionError) {
      throw new Error(`Failed to create version: ${versionError.message}`);
    }

    return this.getVersionWithStats(version.id);
  }

  /**
   * Update a catalog version (only draft versions)
   */
  static async updateVersion(
    versionId: string,
    updates: CatalogVersionUpdateInput
  ): Promise<CatalogVersionWithStats> {
    // Fetch current version
    const { data: version, error: versionError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .select('status')
      .eq('id', versionId)
      .single();

    if (versionError) {
      throw new Error(`Failed to fetch version: ${versionError.message}`);
    }

    if (version.status !== 'draft' && updates.status === undefined) {
      throw new Error(`Cannot update ${version.status} version. Only draft versions can be modified.`);
    }

    // Update version
    const { error: updateError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .update({
        description: updates.description,
        effective_date: updates.effective_date,
        status: updates.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', versionId);

    if (updateError) {
      throw new Error(`Failed to update version: ${updateError.message}`);
    }

    return this.getVersionWithStats(versionId);
  }

  /**
   * Delete a catalog version (only draft versions with no items)
   */
  static async deleteVersion(versionId: string): Promise<void> {
    // Fetch version
    const { data: version, error: versionError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .select('status')
      .eq('id', versionId)
      .single();

    if (versionError) {
      throw new Error(`Failed to fetch version: ${versionError.message}`);
    }

    if (version.status !== 'draft') {
      throw new Error(`Cannot delete ${version.status} version. Only draft versions can be deleted.`);
    }

    // Check if version has items
    const { data: items, error: itemsError } = await catalogVersionDb
      .from('catalog_item')
      .select('id')
      .eq('catalog_version_id', versionId)
      .limit(1);

    if (itemsError) {
      throw new Error(`Failed to check items: ${itemsError.message}`);
    }

    if (items && items.length > 0) {
      throw new Error('Cannot delete version with items. Delete all items first.');
    }

    // Delete version
    const { error: deleteError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .delete()
      .eq('id', versionId);

    if (deleteError) {
      throw new Error(`Failed to delete version: ${deleteError.message}`);
    }
  }

  /**
   * Get version with statistics
   */
  static async getVersionWithStats(versionId: string): Promise<CatalogVersionWithStats> {
    const { data: version, error: versionError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError) {
      throw new Error(`Failed to fetch version: ${versionError.message}`);
    }

    // Get item counts
    const { data: items, error: itemsError } = await catalogVersionDb
      .from('catalog_item')
      .select('item_type')
      .eq('catalog_version_id', versionId);

    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }

    const itemCounts = {
      total: items?.length || 0,
      base_plan: items?.filter(i => i.item_type === 'base_plan').length || 0,
      vertical_package: items?.filter(i => i.item_type === 'vertical_package').length || 0,
      addon: items?.filter(i => i.item_type === 'addon').length || 0,
    };

    // Get active contracts count (only for published versions)
    let activeContractsCount = 0;
    if (version.status === 'published' || version.status === 'deprecated') {
      const { count, error: contractsError } = await catalogVersionDb
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('catalog_version_id', versionId)
        .in('status_v2', ['active', 'trialing']);

      if (!contractsError) {
        activeContractsCount = count || 0;
      }
    }

    return {
      ...version,
      total_items: itemCounts.total,
      base_plans_count: itemCounts.base_plan,
      vertical_packages_count: itemCounts.vertical_package,
      addons_count: itemCounts.addon,
      active_contracts_count: activeContractsCount,
    };
  }

  /**
   * List all versions
   */
  static async listVersions(filters?: {
    status?: CatalogVersionStatus;
  }): Promise<CatalogVersionWithStats[]> {
    let query = supabase
      .from('commercial_catalog_version')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: versions, error } = await query;

    if (error) {
      throw new Error(`Failed to list versions: ${error.message}`);
    }

    // Get stats for each version
    const versionsWithStats = await Promise.all(
      (versions || []).map(v => this.getVersionWithStats(v.id))
    );

    return versionsWithStats;
  }

  // ============================================================================
  // Version Lifecycle
  // ============================================================================

  /**
   * Publish a draft version
   * 
   * Validates all items before publishing.
   * Once published, version becomes immutable.
   */
  static async publishVersion(versionId: string): Promise<CatalogVersionWithStats> {
    // Validate version can be published
    const validation = await this.validateVersion(versionId);

    if (!validation.can_publish) {
      const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Cannot publish version. Errors: ${errorMessages}`);
    }

    // Update status to published
    const { error } = await catalogVersionDb
      .from('commercial_catalog_version')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', versionId);

    if (error) {
      throw new Error(`Failed to publish version: ${error.message}`);
    }

    return this.getVersionWithStats(versionId);
  }

  /**
   * Deprecate a published version
   * 
   * Marks version as deprecated but keeps it active for existing contracts.
   * New contracts cannot use deprecated versions.
   */
  static async deprecateVersion(versionId: string): Promise<CatalogVersionWithStats> {
    const { data: version, error: versionError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .select('status')
      .eq('id', versionId)
      .single();

    if (versionError) {
      throw new Error(`Failed to fetch version: ${versionError.message}`);
    }

    if (version.status !== 'published') {
      throw new Error(`Cannot deprecate ${version.status} version. Only published versions can be deprecated.`);
    }

    const { error } = await catalogVersionDb
      .from('commercial_catalog_version')
      .update({
        status: 'deprecated',
        deprecated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', versionId);

    if (error) {
      throw new Error(`Failed to deprecate version: ${error.message}`);
    }

    return this.getVersionWithStats(versionId);
  }

  /**
   * Archive a deprecated version
   * 
   * Only allowed when no active contracts reference this version.
   * Archived versions are read-only and hidden from normal views.
   */
  static async archiveVersion(versionId: string): Promise<CatalogVersionWithStats> {
    const { data: version, error: versionError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .select('status')
      .eq('id', versionId)
      .single();

    if (versionError) {
      throw new Error(`Failed to fetch version: ${versionError.message}`);
    }

    if (version.status !== 'deprecated') {
      throw new Error(`Cannot archive ${version.status} version. Only deprecated versions can be archived.`);
    }

    // Check for active contracts
    const { count, error: contractsError } = await catalogVersionDb
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('catalog_version_id', versionId)
      .in('status_v2', ['active', 'trialing']);

    if (contractsError) {
      throw new Error(`Failed to check active contracts: ${contractsError.message}`);
    }

    if (count && count > 0) {
      throw new Error(`Cannot archive version with ${count} active contracts. Wait for contracts to expire or migrate them.`);
    }

    const { error } = await catalogVersionDb
      .from('commercial_catalog_version')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', versionId);

    if (error) {
      throw new Error(`Failed to archive version: ${error.message}`);
    }

    return this.getVersionWithStats(versionId);
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate a version before publishing
   */
  static async validateVersion(versionId: string): Promise<CatalogVersionValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const itemsValidation: Record<string, any> = {};

    // Fetch version
    const { data: version, error: versionError } = await catalogVersionDb
      .from('commercial_catalog_version')
      .select('status')
      .eq('id', versionId)
      .single();

    if (versionError) {
      return {
        is_valid: false,
        can_publish: false,
        errors: [{ field: 'version', message: 'Version not found', severity: 'error' }],
        warnings: [],
        items_validation: {},
      };
    }

    if (version.status !== 'draft') {
      errors.push({
        field: 'status',
        message: `Cannot validate ${version.status} version. Only draft versions can be published.`,
        severity: 'error',
      });
    }

    // Fetch all items
    const { data: items, error: itemsError } = await catalogVersionDb
      .from('catalog_item')
      .select('*')
      .eq('catalog_version_id', versionId);

    if (itemsError) {
      errors.push({ field: 'items', message: `Failed to fetch items: ${itemsError.message}`, severity: 'error' });
      return {
        is_valid: false,
        can_publish: false,
        errors,
        warnings,
        items_validation: {},
      };
    }

    if (!items || items.length === 0) {
      errors.push({ field: 'items', message: 'Version has no items', severity: 'error' });
    }

    // Validate each item
    for (const item of items || []) {
      const itemValidation = await CatalogAdminService.validateCatalogItem(item.id);
      itemsValidation[item.item_code] = itemValidation;

      if (!itemValidation.is_valid) {
        errors.push({
          field: `items.${item.item_code}`,
          message: `Item validation failed: ${itemValidation.errors.map(e => e.message).join(', ')}`,
          severity: 'error',
        });
      }

      if (itemValidation.warnings.length > 0) {
        warnings.push({
          field: `items.${item.item_code}`,
          message: `Item warnings: ${itemValidation.warnings.map(w => w.message).join(', ')}`,
          severity: 'warning',
        });
      }
    }

    // Check for at least one base_plan
    const hasBasePlan = items?.some(i => i.item_type === 'base_plan');
    if (!hasBasePlan) {
      warnings.push({ field: 'items', message: 'No base_plan defined', severity: 'warning' });
    }

    return {
      is_valid: errors.length === 0,
      can_publish: errors.length === 0,
      errors,
      warnings,
      items_validation: itemsValidation,
    };
  }

  // ============================================================================
  // Cloning
  // ============================================================================

  /**
   * Clone a version to create a new draft
   * 
   * Useful for creating new versions based on existing ones.
   */
  static async cloneVersion(
    sourceVersionId: string,
    newVersionNumber: string,
    description: string,
    createdBy: string
  ): Promise<CatalogVersionWithStats> {
    // Create new version
    const newVersion = await this.createVersion({
      version_number: newVersionNumber,
      description,
      created_by: createdBy,
    });

    // Fetch all items from source version
    const sourceItems = await CatalogAdminService.listCatalogItems(sourceVersionId);

    // Clone each item
    for (const sourceItem of sourceItems) {
      await CatalogAdminService.createCatalogItem(
        {
          catalog_version_id: newVersion.id,
          item_type: sourceItem.item_type,
          item_code: sourceItem.item_code,
          display_name: sourceItem.display_name,
          description: sourceItem.description,
          plan_tier: sourceItem.plan_tier || undefined,
          entity_family: sourceItem.entity_family || undefined,
          vertical: sourceItem.vertical || undefined,
          pricing_model: sourceItem.pricing_model,
          requires_item_codes: sourceItem.requires_item_codes,
          is_active: sourceItem.is_active,
          metadata: sourceItem.metadata,
        },
        sourceItem.eligibility,
        sourceItem.entitlement,
        sourceItem.pricing
      );
    }

    return this.getVersionWithStats(newVersion.id);
  }
}
