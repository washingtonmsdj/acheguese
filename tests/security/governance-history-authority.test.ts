import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE = "20260830061304_tighten_governance_history_browser_grants.sql";
const TABLES = [
  "location_versions",
  "postal_code_history",
  "territory_change_events",
] as const;
const repository = readFileSync(
  join(ROOT, "src/core/governance/repositories/GovernanceRepositorySupabase.ts"),
  "utf8",
);

describe("G5 governance history authority", () => {
  it("keeps the runtime repository on append/read semantics", () => {
    for (const table of TABLES) expect(repository).toContain(`'${table}'`);
    expect(repository).toContain(".insert(");
    expect(repository).toContain(".select(");
    expect(repository).not.toContain(".update(");
    expect(repository).not.toContain(".delete(");
  });

  it("keeps public read, authenticated insert and server full authority", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    for (const table of TABLES) {
      expect(sql).toContain(
        `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC, anon, authenticated;`,
      );
      expect(sql).toContain(
        `GRANT SELECT ON TABLE public.${table} TO anon, authenticated;`,
      );
      expect(sql).toContain(
        `GRANT INSERT ON TABLE public.${table} TO authenticated;`,
      );
      expect(sql).toContain(
        `GRANT ALL PRIVILEGES ON TABLE public.${table} TO service_role;`,
      );
    }
  });

  it("rejects later browser mutation expansion", () => {
    const offenders: string[] = [];
    const later = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith(".sql") && name > BASELINE)
      .sort();

    for (const name of later) {
      const sql = readFileSync(join(MIGRATIONS, name), "utf8");
      for (const table of TABLES) {
        const anonMutation = new RegExp(
          String.raw`GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|[^;]*\b(?:INSERT|UPDATE|DELETE)\b[^;]*)\s+ON\s+(?:TABLE\s+)?public\.${table}\s+TO\s+[^;]*\banon\b`,
          "i",
        );
        const authenticatedDestructiveMutation = new RegExp(
          String.raw`GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|[^;]*\b(?:UPDATE|DELETE)\b[^;]*)\s+ON\s+(?:TABLE\s+)?public\.${table}\s+TO\s+[^;]*\bauthenticated\b`,
          "i",
        );
        if (anonMutation.test(sql) || authenticatedDestructiveMutation.test(sql)) {
          offenders.push(`${name}: ${table}`);
        }
      }
    }

    expect(
      offenders,
      "governance history tables must remain public-read/authenticated-append unless authority is redesigned",
    ).toEqual([]);
  });
});
