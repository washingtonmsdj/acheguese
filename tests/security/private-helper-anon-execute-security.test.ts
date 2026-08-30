import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");
const adminMigrationName = "20260825183353_harden_admin_helper_anon_scope.sql";
const finalPrivateHelperMigrationName =
  "20260825233757_remove_anon_private_helper_execute.sql";
const adminMigration = readFileSync(
  join(migrationsDir, adminMigrationName),
  "utf8",
);
const finalPrivateHelperMigration = readFileSync(
  join(migrationsDir, finalPrivateHelperMigrationName),
  "utf8",
);

const adminHelpers = ["is_admin", "is_admin_from_roles", "is_admin_user"] as const;
const finalHelpers = ["current_active_profile_id", "auth_can_view_group"] as const;

describe("private helper anonymous execute hardening", () => {
  it("revokes anon EXECUTE from canonical admin helpers", () => {
    for (const helper of adminHelpers) {
      expect(adminMigration).toMatch(
        new RegExp(
          `revoke\\s+execute\\s+on\\s+function\\s+private\\.${helper}\\(uuid\\)\\s+from\\s+anon`,
          "i",
        ),
      );
    }
  });

  it("removes the remaining anonymous private helper surface", () => {
    expect(finalPrivateHelperMigration).toMatch(
      /revoke\s+all\s+on\s+function\s+private\.current_active_profile_id\(\)\s+from\s+anon/i,
    );
    expect(finalPrivateHelperMigration).toMatch(
      /revoke\s+all\s+on\s+function\s+private\.auth_can_view_group\(uuid\)\s+from\s+anon/i,
    );
    expect(finalPrivateHelperMigration).toContain(
      "has_function_privilege('anon', 'private.current_active_profile_id()'::regprocedure, 'EXECUTE')",
    );
    expect(finalPrivateHelperMigration).toContain(
      "has_function_privilege('authenticated', 'private.current_active_profile_id()'::regprocedure, 'EXECUTE')",
    );
  });

  it("does not allow later migrations to restore anonymous execution", () => {
    const laterMigrations = readdirSync(migrationsDir)
      .filter(
        (name) =>
          name.endsWith(".sql") && name > finalPrivateHelperMigrationName,
      )
      .sort();
    const regressions: string[] = [];
    const helpers = [...adminHelpers, ...finalHelpers];

    for (const name of laterMigrations) {
      const sql = readFileSync(join(migrationsDir, name), "utf8");
      for (const helper of helpers) {
        const signature = helper === "current_active_profile_id" ? "\\(\\)" : "\\(uuid\\)";
        const grant = new RegExp(
          `grant\\s+(?:execute|all(?:\\s+privileges)?)\\s+on\\s+function\\s+private\\.${helper}${signature}[^;]*\\bto\\b[^;]*\\b(?:public|anon)\\b`,
          "i",
        );
        if (grant.test(sql)) regressions.push(`${name}: ${helper}`);
      }
    }

    expect(
      regressions,
      "private authorization helpers must not regain anonymous EXECUTE",
    ).toEqual([]);
  });
});
