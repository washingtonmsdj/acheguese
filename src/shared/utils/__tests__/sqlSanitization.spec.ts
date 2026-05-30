import { describe, expect, it } from 'vitest';
import {
  buildSafeILikePattern,
  buildSafeOrILikeFilter,
  sanitizeForILike,
} from '../sqlSanitization';

describe('sqlSanitization', () => {
  it('removes SQL wildcard and statement-control characters from ILIKE input', () => {
    expect(sanitizeForILike("%foo_' OR 1=1; --")).toBe('foo OR 1=1');
  });

  it('builds a safe ILIKE pattern only when sanitized input remains', () => {
    expect(buildSafeILikePattern('  bairro  ')).toBe('%bairro%');
    expect(buildSafeILikePattern(' ;-- ')).toBeNull();
  });

  it('builds Supabase OR ILIKE filters from sanitized input', () => {
    expect(buildSafeOrILikeFilter(['title', 'description'], ' feira% ')).toBe(
      'title.ilike.%feira%,description.ilike.%feira%',
    );
  });
});
