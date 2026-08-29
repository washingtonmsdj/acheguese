import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingPlanService } from '../services/BillingPlanService';
import { CatalogService } from '../services/CatalogService';

vi.mock('../services/CatalogService', () => ({
  CatalogService: {
    getPublishedBasePlans: vi.fn(),
    getPlanByCode: vi.fn(),
  },
}));

const freePlan = {
  id: '1',
  code: 'base-free',
  name: 'Plano Free',
  item_code: 'base-free',
  item_name: 'Plano Free',
  item_type: 'base_plan' as const,
  plan_tier: 'free',
  entity_family: 'company',
  vertical: null,
  pricing_model: 'free' as const,
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

const proPlan = {
  ...freePlan,
  id: '2',
  code: 'base-pro',
  name: 'Plano Pro',
  item_code: 'base-pro',
  item_name: 'Plano Pro',
  plan_tier: 'pro',
  pricing_model: 'subscription' as const,
  is_featured: true,
  display_order: 2,
  entitlement_policy: {
    ...freePlan.entitlement_policy,
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

const getPublishedBasePlans = vi.mocked(CatalogService.getPublishedBasePlans);
const getPlanByCode = vi.mocked(CatalogService.getPlanByCode);

describe('BillingPlanService', () => {
  beforeEach(() => {
    BillingPlanService.clearCache();
    vi.clearAllMocks();
    getPublishedBasePlans.mockResolvedValue([freePlan, proPlan]);
    getPlanByCode.mockImplementation(async (code: string) => {
      const normalized = code.startsWith('base-') ? code : `base-${code}`;
      if (normalized === 'base-free') return freePlan;
      if (normalized === 'base-pro') return proPlan;
      return null;
    });
  });

  it('getActivePlans adapta planos base do catálogo publicado', async () => {
    const plans = await BillingPlanService.getActivePlans();

    expect(getPublishedBasePlans).toHaveBeenCalledTimes(1);
    expect(plans.map((plan) => plan.code)).toEqual(['free', 'pro']);
    expect(plans[0].name).toBe('Free');
  });

  it('getPlanByCode normaliza código público e consulta o catálogo', async () => {
    const plan = await BillingPlanService.getPlanByCode('PRO');

    expect(getPlanByCode).toHaveBeenCalledWith('pro');
    expect(plan?.code).toBe('pro');
    expect(plan?.priceCents).toBe(4990);
  });

  it('getPlanByCode retorna null para código inexistente', async () => {
    const plan = await BillingPlanService.getPlanByCode('invalid');

    expect(plan).toBeNull();
  });

  it('getEntitlements combina colunas canônicas e extensões do catálogo', async () => {
    const entitlements = await BillingPlanService.getEntitlements('pro');

    expect(entitlements?.canUseAdvancedMenu).toBe(true);
    expect(entitlements?.canUseCoupons).toBe(true);
    expect(entitlements?.maxCombos).toBe(20);
    expect(entitlements?.canUseAdvancedCatalog).toBe(true);
  });

  it('requiresPayment deriva pagamento da pricing policy publicada', async () => {
    await expect(BillingPlanService.requiresPayment('free')).resolves.toBe(false);
    await expect(BillingPlanService.requiresPayment('pro')).resolves.toBe(true);
  });

  it('getFeaturedPlan deriva destaque do catálogo publicado', async () => {
    const featured = await BillingPlanService.getFeaturedPlan();

    expect(featured?.code).toBe('pro');
  });

  it('clearCache força nova leitura do catálogo', async () => {
    await BillingPlanService.getActivePlans();
    await BillingPlanService.getActivePlans();
    expect(getPublishedBasePlans).toHaveBeenCalledTimes(1);

    BillingPlanService.clearCache();
    await BillingPlanService.getActivePlans();
    expect(getPublishedBasePlans).toHaveBeenCalledTimes(2);
  });
});
