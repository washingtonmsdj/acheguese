import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CatalogService,
  type CatalogItem,
  type PublishedPlan,
} from '../services/CatalogService';
import { getBaselineEntitlements } from '../entitlementBaselines';
import { PlanTier } from '../types';

const freePlan: CatalogItem = {
  id: '1',
  code: 'base-free',
  name: 'Plano Free',
  item_code: 'base-free',
  item_name: 'Plano Free',
  item_type: 'base_plan',
  plan_tier: 'free',
  entity_family: 'company',
  vertical: null,
  pricing_model: 'free',
  status: 'published',
  description: 'Plano gratuito',
  features: ['Feature 1'],
  display_order: 1,
  is_featured: false,
  created_at: '2026-04-21T00:00:00Z',
  updated_at: '2026-04-21T00:00:00Z',
  entitlement_policy: {
    can_use_premium_public_page: false,
    can_use_short_premium_link: false,
    can_use_custom_qr_code: false,
    can_use_advanced_menu: false,
    can_receive_internal_orders: false,
    can_use_motoboy_network: false,
    can_use_promotions: false,
    can_use_basic_analytics: false,
    can_use_advanced_analytics: false,
    max_menu_items: 20,
    max_promotions: 0,
    max_images: 5,
    max_categories: 3,
    max_orders_per_day: null,
    additional_entitlements: {
      canManageBusinessHours: true,
      canUseCoupons: false,
      maxCombos: 0,
    },
  },
  pricing_policy: {
    price_cents: 0,
    currency: 'BRL',
    billing_period: 'monthly',
  },
};

const proPlan: CatalogItem = {
  ...freePlan,
  id: '2',
  code: 'base-pro',
  name: 'Plano Pro',
  item_code: 'base-pro',
  item_name: 'Plano Pro',
  plan_tier: 'pro',
  pricing_model: 'subscription',
  is_featured: true,
  display_order: 2,
  entitlement_policy: {
    ...freePlan.entitlement_policy!,
    can_use_premium_public_page: true,
    can_use_advanced_menu: true,
    can_use_promotions: true,
    can_use_basic_analytics: true,
    max_menu_items: null,
    max_promotions: 10,
    max_images: null,
    max_categories: null,
    additional_entitlements: {
      canManageBusinessHours: true,
      canUseCoupons: true,
      maxCombos: 20,
    },
  },
  pricing_policy: {
    price_cents: 4990,
    currency: 'BRL',
    billing_period: 'monthly',
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CatalogService published plan projection', () => {
  it('adapts published base plans for UI consumption', async () => {
    vi.spyOn(CatalogService, 'getPublishedBasePlans').mockResolvedValue([
      freePlan,
      proPlan,
    ]);

    const plans = await CatalogService.getPublishedPlans();

    expect(plans.map((plan) => plan.code)).toEqual(['free', 'pro']);
    expect(plans[0].name).toBe('Free');
    expect(plans[1].priceCents).toBe(4990);
  });

  it('normalizes public plan code before querying the catalog owner', async () => {
    const getPlanByCode = vi
      .spyOn(CatalogService, 'getPlanByCode')
      .mockResolvedValue(proPlan);

    const plan = await CatalogService.getPublishedPlanByCode('PRO');

    expect(getPlanByCode).toHaveBeenCalledWith('pro');
    expect(plan?.code).toBe('pro');
    expect(plan?.priceDisplay).toContain('49');
  });

  it('returns null when the code does not resolve to a base plan', async () => {
    vi.spyOn(CatalogService, 'getPlanByCode').mockResolvedValue(null);

    await expect(
      CatalogService.getPublishedPlanByCode('missing'),
    ).resolves.toBeNull();
  });

  it('merges canonical policy columns and additional entitlements', async () => {
    vi.spyOn(CatalogService, 'getPlanByCode').mockResolvedValue(proPlan);

    const entitlements =
      await CatalogService.getPublishedPlanEntitlements('pro');

    expect(entitlements?.canUseAdvancedMenu).toBe(true);
    expect(entitlements?.canUseCoupons).toBe(true);
    expect(entitlements?.maxCombos).toBe(20);
    expect(entitlements?.canUseAdvancedCatalog).toBe(true);
  });

  it('derives payment and featured state from published plan data', async () => {
    const publishedPro: PublishedPlan = {
      id: '2',
      code: 'pro',
      name: 'Pro',
      description: 'Plano Pro',
      priceCents: 4990,
      priceDisplay: 'R$ 49,90',
      currency: 'BRL',
      billingPeriod: 'monthly',
      features: [],
      entitlements: getBaselineEntitlements(PlanTier.PRO),
      isActive: true,
      isFeatured: true,
      displayOrder: 2,
      createdAt: new Date('2026-04-21T00:00:00Z'),
      updatedAt: new Date('2026-04-21T00:00:00Z'),
    };

    vi.spyOn(CatalogService, 'getPublishedPlanByCode').mockResolvedValue(
      publishedPro,
    );
    await expect(
      CatalogService.publishedPlanRequiresPayment('pro'),
    ).resolves.toBe(true);

    vi.spyOn(CatalogService, 'getPublishedPlans').mockResolvedValue([
      { ...publishedPro, isFeatured: false, code: 'free' },
      publishedPro,
    ]);
    await expect(CatalogService.getFeaturedPublishedPlan()).resolves.toEqual(
      publishedPro,
    );
  });
});
