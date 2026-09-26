import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const HARDENING_MIGRATION =
  "20260926011800_fail_closed_browser_default_privileges.sql";
const hardeningSql = readFileSync(
  join(MIGRATIONS_DIR, HARDENING_MIGRATION),
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

  it("keeps future public functions opt-in for browser execution", () => {
    expect(hardeningSql).toMatch(
      /revoke\s+execute\s+on\s+functions[\s\S]*from\s+public,\s*anon,\s*authenticated/i,
    );
  });

  it("does not mutate existing relation grants or platform-owned schemas", () => {
    expect(hardeningSql).not.toMatch(/on\s+all\s+tables/i);
    expect(hardeningSql).not.toMatch(/for\s+role\s+supabase_admin/i);
    expect(hardeningSql).not.toMatch(/in\s+schema\s+(storage|realtime|graphql|extensions)/i);
  });

  it("rejects future migrations that restore permissive postgres public defaults", () => {
    const regressions = readdirSync(MIGRATIONS_DIR)
      .filter(
        (name) =>
          name.endsWith(".sql") && name > HARDENING_MIGRATION,
      )
      .sort()
      .filter((name) => {
        const sql = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
        return /alter\s+default\s+privileges\s+for\s+role\s+postgres\s+in\s+schema\s+public[\s\S]*grant\s+(?:select|insert|update|delete|all|usage|execute)/i.test(
          sql,
        );
      });

    expect(
      regressions,
      "future public access must be granted per object, not restored as a blanket default",
    ).toEqual([]);
  });
});
