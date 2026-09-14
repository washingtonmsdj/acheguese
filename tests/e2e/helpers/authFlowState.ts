import type { Page } from "@playwright/test";

import {
  AUTH_FLOW_STORAGE_KEYS,
  AUTH_FLOW_TTL_MS,
  AUTH_JOURNEY_INTENTS,
  type AuthJourneyIntent,
} from "../../../src/core/auth/constants/authFlow";

type AuthFlowSeed = {
  pendingReturn?: string;
  pendingIntent?: AuthJourneyIntent;
  pendingSignupEmail?: string;
  pendingSignupRedirect?: string;
};

/**
 * Seeds browser-only E2E state using the same versioned envelope as production.
 * Tests never write obsolete raw-string auth values directly.
 */
export async function seedAuthFlowState(page: Page, seed: AuthFlowSeed): Promise<void> {
  const entries: Array<{ key: string; value: string; ttlMs: number }> = [];

  if (seed.pendingReturn !== undefined) {
    entries.push({
      key: AUTH_FLOW_STORAGE_KEYS.pendingReturn,
      value: seed.pendingReturn,
      ttlMs: AUTH_FLOW_TTL_MS.pendingReturn,
    });
  }
  if (seed.pendingIntent !== undefined) {
    entries.push({
      key: AUTH_FLOW_STORAGE_KEYS.pendingIntent,
      value: seed.pendingIntent,
      ttlMs: AUTH_FLOW_TTL_MS.pendingIntent,
    });
  }
  if (seed.pendingSignupEmail !== undefined) {
    entries.push({
      key: AUTH_FLOW_STORAGE_KEYS.pendingSignupEmail,
      value: seed.pendingSignupEmail,
      ttlMs: AUTH_FLOW_TTL_MS.pendingSignup,
    });
  }
  if (seed.pendingSignupRedirect !== undefined) {
    entries.push({
      key: AUTH_FLOW_STORAGE_KEYS.pendingSignupRedirect,
      value: seed.pendingSignupRedirect,
      ttlMs: AUTH_FLOW_TTL_MS.pendingSignup,
    });
  }

  await page.addInitScript((seedEntries) => {
    const now = Date.now();
    for (const entry of seedEntries) {
      window.sessionStorage.setItem(
        entry.key,
        JSON.stringify({
          version: 1,
          value: entry.value,
          expiresAt: now + entry.ttlMs,
        }),
      );
    }
  }, entries);
}

export { AUTH_JOURNEY_INTENTS };
