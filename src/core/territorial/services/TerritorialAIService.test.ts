import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, resolveErrorMessage, trackError } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    functions: { invoke },
    from: vi.fn(),
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

vi.mock('@/shared/utils/errorTracking', () => ({ trackError }));
vi.mock('@/shared/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { TerritorialAIService } from './TerritorialAIService';

const params = {
  territory_slug: 'nordeste-de-amaralina',
  territory_name: 'Nordeste de Amaralina',
  members: ['Nordeste de Amaralina', 'Santa Cruz'],
};

describe('TerritorialAIService.generateAIContent', () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
    trackError.mockReset();
  });

  it('returns a valid structured Edge response', async () => {
    invoke.mockResolvedValue({
      data: { success: true, data: { territory_slug: params.territory_slug } },
      error: null,
    });

    await expect(TerritorialAIService.generateAIContent(params)).resolves.toEqual({
      success: true,
      data: { territory_slug: params.territory_slug },
    });
  });

  it('preserves safe structured errors from a non-2xx Edge response', async () => {
    const httpError = { message: 'Edge Function returned a non-2xx status code' };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue('Rate limit exceeded. Try again later.');

    await expect(TerritorialAIService.generateAIContent(params)).rejects.toThrow(
      'Rate limit exceeded. Try again later.',
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
    expect(trackError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'TerritorialAIService',
        action: 'generateAIContent',
      }),
    );
  });

  it('fails closed for null or primitive successful payloads', async () => {
    invoke.mockResolvedValue({ data: null, error: null });

    await expect(TerritorialAIService.generateAIContent(params)).rejects.toThrow(
      'Resposta inválida da geração territorial',
    );
  });

  it('propagates an application error returned with HTTP success', async () => {
    invoke.mockResolvedValue({
      data: { error: 'Generation unavailable' },
      error: null,
    });

    await expect(TerritorialAIService.generateAIContent(params)).rejects.toThrow(
      'Generation unavailable',
    );
  });
});
