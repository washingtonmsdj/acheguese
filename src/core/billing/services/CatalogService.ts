/**
 * CatalogService — owner do catálogo comercial publicado.
 *
 * Fonte de verdade para oferta, preço e entitlement de contratação:
 * commercial_catalog_version + catalog_item + catalog_*_policy.
 * Identificadores Stripe permanecem server-only no checkout.
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import { PlanTier, type PlanEntitlements } from '../types';
import { getBaselineEntitlements } from '../entitlementBaselines';

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

export interface PublishedPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceCents: number;
  priceDisplay: string;
  currency: string;
  billingPeriod: string;
  features: string[];
  entitlements: PlanEntitlements;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
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

function publicPlanCode(itemCode: string): string {
  return itemCode.startsWith('base-') ? itemCode.slice('base-'.length) : itemCode;
}

function toPlanTier(value: string | null | undefined): PlanTier {
  const normalized = publicPlanCode(value?.trim().toLowerCase() ?? '');
  if (normalized === PlanTier.DELIVERY) return PlanTier.DELIVERY;
  if (normalized === PlanTier.PRO) return PlanTier.PRO;
  return PlanTier.FREE;
}

function formatPublishedPrice(priceCents: number, currency: string): string {
  if (priceCents === 0) return 'Grátis';

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(priceCents / 100);
  } catch {
    return `${currency} ${(priceCents / 100).toFixed(2)}`;
  }
}

function mergeCatalogEntitlements(
  policy: CatalogEntitlementPolicy | undefined,
  planTier: PlanTier,
): PlanEntitlements {
  const baseline = getBaselineEntitlements(planTier);
  const extras = (policy?.additional_entitlements ?? {}) as Partial<PlanEntitlements>;

  const merged: PlanEntitlements = {
    ...baseline,
    ...extras,
    canUsePremiumPublicPage:
      policy?.can_use_premium_public_page ?? baseline.canUsePremiumPublicPage,
    canUseShortPremiumLink:
      policy?.can_use_short_premium_link ?? baseline.canUseShortPremiumLink,
    canUseCustomQRCode:
      policy?.can_use_custom_qr_code ?? baseline.canUseCustomQRCode,
    canUseAdvancedMenu:
      policy?.can_use_advanced_menu ?? baseline.canUseAdvancedMenu,
    canReceiveInternalOrders:
      policy?.can_receive_internal_orders ?? baseline.canReceiveInternalOrders,
    canUseMotoboyNetwork:
      policy?.can_use_motoboy_network ?? baseline.canUseMotoboyNetwork,
    canUsePromotions:
      policy?.can_use_promotions ?? baseline.canUsePromotions,
    canUseBasicAnalytics:
      policy?.can_use_basic_analytics ?? baseline.canUseBasicAnalytics,
    canUseAdvancedAnalytics:
      policy?.can_use_advanced_analytics ?? baseline.canUseAdvancedAnalytics,
    maxMenuItems:
      policy?.max_menu_items !== undefined ? policy.max_menu_items : baseline.maxMenuItems,
    maxPromotions:
      policy?.max_promotions !== undefined ? policy.max_promotions : baseline.maxPromotions,
    maxImages:
      policy?.max_images !== undefined ? policy.max_images : baseline.maxImages,
    maxCategories:
      policy?.max_categories !== undefined ? policy.max_categories : baseline.maxCategories,
    maxOrdersPerDay:
      policy?.max_orders_per_day !== undefined
        ? policy.max_orders_per_day
        : baseline.maxOrdersPerDay,
  };

  return {
    ...merged,
    canUsePremiumSite: merged.canUsePremiumPublicPage,
    canUseShortLink: merged.canUseShortPremiumLink,
    canUseAdvancedCatalog: merged.canUseAdvancedMenu,
    canUseInternalOrders: merged.canReceiveInternalOrders,
    canUseDeliveryRequests: merged.canRequestDelivery,
    canUseDeliveryTracking: merged.canTrackDelivery,
    canUseDeliveryNetwork: merged.canUseMotoboyNetwork,
  };
}

function mapPublishedPlan(item: CatalogItem): PublishedPlan {
  const pricing = item.pricing_policy;
  const priceCents = pricing?.price_cents ?? 0;
  const currency = pricing?.currency ?? 'BRL';
  const planTier = toPlanTier(item.plan_tier || item.item_code);

  return {
    id: item.id,
    code: publicPlanCode(item.item_code),
    name: item.item_name.replace(/^Plano\s+/i, ''),
    description: item.description ?? undefined,
    priceCents,
    priceDisplay: formatPublishedPrice(priceCents, currency),
    currency,
    billingPeriod: pricing?.billing_period ?? 'monthly',
    features: item.features,
    entitlements: mergeCatalogEntitlements(item.entitlement_policy, planTier),
    isActive: item.status === 'published',
    isFeatured: item.is_featured,
    displayOrder: item.display_order,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
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

  static async getPublishedPlans(): Promise<PublishedPlan[]> {
    const items = await this.getPublishedBasePlans();
    return items.map(mapPublishedPlan);
  }

  static async getPublishedPlanByCode(code: string): Promise<PublishedPlan | null> {
    const normalized = publicPlanCode(code.trim().toLowerCase());
    const item = await this.getPlanByCode(normalized);
    if (!item || item.item_type !== 'base_plan') return null;
    return mapPublishedPlan(item);
  }

  static async getPublishedPlanEntitlements(
    code: string,
  ): Promise<PlanEntitlements | null> {
    const plan = await this.getPublishedPlanByCode(code);
    return plan?.entitlements ?? null;
  }

  static async publishedPlanRequiresPayment(code: string): Promise<boolean> {
    const plan = await this.getPublishedPlanByCode(code);
    return Boolean(plan && plan.priceCents > 0);
  }

  static async getFeaturedPublishedPlan(): Promise<PublishedPlan | null> {
    const plans = await this.getPublishedPlans();
    return plans.find((plan) => plan.isFeatured) ?? null;
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
