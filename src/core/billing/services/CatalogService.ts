/**
 * CatalogService — owner do catálogo comercial publicado.
 *
 * Fonte de verdade para oferta, preço e entitlement de contratação:
 * commercial_catalog_version + catalog_item + catalog_*_policy.
 * Identificadores Stripe permanecem server-only no checkout.
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';

export interface EligibilityContext {
  user_id: string;
  entity_family: 'company' | 'professional' | 'worker';
  vertical: string;
  actor_type?: string;
}

export interface CatalogEntitlementPolicy {
  can_use_premium_public_page: boolean;
  can_use_short_premium_link: boolean;
  can_use_custom_qr_code: boolean;
  can_use_advanced_menu: boolean;
  can_receive_internal_orders: boolean;
  can_use_motoboy_network: boolean;
  can_use_promotions: boolean;
  can_use_basic_analytics: boolean;
  can_use_advanced_analytics: boolean;
  max_menu_items: number | null;
  max_promotions: number | null;
  max_images: number | null;
  max_categories: number | null;
  max_orders_per_day: number | null;
  additional_entitlements: Record<string, unknown>;
}

export interface CatalogPricingPolicy {
  price_cents: number;
  currency: string;
  billing_period: string | null;
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  item_code: string;
  item_name: string;
  item_type: 'base_plan' | 'vertical_package' | 'addon';
  plan_tier: string;
  entity_family: string | null;
  vertical: string | null;
  pricing_model: 'free' | 'subscription' | 'transactional' | 'hybrid';
  status: string;
  description: string | null;
  features: string[];
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  entitlement_policy?: CatalogEntitlementPolicy;
  pricing_policy?: CatalogPricingPolicy;
}

type CatalogVersion = {
  version_code: string;
  status: string;
};

type CatalogRow = {
  id: string;
  item_code: string;
  item_name: string;
  item_type: 'base_plan' | 'vertical_package' | 'addon';
  plan_tier: string;
  entity_family: string | null;
  vertical: string | null;
  pricing_model: 'free' | 'subscription' | 'transactional' | 'hybrid';
  description: string | null;
  features: unknown;
  display_order: number | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  commercial_catalog_version?: CatalogVersion | CatalogVersion[] | null;
  catalog_entitlement_policy?:
    | CatalogEntitlementPolicy
    | CatalogEntitlementPolicy[]
    | null;
  catalog_pricing_policy?: CatalogPricingPolicy | CatalogPricingPolicy[] | null;
};

type CatalogEligibilityRow = Pick<
  CatalogRow,
  'entity_family' | 'vertical' | 'commercial_catalog_version'
>;

export interface EligibleCatalog {
  version: string;
  items: CatalogItem[];
  base_plans: CatalogItem[];
  vertical_packages: CatalogItem[];
  addons: CatalogItem[];
}

type QueryError = { message?: string | null };
type QueryArrayResult<T> = { data: T[] | null; error: QueryError | null };
type QuerySingleResult<T> = { data: T | null; error: QueryError | null };

type QueryBuilder<T extends object> = PromiseLike<QueryArrayResult<T>> & {
  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: unknown): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  maybeSingle(): Promise<QuerySingleResult<T>>;
};

type CatalogDbClient = {
  from<T extends object>(table: string): QueryBuilder<T>;
};

const catalogDb = supabase as unknown as CatalogDbClient;
const EMPTY_CATALOG_VERSION = '0.0.0';

const CATALOG_SELECT = `
  id,
  item_code,
  item_name,
  item_type,
  plan_tier,
  entity_family,
  vertical,
  pricing_model,
  description,
  features,
  display_order,
  is_featured,
  created_at,
  updated_at,
  commercial_catalog_version!inner (
    version_code,
    status
  ),
  catalog_entitlement_policy (
    can_use_premium_public_page,
    can_use_short_premium_link,
    can_use_custom_qr_code,
    can_use_advanced_menu,
    can_receive_internal_orders,
    can_use_motoboy_network,
    can_use_promotions,
    can_use_basic_analytics,
    can_use_advanced_analytics,
    max_menu_items,
    max_promotions,
    max_images,
    max_categories,
    max_orders_per_day,
    additional_entitlements
  ),
  catalog_pricing_policy (
    price_cents,
    currency,
    billing_period
  )
`;

function firstRelated<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function getCatalogVersion(
  row?: Pick<CatalogRow, 'commercial_catalog_version'> | null,
): CatalogVersion {
  const version = firstRelated(row?.commercial_catalog_version);
  return {
    version_code: version?.version_code ?? EMPTY_CATALOG_VERSION,
    status: version?.status ?? 'unknown',
  };
}

function normalizeFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizePlanCode(planCode: string): string {
  const normalized = planCode.trim().toLowerCase();
  if (normalized === 'free' || normalized === 'pro' || normalized === 'delivery') {
    return `base-${normalized}`;
  }
  return normalized;
}

function emptyCatalog(): EligibleCatalog {
  return {
    version: EMPTY_CATALOG_VERSION,
    items: [],
    base_plans: [],
    vertical_packages: [],
    addons: [],
  };
}

export class CatalogService {
  static async getEligibleCatalog(
    context: EligibilityContext,
  ): Promise<EligibleCatalog> {
    try {
      const { data, error } = await catalogDb
        .from<CatalogRow>('catalog_item')
        .select(CATALOG_SELECT)
        .eq('entity_family', context.entity_family)
        .eq('commercial_catalog_version.status', 'published')
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[CatalogService] Erro ao buscar catálogo:', error);
        return emptyCatalog();
      }

      const mapped = (data ?? [])
        .map(this.mapCatalogItem)
        .filter(
          (item) =>
            item.item_type === 'base_plan' ||
            item.vertical === null ||
            item.vertical === context.vertical,
        );

      return {
        version: getCatalogVersion(data?.[0]).version_code,
        items: mapped,
        base_plans: mapped.filter((item) => item.item_type === 'base_plan'),
        vertical_packages: mapped.filter(
          (item) => item.item_type === 'vertical_package',
        ),
        addons: mapped.filter((item) => item.item_type === 'addon'),
      };
    } catch (error) {
      logger.error('[CatalogService] Erro ao buscar catálogo:', error);
      return emptyCatalog();
    }
  }

  static async getPublishedBasePlans(): Promise<CatalogItem[]> {
    try {
      const { data, error } = await catalogDb
        .from<CatalogRow>('catalog_item')
        .select(CATALOG_SELECT)
        .eq('item_type', 'base_plan')
        .eq('entity_family', 'company')
        .eq('commercial_catalog_version.status', 'published')
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[CatalogService] Erro ao buscar planos base:', error);
        throw error;
      }

      return (data ?? []).map(this.mapCatalogItem);
    } catch (error) {
      logger.error('[CatalogService] Erro inesperado ao buscar planos base:', error);
      throw error;
    }
  }

  static async getPlanByCode(planCode: string): Promise<CatalogItem | null> {
    try {
      const itemCode = normalizePlanCode(planCode);
      const { data, error } = await catalogDb
        .from<CatalogRow>('catalog_item')
        .select(CATALOG_SELECT)
        .eq('item_code', itemCode)
        .eq('commercial_catalog_version.status', 'published')
        .maybeSingle();

      if (error) {
        logger.error('[CatalogService] Erro ao buscar plano:', error);
        return null;
      }

      return data ? this.mapCatalogItem(data) : null;
    } catch (error) {
      logger.error('[CatalogService] Erro ao buscar plano:', error);
      return null;
    }
  }

  static async getAddonsByVertical(vertical: string): Promise<CatalogItem[]> {
    try {
      const { data, error } = await catalogDb
        .from<CatalogRow>('catalog_item')
        .select(CATALOG_SELECT)
        .eq('item_type', 'addon')
        .eq('vertical', vertical)
        .eq('commercial_catalog_version.status', 'published')
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[CatalogService] Erro ao buscar addons:', error);
        return [];
      }

      return (data ?? []).map(this.mapCatalogItem);
    } catch (error) {
      logger.error('[CatalogService] Erro ao buscar addons:', error);
      return [];
    }
  }

  static async validateEligibility(
    context: EligibilityContext,
    itemId: string,
  ): Promise<{ eligible: boolean; reason?: string }> {
    try {
      const { data: item, error } = await catalogDb
        .from<CatalogEligibilityRow>('catalog_item')
        .select(
          'entity_family, vertical, commercial_catalog_version!inner (version_code, status)',
        )
        .eq('id', itemId)
        .eq('commercial_catalog_version.status', 'published')
        .maybeSingle();

      if (error || !item) {
        return { eligible: false, reason: 'Item não encontrado' };
      }

      if (getCatalogVersion(item).status !== 'published') {
        return { eligible: false, reason: 'Item não está disponível' };
      }

      if (item.entity_family !== context.entity_family) {
        return {
          eligible: false,
          reason: 'Item não disponível para seu tipo de conta',
        };
      }

      if (item.vertical !== null && item.vertical !== context.vertical) {
        return { eligible: false, reason: 'Item não disponível para sua vertical' };
      }

      return { eligible: true };
    } catch (error) {
      logger.error('[CatalogService] Erro ao validar elegibilidade:', error);
      return { eligible: false, reason: 'Erro ao validar elegibilidade' };
    }
  }

  private static mapCatalogItem(item: CatalogRow): CatalogItem {
    return {
      id: item.id,
      code: item.item_code,
      name: item.item_name,
      item_code: item.item_code,
      item_name: item.item_name,
      item_type: item.item_type,
      plan_tier: item.plan_tier,
      entity_family: item.entity_family,
      vertical: item.vertical,
      pricing_model: item.pricing_model,
      status: getCatalogVersion(item).status,
      description: item.description,
      features: normalizeFeatures(item.features),
      display_order: item.display_order ?? 0,
      is_featured: item.is_featured ?? false,
      created_at: item.created_at,
      updated_at: item.updated_at,
      entitlement_policy: firstRelated(item.catalog_entitlement_policy),
      pricing_policy: firstRelated(item.catalog_pricing_policy),
    };
  }
}

export const catalogService = CatalogService;
