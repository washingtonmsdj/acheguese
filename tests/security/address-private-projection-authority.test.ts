import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const BASELINE =
  "20261008220000_enforce_address_private_read_projection.sql";
const read = (path: string) => readFileSync(path, "utf8");
const migration = read(join(MIGRATIONS, BASELINE));

describe("Address private table / public projection SSOT", () => {
  it("fails closed if view, RLS owner, or professional projection drifted", () => {
    expect(migration).toContain("ADDRESS_PRIVATE_PROJECTION_BLOCKED");
    expect(migration).toContain("unexpected view owner or invoker mode");
    expect(migration).toContain("unexpected public projection columns");
    expect(migration).toContain("unexpected base-table RLS policies");
    expect(migration).toContain("professional read-model drift");
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
  });

  it("removes public row access while retaining FK-embedding permission", () => {
    expect(migration).toContain(
      "preservar o GRANT SELECT de anon na tabela física",
    );
    expect(migration).toContain("SELECT retorna");
    expect(migration).toContain(
      "pg_has_role('anon', 'authenticated', 'member')",
    );
    expect(migration).toContain(
      'DROP POLICY "Addresses public verified read" ON public.addresses;',
    );
    expect(migration).toContain("Users manage own addresses");
    expect(migration).toContain(
      "has_table_privilege('anon', 'public.addresses', 'SELECT')",
    );
    expect(migration).toContain(
      "has_table_privilege('authenticated', 'public.addresses', 'SELECT')",
    );
    expect(migration).not.toMatch(
      /GRANT\s+SELECT\s+ON\s+(?:TABLE\s+)?public\.addresses\s+TO\s+(?:PUBLIC|anon)/i,
    );
  });

  it("exposes only verified safe fields through one tightly scoped read model", () => {
    const publicView = migration.match(
      /CREATE OR REPLACE VIEW public\.addresses_public[\s\S]*?;(?=\n)/,
    )?.[0] ?? "";
    expect(publicView).toContain(
      "WITH (security_invoker = false, security_barrier = true)",
    );
    expect(publicView).toContain("FROM public.addresses AS address");
    expect(publicView).toContain("WHERE address.is_verified = true");
    expect(publicView).toContain(
      "address.verification_status = 'verified'::public.address_verification_status",
    );
    for (const privateField of [
      "address.street",
      "address.number",
      "address.postal_code",
      "address.complement",
      "address.owner_user_id",
      "address.metadata",
    ]) {
      expect(publicView).not.toContain(privateField);
    }

    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.addresses_public TO anon, authenticated, service_role;",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.addresses_public",
    );
    expect(migration).toContain("security_barrier=true");
    expect(migration).toContain("security_invoker=false");
  });

  it("keeps paused professional search isolated from the private base table", () => {
    const professionalView = migration.match(
      /CREATE OR REPLACE VIEW public\.public_professional_search[\s\S]*?;(?=\n)/,
    )?.[0] ?? "";
    expect(professionalView).toContain("WITH (security_invoker = true)");
    expect(professionalView).toContain("LEFT JOIN public.addresses_public AS address");
    expect(professionalView).not.toContain(
      "LEFT JOIN public.addresses AS address",
    );
    expect(professionalView).toContain("professional.visibility = 'public_listed'");
    expect(professionalView).toContain("professional.is_accepting_clients = true");
  });

  it("rejects migrations that re-expose the private base table to anon", () => {
    const offenders = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith(".sql") && name > BASELINE)
      .filter((name) => {
        const sql = read(join(MIGRATIONS, name));
        return (
          /GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|SELECT)\s+ON\s+(?:TABLE\s+)?public\.addresses\s+TO\s+[^;]*(?:\bPUBLIC\b|\banon\b)/i.test(sql) ||
          /CREATE\s+POLICY[\s\S]{0,180}\s+ON\s+public\.addresses[\s\S]{0,150}\s+TO\s+(?:anon|PUBLIC)/i.test(sql)
        );
      });
    expect(offenders).toEqual([]);
  });
});
