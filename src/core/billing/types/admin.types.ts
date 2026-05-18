/**
 * Admin Types for Catalog Management
 * 
 * Defines types for administrative operations on the commercial catalog.
 * Supports CRUD, versioning, and impact analysis.
 * 
 * @see F5_ADMIN_MONETIZATION.md
 * @see F1_1_SANEAMENTO_MODELAGEM.md
 */

import type {
  CatalogItemType,
  PlanTier,
  EntityFamily,
  Vertical,
  PricingModel,
} from './catalog.types';

export type CatalogVersionStatus = 'draft' | 'published' | 'deprecated' | 'archived';

// ============================================================================
// Catalog Version Management
// ============================================================================

export interface CatalogVersionCreateInput {
  version_number: string; // e.g., "v1.1.0"
  description: string;
  effective_date?: string; // ISO date
  created_by: string; // user_id
}

export interface CatalogVersionUpdateInput {
  description?: string;
  effective_date?: string;
  status?: CatalogVersionStatus;
}

export interface CatalogVersionWithStats {
  id: string;
  version_number: string;
  description: string;
  status: CatalogVersionStatus;
  effective_date: string | null;
  published_at: string | null;
  deprecated_at: string | null;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Stats
  total_items: number;
  base_plans_count: number;
  vertical_packages_count: number;
  addons_count: number;
  active_contracts_count: number;
}

// ============================================================================
// Catalog Item Management
// ============================================================================

export interface CatalogItemCreateInput {
  catalog_version_id: string;
  item_type: CatalogItemType;
  item_code: string; // e.g., "base-pro", "addon-analytics"
  display_name: string;
  description: string;
  plan_tier?: PlanTier;
  entity_family?: EntityFamily;
  vertical?: Vertical;
  pricing_model: PricingModel;
  requires_item_codes?: string[]; // Dependencies
  is_active: boolean;
  metadata?: Record<string, unknown>;
}

export interface CatalogItemUpdateInput {
  display_name?: string;
  description?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  // Note: Cannot update item_code, item_type, pricing_model after publish
}

export interface CatalogItemWithPolicies {
  // Base item
  id: string;
  catalog_version_id: string;
  item_type: CatalogItemType;
  item_code: string;
  display_name: string;
  description: string;
  plan_tier: PlanTier | null;
  entity_family: EntityFamily | null;
  vertical: Vertical | null;
  pricing_model: PricingModel;
  requires_item_codes: string[];
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  
  // Policies (joined)
  eligibility?: CatalogEligibilityRuleInput;
  entitlement?: CatalogEntitlementPolicyInput;
  pricing?: CatalogPricingPolicyInput;
}

// ============================================================================
// Eligibility Rules
// ============================================================================

export interface CatalogEligibilityRuleInput {
  allowed_entity_families?: EntityFamily[];
  allowed_verticals?: Vertical[];
  allowed_actor_types?: string[];
  min_business_age_days?: number;
  requires_verification?: boolean;
  custom_rules?: Record<string, unknown>;
}

// ============================================================================
// Entitlement Policies
// ============================================================================

export interface CatalogEntitlementPolicyInput {
  // Boolean capabilities
  can_use_short_premium_link?: boolean;
  can_use_premium_public_page?: boolean;
  can_use_custom_qr_code?: boolean;
  can_use_advanced_menu?: boolean;
  can_use_promotions?: boolean;
  can_use_basic_analytics?: boolean;
  can_use_advanced_analytics?: boolean;
  can_receive_internal_orders?: boolean;
  can_use_motoboy_network?: boolean;
  can_use_delivery_tracking?: boolean;
  can_use_multi_location?: boolean;
  can_use_team_management?: boolean;
  can_use_inventory_management?: boolean;
  can_use_customer_database?: boolean;
  can_use_loyalty_program?: boolean;
  can_use_email_marketing?: boolean;
  can_use_sms_marketing?: boolean;
  can_use_whatsapp_integration?: boolean;
  can_use_api_access?: boolean;
  can_use_white_label?: boolean;
  can_use_priority_support?: boolean;
  can_use_custom_domain?: boolean;
  can_use_advanced_reports?: boolean;
  can_use_financial_reports?: boolean;
  can_use_tax_reports?: boolean;
  
  // Limits/quotas
  max_menu_items?: number;
  max_images_per_item?: number;
  max_categories?: number;
  max_promotions?: number;
  max_team_members?: number;
  max_locations?: number;
  
  // Additional entitlements (flexible)
  additional_entitlements?: Record<string, unknown>;
}

// ============================================================================
// Pricing Policies
// ============================================================================

export interface CatalogPricingPolicyInput {
  price_cents: number;
  currency: string; // e.g., "BRL"
  billing_period?: string; // e.g., "monthly", "yearly"
  trial_period_days?: number;
  setup_fee_cents?: number;
  stripe_price_id?: string;
  stripe_lookup_key?: string;
  pricing_metadata?: Record<string, unknown>;
}

// ============================================================================
// Impact Analysis
// ============================================================================

export interface ImpactAnalysisResult {
  catalog_item_id: string;
  item_code: string;
  display_name: string;
  
  // Affected contracts
  affected_contracts_count: number;
  affected_users_count: number;
  affected_businesses_count: number;
  
  // Revenue impact
  current_mrr_cents: number; // Monthly Recurring Revenue
  projected_mrr_cents: number;
  mrr_delta_cents: number;
  mrr_delta_percentage: number;
  
  // Contract breakdown
  contracts_by_status: Record<string, number>;
  contracts_by_scope: Record<string, number>;
  
  // Migration complexity
  requires_migration: boolean;
  migration_complexity: 'low' | 'medium' | 'high';
  migration_notes: string[];
}

export interface BulkImpactAnalysisResult {
  version_id: string;
  version_number: string;
  total_affected_contracts: number;
  total_affected_users: number;
  total_mrr_delta_cents: number;
  items: ImpactAnalysisResult[];
}

// ============================================================================
// Validation Results
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CatalogItemValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface CatalogVersionValidationResult {
  is_valid: boolean;
  can_publish: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  items_validation: Record<string, CatalogItemValidationResult>;
}

// ============================================================================
// Audit Trail
// ============================================================================

export interface CatalogAuditEntry {
  id: string;
  entity_type: 'catalog_version' | 'catalog_item' | 'eligibility_rule' | 'entitlement_policy' | 'pricing_policy';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'deprecate' | 'archive';
  changed_by: string; // user_id
  changed_at: string;
  changes: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    diff: Record<string, { old: unknown; new: unknown }>;
  };
  reason?: string;
}

// ============================================================================
// Bulk Operations
// ============================================================================

export interface BulkCatalogItemCreateInput {
  version_id: string;
  items: CatalogItemCreateInput[];
  validate_before_create: boolean;
}

export interface BulkCatalogItemUpdateInput {
  item_ids: string[];
  updates: Partial<CatalogItemUpdateInput>;
  reason: string;
}

export interface BulkOperationResult<T> {
  success_count: number;
  error_count: number;
  results: Array<{
    item: T;
    success: boolean;
    error?: string;
  }>;
}
