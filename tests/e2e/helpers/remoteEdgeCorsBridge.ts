import type { Page } from "@playwright/test";
import { getOperationalEnv } from "../../helpers/operational-env";

const PRIVACY_FUNCTION_NAME = "privacy-rpc";
const SESSION_FUNCTION_NAMES = ["profile-rpc", "session-rpc"] as const;

function requireRemoteSupabaseUrl(): string {
  const value = getOperationalEnv().supabaseUrl?.trim();
  if (!value) {
    throw new Error(
      "E2E Supabase URL is required for the remote Edge preview bridge.",
    );
  }
  return value.replace(/\/+$/, "");
}

function resolvePreviewOrigin(): string {
  const baseUrl =
    process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:8100";
  return new URL(baseUrl).origin;
}

/**
 * Test-only transport adapter for the production privacy broker.
 *
 * The application preview runs on localhost while the hosted Edge Function
 * intentionally allows only production-approved browser origins. This bridge
 * still forwards the exact authenticated request to the real remote
 * privacy-rpc; it changes only the CORS response header delivered back to the
 * local Playwright page.
 *
 * Do not broaden this helper to arbitrary Edge Functions. Each additional
 * function must earn an explicit test contract.
 */
async function installExplicitEdgePreviewBridge(
  page: Page,
  functionName: string,
): Promise<void> {
  const endpoint =
    `${requireRemoteSupabaseUrl()}/functions/v1/${functionName}`;
  const previewOrigin = resolvePreviewOrigin();

  await page.route(endpoint, async (route) => {
    const requestHeaders = { ...route.request().headers() };
    delete requestHeaders.origin;

    const upstream = await route.fetch({
      headers: requestHeaders,
    });
    const responseHeaders = {
      ...upstream.headers(),
      "access-control-allow-origin": previewOrigin,
      vary: "Origin",
    };

    await route.fulfill({
      response: upstream,
      headers: responseHeaders,
    });
  });
}

export function installPrivacyRpcPreviewBridge(page: Page): Promise<void> {
  return installExplicitEdgePreviewBridge(page, PRIVACY_FUNCTION_NAME);
}

/**
 * Session hydration on the local preview must still exercise the real remote
 * profile/session brokers. These are the only additional functions allowed by
 * this test bridge; production CORS policy remains unchanged.
 */
export async function installSessionProfilePreviewBridges(
  page: Page,
): Promise<void> {
  await Promise.all(
    SESSION_FUNCTION_NAMES.map((functionName) =>
      installExplicitEdgePreviewBridge(page, functionName),
    ),
  );
}
