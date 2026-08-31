import { describe, expect, it } from 'vitest';

import {
  resolveSafeInternalPath,
  resolveSafeRedirectUrl,
} from '@/shared/utils/safeRedirect';

describe('safe internal redirect hardening', () => {
  it('preserves normal internal destinations', () => {
    expect(resolveSafeInternalPath('/admin/usuarios?tab=ativos#lista', '/fallback')).toBe(
      '/admin/usuarios?tab=ativos#lista',
    );
  });

  it.each([
    '//evil.example',
    '/\\evil.example',
    '/safe\\evil.example',
    '/%5Cevil.example',
    '/%255Cevil.example',
    '/%2Fevil.example',
    '/%252Fevil.example',
  ])('rejects unsafe navigation path %s', (candidate) => {
    expect(resolveSafeInternalPath(candidate, '/fallback')).toBe('/fallback');
    expect(resolveSafeRedirectUrl(candidate)).toBeNull();
  });

  it('does not reject encoded slash or backslash data inside query values', () => {
    const candidate = '/buscar?q=%5Cfoo%2Fbar&next=%2Finterno';
    expect(resolveSafeInternalPath(candidate, '/fallback')).toBe(candidate);
  });

  it('falls back when a control character is present', () => {
    expect(resolveSafeInternalPath('/admin\n/usuarios', '/fallback')).toBe('/fallback');
  });
});
