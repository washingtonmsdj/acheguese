/**
 * SHARED: Cache Helper
 * 
 * Utilities for database caching in edge functions.
 * Uses the api_cache table created in migration 20260419000002.
 * 
 * Features:
 * - Get/Set cache with TTL
 * - Automatic expiration
 * - Type-safe
 * - Error handling
 * 
 * @version 1.0.0
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Cache configuration
 */
export const CACHE_TTL = {
  // Short-lived cache (5 minutes)
  SHORT: 5 * 60, // 300 seconds
  
  // Medium cache (1 hour)
  MEDIUM: 60 * 60, // 3600 seconds
  
  // Long cache (24 hours)
  LONG: 24 * 60 * 60, // 86400 seconds
  
  // Very long cache (30 days)
  VERY_LONG: 30 * 24 * 60 * 60, // 2592000 seconds
} as const;

/**
 * Cache types
 */
export type CacheType = 'api' | 'geocoding' | 'external';

/**
 * Get Supabase client for cache operations
 */
function getCacheClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // Suporta novo formato (SUPABASE_SECRET_KEY) e legado (SUPABASE_SERVICE_ROLE_KEY)
  const supabaseServiceKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get data from cache
 * 
 * @param key - Cache key
 * @returns Cached data or null if not found/expired
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  try {
    const supabase = getCacheClient();
    
    const { data, error } = await supabase.rpc('get_cache', {
      p_key: key,
    });

    if (error) {
      console.error('Cache get error:', error);
      return null;
    }

    return data as T;
  } catch (err) {
    console.error('Cache get exception:', err);
    return null;
  }
}

/**
 * Set data in cache
 * 
 * @param key - Cache key
 * @param value - Data to cache
 * @param ttlSeconds - Time to live in seconds (default: 1 hour)
 * @param cacheType - Type of cache (default: 'api')
 */
export async function setCache(
  key: string,
  value: any,
  ttlSeconds: number = CACHE_TTL.MEDIUM,
  cacheType: CacheType = 'api'
): Promise<void> {
  try {
    const supabase = getCacheClient();
    
    await supabase.rpc('set_cache', {
      p_key: key,
      p_value: value,
      p_ttl_seconds: ttlSeconds,
      p_cache_type: cacheType,
    });
  } catch (err) {
    console.error('Cache set exception:', err);
    // Don't throw - cache failure shouldn't break the request
  }
}

/**
 * Delete cache entry
 * 
 * @param key - Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const supabase = getCacheClient();
    
    await supabase.rpc('delete_cache', {
      p_key: key,
    });
  } catch (err) {
    console.error('Cache delete exception:', err);
  }
}

/**
 * Delete cache entries by pattern
 * 
 * @param pattern - SQL LIKE pattern (e.g., 'geocoding:%')
 * @returns Number of deleted entries
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    const supabase = getCacheClient();
    
    const { data, error } = await supabase.rpc('delete_cache_pattern', {
      p_pattern: pattern,
    });

    if (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error('Cache delete pattern exception:', err);
    return 0;
  }
}

/**
 * Get cache statistics
 * 
 * @returns Cache statistics
 */
export async function getCacheStats(): Promise<{
  total_entries: number;
  total_size_mb: number;
  by_type: Record<string, number>;
  top_keys: Array<{ key: string; hits: number; last_hit: string }>;
  expired_count: number;
} | null> {
  try {
    const supabase = getCacheClient();
    
    const { data, error } = await supabase.rpc('get_cache_stats');

    if (error) {
      console.error('Cache stats error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Cache stats exception:', err);
    return null;
  }
}

/**
 * Wrapper for cached API calls
 * 
 * Automatically handles cache get/set with error handling.
 * 
 * @param key - Cache key
 * @param fetchFn - Function to fetch data if not in cache
 * @param ttlSeconds - Time to live in seconds
 * @param cacheType - Type of cache
 * @returns Cached or fresh data
 * 
 * @example
 * const data = await withCache(
 *   'geocoding:lat,lng',
 *   () => fetch('https://api.example.com/geocode'),
 *   CACHE_TTL.VERY_LONG,
 *   'geocoding'
 * );
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.MEDIUM,
  cacheType: CacheType = 'api'
): Promise<T> {
  // Try cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    console.log('Cache hit:', key);
    return cached;
  }

  console.log('Cache miss:', key);

  // Fetch fresh data
  const data = await fetchFn();

  // Save to cache (async, don't wait)
  setCache(key, data, ttlSeconds, cacheType).catch(err => {
    console.error('Failed to save to cache:', err);
  });

  return data;
}

/**
 * Generate cache key from object
 * 
 * Creates a deterministic cache key from an object.
 * 
 * @param prefix - Key prefix (e.g., 'geocoding', 'api')
 * @param params - Parameters object
 * @returns Cache key
 * 
 * @example
 * const key = generateCacheKey('geocoding', { lat: 10, lon: 20 });
 * // Returns: 'geocoding:lat=10:lon=20'
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedEntries = Object.entries(params).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );
  const parts = sortedEntries
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(value)}`);
  
  return `${prefix}:${parts.join(':')}`;
}
