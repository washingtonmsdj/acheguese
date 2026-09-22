import type { FixtureAuthPasswordGrantSession } from "./fixtureAuthPasswordGrant";

export const GITHUB_OIDC_AUDIENCE = "acheguese-supabase-ci-auth";
const CI_AUTH_FUNCTION = "ci-auth-fixture-session";
const MAX_ATTEMPTS = 3;

interface GithubOidcEnvironment {
  requestUrl: string;
  requestToken: string;
  expectedSha: string;
}

interface BrokerOptions extends GithubOidcEnvironment {
  supabaseUrl: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
}

function transientStatus(status: number): boolean {
  return (
    status === 408 ||
    status === 425 ||
    status === 429 ||
    (status >= 500 && status <= 599)
  );
}

function appendAudience(requestUrl: string): string {
  const url = new URL(requestUrl);
  url.searchParams.set("audience", GITHUB_OIDC_AUDIENCE);
  return url.toString();
}

function readJsonObject(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function requestGithubOidcToken(
  env: GithubOidcEnvironment,
  fetchImpl: typeof fetch,
): Promise<string> {
  const response = await fetchImpl(appendAudience(env.requestUrl), {
    headers: {
      Authorization: `bearer ${env.requestToken}`,
      Accept: "application/json",
    },
  });
  const raw = await response.text();
  const body = readJsonObject(raw);
  const value = typeof body.value === "string" ? body.value.trim() : "";

  if (!response.ok || value.split(".").length !== 3) {
    throw new Error(
      `GitHub OIDC token request failed: HTTP ${response.status}.`,
    );
  }

  return value;
}

function brokerUrl(supabaseUrl: string): string {
  return new URL(
    `/functions/v1/${CI_AUTH_FUNCTION}`,
    supabaseUrl.endsWith("/") ? supabaseUrl : `${supabaseUrl}/`,
  ).toString();
}

export function resolveGithubOidcEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): GithubOidcEnvironment | null {
  const requestUrl = env.ACTIONS_ID_TOKEN_REQUEST_URL?.trim() ?? "";
  const requestToken = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN?.trim() ?? "";
  const expectedSha = env.GITHUB_SHA?.trim().toLowerCase() ?? "";

  if (!requestUrl && !requestToken && !expectedSha) return null;
  if (!requestUrl || !requestToken || !/^[0-9a-f]{40}$/.test(expectedSha)) {
    throw new Error(
      "GitHub OIDC broker requires ACTIONS_ID_TOKEN_REQUEST_URL, ACTIONS_ID_TOKEN_REQUEST_TOKEN and a full GITHUB_SHA.",
    );
  }

  return { requestUrl, requestToken, expectedSha };
}

export async function signInFixtureViaGithubOidcBroker({
  supabaseUrl,
  email,
  password,
  fetchImpl = fetch,
  retryDelayMs = 750,
  ...oidcEnv
}: BrokerOptions): Promise<FixtureAuthPasswordGrantSession> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const oidcToken = await requestGithubOidcToken(oidcEnv, fetchImpl);
      const response = await fetchImpl(brokerUrl(supabaseUrl), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${oidcToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          expectedSha: oidcEnv.expectedSha,
        }),
      });
      const raw = await response.text();
      const body = readJsonObject(raw);
      const session =
        body.session && typeof body.session === "object"
          ? (body.session as Record<string, unknown>)
          : {};
      const accessToken =
        typeof session.access_token === "string" ? session.access_token : "";
      const refreshToken =
        typeof session.refresh_token === "string" ? session.refresh_token : "";

      if (response.ok && accessToken && refreshToken) {
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
        };
      }

      const message =
        typeof body.error === "string" && body.error
          ? `; ${body.error}`
          : "";
      const error = new Error(
        `CI Auth fixture broker failed: HTTP ${response.status}${message}.`,
      );
      if (!transientStatus(response.status)) throw error;
      lastError = error;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (
        /HTTP (?:400|401|403|404|405|409|422)\b/.test(lastError.message)
      ) {
        throw lastError;
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelayMs * attempt),
      );
    }
  }

  throw new Error(
    `CI Auth fixture broker failed after transient-safe retry: ${lastError?.message ?? "unknown error"}`,
  );
}
