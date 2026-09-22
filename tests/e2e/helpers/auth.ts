import { Page } from "@playwright/test";
import { TERMS_OF_SERVICE_VERSION } from "../../../src/core/legal/termsOfService";
import {
  createOperationalAnonClientForPublicConfig,
  getOperationalEnv,
} from "../../helpers/operational-env";

// Credenciais de teste — lidas de variáveis de ambiente
export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? "",
  password: process.env.E2E_USER_PASSWORD ?? "",
};

export const E2E_AUTH_FIXTURE_MARKER = "account-authenticated-e2e";
const AUTH_COOKIE_NAME = "sb-auth-acheguese-auth-token";
const AUTH_COOKIE_CHUNK_SIZE = 3_800;

export const TEST_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "",
  password: process.env.E2E_ADMIN_PASSWORD ?? "",
};

const FIXTURE_AUTH_MAX_ATTEMPTS = 3;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : String(message ?? "");
  }
  return String(error ?? "");
}

function isTransientFixtureAuthError(error: unknown): boolean {
  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status?: unknown }).status)
      : NaN;
  if (status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599)) {
    return true;
  }

  const message = getErrorMessage(error);
  return /Unexpected token ['"]?<|failed to fetch|fetch failed|network|timed? out|connection timed out|\b52[0-4]\b/i.test(
    message,
  );
}

async function signInFixtureWithTransientRetry(
  client: ReturnType<typeof createOperationalAnonClientForPublicConfig>,
  email: string,
  password: string,
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= FIXTURE_AUTH_MAX_ATTEMPTS; attempt += 1) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      return data.session;
    }

    lastError = error ?? new Error("session missing");
    if (!isTransientFixtureAuthError(lastError) || attempt === FIXTURE_AUTH_MAX_ATTEMPTS) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }

  throw new Error(
    `Fixture Auth bootstrap failed after transient-safe retry: ${getErrorMessage(lastError) || "session missing"}`,
  );
}

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

function resolvePublicSupabaseConfig(): {
  url: string;
  publishableKey: string;
} {
  const operationalEnv = getOperationalEnv();
  const url = operationalEnv.supabaseUrl?.trim() ?? "";
  const publishableKey = operationalEnv.anonKey?.trim() ?? "";

  if (!url || !publishableKey) {
    throw new Error(
      "Authenticated E2E requires explicit E2E_SUPABASE_URL and E2E_SUPABASE_PUBLISHABLE_KEY (or the canonical VITE public equivalents).",
    );
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

  // The workflow config injects bypass headers at BrowserContext scope. Once
  // the same-origin request has established Vercel's cookie, remove those
  // global headers before the SPA makes cross-origin requests to Supabase.
  await page.context().setExtraHTTPHeaders({});
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
) {
  const { url, publishableKey } = resolvePublicSupabaseConfig();

  const client = createOperationalAnonClientForPublicConfig(
    url,
    publishableKey,
  );
  const session = await signInFixtureWithTransientRetry(
    client,
    email,
    password,
  );

  const serializedSession = JSON.stringify(session);
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
  return client;
}

export async function ensureFixtureCurrentTermsAcceptance(
  client: Awaited<ReturnType<typeof bootstrapFixtureSession>>,
): Promise<void> {
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    throw userError ?? new Error("Fixture Auth user is unavailable.");
  }

  const fixtureMarker =
    userData.user.app_metadata?.acheguese_fixture ??
    userData.user.user_metadata?.acheguese_fixture;
  if (fixtureMarker !== E2E_AUTH_FIXTURE_MARKER) {
    throw new Error(
      "Terms bootstrap refused: authenticated account is not the dedicated E2E fixture.",
    );
  }

  const { data: currentConsent, error: consentReadError } = await client
    .from("user_consents")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("consent_type", "terms_of_service")
    .eq("granted", true)
    .eq("terms_version", TERMS_OF_SERVICE_VERSION)
    .is("revoked_at", null)
    .limit(1);

  if (consentReadError) throw consentReadError;
  if ((currentConsent ?? []).length > 0) return;

  const { data, error } = await client.functions.invoke("privacy-rpc", {
    body: {
      action: "recordConsent",
      params: {
        consentType: "terms_of_service",
        granted: true,
        userAgent: "acheguese-e2e-fixture",
        termsVersion: TERMS_OF_SERVICE_VERSION,
        privacyVersion: "1.0",
      },
    },
  });

  if (error) {
    throw new Error(
      `Fixture terms bootstrap failed through privacy-rpc: ${error.message}`,
    );
  }

  const receipt =
    data && typeof data === "object" && "data" in data
      ? (data as { data?: unknown }).data
      : null;
  if (
    !receipt ||
    typeof receipt !== "object" ||
    !("consentId" in receipt) ||
    typeof (receipt as { consentId?: unknown }).consentId !== "string"
  ) {
    throw new Error("privacy-rpc returned an invalid fixture consent receipt.");
  }
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