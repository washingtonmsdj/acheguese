import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const AUTO_DISPATCH = readFileSync(
  resolve(process.cwd(), 'supabase/functions/auto-dispatch-ride/index.ts'),
  'utf8',
);

const SHARED_MOBILITY_CONSTANTS = readFileSync(
  resolve(process.cwd(), 'src/shared/types/mobility.constants.ts'),
  'utf8',
);

describe('mobility auto-dispatch integrity', () => {
  it('accepts numeric zero coordinates instead of treating them as missing', () => {
    expect(AUTO_DISPATCH).toContain('hasFiniteCoordinates(pickupLat, pickupLng)');
    expect(AUTO_DISPATCH).not.toContain('if (!pickupLat || !pickupLng)');
  });

  it('fails closed for drivers without finite coordinates instead of inventing (0,0)', () => {
    expect(AUTO_DISPATCH).toContain('.filter(hasFiniteDriverCoordinates)');
    expect(AUTO_DISPATCH).not.toContain('driver.current_lat || 0');
    expect(AUTO_DISPATCH).not.toContain('driver.current_lng || 0');
  });

  it('does not reintroduce retired dispatch policy constants into shared types', () => {
    expect(SHARED_MOBILITY_CONSTANTS).not.toContain('OFFER_TIMEOUT_SECONDS');
    expect(SHARED_MOBILITY_CONSTANTS).not.toContain('TOTAL_TIMEOUT_MINUTES');
    expect(SHARED_MOBILITY_CONSTANTS).not.toContain('MAX_RETRY_ATTEMPTS');
    expect(SHARED_MOBILITY_CONSTANTS).not.toContain('SEARCH_RADIUS_KM');
  });
});
