import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const HARDENING_MIGRATION =
  "20260926011800_fail_closed_browser_default_privileges.sql";
const FUNCTION_DEFAULT_REPAIR =
  "20260926025000_repair_postgres_function_default_privileges.sql";

const hardeningSql = readFileSync(
  join(MIGRATIONS_DIR, HARDENING_MIGRATION),
  "utf8",
);
const functionDefaultRepairSql = readFileSync(
  join(MIGRATIONS_DIR, FUNCTION_DEFAULT_REPAIR),
  "utf8",
);

describe("future public object privileges", () => {
  it("makes project-owned public tables fail closed for browser roles", () => {
    expect(hardeningSql).toMatch(
      /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public[\s\S]*revoke\s+select,\s*insert,\s*update,\s*delete\s+on\s+tables[\s\S]*from\s+anon,\s*authenticated/i,
    );
  });

  it("does not auto-grant future project sequences to browser roles", () => {
    expect(hardeningSql).toMatch(
      /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public[\s\S]*revoke\s+usage,\s*select,\s*update\s+on\s+sequences[\s\S]*from\s+anon,\s*authenticated/i,
    );
  });

  it("removes PostgreSQL's global PUBLIC execute default for future postgres functions", () => {
    expect(functionDefaultRepairSql).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;/,
    );
    expect(functionDefaultRepairSql).not.toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;/,
    );
  });

  it("preserves extension compatibility explicitly", () => {
    expect(functionDefaultRepairSql).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA extensions\s+GRANT EXECUTE ON FUNCTIONS TO PUBLIC;/,
    );
  });

  it("does not mutate existing relation or function grants", () => {
    expect(functionDefaultRepairSql).not.toMatch(/^\s*ALTER\s+FUNCTION\b/im);
    expect(functionDefaultRepairSql).not.toMatch(/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/im);
    expect(functionDefaultRepairSql).not.toMatch(/on\s+all\s+functions/i);
    expect(functionDefaultRepairSql).not.toMatch(/for\s+role\s+supabase_admin/i);
  });

  it("rejects future migrations that restore permissive postgres function defaults", () => {
    const regressions = readdirSync(MIGRATIONS_DIR)
      .filter(
        (name) =>
          name.endsWith(".sql") && name > FUNCTION_DEFAULT_REPAIR,
      )
      .sort()
      .filter((name) => {
        const sql = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
        const globalPublicGrant =
          /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+grant\s+execute\s+on\s+functions\s+to\s+public/i.test(
            sql,
          );
        const publicSchemaPublicGrant =
          /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public[\s\S]{0,200}?grant\s+execute\s+on\s+functions\s+to\s+public/i.test(
            sql,
          );
        return globalPublicGrant || publicSchemaPublicGrant;
      });

    expect(
      regressions,
      "future browser RPC access must be granted per function, not restored as a default",
    ).toEqual([]);
  });
});
