import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const BASELINE = "20260825183353_harden_admin_helper_anon_scope.sql";

const ADMIN_HELPERS = [
  "private.is_admin(uuid)",
  "private.is_admin_from_roles(uuid)",
  "private.is_admin_user(uuid)",
] as const;

const VAGA_APPLICATION_POLICIES = [
  "vaga_applications_delete_admin",
  "vaga_applications_insert",
  "vaga_applications_select",
  "vaga_applications_update",
] as const;

function migrationsFromBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function normalizeSql(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("admin helper anonymous-scope hardening", () => {
  it("keeps the baseline migration that removes anonymous admin-helper access", () => {
    const baseline = migrationsFromBaseline().find(({ name }) => name === BASELINE);
    expect(baseline, `${BASELINE} must remain versioned`).toBeDefined();

    const sql = normalizeSql(baseline?.sql ?? "");

    for (const policy of VAGA_APPLICATION_POLICIES) {
      expect(sql).toMatch(
        new RegExp(
          `alter\\s+policy\\s+${escapeRegex(policy)}\\s+on\\s+public\\.vaga_applications\\s+to\\s+authenticated`,
          "i",
        ),
      );
    }

    for (const helper of ADMIN_HELPERS) {
      expect(sql).toMatch(
        new RegExp(
          `revoke\\s+execute\\s+on\\s+function\\s+${escapeRegex(helper)}\\s+from\\s+anon`,
          "i",
        ),
      );
    }
  });

  it("does not re-grant anonymous execution on canonical admin helpers", () => {
    const regressions: string[] = [];

    for (const { name, sql } of migrationsFromBaseline()) {
      const normalized = normalizeSql(sql);
      for (const helper of ADMIN_HELPERS) {
        const regrant = new RegExp(
          `grant\\s+execute\\s+on\\s+function\\s+${escapeRegex(helper)}\\s+to\\s+(?:public|anon)`,
          "i",
        );
        if (regrant.test(normalized)) regressions.push(`${name}: ${helper}`);
      }
    }

    expect(
      regressions,
      "canonical admin helpers must not regain anonymous EXECUTE without explicit review",
    ).toEqual([]);
  });

  it("does not widen vaga_applications policies back to PUBLIC or anon", () => {
    const regressions: string[] = [];

    for (const { name, sql } of migrationsFromBaseline()) {
      const normalized = normalizeSql(sql);
      for (const policy of VAGA_APPLICATION_POLICIES) {
        const widen = new RegExp(
          `alter\\s+policy\\s+${escapeRegex(policy)}\\s+on\\s+public\\.vaga_applications\\s+to\\s+(?:public|anon)`,
          "i",
        );
        if (widen.test(normalized)) regressions.push(`${name}: ${policy}`);
      }
    }

    expect(
      regressions,
      "vaga_applications policies must remain authenticated-only",
    ).toEqual([]);
  });
});
