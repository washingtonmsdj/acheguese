import { describe, expect, it } from 'vitest';
import { secureRandomDigits, secureRandomInt, secureRandomString } from '../secureRandom';

describe('secureRandom', () => {
  it('generates bounded integers', () => {
    for (let index = 0; index < 32; index += 1) {
      const value = secureRandomInt(10);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
    }
  });

  it('generates strings from the provided alphabet', () => {
    const value = secureRandomString(24, 'ABC');
    expect(value).toHaveLength(24);
    expect(value).toMatch(/^[ABC]+$/);
  });

  it('generates fixed-length digit strings', () => {
    const value = secureRandomDigits(4);
    expect(value).toHaveLength(4);
    expect(value).toMatch(/^\d{4}$/);
  });
});
