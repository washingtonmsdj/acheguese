/**
 * EntitlementResolver - Contract Tests
 *
 * Valida contratos de API do EntitlementResolver sem depender de rede/produção:
 * - estrutura pública dos entitlements resolvidos;
 * - fallback técnico determinístico para ausência de assinatura;
 * - tipos e scopes aceitos pela API.
 *
 * A integração remota do billing é coberta pelos gates/E2E próprios. Este arquivo
 * precisa permanecer hermético para não transformar o SSOT Enforcement em um
 * probe de disponibilidade do Supabase.
 *
 * FASE 7: SSOT Enforcement
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from, invoke, maybeSingle, resolveFunctionError } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle,
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return {
    from: vi.fn(() => query),
    invoke: vi.fn(),
    maybeSingle,
    resolveFunctionError: vi.fn(),
  };
});

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    from,
    functions: { invoke },
  },
  resolveSupabaseFunctionErrorMessage: resolveFunctionError,
}));

import {
  EntitlementResolver,
  type EntitlementContext,
} from '@/core/billing/services/EntitlementResolver';

const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';
const TEST_BUSINESS_ID = '00000000-0000-4000-8000-000000000002';
const NON_EXISTENT_USER_ID = '00000000-0000-4000-8000-000000000003';

describe('EntitlementResolver - Contract Tests', () => {
  beforeEach(() => {
    from.mockClear();
    maybeSingle.mockReset();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    invoke.mockReset();
    invoke.mockResolvedValue({ data: null, error: null });
    resolveFunctionError.mockReset();
    resolveFunctionError.mockResolvedValue(null);
  });

  describe('API Contract', () => {
    it('deve aceitar EntitlementContext válido', () => {
      const context: EntitlementContext = {
        user_id: TEST_USER_ID,
        business_id: TEST_BUSINESS_ID,
        subscription_scope: 'business',
      };

      expect(context).toBeDefined();
      expect(context.user_id).toBe(TEST_USER_ID);
      expect(context.subscription_scope).toBe('business');
    });

    it('deve retornar ResolvedEntitlements com estrutura esperada', async () => {
      const context: EntitlementContext = {
        user_id: TEST_USER_ID,
        subscription_scope: 'user',
      };

      const entitlements = await EntitlementResolver.resolve(context);

      expect(entitlements).toBeDefined();
      expect(entitlements).toHaveProperty('planTier');
      expect(entitlements).toHaveProperty('isActive');
      expect(entitlements).toHaveProperty('canUseShortPremiumLink');
      expect(entitlements).toHaveProperty('canUseCustomQRCode');
      expect(entitlements).toHaveProperty('canUseMotoboyNetwork');
      expect(entitlements).toHaveProperty('canRequestDelivery');
    });
  });

  describe('Fallback determinístico', () => {
    it('mantém o contrato de entitlement mesmo sem assinatura remota', async () => {
      const context: EntitlementContext = {
        user_id: TEST_USER_ID,
        subscription_scope: 'user',
      };

      const entitlements = await EntitlementResolver.resolve(context);

      expect(entitlements).toBeDefined();
      expect(entitlements.planTier).toBe('free');
      expect(entitlements.isActive).toBe(false);
      expect(entitlements.subscriptionStatus).toBe('inactive');
    });

    it('deve retornar fallback para usuário sem assinatura', async () => {
      const context: EntitlementContext = {
        user_id: NON_EXISTENT_USER_ID,
        subscription_scope: 'user',
      };

      const entitlements = await EntitlementResolver.resolve(context);

      expect(entitlements).toBeDefined();
      expect(entitlements.planTier).toBe('free');
      expect(entitlements.isActive).toBe(false);
    });
  });

  describe('Tipos de Entitlement', () => {
    it('entitlements booleanos devem ser boolean', async () => {
      const context: EntitlementContext = {
        user_id: TEST_USER_ID,
        subscription_scope: 'user',
      };

      const entitlements = await EntitlementResolver.resolve(context);

      expect(typeof entitlements.canUseShortPremiumLink).toBe('boolean');
      expect(typeof entitlements.canUseCustomQRCode).toBe('boolean');
      expect(typeof entitlements.canUseMotoboyNetwork).toBe('boolean');
    });

    it('entitlements numéricos devem ser number ou null', async () => {
      const context: EntitlementContext = {
        user_id: TEST_USER_ID,
        subscription_scope: 'user',
      };

      const entitlements = await EntitlementResolver.resolve(context);
      const maxMenuItems = entitlements.maxMenuItems;

      expect(maxMenuItems === null || typeof maxMenuItems === 'number').toBe(true);
    });
  });

  describe('Subscription Scope', () => {
    it('deve aceitar scope = user', async () => {
      const context: EntitlementContext = {
        user_id: TEST_USER_ID,
        subscription_scope: 'user',
      };

      const entitlements = await EntitlementResolver.resolve(context);
      expect(entitlements).toBeDefined();
    });

    it('deve aceitar scope = business com business_id sem chamar rede real', async () => {
      const context: EntitlementContext = {
        user_id: TEST_USER_ID,
        business_id: TEST_BUSINESS_ID,
        subscription_scope: 'business',
      };

      const entitlements = await EntitlementResolver.resolve(context);

      expect(entitlements).toBeDefined();
      expect(invoke).toHaveBeenCalledWith(
        'billing-entitlements-rpc',
        expect.objectContaining({
          body: {
            action: 'getBusinessSubscriptionSnapshot',
            params: { businessDataId: TEST_BUSINESS_ID },
          },
        }),
      );
    });
  });
});
