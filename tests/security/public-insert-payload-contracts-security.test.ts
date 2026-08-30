import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

const payloadHardening = read(
  "supabase/migrations/20260830080037_harden_public_insert_payload_contracts_g5.sql",
);
const professionalRoleSplit = read(
  "supabase/migrations/20260830080145_fix_professional_lead_public_insert_role_split_g5.sql",
);
const professionalLeadService = read(
  "src/core/professional/services/ProfessionalLeadService.ts",
);
const educationTrackingService = read(
  "src/core/education/services/EducationTrackingService.ts",
);
const qrCodeService = read("src/core/qr/QrCodeService.ts");

function grantColumns(sql: string, table: string, role: string): string {
  const match = sql.match(
    new RegExp(
      `grant\\s+insert\\s*\\(([\\s\\S]*?)\\)\\s+on\\s+table\\s+public\\.${table}\\s+to\\s+${role}\\s*;`,
      "i",
    ),
  );
  expect(match, `${table} INSERT grant for ${role}`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("G5 public insert payload contracts", () => {
  it("keeps server-owned columns outside browser INSERT grants", () => {
    const educationColumns = grantColumns(
      payloadHardening,
      "education_analytics_events",
      "anon, authenticated",
    );
    const qrColumns = grantColumns(
      payloadHardening,
      "qr_code_scans",
      "anon, authenticated",
    );
    const anonymousLeadColumns = grantColumns(
      professionalRoleSplit,
      "professional_leads",
      "anon",
    );
    const authenticatedLeadColumns = grantColumns(
      professionalRoleSplit,
      "professional_leads",
      "authenticated",
    );

    expect(educationColumns).not.toMatch(/\bid\b|\bcreated_at\b/i);
    expect(qrColumns).not.toMatch(/\bid\b|\bscanned_at\b/i);
    expect(anonymousLeadColumns).not.toMatch(
      /requester_user_id|requester_profile_id|\bstatus\b|\bcreated_at\b|\bupdated_at\b/i,
    );
    expect(authenticatedLeadColumns).toContain("requester_user_id");
    expect(authenticatedLeadColumns).toContain("requester_profile_id");
    expect(authenticatedLeadColumns).not.toMatch(
      /\bstatus\b|\bcreated_at\b|\bupdated_at\b/i,
    );
  });

  it("separates anonymous and authenticated lead identity authority", () => {
    const anonymousPolicy = professionalRoleSplit.match(
      /create policy professional_leads_public_insert([\s\S]*?)create policy professional_leads_authenticated_insert/i,
    )?.[1];
    const authenticatedPolicy = professionalRoleSplit.match(
      /create policy professional_leads_authenticated_insert([\s\S]*?)do \$\$/i,
    )?.[1];

    expect(anonymousPolicy).toBeDefined();
    expect(anonymousPolicy).toContain("to anon");
    expect(anonymousPolicy).toContain("requester_user_id is null");
    expect(anonymousPolicy).toContain("requester_profile_id is null");
    expect(anonymousPolicy).not.toContain("private.current_active_profile_id()");

    expect(authenticatedPolicy).toBeDefined();
    expect(authenticatedPolicy).toContain("to authenticated");
    expect(authenticatedPolicy).toContain("requester_user_id = auth.uid()");
    expect(authenticatedPolicy).toContain("private.current_active_profile_id()");
  });

  it("preserves anonymous lead submission without requiring RETURNING visibility", () => {
    const anonymousBranchStart = professionalLeadService.indexOf("if (!user) {");
    const authenticatedInsertStart = professionalLeadService.indexOf(
      "const { data, error } = await professionalLeadDb",
      anonymousBranchStart,
    );
    const anonymousBranch = professionalLeadService.slice(
      anonymousBranchStart,
      authenticatedInsertStart,
    );

    expect(anonymousBranchStart).toBeGreaterThanOrEqual(0);
    expect(anonymousBranch).toContain(".insert(insertPayload)");
    expect(anonymousBranch).not.toContain(".select(");
    expect(anonymousBranch).not.toContain(".single(");
    expect(anonymousBranch).toContain("return { success: true }");
  });

  it("validates Education analytics relational provenance in the database", () => {
    expect(educationTrackingService).toContain(
      ".from('education_analytics_events')",
    );
    expect(payloadHardening).toContain(
      "ep.niche_key = education_analytics_events.niche_key",
    );
    expect(payloadHardening).toContain(
      "education_analytics_events.business_id = ep.business_id",
    );
    expect(payloadHardening).toContain(
      "p.education_profile_id = education_analytics_events.education_profile_id",
    );
    expect(payloadHardening).toContain(
      "e.education_profile_id = education_analytics_events.education_profile_id",
    );
    expect(payloadHardening).toContain(
      "l.education_profile_id = education_analytics_events.education_profile_id",
    );
    expect(payloadHardening).toContain(
      "octet_length(coalesce(metadata, '{}'::jsonb)::text) <= 8192",
    );
  });

  it("bounds QR scan telemetry without changing the direct scan SSOT", () => {
    expect(qrCodeService).toContain(".from('qr_code_scans')");
    expect(payloadHardening).toContain(
      "char_length(resolved_url) between 1 and 2048",
    );
    expect(payloadHardening).toContain(
      "char_length(user_agent) <= 1024",
    );
    expect(payloadHardening).toContain("char_length(referrer) <= 2048");
    expect(payloadHardening).toContain(
      "char_length(approximate_location) <= 255",
    );
    expect(payloadHardening).toContain("char_length(ip_hash) <= 128");
    expect(payloadHardening).toContain("qc.is_active = true");
  });
});
