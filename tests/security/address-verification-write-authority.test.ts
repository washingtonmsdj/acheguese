import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");
const migration = read(
  "supabase",
  "migrations",
  "20261008224500_restrict_address_verification_mutations.sql",
);
const client = read("src", "core", "residence", "hooks", "useResidenceManager.ts");
const types = read("src", "core", "address", "types", "index.ts");
const residenceService = read(
  "src", "core", "residence", "services", "ResidenceService.ts",
);

describe("Address verification write authority", () => {
  it("denies browser table-wide INSERT/UPDATE before granting postal allowlists", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.addresses FROM PUBLIC, authenticated;",
    );
    expect(migration).toContain("GRANT INSERT (");
    expect(migration).toContain("GRANT UPDATE (");
    expect(migration).toContain("ON TABLE public.addresses TO authenticated;");
    const grants = migration.match(
      /GRANT (?:INSERT|UPDATE) \([\s\S]*?\) ON TABLE public\.addresses TO authenticated;/g,
    ) ?? [];
    expect(grants).toHaveLength(2);
    for (const grant of grants) {
      for (const trusted of [
        "is_verified", "verification_status", "verified_at",
        "verified_by", "verified_reason", "point",
      ]) {
        expect(grant).not.toContain(trusted);
      }
    }
    expect(migration).toContain(
      "has_column_privilege('authenticated','public.addresses',v_protected_column,'UPDATE')",
    );
    expect(migration).toContain(
      "has_column_privilege('authenticated','public.addresses',v_protected_column,'INSERT')",
    );
    expect(migration).toContain(
      "has_table_privilege('service_role','public.addresses','UPDATE')",
    );
  });

  it("atomically invalidates stale verification whenever the owner changes physical address data", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
    expect(migration).toContain("CREATE TRIGGER address_verification_owner_guard");
    expect(migration).toContain("BEFORE INSERT OR UPDATE ON public.addresses");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("IF current_user <> 'authenticated' THEN");
    expect(migration).toContain("IS DISTINCT FROM ROW(");
    expect(migration).toContain("NEW.is_verified := false;");
    expect(migration).toContain("NEW.verification_status := 'pending'");
    expect(migration).toContain("NEW.verified_at := NULL;");
    expect(migration).toContain("NEW.verified_by := NULL;");
    expect(migration).toContain("NEW.verified_reason := 'address_details_changed';");
    expect(migration).toContain("REVOKE ALL ON FUNCTION private.address_verification_owner_guard()");
    expect(migration).toContain("RLS owner boundary changed");
  });

  it("keeps the residence editor free of server-owned verification fields", () => {
    const typeStart = types.indexOf("export interface UpdateAddressInput {");
    const typeEnd = types.indexOf("\n}", typeStart);
    const update = types.slice(typeStart, typeEnd);
    for (const key of [
      "is_verified?:", "verification_status?:", "verified_at?:",
      "verified_by?:", "verified_reason?:",
    ]) {
      expect(update).not.toContain(key);
    }
    expect(client).toContain("const updatePayload: UpdateAddressInput = addressPayload;");
    expect(client).toContain("addressService.updateAddress(addressId, updatePayload)");
    expect(client).toContain("is_verified: false");
    expect(client).toContain("verification_requested_at: null");
    expect(client).not.toContain('verified_reason: "residence_address_updated"');
  });

  it("also restricts residence proof, without disabling postal requests", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.user_residences",
    );
    expect(migration).toContain(
      "GRANT UPDATE (\n  address_id, location_id, country, is_primary, verification_requested_at",
    );
    expect(migration).toContain(
      "has_column_privilege('authenticated','public.user_residences','is_verified','UPDATE')",
    );
    expect(migration).toContain(
      "CREATE TRIGGER residence_verification_owner_guard",
    );
    expect(migration).toContain(
      "CREATE TRIGGER invalidate_linked_residence_verification",
    );
    expect(migration).toContain(
      "AFTER UPDATE ON public.addresses",
    );
    expect(migration).toContain(
      "WHERE address_id = NEW.id",
    );
    expect(migration).toContain(
      "SET is_verified = false,\n        verification_requested_at = NULL",
    );
    expect(migration).toContain(
      "NEW.verification_requested_at := now();",
    );
    expect(migration).toContain(
      "NEW.verification_requested_at := OLD.verification_requested_at;",
    );
    const updateResidence = residenceService.slice(
      residenceService.indexOf("export interface UpdateResidenceData {"),
      residenceService.indexOf("\n}", residenceService.indexOf("export interface UpdateResidenceData {")),
    );
    expect(updateResidence).not.toContain("is_verified?:");
    expect(updateResidence).not.toContain("verification_requested_at?:");
    expect(residenceService).toContain("async requestVerification(residenceId: string)");
    expect(residenceService).not.toContain(
      "if (data.is_verified !== undefined) payload.is_verified",
    );
    expect(client).toContain("residenceService.updateResidence(residence.id, {");
    expect(client).not.toContain("verification_requested_at: null,");
  });

  it("includes a read-only DB role privilege probe to run after migration", () => {
    const probe = read(
      "tests", "security", "address-verification-authenticated-probe.sql",
    );
    expect(probe).toContain("BEGIN TRANSACTION READ ONLY;");
    expect(probe).toContain("SET LOCAL ROLE authenticated;");
    expect(probe).toContain("has_column_privilege(");
    expect(probe).toContain("verified_reason");
    expect(probe).toContain("ROLLBACK;");
    expect(probe).not.toMatch(/\b(?:UPDATE|INSERT|DELETE)\s+public\.addresses\b/i);
  });
});
