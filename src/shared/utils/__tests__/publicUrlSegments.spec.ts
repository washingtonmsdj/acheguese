import { describe, expect, it } from 'vitest';

import {
  isSafePublicId,
  isSafePublicUrlSegment,
  normalizeSafePublicId,
  normalizeSafePublicUrlSegment,
} from '../publicUrlSegments';

describe('publicUrlSegments', () => {
  it('accepts canonical lowercase URL segments', () => {
    expect(isSafePublicUrlSegment('salvador')).toBe(true);
    expect(isSafePublicUrlSegment('rio-vermelho')).toBe(true);
    expect(normalizeSafePublicUrlSegment(' pituba ', 'bairro')).toBe('pituba');
  });

  it('rejects malformed URL segments', () => {
    expect(isSafePublicUrlSegment('Rio-Vermelho')).toBe(false);
    expect(isSafePublicUrlSegment('-pituba')).toBe(false);
    expect(isSafePublicUrlSegment('pituba-')).toBe(false);
    expect(isSafePublicUrlSegment('rio--vermelho')).toBe(false);
    expect(isSafePublicUrlSegment('rio/vermelho')).toBe(false);
    expect(() => normalizeSafePublicUrlSegment('rio/vermelho', 'bairro')).toThrow();
  });

  it('accepts stable public ids used by short routes', () => {
    expect(isSafePublicId('ab12CD_34-xy')).toBe(true);
    expect(normalizeSafePublicId(' ab12CD_34-xy ', 'publicId')).toBe('ab12CD_34-xy');
  });

  it('rejects public ids with executable or path characters', () => {
    expect(isSafePublicId('javascript:alert(1)')).toBe(false);
    expect(isSafePublicId('../secret')).toBe(false);
    expect(isSafePublicId('abc?next=/admin')).toBe(false);
    expect(() => normalizeSafePublicId('../secret', 'publicId')).toThrow();
  });
});
