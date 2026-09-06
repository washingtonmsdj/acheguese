import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 public Education lead intake", () => {
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

    expect(service).toContain(
      'supabase.functions.invoke("education-lead-rpc"',
    );
    expect(service).not.toContain('.from("education_leads")');
    expect(hook).toContain("PublicEducationLeadService.create");
    expect(detail).toContain("createPublic");
  });

  it("keeps the PII table closed to anonymous direct inserts", () => {
    const migration = read(
      "supabase/migrations/20260906100029_harden_public_education_lead_intake_g6.sql",
    );
    const edge = read("supabase/functions/education-lead-rpc/index.ts");

    expect(migration).toContain(
      "REVOKE INSERT ON public.education_leads FROM anon",
    );
    expect(edge).toContain('source_channel: "public_directory_form"');
    expect(edge).toContain("institution_lead_authority_not_enabled");
    expect(edge).toContain("public_institution_lead_intake_disabled");
    expect(edge).toContain("findRecentDuplicate");
    expect(edge).toContain("enforceDailySubjectLimit");
  });

  it("does not log submitted PII in the broker audit payload", () => {
    const edge = read("supabase/functions/education-lead-rpc/index.ts");
    const auditSection = edge.slice(edge.indexOf('action: "education_public_lead_created"'));
    expect(auditSection).not.toContain("fullName");
    expect(auditSection).not.toContain("email,");
    expect(auditSection).not.toContain("phone,");
  });
});
