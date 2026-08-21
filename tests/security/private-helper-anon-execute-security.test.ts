import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");
const migrationName =
  "20260821002600_revoke_residual_anon_private_admin_helper_execute.sql";
const migration = readFileSync(join(migrationsDir, migrationName), "utf8");

const revokedHelpers = [
  "auth_can_view_group",
  "is_admin",
  "is_admin_from_roles",
  "is_admin_user",
] as const;

describe("private helper anonymous execute hardening", () => {
  it("revokes PUBLIC and anon EXECUTE from residual administrative helpers", () => {
    for (const helper of revokedHelpers) {
      expect(migration).toMatch(
        new RegExp(
          `revoke\\s+execute\\s+on\\s+function\\s+private\\.${helper}\\(uuid\\)[\\s\\S]*?from\\s+public,\\s*anon`,
          "i",
        ),
      );
    }
  });

  it("keeps authenticated execution as an explicit postcondition", () => {
    expect(migration).toContain(
      "IF NOT has_function_privilege('authenticated', fn, 'EXECUTE')",
    );
    expect(migration).toContain(
      "postcondition failed: authenticated lost EXECUTE on %",
    );
  });

  it("preserves the anonymous invoker dependency on current_active_profile_id", () => {
    expect(migration).not.toMatch(
      /revoke\s+execute\s+on\s+function\s+private\.current_active_profile_id\(\)/i,
    );
    expect(migration).toContain(
      "'private.current_active_profile_id()'::regprocedure",
    );
    expect(migration).toContain(
      "anon must retain current_active_profile_id for list_community_groups_page",
    );
  });

  it("does not allow later migrations to silently restore anonymous execution", () => {
    const laterMigrations = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql") && name > migrationName)
      .sort();
    const regressions: string[] = [];

    for (const name of laterMigrations) {
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      for (const helper of revokedHelpers) {
        const grant = new RegExp(
          `grant\\s+(?:execute|all(?:\\s+privileges)?)\\s+on\\s+function\\s+private\\.${helper}\\([^;]*\\)[^;]*\\bto\\b[^;]*\\b(?:public|anon)\\b`,
          "i",
        );
        if (grant.test(sql)) regressions.push(`${name}: ${helper}`);
      }
    }

    expect(
      regressions,
      "private administrative helpers must not regain anonymous EXECUTE",
    ).toEqual([]);
  });
});
