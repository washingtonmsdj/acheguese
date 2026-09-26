import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260926033000_consolidate_remaining_proven_rls_redundancies.sql";
const migration = readFileSync(migrationPath, "utf8");

const retiredPolicies = [
  "Owners view own work opportunities",
  "Usuários atualizam seus próprios perfis",
] as const;

describe("remaining RLS redundancy consolidation", () => {
  it("drops only the two reviewed redundant policies", () => {
    expect(migration).toContain(
      'DROP POLICY "Owners view own work opportunities" ON public.work_opportunities;',
    );
    expect(migration).toContain(
      'DROP POLICY "Usuários atualizam seus próprios perfis" ON public.profiles;',
    );
    expect(migration.match(/^DROP POLICY\s+/gm) ?? []).toHaveLength(2);
  });

  it("preserves canonical authorization and the profile delete deny policy", () => {
    expect(migration).toContain("policyname='Owners manage own work opportunities'");
    expect(migration).toContain("policyname='Account owners can update their profiles'");
    expect(migration).toContain("policyname='Perfis não podem ser deletados'");
    expect(migration).toContain("trg_guard_profile_server_owned_fields");
    expect(migration).toContain(
      "has_table_privilege('authenticated','public.profiles','DELETE')",
    );
  });

  it("does not broaden grants or rewrite policy/function definitions", () => {
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+/im);
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
    expect(migration).not.toMatch(/ALTER\s+POLICY/i);
    expect(migration).not.toMatch(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION/i);
    expect(migration).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(migration).not.toMatch(/^\s*(?:INSERT|UPDATE|DELETE|TRUNCATE)\b/im);
  });

  it("prevents later migrations from silently recreating retired policies", () => {
    const ownName = migrationPath.split("/").at(-1)!;
    const later = readdirSync("supabase/migrations")
      .filter((name) => name.endsWith(".sql") && name > ownName)
      .sort();

    for (const name of later) {
      const source = readFileSync(`supabase/migrations/${name}`, "utf8").toLowerCase();
      for (const policy of retiredPolicies) {
        expect(source).not.toContain(`create policy \"${policy.toLowerCase()}\"`);
      }
    }
  });
});
