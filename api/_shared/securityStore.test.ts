import { describe, expect, it } from 'vitest';
import {
  checkRateLimit,
  clearAuthFailures,
  getAuthBackoffRemainingMs,
  registerAuthFailure,
} from './securityStore';

describe('securityStore (memory fallback)', () => {
  it('enforces fixed-window rate limit', async () => {
    const key = `test-rate-${Date.now()}-${Math.random()}`;
    const first = await checkRateLimit(key, 2, 60_000);
    const second = await checkRateLimit(key, 2, 60_000);
    const third = await checkRateLimit(key, 2, 60_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect((third.retryAfterSeconds ?? 0) > 0).toBe(true);
  });

  it('increases auth backoff and clears state', async () => {
    const principal = `test-auth-${Date.now()}-${Math.random()}`;
    const baseMs = 100;
    const maxMs = 5_000;

    const firstBlock = await registerAuthFailure(principal, baseMs, maxMs);
    const firstRemaining = await getAuthBackoffRemainingMs(principal);
    const secondBlock = await registerAuthFailure(principal, baseMs, maxMs);
    const secondRemaining = await getAuthBackoffRemainingMs(principal);

    expect(firstBlock).toBeGreaterThanOrEqual(baseMs);
    expect(firstRemaining).toBeGreaterThan(0);
    expect(secondBlock).toBeGreaterThanOrEqual(firstBlock);
    expect(secondRemaining).toBeGreaterThan(0);

    await clearAuthFailures(principal);
    const afterClear = await getAuthBackoffRemainingMs(principal);
    expect(afterClear).toBe(0);
  });
});

