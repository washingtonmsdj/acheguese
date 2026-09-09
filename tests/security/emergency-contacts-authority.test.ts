import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Emergency contact authority", () => {
  const migration = readProjectFile(
    "supabase/migrations/20260909200953_server_own_emergency_contacts_g25.sql",
  );
  const service = readProjectFile(
    "src/core/safety/services/SafetyEmergencyContactsService.ts",
  );

  it("keeps writes behind server-owned commands", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.create_emergency_contact",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.patch_emergency_contact",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.emergency_contacts FROM authenticated",
    );
    expect(migration).toContain(
      "DROP POLICY IF EXISTS emergency_contacts_insert_own",
    );
    expect(migration).toContain(
      "DROP POLICY IF EXISTS emergency_contacts_update_own",
    );

    expect(service).toContain('"create_emergency_contact"');
    expect(service).toContain('"patch_emergency_contact"');
    expect(service).not.toMatch(
      /from<EmergencyContactRow>\("emergency_contacts"\)[\s\S]{0,200}\.(insert|update)\(/,
    );
  });

  it("keeps provenance and lifecycle fields out of the patch surface", () => {
    expect(migration).toContain(
      "'name','email','phone','relationship','is_primary','is_active'",
    );
    expect(migration).toContain(
      "unsupported_emergency_contact_patch_field",
    );
    expect(migration).toContain("IF NOT v_is_active THEN");
    expect(migration).toContain("v_is_primary := false");
    expect(migration).toContain("metadata");
    expect(migration).toContain("created_at");
    expect(service).not.toContain("created_at: new Date()");
    expect(service).not.toContain("metadata:");
  });

  it("enforces one active primary at the database layer", () => {
    expect(migration).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS emergency_contacts_one_active_primary_per_profile",
    );
    expect(migration).toContain(
      "WHERE is_primary = true AND is_active = true",
    );
  });
});
