import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.0";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "npm:jose@6.2.12";
import {
  auditLog,
  extractBearerToken,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_AUDIENCE = "acheguese-supabase-ci-auth";
const GITHUB_OIDC_JWKS = createRemoteJWKSet(
  new URL("https://token.actions.githubusercontent.com/.well-known/jwks"),
);
const EXPECTED_REPOSITORY = "washingtonmsdj/acheguese";
const EXPECTED_REPOSITORY_ID = "1211499732";
const EXPECTED_REF = "refs/heads/main";
const EXPECTED_WORKFLOW_REF =
  "washingtonmsdj/acheguese/.github/workflows/ssot-tests.yml@refs/heads/main";
const EXPECTED_EVENT = "push";
const EXPECTED_RUNNER_ENVIRONMENT = "github-hosted";
const FIXTURE_MARKER = "account-authenticated-e2e";
const FIXTURE_VERSION = "1";

interface FixtureSessionRequest {
  email: string;
  password: string;
  expectedSha: string;
}

interface GithubOidcClaims extends JWTPayload {
  event_name?: string;
  ref?: string;
  repository?: string;
  repository_id?: string;
  runner_environment?: string;
  sha?: string;
  workflow_ref?: string;
}

function unauthorized(req: Request, code?: string): Response {
  return jsonResponse(
    code ? { error: "Unauthorized", code } : { error: "Unauthorized" },
    401,
    ALLOWED_METHODS,
    req,
  );
}

function invalidRequest(req: Request, message: string): Response {
  return jsonResponse({ error: message }, 400, ALLOWED_METHODS, req);
}

interface FixtureAuthErrorShape {
  code?: string;
  status?: number;
  name?: string;
}

interface FixtureAuthFailure {
  code:
    | "fixture_credentials_rejected"
    | "fixture_account_unavailable"
    | "auth_upstream_unavailable"
    | "fixture_auth_failed";
  status: 401 | 503;
}

function classifyFixtureAuthFailure(
  error: FixtureAuthErrorShape | null,
): FixtureAuthFailure {
  if (
    error?.code === "invalid_credentials" ||
    error?.code === "invalid_grant"
  ) {
    return { code: "fixture_credentials_rejected", status: 401 };
  }

  if (
    error?.code === "email_not_confirmed" ||
    error?.code === "phone_not_confirmed" ||
    error?.code === "user_banned"
  ) {
    return { code: "fixture_account_unavailable", status: 401 };
  }

  if (
    (typeof error?.status === "number" && error.status >= 500) ||
    error?.name === "AuthRetryableFetchError"
  ) {
    return { code: "auth_upstream_unavailable", status: 503 };
  }

  return { code: "fixture_auth_failed", status: 401 };
}

function fixtureAuthFailureResponse(
  req: Request,
  failure: FixtureAuthFailure,
): Response {
  return jsonResponse(
    {
      error: failure.status === 503 ? "Authentication unavailable" : "Unauthorized",
      code: failure.code,
    },
    failure.status,
    ALLOWED_METHODS,
    req,
  );
}

function validateFixtureRequest(
  body: unknown,
  req: Request,
): { ok: true; data: FixtureSessionRequest } | { ok: false; response: Response } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, response: invalidRequest(req, "Invalid request body") };
  }

  const record = body as Record<string, unknown>;
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const password =
    typeof record.password === "string" ? record.password : "";
  const expectedSha =
    typeof record.expectedSha === "string"
      ? record.expectedSha.trim().toLowerCase()
      : "";

  if (
    !email ||
    email.length > 320 ||
    !/(^|[._+\-])e2e([._+@\-]|$)/i.test(email)
  ) {
    return { ok: false, response: invalidRequest(req, "Invalid E2E identity") };
  }
  if (!password || password.length > 512) {
    return { ok: false, response: invalidRequest(req, "Invalid password payload") };
  }
  if (!/^[0-9a-f]{40}$/.test(expectedSha)) {
    return { ok: false, response: invalidRequest(req, "Invalid expected SHA") };
  }

  return {
    ok: true,
    data: { email, password, expectedSha },
  };
}

async function verifyGithubOidc(
  req: Request,
  expectedSha: string,
): Promise<GithubOidcClaims | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, GITHUB_OIDC_JWKS, {
      algorithms: ["RS256"],
      audience: GITHUB_OIDC_AUDIENCE,
      issuer: GITHUB_OIDC_ISSUER,
    });
    const claims = payload as GithubOidcClaims;

    if (
      claims.repository !== EXPECTED_REPOSITORY ||
      claims.repository_id !== EXPECTED_REPOSITORY_ID ||
      claims.ref !== EXPECTED_REF ||
      claims.workflow_ref !== EXPECTED_WORKFLOW_REF ||
      claims.event_name !== EXPECTED_EVENT ||
      claims.runner_environment !== EXPECTED_RUNNER_ENVIRONMENT ||
      claims.sha !== expectedSha
    ) {
      return null;
    }

    return claims;
  } catch (error) {
    console.warn(
      "[ci-auth-fixture-session] GitHub OIDC verification failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    12,
    60_000,
    ALLOWED_METHODS,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const auditInfo = getAuditInfo(req);
  const body = await readJsonBody<unknown>(req, {
    maxBytes: 4096,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const validated = validateFixtureRequest(body.data, req);
  if (!validated.ok) return validated.response;

  const oidcClaims = await verifyGithubOidc(req, validated.data.expectedSha);
  if (!oidcClaims) {
    auditLog({
      timestamp: new Date().toISOString(),
      action: "ci_auth_fixture_session",
      resource: "ci-auth-fixture-session",
      status: "failure",
      details: { reason: "github_oidc_rejected" },
      ...auditInfo,
    });
    return unauthorized(req);
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email: validated.data.email,
      password: validated.data.password,
    });

    const marker = data.user?.app_metadata?.acheguese_fixture;
    const fixtureVersion = data.user?.app_metadata?.fixture_version;
    if (error || !data.session || !data.user) {
      const failure = classifyFixtureAuthFailure(error);
      auditLog({
        timestamp: new Date().toISOString(),
        action: "ci_auth_fixture_session",
        resource: "ci-auth-fixture-session",
        status: "failure",
        details: {
          reason: failure.code,
          githubRunId: oidcClaims.run_id ?? null,
          githubSha: oidcClaims.sha ?? null,
        },
        ...auditInfo,
      });
      return fixtureAuthFailureResponse(req, failure);
    }

    if (marker !== FIXTURE_MARKER || fixtureVersion !== FIXTURE_VERSION) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: "ci_auth_fixture_session",
        resource: "ci-auth-fixture-session",
        status: "failure",
        details: {
          reason: "fixture_provenance_rejected",
          githubRunId: oidcClaims.run_id ?? null,
          githubSha: oidcClaims.sha ?? null,
        },
        ...auditInfo,
      });
      return unauthorized(req, "fixture_provenance_rejected");
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: data.user.id,
      action: "ci_auth_fixture_session",
      resource: "ci-auth-fixture-session",
      status: "success",
      details: {
        githubRunId: oidcClaims.run_id ?? null,
        githubSha: oidcClaims.sha ?? null,
      },
      ...auditInfo,
    });

    return jsonResponse(
      {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
      200,
      ALLOWED_METHODS,
      req,
    );
  } catch (error) {
    console.error(
      "[ci-auth-fixture-session]",
      error instanceof Error ? error.message : "unknown error",
    );
    return jsonResponse(
      { error: "Internal server error" },
      500,
      ALLOWED_METHODS,
      req,
    );
  }
});
