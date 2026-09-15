import { ACTIVE_PROFILE_STORAGE_KEY } from "@/core/profiles/constants/activeProfileStorage";
import { CacheManager } from "@/core/session/cache/CacheManager";
import { SessionState } from "@/core/session/state/SessionState";
import { SessionService } from "./SessionService";

/**
 * Reconciles the application session after AuthService had to force a local
 * sign-out because the Supabase signOut request failed or timed out.
 *
 * The auth cookies are cleared by AuthService. This owner clears the in-memory
 * session/profile state that belongs to core/session, removes the persisted
 * active-profile pointer, and re-arms the canonical auth listener so a later
 * sign-in in the same SPA lifetime is observed normally.
 */
export function recoverForcedLocalSignOut(): void {
  SessionService.cleanup();

  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
    }
  } catch {
    // Restricted browser storage must not prevent a safe in-memory sign-out.
  }

  SessionState.clear();
  CacheManager.clearAll();
  SessionService.initialize();
}
