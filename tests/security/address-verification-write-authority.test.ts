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
