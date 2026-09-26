import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260926030000_consolidate_proven_rls_redundancies.sql";
const migration = readFileSync(migrationPath, "utf8");

const removedPolicies = [
  ["Users manage own answer likes", "public.question_answer_likes"],
  ["Admins can view all application logs", "public.application_logs"],
  ["guide_tpm_admin_all", "public.tourist_point_media"],
] as const;

describe("proven RLS redundancy consolidation", () => {
  it("removes only the three proven redundant policies", () => {
    for (const [policy, table] of removedPolicies) {
      if (policy === "guide_tpm_admin_all") {
        expect(migration).toContain(`DROP POLICY IF EXISTS ${policy}`);
      } else {
        expect(migration).toContain(`DROP POLICY IF EXISTS \"${policy}\"`);
      }
      expect(migration).toContain(`ON ${table};`);
    }
  });

  it("keeps answer-like mutations fail-closed to direct browser DML", () => {
    expect(migration).toMatch(
      /REVOKE\s+INSERT,\s*UPDATE,\s*DELETE,\s*TRUNCATE,\s*REFERENCES,\s*TRIGGER\s+ON TABLE public\.question_answer_likes\s+FROM authenticated;/i,
    );
  });

  it("does not broaden authorization while consolidating", () => {
    expect(migration).not.toMatch(/GRANT\s+/i);
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
    expect(migration).not.toMatch(/ALTER\s+POLICY/i);
    expect(migration).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  });

  it("does not silently recreate the removed policies later", () => {
    const ownName = migrationPath.split("/").at(-1)!;
    const laterMigrations = readdirSync("supabase/migrations")
      .filter((name) => name.endsWith(".sql"))
      .filter((name) => name > ownName);

    for (const name of laterMigrations) {
      const source = readFileSync(`supabase/migrations/${name}`, "utf8");
      for (const [policy] of removedPolicies) {
        expect(source.toLowerCase()).not.toContain(
          `create policy \"${policy.toLowerCase()}\"`,
        );
        expect(source.toLowerCase()).not.toContain(
          `create policy ${policy.toLowerCase()}`,
        );
      }
    }
  });

  it("is transactionally bounded", () => {
    expect(migration).toMatch(/^--[\s\S]*\bBEGIN;/m);
    expect(migration).toMatch(/\bCOMMIT;\s*$/m);
  });
});
