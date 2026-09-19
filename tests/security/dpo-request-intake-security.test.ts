import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { executeDpoRequestIntake } from "../../supabase/functions/_shared/dpoRequestIntake";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

const migration = read(
  "supabase/migrations/20260916101000_create_privacy_subject_request_broker.sql",
);
const broker = read("supabase/functions/submit-dpo-request/index.ts");
const service = read("src/core/privacy/services/PrivacyService.ts");
const page = read("src/app/pages/DPOContactPage.tsx");
const privacyContacts = read("src/shared/config/privacyContacts.ts");
const deployVerifier = read("tools/release/verify-deploy-ready.mjs");
const productionEnv = read(".env.production");
const config = read("supabase/config.toml");
const authPolicy = read(
  "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
);

const validPayload = {
  requesterName: "Pessoa Titular",
  requesterEmail: "titular@example.com",
  requestType: "access",
  subject: "Acesso aos meus dados",
  message: "Quero confirmar e acessar os dados pessoais tratados pela plataforma.",
  honeypot: "",
  turnstileToken: "turnstile-token",
};

describe("DPO request intake broker", () => {
  it("keeps the privacy ledger server-only", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.privacy_subject_requests");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.privacy_subject_requests FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.privacy_subject_requests TO service_role",
    );
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("FORCE ROW LEVEL SECURITY");
  });

  it("classifies the public Edge Function explicitly and protects it", () => {
    expect(config).toMatch(/\[functions\.submit-dpo-request\]\s*verify_jwt = false/);
    expect(authPolicy).toContain('"submit-dpo-request"');
    expect(broker).toContain("rateLimitMiddleware(");
    expect(broker).toContain("readJsonBody<unknown>(");
    expect(broker).toContain('getRequiredEnv("TURNSTILE_SECRET_KEY")');
    expect(broker).toContain("verifyTurnstileToken(");
    expect(broker).toContain("executeDpoRequestIntake(");
    expect(broker).toContain("getSupabaseAdminClient()");
    expect(broker).toContain('.from("privacy_subject_requests")');
  });

  it("removes the stale browser write to dpo_requests", () => {
    expect(service).toContain('supabase.functions.invoke("submit-dpo-request"');
    expect(service).not.toContain('.from("dpo_requests")');
    expect(service).not.toContain("DPO_REQUEST_STATUS");
  });

  it("requires a public DPO identity in the production release contract", () => {
    expect(privacyContacts).toContain("VITE_DPO_NAME");
    expect(privacyContacts).toContain("getDpoName");
    expect(page).toContain("getDpoName");
    expect(page).toContain("Identidade do encarregado");
    expect(deployVerifier).toContain("'VITE_DPO_NAME'");
    expect(productionEnv).toMatch(/^VITE_DPO_NAME=$/m);
  });

  it("requires anti-abuse verification in the production DPO form", () => {
    expect(page).toContain("TurnstileWidget");
    expect(page).toContain("DPO_REQUEST_ANTI_ABUSE_CONFIG");
    expect(page).toContain("turnstileRequiredInProduction");
    expect(page).not.toContain("15 dias úteis");
  });

  it("rejects bot honeypot submissions without inserting", async () => {
    const insertRequest = vi.fn();
    const result = await executeDpoRequestIntake(
      { ...validPayload, honeypot: "https://spam.example" },
      {
        authenticatedUserId: null,
        verifyTurnstile: async () => ({ ok: true as const }),
        insertRequest,
      },
    );

    expect(result).toEqual({ status: "turnstile_failed" });
    expect(insertRequest).not.toHaveBeenCalled();
  });

  it("binds only the server-resolved authenticated user id", async () => {
    const insertRequest = vi.fn().mockResolvedValue({ error: null });
    const result = await executeDpoRequestIntake(validPayload, {
      authenticatedUserId: "11111111-1111-4111-8111-111111111111",
      verifyTurnstile: async () => ({ ok: true as const }),
      insertRequest,
    });

    expect(result).toEqual({ status: "registered" });
    expect(insertRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "11111111-1111-4111-8111-111111111111",
        requester_email: "titular@example.com",
        status: "received",
        turnstile_verified: true,
      }),
    );
  });

  it("fails closed when Turnstile is unavailable", async () => {
    const insertRequest = vi.fn();
    const result = await executeDpoRequestIntake(validPayload, {
      authenticatedUserId: null,
      verifyTurnstile: async () => ({ ok: false as const, reason: "unavailable" as const }),
      insertRequest,
    });

    expect(result).toEqual({ status: "verification_unavailable" });
    expect(insertRequest).not.toHaveBeenCalled();
  });
});
