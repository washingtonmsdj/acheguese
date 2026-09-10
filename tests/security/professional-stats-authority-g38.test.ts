import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const pendingCutoverPath =
  "docs/09-reference/migrations-pending/20260910133000_finalize_professional_lead_intake_g39.sql";

describe("Professional stats authority G38", () => {
  it("keeps the contact-counter trigger staged until G39 is live", () => {
    const migration = read(pendingCutoverPath);

    expect(migration).toContain("PENDING CUTOVER");
    expect(migration).toContain(
      "private.increment_professional_contacts_from_lead",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("AFTER INSERT");
    expect(migration).toContain("ON public.professional_leads");
    expect(migration).toContain(
      "contacts_count = public.professional_stats.contacts_count + 1",
    );
  });

  it("retires browser lead/stats DML atomically at the future cutover", () => {
    const migration = read(pendingCutoverPath);

    expect(migration).toContain(
      "REVOKE INSERT ON TABLE public.professional_leads",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_stats",
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Owners manage own professional stats"',
    );
    expect(migration).toContain("professional_leads_public_insert");
    expect(migration).toContain("professional_leads_authenticated_insert");
    expect(migration).toContain("has_column_privilege");
    expect(migration).not.toContain("REVOKE SELECT");
  });

  it("keeps ProfessionalLeadService free of stats read-modify-write bridges", () => {
    const service = read(
      "src/core/professional/services/ProfessionalLeadService.ts",
    );

    expect(service).toContain('.from<ProfessionalLeadRecord>("professional_leads")');
    expect(service).not.toContain("professional_stats");
    expect(service).not.toContain("incrementContactsCount");
    expect(service).not.toContain("ProfessionalStatsContactsRow");
    expect(service).not.toContain("getProfessionalOwner(");
  });
});
