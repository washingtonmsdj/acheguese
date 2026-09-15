import type { CacheInvalidationCallback } from "../types";

/**
 * Cross-domain invalidation bus owned by the session layer.
 *
 * Session data itself lives only in SessionState and is always rehydrated from
 * the canonical private readers. This class intentionally does not cache a
 * second copy of SessionData.
 */
export class CacheManager {
  private static invalidationCallbacks: Set<CacheInvalidationCallback> =
    new Set();

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

  static invalidateSession(): void {
    CacheManager.notifyInvalidation("session");
  }

  static invalidateProfile(): void {
    CacheManager.notifyInvalidation("profile");
  }

  static invalidateAuthorization(): void {
    CacheManager.notifyInvalidation("authorization");
  }

  static clearAll(): void {
    CacheManager.notifyInvalidation("all");
  }
}
