export const GEOLOCATION_RUNTIME = {
  cacheKey: "robust_geolocation_cache_v1",
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: 15_000,
  requestMaximumAgeMs: 10_000,
  watchMaximumAgeMs: 5_000,
  mobileFastMaximumAgeMs: 60_000,
  desktopFallbackMaximumAgeMs: 30_000,
  retryDelayMs: 500,
  safetyTimeoutBufferMs: 2_000,
  backgroundRefreshDelayMs: 100,
  highAccuracyThresholdMeters: 100,
  ipFallbackAccuracyMeters: 5_000,
} as const;
