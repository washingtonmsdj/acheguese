import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, resolveErrorMessage } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { fetchTerritoryTree } from './territorial.queries';

describe('fetchTerritoryTree Edge boundary', () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
  });

  it('normalizes group membership object into the domain Map', async () => {
    invoke.mockResolvedValue({
      data: {
        locations: [],
        groups: [],
        groupMembers: {
          'group-1': ['location-1', 'location-2'],
          invalid: ['location-3', 123],
        },
      },
      error: null,
    });

    const result = await fetchTerritoryTree();

    expect(result.locations).toEqual([]);
    expect(result.groups).toEqual([]);
    expect(result.groupMembers).toEqual(
      new Map([['group-1', ['location-1', 'location-2']]]),
    );
  });

  it('preserves structured non-2xx Edge errors', async () => {
    const httpError = { message: 'Edge Function returned a non-2xx status code' };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue('Forbidden: Admin access required');

    await expect(fetchTerritoryTree()).rejects.toThrow(
      'Erro ao buscar árvore territorial: Forbidden: Admin access required',
    );
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
  });

  it('fails closed when the Edge payload misses required arrays', async () => {
    invoke.mockResolvedValue({ data: { locations: [] }, error: null });

    await expect(fetchTerritoryTree()).rejects.toThrow(
      'Resposta inválida da edge function territorial-get-tree',
    );
  });
});
