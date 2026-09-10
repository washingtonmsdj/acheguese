import { describe, expect, it } from 'vitest';

import { isTransientSitemapSourceError } from '../generateSitemap';

describe('isTransientSitemapSourceError', () => {
  it('accepts normalized transient upstream failures used by hosted builds', () => {
    for (const message of [
      'Gateway Timeout',
      'Service Unavailable',
      'Bad Gateway',
      'Too Many Requests',
      'Request Timeout',
      'Origin is unreachable',
      'Web server is down',
      'supabase.co | 522: Connection timed out',
      'TypeError: fetch failed',
    ]) {
      expect(isTransientSitemapSourceError(new Error(message))).toBe(true);
    }
  });

  it('keeps schema, credentials and application contract errors fatal', () => {
    for (const message of [
      'column geographic_path does not exist',
      'Invalid API key',
      'permission denied for table locations',
      'invalid input syntax for type uuid',
    ]) {
      expect(isTransientSitemapSourceError(new Error(message))).toBe(false);
    }
  });
});
