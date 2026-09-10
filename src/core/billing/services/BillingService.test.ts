import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, resolveErrorMessage } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    functions: { invoke },
    from: vi.fn(),
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

import { BillingService, type CreateCheckoutParams } from './BillingService';

const checkoutParams: CreateCheckoutParams = {
  planCode: 'pro',
  successUrl: 'https://acheguese.com/conta/assinatura?status=success',
  cancelUrl: 'https://acheguese.com/conta/assinatura?status=cancel',
};

describe('BillingService Edge boundary', () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it('returns a validated checkout session', async () => {
    invoke.mockResolvedValue({
      data: {
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      },
      error: null,
    });

    await expect(BillingService.createCheckoutSession(checkoutParams)).resolves.toEqual({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });
  });

  it('preserves safe structured checkout errors from non-2xx Edge responses', async () => {
    const httpError = { message: 'Edge Function returned a non-2xx status code' };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue('Plan not found');

    await expect(BillingService.createCheckoutSession(checkoutParams)).rejects.toThrow(
      'Plan not found',
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it('fails closed when checkout returns malformed data', async () => {
    invoke.mockResolvedValue({ data: { sessionId: 'cs_test_123' }, error: null });

    await expect(BillingService.createCheckoutSession(checkoutParams)).rejects.toThrow(
      'Invalid checkout response',
    );
  });

  it('returns a validated billing portal session', async () => {
    invoke.mockResolvedValue({
      data: { url: 'https://billing.stripe.com/p/session/test' },
      error: null,
    });

    await expect(
      BillingService.createPortalSession('https://acheguese.com/conta/assinatura'),
    ).resolves.toEqual({ url: 'https://billing.stripe.com/p/session/test' });
  });

  it('preserves safe structured portal errors from non-2xx Edge responses', async () => {
    invoke.mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code' },
    });
    resolveErrorMessage.mockResolvedValue('No active subscription found');

    await expect(
      BillingService.createPortalSession('https://acheguese.com/conta/assinatura'),
    ).rejects.toThrow('No active subscription found');
  });

  it('fails closed when portal returns a primitive or blank URL', async () => {
    invoke.mockResolvedValue({ data: 'unexpected', error: null });

    await expect(
      BillingService.createPortalSession('https://acheguese.com/conta/assinatura'),
    ).rejects.toThrow('Invalid billing portal response');
  });
});
