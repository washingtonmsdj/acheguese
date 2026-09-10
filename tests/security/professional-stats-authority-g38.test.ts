import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Professional stats authority G38", () => {
  it("increments contact stats atomically from the authoritative lead insert", () => {
    const migration = read(
      "supabase/migrations/20260910133000_server_own_professional_stats_contacts_g38.sql",
    );

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

  it("retires browser DML while preserving the existing read authority", () => {
    const migration = read(
      "supabase/migrations/20260910133000_server_own_professional_stats_contacts_g38.sql",
    );

    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.professional_stats",
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Owners manage own professional stats"',
    );
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
