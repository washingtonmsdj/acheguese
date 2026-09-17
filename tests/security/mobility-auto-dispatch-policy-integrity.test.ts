import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const AUTO_DISPATCH = readFileSync(
  resolve(process.cwd(), 'supabase/functions/auto-dispatch-ride/index.ts'),
  'utf8',
);
const DISPATCH_CONFIG_SERVICE = readFileSync(
  resolve(process.cwd(), 'src/core/mobility/services/MobilityDispatchConfigService.ts'),
  'utf8',
);
const DISPATCH_POLICY = readFileSync(
  resolve(process.cwd(), 'src/shared/contracts/mobilityDispatchPolicy.ts'),
  'utf8',
);
const LEGACY_MOBILITY_CONSTANTS = readFileSync(
  resolve(process.cwd(), 'src/shared/types/mobility.constants.ts'),
  'utf8',
);

describe('mobility dispatch policy integrity', () => {
  it('uses the same runtime-neutral policy in app and Edge', () => {
    expect(DISPATCH_POLICY).toContain('export const MOBILITY_DISPATCH_POLICY');
    expect(DISPATCH_POLICY).toContain('totalTimeoutMinutes: 10');
    expect(DISPATCH_CONFIG_SERVICE).toContain(
      "@/shared/contracts/mobilityDispatchPolicy",
    );
    expect(AUTO_DISPATCH).toContain(
      "../../../src/shared/contracts/mobilityDispatchPolicy.ts",
    );
    expect(AUTO_DISPATCH).toContain(
      'const AUTO_DISPATCH_POLICY = MOBILITY_DISPATCH_POLICY.exclusiveOffer',
    );
    expect(AUTO_DISPATCH).not.toContain('const CONFIG = {');
    expect(AUTO_DISPATCH).not.toContain('OFFER_TIMEOUT_SECONDS');
    expect(AUTO_DISPATCH).not.toContain('MAX_RETRY_ATTEMPTS');
    expect(AUTO_DISPATCH).not.toContain('TOTAL_TIMEOUT_MINUTES');
    expect(AUTO_DISPATCH).not.toContain('SEARCH_RADIUS_KM');
  });

  it('keeps pre-accept details redacted in every strategy', () => {
    expect((DISPATCH_CONFIG_SERVICE.match(/showFullDetails: false/g) ?? []).length)
      .toBeGreaterThanOrEqual(3);
    expect(DISPATCH_CONFIG_SERVICE).not.toContain('showFullDetails: true');
  });

  it('accepts coordinate zero and rejects missing or non-finite driver coordinates', () => {
    expect(AUTO_DISPATCH).toContain('hasFiniteCoordinates(pickupLat, pickupLng)');
    expect(AUTO_DISPATCH).toContain('.filter(hasFiniteDriverCoordinates)');
    expect(AUTO_DISPATCH).not.toContain('if (!pickupLat || !pickupLng)');
    expect(AUTO_DISPATCH).not.toContain('driver.current_lat || 0');
    expect(AUTO_DISPATCH).not.toContain('driver.current_lng || 0');
  });

  it('does not reintroduce retired dispatch policy literals in legacy mobility constants', () => {
    expect(LEGACY_MOBILITY_CONSTANTS).not.toContain('OFFER_TIMEOUT_SECONDS');
    expect(LEGACY_MOBILITY_CONSTANTS).not.toContain('TOTAL_TIMEOUT_MINUTES');
    expect(LEGACY_MOBILITY_CONSTANTS).not.toContain('MAX_RETRY_ATTEMPTS');
    expect(LEGACY_MOBILITY_CONSTANTS).not.toContain('SEARCH_RADIUS_KM');
  });
});
