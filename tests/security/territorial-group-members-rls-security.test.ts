import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260826040500_remove_territorial_group_member_public_shadow.sql",
);
const semantics = readProjectFile(
  "src/core/territorial/TERRITORIAL_GROUPS_SEMANTICS.md",
);

describe("territorial group membership visibility", () => {
  it("keeps inactive groups hidden by product contract", () => {
    expect(semantics).toContain("`inactive`: Grupo oculto");
    expect(semantics).toContain("URLs retornam 404");
  });

  it("removes the legacy public SELECT true membership shadow", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Membros de grupos visíveis publicamente"',
    );
    expect(migration).toContain("Territorial group members viewable by all");
    expect(migration).toContain("territorial_groups.status = ''active''");
    expect(migration).toContain("browser SELECT true shadow");
  });

  it("preserves anonymous and authenticated reads for active-group membership", () => {
    expect(migration).toContain(
      "ARRAY['anon', 'authenticated']::NAME[]",
    );
    expect(migration).not.toMatch(
      /CREATE\s+POLICY[\s\S]*territorial_group_members[\s\S]*USING\s*\(\s*true\s*\)/i,
    );
  });
});
