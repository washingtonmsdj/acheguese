import type { Page } from "@playwright/test";

const FUNCTION_NAME = "privacy-rpc";

function requireRemoteSupabaseUrl(): string {
  const value =
    process.env.E2E_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim();
  if (!value) {
    throw new Error(
      "E2E Supabase URL is required for the privacy-rpc preview bridge.",
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
export async function installPrivacyRpcPreviewBridge(
  page: Page,
): Promise<void> {
  const endpoint = `${requireRemoteSupabaseUrl()}/functions/v1/${FUNCTION_NAME}`;
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
