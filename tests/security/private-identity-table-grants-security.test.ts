import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const HARDENING = "20260825221000_revoke_anon_identity_graph_select_grants.sql";
const PRIVATE_IDENTITY_TABLES = [
  "question_answer_likes",
  "event_review_helpfulness",
  "user_follows",
] as const;

function migrationsFromHardening() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= HARDENING)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

describe("private identity table grants", () => {
  it("keeps anonymous SELECT revocations versioned", () => {
    const migration = migrationsFromHardening().find(({ name }) => name === HARDENING);
    expect(migration, `${HARDENING} must remain versioned`).toBeDefined();

    const sql = migration?.sql ?? "";
    for (const table of PRIVATE_IDENTITY_TABLES) {
      expect(sql).toMatch(
        new RegExp(`revoke\\s+select\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+anon`, "i"),
      );
    }
  });

  it("does not restore anonymous reads on private identity tables", () => {
    const regressions: string[] = [];

    for (const { name, sql } of migrationsFromHardening()) {
      if (name === HARDENING) continue;

      for (const table of PRIVATE_IDENTITY_TABLES) {
        const grant = new RegExp(
          `grant\\s+(?:all(?:\\s+privileges)?|select)(?:\\s*,[\\s\\w]+)*\\s+on(?:\\s+table)?\\s+public\\.${table}\\s+to\\s+(?:public|anon)\\b`,
          "i",
        );
        if (grant.test(sql)) regressions.push(`${name}: ${table}`);
      }
    }

    expect(
      regressions,
      "private relationship/vote tables must not regain anonymous read grants",
    ).toEqual([]);
  });
});
