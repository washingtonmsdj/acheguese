import { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Credenciais de teste — lidas de variáveis de ambiente
export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? "",
  password: process.env.E2E_USER_PASSWORD ?? "",
};

const AUTH_COOKIE_NAME = "sb-auth-acheguese-auth-token";
const AUTH_COOKIE_CHUNK_SIZE = 3_800;

export const TEST_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "",
  password: process.env.E2E_ADMIN_PASSWORD ?? "",
};

export function hasE2EUserCredentials(): boolean {
  return Boolean(TEST_USER.email && TEST_USER.password);
}

export function requireE2EUserCredentials() {
  if (!hasE2EUserCredentials()) {
    throw new Error(
      "Authenticated E2E requires E2E_USER_EMAIL and E2E_USER_PASSWORD; no default credential is allowed.",
    );
  }
  return TEST_USER;
}

function splitCookieValue(value: string): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const character of value) {
    const next = current + character;
    if (
      current.length > 0 &&
      encodeURIComponent(next).length > AUTH_COOKIE_CHUNK_SIZE
    ) {
      chunks.push(current);
      current = character;
      continue;
    }

    current = next;
  }

  if (current.length > 0 || value.length === 0) chunks.push(current);
  return chunks;
}

async function resolvePublicSupabaseConfig(page: Page): Promise<{
  url: string;
  publishableKey: string;
}> {
  const configuredUrl =
    process.env.E2E_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const configuredKey =
    process.env.E2E_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    "";
  if (configuredUrl && configuredKey) {
    return { url: configuredUrl, publishableKey: configuredKey };
  }

  const origin = new URL(page.url()).origin;
  const indexResponse = await fetch(origin);
  if (!indexResponse.ok) {
    throw new Error(`Unable to discover public Supabase config: HTTP ${indexResponse.status}`);
  }
  const indexHtml = await indexResponse.text();
  const scriptSources = [...indexHtml.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/gi)]
    .map((match) => new URL(match[1], origin).toString());
  const bundles = await Promise.all(
    scriptSources.map(async (source) => {
      const response = await fetch(source);
      return response.ok ? response.text() : "";
    }),
  );
  const publicBundles = [indexHtml, ...bundles].join("\n");
  const url = publicBundles.match(/https:\/\/[a-z0-9-]+\.supabase\.co/i)?.[0] ?? "";
  const publishableKey =
    publicBundles.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0] ??
    publicBundles.match(/eyJ[A-Za-z0-9_.-]{40,}/)?.[0] ??
    "";

  if (!url || !publishableKey) {
    throw new Error("Unable to discover the public Supabase browser configuration from Production.");
  }
  return { url, publishableKey };
}

/**
 * Seeds the Vercel Deployment Protection bypass cookie only for protected
 * Preview runs. The associated APIRequestContext shares the browser cookie jar,
 * so subsequent page navigations are authorized without injecting Vercel-only
 * headers into cross-origin application requests such as Supabase API calls.
 */
export async function bootstrapProtectedPreviewAccess(page: Page): Promise<void> {
  if (process.env.ACCOUNT_TARGET_IS_PREVIEW !== "true") return;

  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ?? "";
  const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim() ?? "";
  if (!bypassSecret || !configuredBaseUrl) {
    throw new Error(
      "Protected Preview E2E requires VERCEL_AUTOMATION_BYPASS_SECRET and PLAYWRIGHT_BASE_URL.",
    );
  }

  const target = new URL("/", configuredBaseUrl).toString();
  const response = await page.context().request.get(target, {
    headers: {
      "x-vercel-protection-bypass": bypassSecret,
      "x-vercel-set-bypass-cookie": "true",
    },
    timeout: 30_000,
  });

  if (!response.ok()) {
    throw new Error(
      `Unable to establish Vercel Preview automation bypass: HTTP ${response.status()}.`,
    );
  }
}

/**
 * Authenticates the dedicated fixture through the public Supabase Auth API
 * and installs the resulting session in the same cookie contract used by the
 * browser client. This avoids making CI depend on solving Cloudflare
 * Turnstile while preserving the real Production session and authorization
 * path for the application.
 */
export async function bootstrapFixtureSession(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const { url, publishableKey } = await resolvePublicSupabaseConfig(page);

  const client = createClient(
    url,
    publishableKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(`Fixture Auth bootstrap failed: ${error?.message ?? "session missing"}`);
  }

  const serializedSession = JSON.stringify(data.session);
  const chunks = splitCookieValue(serializedSession);
  const appUrl = new URL(page.url());
  const cookieBase = {
    domain: appUrl.hostname,
    httpOnly: false,
    secure: appUrl.protocol === "https:",
    sameSite: "Strict" as const,
    path: "/",
  };

  // Preserve unrelated cookies such as the Vercel automation-bypass cookie.
  // Only the Achegue-se Supabase session contract must be replaced here.
  await page.context().clearCookies({
    name: new RegExp(`^${AUTH_COOKIE_NAME}(?:\\.chunks|\\.\\d+)?$`),
  });
  if (chunks.length === 1) {
    await page.context().addCookies([
      { ...cookieBase, name: AUTH_COOKIE_NAME, value: chunks[0] },
    ]);
  } else {
    await page.context().addCookies([
      {
        ...cookieBase,
        name: `${AUTH_COOKIE_NAME}.chunks`,
        value: String(chunks.length),
      },
      ...chunks.map((chunk, index) => ({
        ...cookieBase,
        name: `${AUTH_COOKIE_NAME}.${index}`,
        value: chunk,
      })),
    ]);
  }

  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
}

async function waitForLoginForm(page: Page) {
  const identifier = page.locator("#login-identifier");

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await identifier.waitFor({ state: "visible", timeout: 30_000 });
      await page
        .locator("#login-password")
        .waitFor({ state: "visible", timeout: 30_000 });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }

      const bodyText = await page
        .locator("body")
        .innerText()
        .catch(() => "");
      if (/Preparando a casa/i.test(bodyText)) {
        await page
          .reload({ waitUntil: "domcontentloaded", timeout: 60_000 })
          .catch(() => undefined);
        continue;
      }

      await page
        .goto("/login", { waitUntil: "domcontentloaded", timeout: 60_000 })
        .catch(() => undefined);
    }
  }
}

export async function completeLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.waitForLoadState("domcontentloaded");

  await waitForLoginForm(page);

  await page.locator("#login-identifier").fill(email);
  await page.locator("#login-password").fill(password);
  const cookieAccept = page.getByRole("button", { name: /aceitar todos/i });
  if (await cookieAccept.isVisible().catch(() => false)) {
    await cookieAccept.click().catch(() => undefined);
  }

  const submitButton = page.getByRole("button", { name: /^Entrar$/i });
  await submitButton.waitFor({ state: "visible", timeout: 10_000 });
  await submitButton.click({ trial: true }).catch(() => undefined);
  await submitButton.click().catch(async () => {
    await page.locator("#login-password").press("Enter");
  });

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15_000,
  });
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await completeLoginForm(page, email, password);
}

export async function loginAsAdmin(page: Page) {
  if (!TEST_ADMIN.email || !TEST_ADMIN.password) {
    throw new Error(
      "Admin E2E requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD; no default credential is allowed.",
    );
  }
  return login(page, TEST_ADMIN.email, TEST_ADMIN.password);
}

export async function loginAsUser(page: Page) {
  const credentials = requireE2EUserCredentials();
  return login(page, credentials.email, credentials.password);
}
