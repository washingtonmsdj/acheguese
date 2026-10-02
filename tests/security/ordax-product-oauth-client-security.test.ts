import { describe, expect, it } from "vitest";

import {
  ORDAX_PRODUCT_OAUTH_AUDIENCE,
  ORDAX_PRODUCT_OAUTH_CLIENT_ID,
  ORDAX_PRODUCT_OAUTH_INITIAL_SCOPES,
  assertOrdaxOAuthCallback,
  buildOrdaxOAuthRevocationRequest,
  buildOrdaxOAuthTokenRequest,
  createOrdaxOAuthPkce,
  createOrdaxOAuthState,
  resolveOrdaxProductOAuthServerConfig,
  validateOrdaxOAuthTokenResponse,
} from "../../supabase/functions/_shared/ordaxProductOAuth";

describe("OrdaX Product OAuth server primitives", () => {
  it("stays fail-closed until the server-side runtime gate is explicitly enabled", () => {
    expect(
      resolveOrdaxProductOAuthServerConfig({
        enabled: "false",
        issuer: "https://id.ordax.example",
        redirectUri: "https://acheguese.com.br/integracoes/ordax/callback",
      }),
    ).toBeNull();
  });

  it("pins the real first-party registration and only the provider-registered initial scopes", () => {
    const config = resolveOrdaxProductOAuthServerConfig({
      enabled: "true",
      issuer: "https://id.ordax.example",
      redirectUri: "https://acheguese.com.br/integracoes/ordax/callback",
    });

    expect(config).not.toBeNull();
    expect(config?.clientId).toBe(ORDAX_PRODUCT_OAUTH_CLIENT_ID);
    expect(config?.clientId).toBe("acheguese-web-01");
    expect(config?.audience).toBe(ORDAX_PRODUCT_OAUTH_AUDIENCE);
    expect(config?.scopes).toEqual([
      "network.space.read",
      "network.directory.read",
      "network.communities.read",
    ]);
    expect(ORDAX_PRODUCT_OAUTH_INITIAL_SCOPES).not.toContain(
      "network.messages.read",
    );
  });

  it("rejects insecure provider origins and callback URLs", () => {
    expect(() =>
      resolveOrdaxProductOAuthServerConfig({
        enabled: "true",
        issuer: "http://id.ordax.example",
        redirectUri: "https://acheguese.com.br/integracoes/ordax/callback",
      }),
    ).toThrow(/HTTPS origin/);

    expect(() =>
      resolveOrdaxProductOAuthServerConfig({
        enabled: "true",
        issuer: "https://id.ordax.example/oauth",
        redirectUri: "https://acheguese.com.br/integracoes/ordax/callback",
      }),
    ).toThrow(/without credentials, path, query or fragment/);

    expect(() =>
      resolveOrdaxProductOAuthServerConfig({
        enabled: "true",
        issuer: "https://id.ordax.example",
        redirectUri:
          "https://acheguese.com.br/integracoes/ordax/callback?code=forbidden",
      }),
    ).toThrow(/reserved OAuth query keys/);
  });

  it("generates bounded random state and PKCE S256 material", async () => {
    const firstState = createOrdaxOAuthState();
    const secondState = createOrdaxOAuthState();
    expect(firstState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondState).not.toBe(firstState);

    const first = await createOrdaxOAuthPkce();
    const second = await createOrdaxOAuthPkce();
    expect(first.method).toBe("S256");
    expect(first.verifier).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(first.challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second.verifier).not.toBe(first.verifier);
    expect(second.challenge).not.toBe(first.challenge);
  });

  it("validates callback state before allowing a code exchange", () => {
    expect(
      assertOrdaxOAuthCallback({
        code: "authorization_code_001",
        state: "state_value_12345678",
        expectedState: "state_value_12345678",
      }),
    ).toEqual({ code: "authorization_code_001" });

    expect(() =>
      assertOrdaxOAuthCallback({
        code: "authorization_code_001",
        state: "state_value_attacker",
        expectedState: "state_value_12345678",
      }),
    ).toThrow(/state mismatch/);
  });

  it("builds the provider-defined token and revocation requests without refresh-token support", () => {
    const config = resolveOrdaxProductOAuthServerConfig({
      enabled: "true",
      issuer: "https://id.ordax.example",
      redirectUri: "https://acheguese.com.br/integracoes/ordax/callback",
    });
    expect(config).not.toBeNull();
    if (!config) return;

    const token = buildOrdaxOAuthTokenRequest(
      config,
      "authorization_code_001",
      "pkce_verifier_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
    );
    expect(token.url).toBe("https://id.ordax.example/oauth/token");
    expect(new URLSearchParams(token.body).get("grant_type")).toBe(
      "authorization_code",
    );
    expect(new URLSearchParams(token.body).get("client_id")).toBe(
      "acheguese-web-01",
    );

    const revoke = buildOrdaxOAuthRevocationRequest(
      config,
      "opaque_access_token_1234567890",
    );
    expect(revoke.url).toBe("https://id.ordax.example/oauth/revoke");
    expect(new URLSearchParams(revoke.body).get("token")).toBe(
      "opaque_access_token_1234567890",
    );
  });

  it("accepts only bounded Bearer access tokens and rejects refresh tokens", () => {
    expect(
      validateOrdaxOAuthTokenResponse({
        access_token: "opaque_access_token_1234567890",
        token_type: "Bearer",
        expires_in: 900,
      }),
    ).toEqual({
      accessToken: "opaque_access_token_1234567890",
      tokenType: "Bearer",
      expiresIn: 900,
    });

    expect(() =>
      validateOrdaxOAuthTokenResponse({
        access_token: "opaque_access_token_1234567890",
        token_type: "Bearer",
        expires_in: 900,
        refresh_token: "not-enabled",
      }),
    ).toThrow(/refresh tokens are not enabled/);
  });
});
