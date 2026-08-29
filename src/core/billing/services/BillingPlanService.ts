/**
 * BillingPlanService — compatibility read model over the published catalog.
 *
 * The commercial catalog is the only runtime authority for plan name, price,
 * features and entitlements. This adapter preserves the historical BillingPlan
 * DTO used by UI callers without reading or mutating public.billing_plans.
 */

import { PlanTier, type PlanEntitlements as CorePlanEntitlements } from '../types';
import { getBaselineEntitlements } from '../entitlementBaselines';
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

function publicPlanCode(itemCode: string): string {
  return itemCode.startsWith('base-') ? itemCode.slice('base-'.length) : itemCode;
}

function toPlanTier(value: string | null | undefined): PlanTier {
  if (value === PlanTier.DELIVERY) return PlanTier.DELIVERY;
  if (value === PlanTier.PRO) return PlanTier.PRO;
  return PlanTier.FREE;
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

function mapCatalogPlan(item: CatalogItem): BillingPlan {
  const pricing = item.pricing_policy;
  const priceCents = pricing?.price_cents ?? 0;
  const currency = pricing?.currency ?? 'BRL';
  const planTier = toPlanTier(item.plan_tier ?? publicPlanCode(item.item_code));

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
    entitlements: mergeEntitlements(item.entitlement_policy, planTier),
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
