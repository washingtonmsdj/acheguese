import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260926024500_remove_dead_territory_history_admin_policies.sql";
const migration = readFileSync(migrationPath, "utf8");

const removedPolicies = [
  ["location_versions_write_admin", "public.location_versions"],
  ["postal_code_history_write_admin", "public.postal_code_history"],
  ["territory_change_events_write_admin", "public.territory_change_events"],
] as const;

const protectedTables = [
  "public.location_versions",
  "public.postal_code_history",
  "public.territory_change_events",
] as const;

describe("territory-history dead admin policy hardening", () => {
  it("removes the unreachable PUBLIC admin policies", () => {
    for (const [policy, table] of removedPolicies) {
      expect(migration).toContain(`DROP POLICY IF EXISTS \"${policy}\"`);
      expect(migration).toContain(`ON ${table};`);
    }
  });

  it("keeps browser DML fail-closed instead of replacing the dead policies", () => {
    for (const table of protectedTables) {
      expect(migration).toContain(`ON TABLE ${table}`);
    }
    expect(migration).toMatch(
      /REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE,\s*REFERENCES,\s*TRIGGER[\s\S]*FROM\s+anon,\s*authenticated;/i,
    );
    expect(migration).not.toMatch(/GRANT\s+/i);
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
    expect(migration).not.toMatch(/ALTER\s+POLICY/i);
    expect(migration).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  });

  it("does not silently recreate the removed policies in a later migration", () => {
    const migrationNames = readdirSync("supabase/migrations")
      .filter((name) => name.endsWith(".sql"))
      .filter((name) => name > migrationPath.split("/").at(-1)!);

    for (const name of migrationNames) {
      const source = readFileSync(`supabase/migrations/${name}`, "utf8");
      for (const [policy] of removedPolicies) {
        expect(source).not.toMatch(
          new RegExp(`CREATE\\s+POLICY\\s+\\"?${policy}\\"?`, "i"),
        );
      }
    }
  });

  it("is transactionally bounded", () => {
    expect(migration).toMatch(/^--[\s\S]*\bBEGIN;/m);
    expect(migration).toMatch(/\bCOMMIT;\s*$/m);
  });
});
