import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  executeProfessionalLeadIntake,
  type ProfessionalLeadIntakeRow,
} from "../../supabase/functions/_shared/professionalLeadIntake.ts";
import type { TurnstileVerificationResult } from "../../supabase/functions/_shared/turnstile.ts";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const edge = read("supabase/functions/create-professional-lead/index.ts");
const client = read(
  "src/core/professional/services/ProfessionalLeadIntakeService.ts",
);
const dialog = read(
  "src/modules/professionals/components/ProfessionalLeadRequestDialog.tsx",
);
const oldLeadService = read(
  "src/core/professional/services/ProfessionalLeadService.ts",
);
const clientContract = read(
  "src/core/professional/contracts/ProfessionalLeadIntakeContract.ts",
);
const functionConfig = read("supabase/config.toml");
const authPolicy = read(
  "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
);
const pendingCutover = read(
  "docs/09-reference/migrations-pending/20260910133000_finalize_professional_lead_intake_g39.sql",
);

const PROFESSIONAL_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const PROFILE_ID = "33333333-3333-4333-8333-333333333333";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    professionalId: PROFESSIONAL_ID,
    requesterName: "Pessoa Teste",
    requesterPhone: "+55 (71) 99999-9999",
    requesterEmail: "PESSOA@EXAMPLE.COM",
    serviceNeeded: "Instalação elétrica",
    description: "Preciso instalar novos pontos elétricos no apartamento.",
    preferredDate: null,
    preferredTimeWindow: null,
    neighborhood: "Pituba",
    locationId: null,
    sourceChannel: "public_profile",
    honeypot: "",
    turnstileToken: "valid-turnstile-token",
    ...overrides,
  };
}

function acceptedVerifier() {
  return vi.fn(
    async (_token: string): Promise<TurnstileVerificationResult> => ({ ok: true }),
  );
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    requesterUserId: USER_ID,
    requesterProfileId: PROFILE_ID,
    verifyTurnstile: acceptedVerifier(),
    isProfessionalAvailable: vi.fn(async () => true),
    findRecentDuplicate: vi.fn(async () => null),
    insertLead: vi.fn(async (row: ProfessionalLeadIntakeRow) => ({
      data: { id: "44444444-4444-4444-8444-444444444444", row },
      error: null,
    })),
    ...overrides,
  };
}

describe("G39 Professional lead browser boundary", () => {
  it("routes public creation only through the authoritative broker", () => {
    expect(client).toContain('"create-professional-lead"');
    expect(client).not.toContain('.from("professional_leads")');
    expect(dialog).toContain("ProfessionalLeadIntakeService.createLead");
    expect(dialog).not.toContain("ProfessionalLeadService.createLead");
    expect(dialog).toContain("TurnstileWidget");
    expect(dialog).toContain("honeypot");
    expect(dialog).toContain("PROFESSIONAL_LEAD_INTAKE_CLIENT_CONTRACT");
  });

  it("does not let the public payload choose server-owned identity or lifecycle fields", () => {
    expect(client).not.toContain("requesterUserId");
    expect(client).not.toContain("requesterProfileId");
    expect(client).not.toContain("priority:");
    expect(client).not.toContain("metadata:");
    expect(edge).toContain("get_active_profile");
    expect(edge).toContain("invalid_or_expired_token");
  });

  it("keeps the legacy creator unreachable from the current public dialog", () => {
    expect(oldLeadService).toContain("static async createLead(");
    expect(dialog).not.toContain("ProfessionalLeadService");
  });
});

describe("G39 public Edge governance", () => {
  it("is explicitly no-JWT but security-governed", () => {
    expect(functionConfig).toMatch(
      /\[functions\.create-professional-lead\]\s*verify_jwt = false/,
    );
    expect(authPolicy).toContain('"create-professional-lead"');
    expect(authPolicy).toContain('"public-registration-broker"');
  });

  it("applies method, origin, body, rate, Turnstile and identity controls", () => {
    for (const marker of [
      "requireHttpMethod",
      "isOriginAllowed",
      "readJsonBody<unknown>",
      "MAX_BODY_BYTES",
      "rateLimitMiddleware",
      "verifyTurnstileToken",
      "getSupabaseAdminClient",
      "get_active_profile",
      'from("professional_leads")',
    ]) {
      expect(edge).toContain(marker);
    }
    expect(edge).toContain('const TURNSTILE_ACTION = "professional-lead"');
    expect(edge).toContain('select("id")');
  });

  it("ratchets the client and server Turnstile actions to the same value", () => {
    const clientAction = clientContract.match(/turnstileAction:\s*["']([^"']+)["']/)?.[1];
    const serverAction = edge.match(/TURNSTILE_ACTION\s*=\s*["']([^"']+)["']/)?.[1];
    expect(clientAction).toBe("professional-lead");
    expect(serverAction).toBe(clientAction);
  });
});

describe("G39 authoritative intake operation", () => {
  it("rejects honeypot traffic before Turnstile or database work", async () => {
    const deps = dependencies();
    const result = await executeProfessionalLeadIntake(
      validPayload({ honeypot: "https://bot.example" }),
      deps,
    );
    expect(result).toEqual({ status: "turnstile_failed" });
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
    expect(deps.insertLead).not.toHaveBeenCalled();
  });

  it("rejects client attempts to set priority, metadata or requester identity", async () => {
    for (const forbiddenPatch of [
      { priority: "urgent" },
      { metadata: { forged: true } },
      { requesterProfileId: PROFILE_ID },
      { requesterUserId: USER_ID },
    ]) {
      const deps = dependencies();
      const result = await executeProfessionalLeadIntake(
        validPayload(forbiddenPatch),
        deps,
      );
      expect(result).toEqual({ status: "invalid_payload" });
      expect(deps.insertLead).not.toHaveBeenCalled();
    }
  });

  it("rejects a request without a return contact", async () => {
    const deps = dependencies();
    const result = await executeProfessionalLeadIntake(
      validPayload({ requesterPhone: null, requesterEmail: null }),
      deps,
    );
    expect(result).toEqual({ status: "invalid_payload" });
    expect(deps.insertLead).not.toHaveBeenCalled();
  });

  it("fails closed when Turnstile is unavailable or misconfigured", async () => {
    for (const reason of ["unavailable", "configuration"] as const) {
      const deps = dependencies({
        verifyTurnstile: async () => ({ ok: false as const, reason }),
      });
      const result = await executeProfessionalLeadIntake(validPayload(), deps);
      expect(result.status).toBe(
        reason === "unavailable"
          ? "verification_unavailable"
          : "configuration_unavailable",
      );
      expect(deps.insertLead).not.toHaveBeenCalled();
    }
  });

  it("does not insert for a Professional that cannot receive new clients", async () => {
    const deps = dependencies({ isProfessionalAvailable: vi.fn(async () => false) });
    const result = await executeProfessionalLeadIntake(validPayload(), deps);
    expect(result).toEqual({ status: "professional_unavailable" });
    expect(deps.insertLead).not.toHaveBeenCalled();
  });

  it("deduplicates a recent equivalent request before insert", async () => {
    const duplicate = { id: "55555555-5555-4555-8555-555555555555" };
    const deps = dependencies({
      findRecentDuplicate: vi.fn(async () => duplicate),
    });
    const result = await executeProfessionalLeadIntake(validPayload(), deps);
    expect(result).toEqual({ status: "already_submitted", lead: duplicate });
    expect(deps.insertLead).not.toHaveBeenCalled();
  });

  it("persists normalized public fields plus server-derived identity and lifecycle", async () => {
    const deps = dependencies();
    const result = await executeProfessionalLeadIntake(validPayload(), deps);
    expect(result.status).toBe("created");
    expect(deps.insertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        professional_id: PROFESSIONAL_ID,
        requester_user_id: USER_ID,
        requester_profile_id: PROFILE_ID,
        requester_email: "pessoa@example.com",
        status: "new",
        priority: "normal",
        metadata: {},
      }),
    );
    const inserted = deps.insertLead.mock.calls[0]?.[0];
    expect(inserted).not.toHaveProperty("honeypot");
    expect(inserted).not.toHaveProperty("turnstileToken");
  });
});

describe("G39/G38 cutover staging", () => {
  it("keeps the destructive cutover outside the active migration queue", () => {
    expect(pendingCutover).toContain("PENDING CUTOVER");
    expect(pendingCutover).toContain(
      "REVOKE INSERT ON TABLE public.professional_leads",
    );
    expect(pendingCutover).toContain("professional_leads_increment_contacts");
    expect(pendingCutover).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_stats",
    );
    expect(pendingCutover).toContain("has_column_privilege");
    expect(pendingCutover).toContain("service_role INSERT not preserved");
  });
});
