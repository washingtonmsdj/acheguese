export const GEOLOCATION_RUNTIME = {
  cacheKey: "robust_geolocation_cache_v1",
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: 15_000,
  requestMaximumAgeMs: 10_000,
  watchMaximumAgeMs: 5_000,
  highAccuracyThresholdMeters: 100,
} as const;
