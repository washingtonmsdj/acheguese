interface CacheConfigShape {
  authorization: { ttl: number };
}

/** Production: authorization previews cache for 2 min */
export const CacheConfig: CacheConfigShape = {
  authorization: { ttl: 120_000 },
};

/** Development: authorization previews cache for 30 s */
export const DevCacheConfig: CacheConfigShape = {
  authorization: { ttl: 30_000 },
};

/** Test: authorization previews cache for 500 ms */
export const TestCacheConfig: CacheConfigShape = {
  authorization: { ttl: 500 },
};

export function getCacheConfig(): CacheConfigShape {
  const mode = typeof import.meta !== "undefined" && import.meta.env?.MODE;
  const nodeEnv = typeof process !== "undefined" && process.env?.NODE_ENV;

  if (mode === "test" || nodeEnv === "test") return TestCacheConfig;
  if (mode === "development" || nodeEnv === "development")
    return DevCacheConfig;
  return CacheConfig;
}
