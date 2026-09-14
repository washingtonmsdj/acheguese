import { TIMEOUTS } from "@/shared/constants";

export const GEOLOCATION_RUNTIME = {
  cacheKey: "robust_geolocation_cache_v1",
  cacheTtlMs: 15 * 60 * 1000,
  requestTimeoutMs: TIMEOUTS.GPS_LOCATION,
  requestMaximumAgeMs: 10_000,
  watchMaximumAgeMs: 5_000,
  interactivePreciseTimeoutMs: 8_000,
  mobileFastTimeoutMs: 8_000,
  mobileFastMaximumAgeMs: 60_000,
  fallbackTimeoutExtensionMs: 5_000,
  desktopFallbackMaximumAgeMs: 30_000,
  ipFallbackTimeoutMs: TIMEOUTS.IP_GEOLOCATION,
  retryDelayMs: 500,
  safetyTimeoutBufferMs: 2_000,
  backgroundRefreshDelayMs: 100,
  highAccuracyThresholdMeters: 100,
  ipFallbackAccuracyMeters: 5_000,
} as const;
