import type { SessionData, CacheInvalidationCallback } from "../types";
import { getCacheConfig } from "./CacheConfig";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CacheManager {
  private static sessionCache: CacheEntry<SessionData> | null = null;

  private static _hits = 0;
  private static _misses = 0;
  private static _invalidations = 0;

  private static invalidationCallbacks: Set<CacheInvalidationCallback> =
    new Set();

  // ── Callback registry ──────────────────────────────────────────────────────

  static registerInvalidationCallback(cb: CacheInvalidationCallback): void {
    CacheManager.invalidationCallbacks.add(cb);
  }

  static unregisterInvalidationCallback(cb: CacheInvalidationCallback): void {
    CacheManager.invalidationCallbacks.delete(cb);
  }

  private static notifyInvalidation(
    scope: "session" | "profile" | "authorization" | "all",
  ): void {
    CacheManager.invalidationCallbacks.forEach((cb) => cb(scope));
  }

  // ── Session cache ──────────────────────────────────────────────────────────

  static getSession(): SessionData | null {
    const entry = CacheManager.sessionCache;
    if (!entry || Date.now() > entry.expiresAt) {
      CacheManager._misses++;
      return null;
    }
    CacheManager._hits++;
    return entry.data;
  }

  static setSession(data: SessionData): void {
    CacheManager.sessionCache = {
      data,
      expiresAt: Date.now() + getCacheConfig().session.ttl,
    };
  }

  static invalidateSession(): void {
    CacheManager.sessionCache = null;
    CacheManager._invalidations++;
    CacheManager.notifyInvalidation("session");
  }

  static invalidateProfile(): void {
    CacheManager.sessionCache = null;
    CacheManager._invalidations++;
    CacheManager.notifyInvalidation("profile");
  }

  static invalidateAuthorization(): void {
    CacheManager._invalidations++;
    CacheManager.notifyInvalidation("authorization");
  }

  static clearAll(): void {
    CacheManager.sessionCache = null;
    CacheManager._invalidations++;
    CacheManager.notifyInvalidation("all");
  }

  // ── Metrics ────────────────────────────────────────────────────────────────

  static getMetrics() {
    return {
      hits: CacheManager._hits,
      misses: CacheManager._misses,
      invalidations: CacheManager._invalidations,
    };
  }
}
