import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 public Education lead intake", () => {
  it("keeps the public broker outside the authenticated -rpc namespace", () => {
    expect(
      existsSync(resolve(root, "supabase/functions/education-lead-intake/index.ts")),
    ).toBe(true);
    expect(
      existsSync(resolve(root, "supabase/functions/education-lead-rpc/index.ts")),
    ).toBe(false);
  });


  it("keeps browser lead intake behind a server-owned Edge broker", () => {
    const service = read(
      "src/core/education/services/PublicEducationLeadService.ts",
    );
    const hook = read(
      "src/modules/business/education/hooks/useEducationLeads.ts",
    );
    const detail = read(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );
    const form = read(
      "src/modules/business/education/components/EducationLeadForm.tsx",
    );
    const contract = read(
      "src/core/education/publicLeadIntakeContract.ts",
    );

    expect(service).toContain(
      'supabase.functions.invoke("education-lead-intake"',
    );
    expect(service).not.toContain('.from("education_leads")');
    expect(hook).toContain("PublicEducationLeadService.create");
    expect(hook).toContain("turnstileToken: string | null");
    expect(hook).toContain("honeypot: string");
    expect(detail).toContain("createPublic");
    expect(detail).toContain("turnstileToken: formData.turnstileToken");
    expect(detail).toContain("honeypot: formData.honeypot");
    expect(form).toContain("TurnstileWidget");
    expect(form).toContain("education-lead-honeypot");
    expect(form).toContain("EDUCATION_PUBLIC_LEAD_INTAKE_CLIENT_CONTRACT");
    expect(contract).toContain('turnstileAction: "education-lead"');
  });

  it("keeps the PII table closed to anonymous direct inserts", () => {
    const migration = read(
      "supabase/migrations/20260906100029_harden_public_education_lead_intake_g6.sql",
    );
    const edge = read("supabase/functions/education-lead-intake/index.ts");

    expect(migration).toContain(
      "REVOKE INSERT ON public.education_leads FROM anon",
    );
    expect(edge).toContain('source_channel: "public_directory_form"');
    expect(edge).toContain("institution_lead_authority_not_enabled");
    expect(edge).toContain("public_institution_lead_intake_disabled");
    expect(edge).toContain("findRecentDuplicate");
    expect(edge).toContain("enforceDailySubjectLimit");
    expect(edge).toContain("isOriginAllowed");
    expect(edge).toContain("verifyTurnstileToken");
    expect(edge).toContain('getRequiredEnv("TURNSTILE_SECRET_KEY")');
    expect(edge).toContain('getRequiredEnv("ALLOWED_ORIGINS")');
    expect(edge).toContain('const TURNSTILE_ACTION = "education-lead"');
    expect(edge).toContain("getTrustedClientIp");
    expect(edge).toContain("body.honeypot");
    expect(edge).toContain("body.turnstileToken");
  });

  it("pins the public lead broker to explicit no-JWT anti-abuse governance", () => {
    const config = read("supabase/config.toml");
    const policy = read(
      "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
    );

    expect(config).toContain("[functions.education-lead-intake]");
    expect(
      config.slice(config.indexOf("[functions.education-lead-intake]"))
        .split("\n\n")[0],
    ).toContain("verify_jwt = false");
    expect(policy).toContain('"education-lead-intake"');
    expect(policy).toContain('"public-registration-broker"');
    expect(policy).toContain("requireLeadEligibleProfile");
    expect(policy).toContain("verifyTurnstileToken\\s*\\(");
    expect(policy).toContain("isOriginAllowed\\s*\\(");
  });

  it("does not log submitted PII in the broker audit payload", () => {
    const edge = read("supabase/functions/education-lead-intake/index.ts");
    const auditSection = edge.slice(edge.indexOf('action: "education_public_lead_created"'));
    expect(auditSection).not.toContain("fullName");
    expect(auditSection).not.toContain("email,");
    expect(auditSection).not.toContain("phone,");
  });
});
