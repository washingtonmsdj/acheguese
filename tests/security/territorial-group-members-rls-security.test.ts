import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const visibilityMigration = readProjectFile(
  "supabase/migrations/20260826040215_remove_territorial_group_member_public_shadow.sql",
);
const adminAuthorityMigration = readProjectFile(
  "supabase/migrations/20260826040419_consolidate_territorial_group_admin_authority.sql",
);
const semantics = readProjectFile(
  "src/core/territorial/TERRITORIAL_GROUPS_SEMANTICS.md",
);

describe("territorial group security boundaries", () => {
  it("keeps inactive groups hidden by product contract", () => {
    expect(semantics).toContain("`inactive`: Grupo oculto");
    expect(semantics).toContain("URLs retornam 404");
  });

  it("removes the legacy public SELECT true membership shadow", () => {
    expect(visibilityMigration).toContain(
      'DROP POLICY IF EXISTS "Membros de grupos visíveis publicamente"',
    );
    expect(visibilityMigration).toContain("Territorial group members viewable by all");
    expect(visibilityMigration).toContain("territorial_groups.status = ''active''");
    expect(visibilityMigration).toContain("browser SELECT true shadow");
  });

  it("preserves anonymous and authenticated reads for active-group membership", () => {
    expect(visibilityMigration).toContain(
      "ARRAY['anon', 'authenticated']::NAME[]",
    );
    expect(visibilityMigration).not.toMatch(
      /CREATE\s+POLICY[\s\S]*territorial_group_members[\s\S]*USING\s*\(\s*true\s*\)/i,
    );
  });

  it("consolidates group administration on the canonical admin helper", () => {
    for (const legacyPolicy of [
      "Admins manage territorial groups",
      "Admins view all territorial groups",
      "Admins manage territorial group members",
      "Admins view all territorial group members",
    ]) {
      expect(adminAuthorityMigration).toContain(
        `DROP POLICY IF EXISTS \"${legacyPolicy}\"`,
      );
    }

    expect(adminAuthorityMigration).toContain("private.is_admin");
    expect(adminAuthorityMigration).toContain("direct user_roles territorial authority remains");
    expect(adminAuthorityMigration).toContain("COALESCE(qual, '') ILIKE '%FROM user_roles%'");
    expect(adminAuthorityMigration).toContain("COALESCE(with_check, '') ILIKE '%FROM user_roles%'");
  });
});
