import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE = "20260830061304_tighten_governance_history_browser_grants.sql";
const COLUMN_BOUNDARY =
  "20260918132546_bound_governance_history_browser_columns.sql";
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
    expect(repository).toContain("LOCATION_VERSION_PUBLIC_COLUMNS");
    expect(repository).toContain("TERRITORY_CHANGE_EVENT_PUBLIC_COLUMNS");
    expect(repository).toContain("POSTAL_CODE_HISTORY_PUBLIC_COLUMNS");
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


  it("narrows current browser authority to explicit governance columns", () => {
    const sql = readFileSync(join(MIGRATIONS, COLUMN_BOUNDARY), "utf8");

    for (const table of TABLES) {
      expect(sql).toContain(
        `REVOKE ALL PRIVILEGES ON TABLE public.${table}`,
      );
      expect(sql).toContain(
        `GRANT ALL PRIVILEGES ON TABLE public.${table} TO service_role;`,
      );
    }

    expect(sql).toContain(
      "GRANT SELECT (\n  id,\n  location_id,\n  version_number,",
    );
    expect(sql).toContain(
      "GRANT SELECT (\n  id,\n  location_id,\n  event_type,",
    );
    expect(sql).toContain(
      "GRANT SELECT (\n  id,\n  location_id,\n  postal_code,",
    );
    expect(sql).toContain(
      "location_versions.created_by remains browser-readable",
    );
    expect(sql).toContain(
      "territory_change_events.processed_by remains browser-readable",
    );
    expect(sql).toContain(
      "browser can insert server-owned governance audit fields",
    );

    expect(repository).not.toMatch(
      /from<LocationVersionRow>\('location_versions'\)[\s\S]{0,120}\.select\('\*'\)/,
    );
    expect(repository).not.toMatch(
      /from<TerritoryChangeEventRow>\('territory_change_events'\)[\s\S]{0,120}\.select\('\*'\)/,
    );
    expect(repository).not.toMatch(
      /from<PostalCodeHistoryRow>\('postal_code_history'\)[\s\S]{0,120}\.select\('\*'\)/,
    );
  });

  it("rejects later expansion of actor metadata or table-wide history grants", () => {
    const offenders: string[] = [];
    const later = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith(".sql") && name > COLUMN_BOUNDARY)
      .sort();

    for (const name of later) {
      const sql = readFileSync(join(MIGRATIONS, name), "utf8");

      for (const table of TABLES) {
        if (
          new RegExp(
            String.raw`GRANT\s+(?:SELECT|INSERT|ALL(?:\s+PRIVILEGES)?)\s+ON\s+(?:TABLE\s+)?public\.${table}\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)`,
            "i",
          ).test(sql)
        ) {
          offenders.push(`${name}: table-wide ${table}`);
        }
      }

      if (
        /GRANT\s+(?:SELECT|INSERT)\s*\([^;]*\bcreated_by\b[^;]*\)\s*ON\s+(?:TABLE\s+)?public\.location_versions\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        offenders.push(`${name}: location_versions.created_by`);
      }

      if (
        /GRANT\s+(?:SELECT|INSERT)\s*\([^;]*\bprocessed_by\b[^;]*\)\s*ON\s+(?:TABLE\s+)?public\.territory_change_events\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        offenders.push(`${name}: territory_change_events.processed_by`);
      }
    }

    expect(offenders).toEqual([]);
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
