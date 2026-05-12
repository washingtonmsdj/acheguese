/**
 * Feed Cache
 *
 * Cache em memória para otimizar queries do feed.
 * TTL padrão: 60 segundos
 */

interface CacheEntry<T> {
  date: T;
  timestamp: number;
}

class FeedCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 60000; // 60 segundos

  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl ?? this.defaultTTL;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.date as T;
  }

  set<T>(key: string, date: T): void {
    this.cache.set(key, {
      date,
      timestamp: Date.now(),
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate keys matching pattern
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Invalidate cache for specific post
  invalidatePost(postId: string): void {
    this.invalidate(`post:${postId}`);
    this.invalidate("feed:"); // Invalidate all feed queries
  }

  // Invalidate cache for specific profile
  invalidateProfile(profileId: string): void {
    this.invalidate(`profile:${profileId}`);
    this.invalidate("feed:"); // Invalidate all feed queries
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const feedCache = new FeedCache();
