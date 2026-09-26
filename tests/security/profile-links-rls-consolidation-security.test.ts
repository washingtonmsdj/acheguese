import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260926030330_consolidate_profile_links_rls.sql";
const migration = readFileSync(migrationPath, "utf8");

const legacyPolicies = ["Manage profile links", "View profile links"] as const;

describe("profile_links RLS consolidation", () => {
  it("removes only the legacy owner-only policies", () => {
    for (const policy of legacyPolicies) {
      expect(migration).toContain(`DROP POLICY IF EXISTS \"${policy}\"`);
      expect(migration).toContain("ON public.profile_links;");
    }
  });

  it("does not broaden or rewrite authorization", () => {
    expect(migration).not.toMatch(/GRANT\s+/i);
    expect(migration).not.toMatch(/REVOKE\s+/i);
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
    expect(migration).not.toMatch(/ALTER\s+POLICY/i);
    expect(migration).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(migration).not.toMatch(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i);
  });

  it("does not silently recreate the retired policies later", () => {
    const ownName = migrationPath.split("/").at(-1)!;
    const laterMigrations = readdirSync("supabase/migrations")
      .filter((name) => name.endsWith(".sql"))
      .filter((name) => name > ownName);

    for (const name of laterMigrations) {
      const source = readFileSync(`supabase/migrations/${name}`, "utf8").toLowerCase();
      for (const policy of legacyPolicies) {
        expect(source).not.toContain(`create policy \"${policy.toLowerCase()}\"`);
      }
    }
  });

  it("is transactionally bounded", () => {
    expect(migration).toMatch(/^--[\s\S]*\bBEGIN;/m);
    expect(migration).toMatch(/\bCOMMIT;\s*$/m);
  });
});
