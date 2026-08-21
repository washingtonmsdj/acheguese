import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const BOUNDARY_MIGRATION =
  "20260821024000_guard_pending_deletion_dml.sql";
const REFRESH_CALL = "private.ensure_pending_deletion_write_guards()";

describe("pending deletion write-guard migration governance", () => {
  it("keeps the refreshable guard installer private and versioned", () => {
    const source = readFileSync(
      join(MIGRATIONS_DIR, BOUNDARY_MIGRATION),
      "utf8",
    );

    expect(source).toContain(
      "CREATE FUNCTION private.ensure_pending_deletion_write_guards()",
    );
    expect(source).toContain(
      "REVOKE ALL ON FUNCTION private.ensure_pending_deletion_write_guards() FROM authenticated",
    );
    expect(source).toContain(`SELECT ${REFRESH_CALL};`);
    expect(source).toContain("dependency.deptype = 'e'");
    expect(source).toContain("c.relkind = 'r'");
  });

  it("requires every later migration that creates a public table to refresh DML guards", () => {
    const laterMigrations = readdirSync(MIGRATIONS_DIR)
      .filter((name) => name.endsWith(".sql") && name > BOUNDARY_MIGRATION)
      .sort();

    for (const name of laterMigrations) {
      const source = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
      const createsPublicTable =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\./i.test(source);

      if (createsPublicTable) {
        expect(
          source,
          `${name} creates a public table without refreshing the pending-deletion DML guards`,
        ).toContain(REFRESH_CALL);
      }
    }
  });
});
