import type { FixtureAuthPasswordGrantSession } from "./fixtureAuthPasswordGrant";

export const GITHUB_OIDC_AUDIENCE = "acheguese-supabase-ci-auth";
export const CI_AUTH_FUNCTION_REGION = "us-west-2";
const CI_AUTH_FUNCTION = "ci-auth-fixture-session";
const MAX_ATTEMPTS = 3;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

interface GithubOidcEnvironment {
  requestUrl: string;
  requestToken: string;
  expectedSha: string;
  repository: string;
  repositoryId: string;
  ref: string;
  workflowRef: string;
  eventName: string;
  runnerEnvironment: string;
}

interface BrokerOptions extends GithubOidcEnvironment {
  supabaseUrl: string;
  email: string;
  password: string;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
  requestTimeoutMs?: number;
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

function decodeOidcClaims(token: string): Record<string, unknown> {
  const payload = token.split(".")[1] ?? "";
  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    return readJsonObject(decoded);
  } catch {
    throw new Error("GitHub OIDC token payload is not valid base64url JSON.");
  }
}

function assertExpectedOidcClaims(
  token: string,
  env: GithubOidcEnvironment,
): void {
  const claims = decodeOidcClaims(token);
  const expected: Record<string, string> = {
    aud: GITHUB_OIDC_AUDIENCE,
    repository: env.repository,
    repository_id: env.repositoryId,
    ref: env.ref,
    workflow_ref: env.workflowRef,
    event_name: env.eventName,
    runner_environment: env.runnerEnvironment,
    sha: env.expectedSha,
  };

  const mismatches = Object.entries(expected)
    .filter(([key, value]) => claims[key] !== value)
    .map(([key]) => key);

  if (mismatches.length > 0) {
    throw new Error(
      `GitHub OIDC token claim mismatch: ${mismatches.join(", ")}.`,
    );
  }
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  input: string,
  init: RequestInit,
  timeoutMs: number,
  stage: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`${stage} timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGithubOidcToken(
  env: GithubOidcEnvironment,
  fetchImpl: typeof fetch,
  requestTimeoutMs: number,
): Promise<string> {
  const response = await fetchWithTimeout(
    fetchImpl,
    appendAudience(env.requestUrl),
    {
      headers: {
        Authorization: `bearer ${env.requestToken}`,
        Accept: "application/json",
      },
    },
    requestTimeoutMs,
    "GitHub OIDC token request",
  );
  const raw = await response.text();
  const body = readJsonObject(raw);
  const value = typeof body.value === "string" ? body.value.trim() : "";

  if (!response.ok || value.split(".").length !== 3) {
    throw new Error(
      `GitHub OIDC token request failed: HTTP ${response.status}.`,
    );
  }

  assertExpectedOidcClaims(value, env);
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
  const repository = env.GITHUB_REPOSITORY?.trim() ?? "";
  const repositoryId = env.GITHUB_REPOSITORY_ID?.trim() ?? "";
  const ref = env.GITHUB_REF?.trim() ?? "";
  const workflowRef = env.GITHUB_WORKFLOW_REF?.trim() ?? "";
  const eventName = env.GITHUB_EVENT_NAME?.trim() ?? "";
  const runnerEnvironment = env.RUNNER_ENVIRONMENT?.trim() ?? "";

  const values = [
    requestUrl,
    requestToken,
    expectedSha,
    repository,
    repositoryId,
    ref,
    workflowRef,
    eventName,
    runnerEnvironment,
  ];
  if (values.every((value) => !value)) return null;
  if (
    values.some((value) => !value) ||
    !/^[0-9a-f]{40}$/.test(expectedSha)
  ) {
    throw new Error(
      "GitHub OIDC broker requires the complete Actions OIDC and workflow identity environment.",
    );
  }

  return {
    requestUrl,
    requestToken,
    expectedSha,
    repository,
    repositoryId,
    ref,
    workflowRef,
    eventName,
    runnerEnvironment,
  };
}

export async function signInFixtureViaGithubOidcBroker({
  supabaseUrl,
  email,
  password,
  fetchImpl = fetch,
  retryDelayMs = 750,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  ...oidcEnv
}: BrokerOptions): Promise<FixtureAuthPasswordGrantSession> {
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs < 1_000 || requestTimeoutMs > 30_000) {
    throw new Error("CI Auth fixture broker request timeout must be between 1000ms and 30000ms.");
  }
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const oidcToken = await requestGithubOidcToken(
        oidcEnv,
        fetchImpl,
        requestTimeoutMs,
      );
      const response = await fetchWithTimeout(
        fetchImpl,
        brokerUrl(supabaseUrl),
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${oidcToken}`,
            "Content-Type": "application/json",
            "x-region": CI_AUTH_FUNCTION_REGION,
          },
          body: JSON.stringify({
            email,
            password,
            expectedSha: oidcEnv.expectedSha,
          }),
        },
        requestTimeoutMs,
        "CI Auth fixture broker request",
      );
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
      const stage =
        typeof body.code === "string" && body.code
          ? ` [${body.code}]`
          : "";
      const error = new Error(
        `CI Auth fixture broker failed: HTTP ${response.status}${message}${stage}.`,
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
