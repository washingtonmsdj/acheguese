import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingPlanService } from '../services/BillingPlanService';

const basePlanRow = {
  id: '1',
  code: 'free',
  name: 'Free',
  description: 'Plano gratuito',
  price_cents: 0,
  price_display: 'Gratis',
  currency: 'BRL',
  billing_period: 'monthly',
  features: ['Feature 1'],
  entitlements: { canUseAdvancedMenu: false },
  is_active: true,
  is_featured: false,
  display_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      let currentCode: string | null = null;

      const query = {
        select: vi.fn(() => query),
        eq: vi.fn((field: string, value: unknown) => {
          if (field === 'code' && typeof value === 'string') {
            currentCode = value;
          }
          return query;
        }),
        order: vi.fn(() => ({
          data: [basePlanRow],
          error: null,
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({ data: null, error: null })),
            single: vi.fn(() => ({ data: null, error: { code: 'PGRST116' } })),
          })),
        })),
        maybeSingle: vi.fn(() => {
          if (currentCode === 'invalid') {
            return { data: null, error: null };
          }

          if (currentCode === 'pro') {
            return {
              data: { ...basePlanRow, id: '2', code: 'pro', name: 'Pro', price_cents: 4990 },
              error: null,
            };
          }

          return { data: basePlanRow, error: null };
        }),
        single: vi.fn(() => {
          if (currentCode === 'invalid') {
            return { data: null, error: { code: 'PGRST116' } };
          }

          if (currentCode === 'pro') {
            return {
              data: { ...basePlanRow, id: '2', code: 'pro', name: 'Pro', price_cents: 4990 },
              error: null,
            };
          }

          return { data: basePlanRow, error: null };
        }),
      };

      return query;
    }),
  },
}));

describe('BillingPlanService', () => {
  beforeEach(() => {
    BillingPlanService.clearCache();
    vi.restoreAllMocks();
  });

  it('getActivePlans retorna planos', async () => {
    const plans = await BillingPlanService.getActivePlans();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].code).toBe('free');
  });

  it('getPlanByCode retorna plano por codigo', async () => {
    const plan = await BillingPlanService.getPlanByCode('free');
    expect(plan?.code).toBe('free');
  });

  it('getPlanByCode retorna null para codigo invalido', async () => {
    const plan = await BillingPlanService.getPlanByCode('invalid');
    expect(plan).toBeNull();
  });

  it('getEntitlements retorna estrutura do plano', async () => {
    const entitlements = await BillingPlanService.getEntitlements('free');
    expect(entitlements).toBeTruthy();
    expect(typeof entitlements?.canUseAdvancedMenu).toBe('boolean');
  });

  it('requiresPayment retorna true para plano pago', async () => {
    const requires = await BillingPlanService.requiresPayment('pro');
    expect(requires).toBe(true);
  });

  it('getFeaturedPlan retorna null sem explodir quando nao houver destaque', async () => {
    const featured = await BillingPlanService.getFeaturedPlan();
    expect(featured).toBeNull();
  });

  it('clearCache limpa cache sem quebrar leituras subsequentes', async () => {
    await BillingPlanService.getActivePlans();
    BillingPlanService.clearCache();
    const plans = await BillingPlanService.getActivePlans();
    expect(plans.length).toBeGreaterThan(0);
  });
});
