import { describe, expect, it, vi } from "vitest";
import {
  GITHUB_OIDC_AUDIENCE,
  resolveGithubOidcEnvironment,
  signInFixtureViaGithubOidcBroker,
} from "./fixtureAuthGithubOidcBroker";

const sha = "a".repeat(40);
const oidcToken = ["header", "payload", "signature"].join(".");
const base = {
  supabaseUrl: "https://project.supabase.co",
  email: "fixture-e2e@example.com",
  password: "fixture-password",
  requestUrl: "https://token.actions.githubusercontent.com/request?id=1",
  requestToken: "github-request-token",
  expectedSha: sha,
  retryDelayMs: 0,
};

describe("GitHub OIDC fixture auth broker", () => {
  it("requires the complete GitHub OIDC runner environment", () => {
    expect(resolveGithubOidcEnvironment({})).toBeNull();
    expect(() =>
      resolveGithubOidcEnvironment({
        ACTIONS_ID_TOKEN_REQUEST_URL: base.requestUrl,
      }),
    ).toThrow("GitHub OIDC broker requires");
  });

  it("requests a custom-audience token and exchanges it for fixture session tokens", async () => {
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

  it("fails closed when the broker rejects the OIDC identity", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: oidcToken }), {
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
});
