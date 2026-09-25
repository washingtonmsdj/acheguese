import { describe, expect, it, vi } from "vitest";
import {
  CI_AUTH_FUNCTION_REGION,
  GITHUB_OIDC_AUDIENCE,
  resolveGithubOidcEnvironment,
  signInFixtureViaGithubOidcBroker,
} from "./fixtureAuthGithubOidcBroker";

const sha = "a".repeat(40);
const workflowRef =
  "washingtonmsdj/acheguese/.github/workflows/ssot-tests.yml@refs/heads/main";
const oidcClaims = {
  aud: GITHUB_OIDC_AUDIENCE,
  repository: "washingtonmsdj/acheguese",
  repository_id: "1211499732",
  ref: "refs/heads/main",
  workflow_ref: workflowRef,
  event_name: "push",
  runner_environment: "github-hosted",
  sha,
};

function encodeBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function tokenWithClaims(
  overrides: Record<string, unknown> = {},
): string {
  return [
    encodeBase64Url({ alg: "RS256", typ: "JWT" }),
    encodeBase64Url({ ...oidcClaims, ...overrides }),
    "signature",
  ].join(".");
}

const base = {
  supabaseUrl: "https://project.supabase.co",
  email: "fixture-e2e@example.com",
  password: "fixture-password",
  requestUrl: "https://token.actions.githubusercontent.com/request?id=1",
  requestToken: "github-request-token",
  expectedSha: sha,
  repository: "washingtonmsdj/acheguese",
  repositoryId: "1211499732",
  ref: "refs/heads/main",
  workflowRef,
  eventName: "push",
  runnerEnvironment: "github-hosted",
  retryDelayMs: 0,
};

describe("GitHub OIDC fixture auth broker", () => {
  it("requires the complete GitHub OIDC runner environment", () => {
    expect(resolveGithubOidcEnvironment({})).toBeNull();
    expect(() =>
      resolveGithubOidcEnvironment({
        ACTIONS_ID_TOKEN_REQUEST_URL: base.requestUrl,
      }),
    ).toThrow("complete Actions OIDC and workflow identity environment");
  });

  it("requests a custom-audience token, validates its claims and exchanges it for fixture session tokens", async () => {
    const oidcToken = tokenWithClaims();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(async (input, init) => {
        const url = new URL(String(input));
        expect(url.searchParams.get("audience")).toBe(GITHUB_OIDC_AUDIENCE);
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe(
          `bearer ${base.requestToken}`,
        );
        return new Response(JSON.stringify({ value: oidcToken }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      })
      .mockImplementationOnce(async (input, init) => {
        expect(String(input)).toBe(
          "https://project.supabase.co/functions/v1/ci-auth-fixture-session",
        );
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe(`Bearer ${oidcToken}`);
        expect(headers.get("x-region")).toBe(CI_AUTH_FUNCTION_REGION);
        expect(CI_AUTH_FUNCTION_REGION).toBe("us-west-2");
        expect(JSON.parse(String(init?.body))).toEqual({
          email: base.email,
          password: base.password,
          expectedSha: sha,
        });
        return new Response(
          JSON.stringify({
            session: {
              access_token: "access-token",
              refresh_token: "refresh-token",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      });

    await expect(
      signInFixtureViaGithubOidcBroker({ ...base, fetchImpl }),
    ).resolves.toEqual({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails before the broker call when a GitHub OIDC claim differs from the runner identity", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          value: tokenWithClaims({
            workflow_ref:
              "washingtonmsdj/acheguese/.github/workflows/other.yml@refs/heads/main",
          }),
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await expect(
      signInFixtureViaGithubOidcBroker({ ...base, fetchImpl }),
    ).rejects.toThrow("GitHub OIDC token claim mismatch: workflow_ref.");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("keeps an OIDC rejection generic", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: tokenWithClaims() }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

    await expect(
      signInFixtureViaGithubOidcBroker({ ...base, fetchImpl }),
    ).rejects.toThrow("CI Auth fixture broker failed: HTTP 401; Unauthorized.");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("surfaces a post-OIDC fixture rejection stage without exposing token claims", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: tokenWithClaims() }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "Unauthorized",
            code: "fixture_provenance_rejected",
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    await expect(
      signInFixtureViaGithubOidcBroker({ ...base, fetchImpl }),
    ).rejects.toThrow(
      "CI Auth fixture broker failed: HTTP 401; Unauthorized [fixture_provenance_rejected].",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("surfaces a bounded credential rejection after valid OIDC", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: tokenWithClaims() }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "Unauthorized",
            code: "fixture_credentials_rejected",
          }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    await expect(
      signInFixtureViaGithubOidcBroker({ ...base, fetchImpl }),
    ).rejects.toThrow(
      "CI Auth fixture broker failed: HTTP 401; Unauthorized [fixture_credentials_rejected].",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("treats bounded upstream Auth unavailability as transient", async () => {
    let brokerCalls = 0;
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("token.actions.githubusercontent.com")) {
        return new Response(JSON.stringify({ value: tokenWithClaims() }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      brokerCalls += 1;
      return new Response(
        JSON.stringify({
          error: "Authentication unavailable",
          code: "auth_upstream_unavailable",
        }),
        {
          status: 503,
          headers: { "content-type": "application/json" },
        },
      );
    });

    await expect(
      signInFixtureViaGithubOidcBroker({ ...base, fetchImpl }),
    ).rejects.toThrow("failed after transient-safe retry");
    expect(brokerCalls).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });
});
