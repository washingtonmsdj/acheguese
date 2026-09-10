import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke, resolveErrorMessage, getProfileContext, logError } = vi.hoisted(() => ({
  invoke: vi.fn(),
  resolveErrorMessage: vi.fn(),
  getProfileContext: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
  resolveSupabaseFunctionErrorMessage: resolveErrorMessage,
}));

vi.mock('@/core/profiles/services/ProfileService', () => ({
  profileService: { getProfileContext },
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: { error: logError },
}));

import { loadAuthSummary } from './AdminProfileGovernanceAuthLoaders';

describe('loadAuthSummary', () => {
  beforeEach(() => {
    invoke.mockReset();
    resolveErrorMessage.mockReset();
    resolveErrorMessage.mockResolvedValue(null);
    getProfileContext.mockReset();
    logError.mockReset();
  });

  it('maps the supported auth summary fields', async () => {
    invoke.mockResolvedValue({
      data: {
        summary: {
          email: 'person@example.com',
          phone: '+5571999999999',
          emailConfirmed: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          lastSignInAt: '2026-09-10T10:00:00.000Z',
        },
      },
      error: null,
    });

    await expect(loadAuthSummary('user-1')).resolves.toEqual({
      email: 'person@example.com',
      phone: '+5571999999999',
      emailConfirmed: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastSignInAt: '2026-09-10T10:00:00.000Z',
    });
  });

  it('returns null instead of fabricating an empty summary from a malformed payload', async () => {
    invoke.mockResolvedValue({ data: { summary: 'invalid' }, error: null });

    await expect(loadAuthSummary('user-1')).resolves.toBeNull();
    expect(logError).toHaveBeenCalledWith(
      'AdminProfileGovernanceService.loadAuthSummary',
      { message: 'Invalid auth summary response' },
    );
  });

  it('preserves the deliberate null fallback while logging the structured Edge reason', async () => {
    const httpError = { message: 'Edge Function returned a non-2xx status code' };
    invoke.mockResolvedValue({ data: null, error: httpError });
    resolveErrorMessage.mockResolvedValue('User not found');

    await expect(loadAuthSummary('user-1')).resolves.toBeNull();
    expect(resolveErrorMessage).toHaveBeenCalledWith(httpError);
    expect(logError).toHaveBeenCalledWith(
      'AdminProfileGovernanceService.loadAuthSummary',
      { message: 'User not found' },
    );
  });
});
