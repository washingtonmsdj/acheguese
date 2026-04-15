interface CacheConfigShape {
  session: { ttl: number };
  authorization: { ttl: number };
}

/** Production: session 5 min, authorization 2 min */
export const CacheConfig: CacheConfigShape = {
  session: { ttl: 300_000 },
  authorization: { ttl: 120_000 },
};

/** Development: session 1 min, authorization 30 s */
export const DevCacheConfig: CacheConfigShape = {
  session: { ttl: 60_000 },
  authorization: { ttl: 30_000 },
};

/** Test: session 1 s, authorization 500 ms */
export const TestCacheConfig: CacheConfigShape = {
  session: { ttl: 1_000 },
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
