import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  executeCommunityInterestRegistration,
  type CommunityInterestRegistrationRow,
} from "../../supabase/functions/_shared/communityInterestRegistration.ts";
import {
  verifyTurnstileToken,
  type TurnstileVerificationResult,
} from "../../supabase/functions/_shared/turnstile.ts";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260809184409_create_authoritative_community_interest_registration.sql",
);
const edgeFunction = read(
  "supabase/functions/register-community-interest/index.ts",
);
const frontendService = read(
  "src/core/routing/services/CommunityInterestRegistrationService.ts",
);
const functionConfig = read("supabase/config.toml");
const authPolicy = read(
  "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
);

function validPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    communityId: null,
    communitySlug: "pituba",
    territoryPath: "/ba/salvador/pituba",
    fullName: "Pessoa Teste",
    email: "pessoa@example.com",
    phone: "+55 (71) 99999-9999",
    role: "morador",
    message: "Quero receber novidades.",
    wantsUpdates: true,
    source: "/ba/salvador/pituba/interesse",
    honeypot: "",
    turnstileToken: "valid-turnstile-token",
    ...overrides,
  };
}

function acceptedVerifier() {
  return vi.fn(
    async (_token: string): Promise<TurnstileVerificationResult> => ({
      ok: true,
    }),
  );
}

function acceptedInsert() {
  return vi.fn(
    async (
      _row: CommunityInterestRegistrationRow,
    ): Promise<{ error: null }> => ({ error: null }),
  );
}

function providerFetch(payload: unknown, status = 200) {
  return async (): Promise<Response> =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

describe("Community Interest database boundary", () => {
  it("keeps only the temporary column-restricted legacy writer", () => {
    expect(migration).toContain("TEMPORARY LEGACY COMPATIBILITY");
    expect(migration).toMatch(
      /GRANT INSERT \([\s\S]*?turnstile_verified\s*\) ON public\.community_interest_registrations TO anon, authenticated;/,
    );
    expect(migration).toMatch(
      /CREATE POLICY community_interest_legacy_insert[\s\S]*?FOR INSERT[\s\S]*?TO anon, authenticated[\s\S]*?WITH CHECK/,
    );
    expect(migration).not.toMatch(
      /CREATE POLICY community_interest_public_insert/i,
    );
  });

  it("keeps RLS, the broker grant and no anonymous read or mutation grants", () => {
    expect(migration).toContain(
      "ALTER TABLE public.community_interest_registrations ENABLE ROW LEVEL SECURITY;",
    );
    expect(migration).toContain(
      "GRANT INSERT ON TABLE public.community_interest_registrations TO service_role;",
    );
    expect(migration).toMatch(
      /GRANT SELECT, UPDATE, DELETE ON TABLE public\.community_interest_registrations\s+TO authenticated;/,
    );
    expect(migration).not.toMatch(
      /GRANT\s+SELECT[^;]*\sTO\s+(?:PUBLIC|anon)\b/i,
    );
    expect(migration).not.toMatch(
      /GRANT\s+UPDATE[^;]*\sTO\s+(?:PUBLIC|anon)\b/i,
    );
    expect(migration).not.toMatch(
      /GRANT\s+DELETE[^;]*\sTO\s+(?:PUBLIC|anon)\b/i,
    );
    expect(migration).toContain("private.is_admin((SELECT auth.uid()))");
  });
});

describe("Community Interest broker wiring", () => {
  it("makes the browser invoke only the authoritative broker", () => {
    expect(frontendService).toContain(
      'supabase.functions.invoke("register-community-interest"',
    );
    expect(frontendService).not.toContain(
      '.from("community_interest_registrations")',
    );
    expect(frontendService).not.toContain("verify-turnstile-token");
    expect(frontendService).not.toContain("userAgent");
  });

  it("keeps the public broker explicitly classified and no-JWT", () => {
    expect(functionConfig).toMatch(
      /\[functions\.register-community-interest\]\s*verify_jwt = false/,
    );
    expect(functionConfig).not.toContain("[functions.verify-turnstile-token]");
    expect(authPolicy).toContain('"register-community-interest"');
    expect(authPolicy).toContain('"kind": "public-registration-broker"');
  });

  it("applies method, origin, body-size, rate, Turnstile and server-agent controls", () => {
    expect(edgeFunction).toContain("requireHttpMethod");
    expect(edgeFunction).toContain("isOriginAllowed");
    expect(edgeFunction).toContain("readJsonBody<unknown>");
    expect(edgeFunction).toContain("MAX_BODY_BYTES");
    expect(edgeFunction).toContain("rateLimitMiddleware");
    expect(edgeFunction).toContain("verifyTurnstileToken");
    expect(edgeFunction).toContain('req.headers.get("user-agent")');
    expect(edgeFunction).toContain("getSupabaseAdminClient");
    expect(edgeFunction).toContain('.from("community_interest_registrations")');
  });
});

describe("Community Interest authoritative operation", () => {
  it("rejects a populated honeypot without verifying or inserting", async () => {
    const verifyTurnstile = acceptedVerifier();
    const insertRegistration = acceptedInsert();

    const result = await executeCommunityInterestRegistration(
      validPayload({ honeypot: "bot-filled" }),
      { userAgent: "server-agent", verifyTurnstile, insertRegistration },
    );

    expect(result).toEqual({ status: "turnstile_failed" });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(insertRegistration).not.toHaveBeenCalled();
  });

  it("rejects missing token without inserting", async () => {
    const verifyTurnstile = acceptedVerifier();
    const insertRegistration = acceptedInsert();

    const result = await executeCommunityInterestRegistration(
      validPayload({ turnstileToken: null }),
      { userAgent: null, verifyTurnstile, insertRegistration },
    );

    expect(result).toEqual({ status: "turnstile_failed" });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(insertRegistration).not.toHaveBeenCalled();
  });

  it("rejects unknown properties and malformed fields before verification", async () => {
    const verifyTurnstile = acceptedVerifier();
    const insertRegistration = acceptedInsert();

    const result = await executeCommunityInterestRegistration(
      validPayload({ unexpected: true, email: "not-an-email" }),
      { userAgent: null, verifyTurnstile, insertRegistration },
    );

    expect(result).toEqual({ status: "invalid_payload" });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(insertRegistration).not.toHaveBeenCalled();
  });

  it("does not insert when Turnstile rejects the token", async () => {
    const verifyTurnstile = vi.fn(
      async (): Promise<TurnstileVerificationResult> => ({
        ok: false,
        reason: "rejected",
      }),
    );
    const insertRegistration = acceptedInsert();

    const result = await executeCommunityInterestRegistration(validPayload(), {
      userAgent: null,
      verifyTurnstile,
      insertRegistration,
    });

    expect(result).toEqual({ status: "turnstile_failed" });
    expect(insertRegistration).not.toHaveBeenCalled();
  });

  it("fails closed when the Turnstile provider is unavailable", async () => {
    const insertRegistration = acceptedInsert();
    const result = await executeCommunityInterestRegistration(validPayload(), {
      userAgent: null,
      verifyTurnstile: async () => ({ ok: false, reason: "unavailable" }),
      insertRegistration,
    });

    expect(result).toEqual({ status: "verification_unavailable" });
    expect(insertRegistration).not.toHaveBeenCalled();
  });

  it("fails closed when the server configuration is unavailable", async () => {
    const insertRegistration = acceptedInsert();
    const result = await executeCommunityInterestRegistration(validPayload(), {
      userAgent: null,
      verifyTurnstile: async () => ({ ok: false, reason: "configuration" }),
      insertRegistration,
    });

    expect(result).toEqual({ status: "configuration_unavailable" });
    expect(insertRegistration).not.toHaveBeenCalled();
  });

  it("preserves duplicate semantics for unique constraint violations", async () => {
    const insertRegistration = vi.fn(
      async (_row: CommunityInterestRegistrationRow) => ({
        error: { code: "23505" },
      }),
    );

    const result = await executeCommunityInterestRegistration(validPayload(), {
      userAgent: "server-agent",
      verifyTurnstile: acceptedVerifier(),
      insertRegistration,
    });

    expect(result).toEqual({ status: "already_registered" });
  });

  it("persists only normalized fields plus server-derived controls", async () => {
    const insertRegistration = acceptedInsert();

    const result = await executeCommunityInterestRegistration(
      validPayload({
        fullName: "  Pessoa Teste  ",
        email: "PESSOA@EXAMPLE.COM",
      }),
      {
        userAgent: "server-agent",
        verifyTurnstile: acceptedVerifier(),
        insertRegistration,
      },
    );

    expect(result).toEqual({ status: "registered" });
    expect(insertRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Pessoa Teste",
        email: "pessoa@example.com",
        user_agent: "server-agent",
        turnstile_verified: true,
        user_id: null,
      }),
    );
    const persistedRow = insertRegistration.mock.calls[0]?.[0];
    expect(persistedRow).not.toHaveProperty("honeypot");
    expect(persistedRow).not.toHaveProperty("turnstileToken");
  });

  it("does not confirm registration when the database rejects the insert", async () => {
    const result = await executeCommunityInterestRegistration(validPayload(), {
      userAgent: null,
      verifyTurnstile: acceptedVerifier(),
      insertRegistration: async () => ({ error: { code: "42501" } }),
    });

    expect(result).toEqual({ status: "database_failed" });
  });
});

describe("Turnstile authoritative verification", () => {
  const baseOptions = {
    token: "token",
    secret: "secret",
    expectedAction: "community-interest",
    allowedHostnames: new Set(["achegue.se"]),
    remoteIp: "203.0.113.10",
  };

  it("rejects an invalid token response", async () => {
    const result = await verifyTurnstileToken({
      ...baseOptions,
      fetchImpl: providerFetch({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    });
    expect(result).toEqual({ ok: false, reason: "rejected" });
  });

  it("rejects a mismatched action", async () => {
    const result = await verifyTurnstileToken({
      ...baseOptions,
      fetchImpl: providerFetch({
        success: true,
        action: "other-action",
        hostname: "achegue.se",
      }),
    });
    expect(result).toEqual({ ok: false, reason: "rejected" });
  });

  it("rejects a hostname outside the allowlist", async () => {
    const result = await verifyTurnstileToken({
      ...baseOptions,
      fetchImpl: providerFetch({
        success: true,
        action: "community-interest",
        hostname: "attacker.example",
      }),
    });
    expect(result).toEqual({ ok: false, reason: "rejected" });
  });

  it("accepts only the expected action and hostname", async () => {
    const result = await verifyTurnstileToken({
      ...baseOptions,
      fetchImpl: providerFetch({
        success: true,
        action: "community-interest",
        hostname: "achegue.se",
      }),
    });
    expect(result).toEqual({ ok: true });
  });

  it("fails closed when the provider request throws or times out", async () => {
    const result = await verifyTurnstileToken({
      ...baseOptions,
      fetchImpl: async () => {
        throw new Error("provider timeout");
      },
    });
    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });
});
