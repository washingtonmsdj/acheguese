/**
 * BillingPlanService — compatibility read model over the published catalog.
 *
 * The commercial catalog is the only runtime authority for plan name, price,
 * features and entitlements. This adapter preserves the historical BillingPlan
 * DTO used by UI callers without reading or mutating public.billing_plans.
 */

import type { PlanEntitlements as CorePlanEntitlements } from '../types';
import {
  CatalogService,
  type CatalogEntitlementPolicy,
  type CatalogItem,
} from './CatalogService';

export type PlanEntitlements = CorePlanEntitlements;

export interface BillingPlan {
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

const DEFAULT_PLAN_ENTITLEMENTS: PlanEntitlements = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseCustomQRCode: false,
  canUseAdvancedMenu: false,
  canUseMenuCategories: false,
  canUseMenuImages: false,
  canUseMenuVariations: false,
  canUseMenuAddons: false,
  canUseMenuCombos: false,
  canManageAvailability: false,
  canScheduleItems: false,
  canReceiveInternalOrders: false,
  canUseOrdersPanel: false,
  canManageOrderStatus: false,
  canCancelOrders: false,
  canViewOrderHistory: false,
  canUseMotoboyNetwork: false,
  canRequestDelivery: false,
  canTrackDelivery: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canManageBusinessHours: false,
  canSetMinimumOrder: false,
  canUseOwnDelivery: false,
  canUsePromotions: false,
  canUseFeaturedPlacement: false,
  canUseBanners: false,
  canUseCoupons: false,
  canSchedulePromotions: false,
  canUseBasicAnalytics: false,
  canUseAdvancedAnalytics: false,
  canExportReports: false,
  canViewRealtimeMetrics: false,
  canViewCustomerInsights: false,
  maxMenuItems: null,
  maxPromotions: null,
  maxImages: null,
  maxCategories: null,
  maxCombos: null,
  maxOrdersPerDay: null,
};

function publicPlanCode(itemCode: string): string {
  return itemCode.startsWith('base-') ? itemCode.slice('base-'.length) : itemCode;
}

function formatPrice(priceCents: number, currency: string): string {
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

function mergeEntitlements(
  policy: CatalogEntitlementPolicy | undefined,
): PlanEntitlements {
  const extras = (policy?.additional_entitlements ?? {}) as Partial<PlanEntitlements>;

  const merged: PlanEntitlements = {
    ...DEFAULT_PLAN_ENTITLEMENTS,
    ...extras,
    canUsePremiumPublicPage: policy?.can_use_premium_public_page ?? false,
    canUseShortPremiumLink: policy?.can_use_short_premium_link ?? false,
    canUseCustomQRCode: policy?.can_use_custom_qr_code ?? false,
    canUseAdvancedMenu: policy?.can_use_advanced_menu ?? false,
    canReceiveInternalOrders: policy?.can_receive_internal_orders ?? false,
    canUseMotoboyNetwork: policy?.can_use_motoboy_network ?? false,
    canUsePromotions: policy?.can_use_promotions ?? false,
    canUseBasicAnalytics: policy?.can_use_basic_analytics ?? false,
    canUseAdvancedAnalytics: policy?.can_use_advanced_analytics ?? false,
    maxMenuItems: policy?.max_menu_items ?? null,
    maxPromotions: policy?.max_promotions ?? null,
    maxImages: policy?.max_images ?? null,
    maxCategories: policy?.max_categories ?? null,
    maxOrdersPerDay: policy?.max_orders_per_day ?? null,
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

function mapCatalogPlan(item: CatalogItem): BillingPlan {
  const pricing = item.pricing_policy;
  const priceCents = pricing?.price_cents ?? 0;
  const currency = pricing?.currency ?? 'BRL';

  return {
    id: item.id,
    code: publicPlanCode(item.item_code),
    name: item.item_name.replace(/^Plano\s+/i, ''),
    description: item.description ?? undefined,
    priceCents,
    priceDisplay: formatPrice(priceCents, currency),
    currency,
    billingPeriod: pricing?.billing_period ?? 'monthly',
    features: item.features,
    entitlements: mergeEntitlements(item.entitlement_policy),
    isActive: item.status === 'published',
    isFeatured: item.is_featured,
    displayOrder: item.display_order,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
  };
}

export class BillingPlanService {
  private static cache = new Map<string, BillingPlan>();
  private static allPlansCache: BillingPlan[] | null = null;
  private static cacheTimestamp = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000;

  static async getActivePlans(): Promise<BillingPlan[]> {
    if (this.isCacheValid() && this.allPlansCache) {
      return this.allPlansCache;
    }

    const plans = (await CatalogService.getPublishedBasePlans()).map(mapCatalogPlan);
    this.allPlansCache = plans;
    this.cache.clear();
    plans.forEach((plan) => this.cache.set(plan.code, plan));
    this.cacheTimestamp = Date.now();
    return plans;
  }

  static async getPlanByCode(code: string): Promise<BillingPlan | null> {
    const normalized = publicPlanCode(code.trim().toLowerCase());
    if (this.isCacheValid() && this.cache.has(normalized)) {
      return this.cache.get(normalized) ?? null;
    }

    const item = await CatalogService.getPlanByCode(normalized);
    if (!item || item.item_type !== 'base_plan') {
      return null;
    }

    const plan = mapCatalogPlan(item);
    this.cache.set(plan.code, plan);
    this.cacheTimestamp = Date.now();
    return plan;
  }

  static async getEntitlements(code: string): Promise<PlanEntitlements | null> {
    const plan = await this.getPlanByCode(code);
    return plan?.entitlements ?? null;
  }

  static async requiresPayment(code: string): Promise<boolean> {
    const plan = await this.getPlanByCode(code);
    return Boolean(plan && plan.priceCents > 0);
  }

  static async getFeaturedPlan(): Promise<BillingPlan | null> {
    const plans = await this.getActivePlans();
    return plans.find((plan) => plan.isFeatured) ?? null;
  }

  static clearCache(): void {
    this.cache.clear();
    this.allPlansCache = null;
    this.cacheTimestamp = 0;
  }

  private static isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }
}
