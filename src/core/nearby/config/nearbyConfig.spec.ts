import { describe, expect, it } from "vitest";
import {
  NEARBY_DEFAULT_RADIUS_KM,
  NEARBY_DETAILS_STALE_TIME_MS,
  NEARBY_MIN_ADDRESS_QUERY_LENGTH,
  NEARBY_QUERY_LIMIT,
  NEARBY_RADIUS_OPTIONS_KM,
  NEARBY_VISIBLE_RESULTS_LIMIT,
  isPreciseNearbyDistance,
} from "./nearbyConfig";

describe("nearbyConfig", () => {
  it("keeps radius options ordered, unique and anchored by the default", () => {
    expect(NEARBY_RADIUS_OPTIONS_KM).toContain(NEARBY_DEFAULT_RADIUS_KM);
    expect([...NEARBY_RADIUS_OPTIONS_KM]).toEqual(
      [...new Set(NEARBY_RADIUS_OPTIONS_KM)].sort((left, right) => left - right),
    );
  });

  it("keeps operational limits positive", () => {
    expect(NEARBY_QUERY_LIMIT).toBeGreaterThan(0);
    expect(NEARBY_VISIBLE_RESULTS_LIMIT).toBeGreaterThan(0);
    expect(NEARBY_VISIBLE_RESULTS_LIMIT).toBeLessThanOrEqual(NEARBY_QUERY_LIMIT);
    expect(NEARBY_DETAILS_STALE_TIME_MS).toBeGreaterThan(0);
    expect(NEARBY_MIN_ADDRESS_QUERY_LENGTH).toBeGreaterThan(0);
  });

  it("accepts only finite positive distances as precise proximity", () => {
    expect(isPreciseNearbyDistance(250, true)).toBe(true);
    expect(isPreciseNearbyDistance(0, true)).toBe(false);
    expect(isPreciseNearbyDistance(Number.POSITIVE_INFINITY, true)).toBe(false);
    expect(isPreciseNearbyDistance(250, false)).toBe(false);
  });
});
