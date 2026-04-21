/**
 * Catalog Types — DTOs canônicos para catálogo comercial
 *
 * REGRAS ARQUITETURAIS:
 *   - Tipos compartilhados entre backend e frontend
 *   - Imutáveis após definição
 *   - Versionados junto com catálogo
 *
 * FASE: 3 - Services e Contratos
 * REFERÊNCIA: F3_SERVICES_RESTANTES.md
 *
 * @version 1.0.0
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EntityFamily = 'company' | 'professional' | 'worker';

export type Vertical = 
  | 'gastronomy'
  | 'health'
  | 'education'
  | 'services'
  | 'retail'
  | 'classifieds'
  | 'mobility_company'
  | 'mobility_driver'
  | 'mobility_courier';

export type ActorType = 
  | 'owner'
  | 'manager'
  | 'operator'
  | 'driver'
  | 'courier'
  | 'professional'
  | 'customer';

export type PlanTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise' | 'delivery';

export type CatalogItemType = 'base_plan' | 'vertical_package' | 'addon';

export type PricingModel = 'free' | 'subscription' | 'transactional' | 'hybrid';

export type CatalogStatus = 'draft' | 'published' | 'deprecated' | 'archived';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/**
 * Contexto de elegibilidade para filtrar catálogo.
 */
export interface EligibilityContextDTO {
  user_id: string;
  entity_family: EntityFamily;
  vertical: Vertical;
  actor_type?: ActorType;
}

/**
 * Item de catálogo (plano, pacote vertical ou addon).
 */
export interface CatalogItemDTO {
  id: string;
  item_code: string;
  item_name: string;
  item_description?: string;
  item_type: CatalogItemType;
  plan_tier: PlanTier;
  entity_family: EntityFamily;
  vertical: Vertical;
  pricing_model: PricingModel;
  status: CatalogStatus;
  
  // Políticas
  entitlement_policy?: EntitlementPolicyDTO;
  pricing_policy?: PricingPolicyDTO;
  
  // Metadata
  created_at: string;
  updated_at: string;
  catalog_version_id: string;
}

/**
 * Política de entitlement (capacidades e limites).
 */
export interface EntitlementPolicyDTO {
  // Página Pública
  can_use_premium_public_page: boolean;
  can_use_short_premium_link: boolean;
  can_use_custom_qr_code: boolean;
  
  // Cardápio
  can_use_advanced_menu: boolean;
  can_use_menu_categories: boolean;
  can_use_menu_images: boolean;
  can_use_menu_variations: boolean;
  can_use_menu_addons: boolean;
  can_use_menu_combos: boolean;
  can_manage_availability: boolean;
  can_schedule_items: boolean;
  
  // Pedidos
  can_receive_internal_orders: boolean;
  can_use_orders_panel: boolean;
  can_manage_order_status: boolean;
  can_cancel_orders: boolean;
  can_view_order_history: boolean;
  
  // Delivery
  can_use_motoboy_network: boolean;
  can_request_delivery: boolean;
  can_track_delivery: boolean;
  can_configure_delivery_area: boolean;
  can_set_delivery_fees: boolean;
  can_manage_business_hours: boolean;
  can_set_minimum_order: boolean;
  can_use_own_delivery: boolean;
  
  // Marketing
  can_use_promotions: boolean;
  can_use_featured_placement: boolean;
  can_use_banners: boolean;
  can_use_coupons: boolean;
  can_schedule_promotions: boolean;
  
  // Analytics
  can_use_basic_analytics: boolean;
  can_use_advanced_analytics: boolean;
  can_export_reports: boolean;
  can_view_realtime_metrics: boolean;
  can_view_customer_insights: boolean;
  
  // Limites
  max_menu_items: number | null;
  max_promotions: number | null;
  max_images: number | null;
  max_categories: number | null;
  max_combos: number | null;
  max_orders_per_day: number | null;
}

/**
 * Política de pricing (preço e cobrança).
 */
export interface PricingPolicyDTO {
  price_cents: number;
  currency: string;
  billing_period: 'monthly' | 'yearly' | 'one_time' | 'usage_based';
  stripe_price_id: string;
  stripe_lookup_key?: string;
  trial_period_days?: number;
}

/**
 * Catálogo elegível (filtrado por contexto).
 */
export interface EligibleCatalogDTO {
  base_plans: CatalogItemDTO[];
  vertical_packages: CatalogItemDTO[];
  addons: CatalogItemDTO[];
  context: EligibilityContextDTO;
}

/**
 * Resultado de validação de elegibilidade.
 */
export interface EligibilityValidationDTO {
  eligible: boolean;
  reason?: string;
  item_id?: string;
  user_id?: string;
}
