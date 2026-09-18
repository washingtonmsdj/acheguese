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
const governanceTypes = readFileSync(
  join(ROOT, "src/core/governance/types/index.ts"),
  "utf8",
);

describe("G5 governance history authority", () => {
  it("keeps the runtime repository append/read-only with explicit governed projections", () => {
    for (const table of TABLES) expect(repository).toContain(`'${table}'`);
    expect(repository).toContain(".insert(");
    expect(repository).toContain(".select(");
    expect(repository).not.toContain(".update(");
    expect(repository).not.toContain(".delete(");

    expect(repository).toContain("LOCATION_VERSION_PUBLIC_COLUMNS");
    expect(repository).toContain("TERRITORY_CHANGE_EVENT_PUBLIC_COLUMNS");
    expect(repository).toContain("POSTAL_CODE_HISTORY_PUBLIC_COLUMNS");

    const locationSection = repository.slice(
      repository.indexOf("// LOCATION VERSIONS"),
      repository.indexOf("// LOCATION ALIASES"),
    );
    const eventSection = repository.slice(
      repository.indexOf("// TERRITORY CHANGE EVENTS"),
      repository.indexOf("// POSTAL CODE HISTORY"),
    );
    const postalSection = repository.slice(
      repository.indexOf("// POSTAL CODE HISTORY"),
    );

    expect(locationSection).not.toContain(".select('*')");
    expect(eventSection).not.toContain(".select('*')");
    expect(postalSection).not.toContain(".select('*')");
    expect(locationSection).not.toContain(".select()");
    expect(eventSection).not.toContain(".select()");
    expect(postalSection).not.toContain(".select()");
  });

  it("preserves the original public-read/authenticated-append design before the column boundary", () => {
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

  it("bounds browser history access to reviewed columns and hides actor metadata", () => {
    const sql = readFileSync(join(MIGRATIONS, COLUMN_BOUNDARY), "utf8");

    for (const table of TABLES) {
      expect(sql).toContain(
        `REVOKE ALL PRIVILEGES ON TABLE public.${table}`,
      );
      expect(sql).toContain(
        `GRANT ALL PRIVILEGES ON TABLE public.${table} TO service_role;`,
      );
    }

    expect(sql).toContain("GRANT SELECT (");
    expect(sql).toContain("GRANT INSERT (");
    expect(sql).toContain("TO anon, authenticated;");
    expect(sql).toContain("TO authenticated;");

    expect(sql).toContain(
      "has_column_privilege(v_role, 'public.location_versions', 'created_by', 'SELECT')",
    );
    expect(sql).toContain(
      "has_column_privilege(v_role, 'public.territory_change_events', 'processed_by', 'SELECT')",
    );
    expect(sql).toContain(
      "browser can insert server-owned governance audit fields",
    );

    expect(governanceTypes).not.toContain("created_by: string | null");
    expect(governanceTypes).not.toContain("processed_by: string | null");
    expect(repository).not.toContain('"created_by"');
    expect(repository).not.toContain('"processed_by"');
  });

  it("rejects later browser authority expansion after the column boundary", () => {
    const offenders: string[] = [];
    const later = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith(".sql") && name > COLUMN_BOUNDARY)
      .sort();

    for (const name of later) {
      const sql = readFileSync(join(MIGRATIONS, name), "utf8");
      for (const table of TABLES) {
        const broadSelect = new RegExp(
          String.raw`GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|SELECT)\s+ON\s+(?:TABLE\s+)?public\.${table}\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)`,
          "i",
        );
        const anonMutation = new RegExp(
          String.raw`GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|[^;]*\b(?:INSERT|UPDATE|DELETE)\b[^;]*)\s+ON\s+(?:TABLE\s+)?public\.${table}\s+TO\s+[^;]*\banon\b`,
          "i",
        );
        const authenticatedDestructiveMutation = new RegExp(
          String.raw`GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|[^;]*\b(?:UPDATE|DELETE)\b[^;]*)\s+ON\s+(?:TABLE\s+)?public\.${table}\s+TO\s+[^;]*\bauthenticated\b`,
          "i",
        );

        if (
          broadSelect.test(sql) ||
          anonMutation.test(sql) ||
          authenticatedDestructiveMutation.test(sql)
        ) {
          offenders.push(`${name}: ${table}`);
        }
      }
    }

    expect(
      offenders,
      "governance history must remain explicit-column public-read/authenticated-append unless authority is redesigned",
    ).toEqual([]);
  });
});
