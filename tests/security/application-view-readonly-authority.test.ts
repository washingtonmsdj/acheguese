import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE = "20260830055257_lock_application_views_to_read_only.sql";
const LOCKED_VIEWS = [
  "active_user_consents",
  "addresses_public",
  "analytics_kpis",
  "community_alerts_public",
  "community_issues_public",
  "driver_complete_profile",
  "function_audit_stats",
  "locations_coordinates_status",
  "personal_social_profiles",
  "pii_access_stats",
  "public_profile_links",
  "public_profiles",
  "public_work_opportunity_search",
  "user_companies",
  "user_organizations",
  "user_professional_profiles",
] as const;

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS, name), "utf8") }));
}

describe("G5 application view read-only authority", () => {
  it("locks the application-owned view set without touching extension views", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    for (const view of LOCKED_VIEWS) expect(sql).toContain(`'${view}'`);
    expect(sql).toContain("v_owner <> 'postgres' OR v_extension_owned");
    expect(sql).toContain("v_rule_count <> 0 OR v_trigger_count <> 0");
    expect(sql).toContain("REVOKE INSERT, UPDATE, DELETE ON TABLE public.%I");
    expect(sql).not.toContain("'geometry_columns'");
    expect(sql).not.toContain("'geography_columns'");
  });

  it("rejects future browser DML grants on the locked application views", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      for (const view of LOCKED_VIEWS) {
        const grantsBrowserDml = new RegExp(
          String.raw`GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|[^;]*\b(?:INSERT|UPDATE|DELETE)\b[^;]*)\s+ON\s+(?:TABLE\s+)?(?:public\.)?${view}\s+TO\s+[^;]*(?:\bPUBLIC\b|\banon\b|\bauthenticated\b)`,
          "i",
        );
        if (grantsBrowserDml.test(sql)) offenders.push(`${name}: ${view}`);
      }
    }

    expect(
      offenders,
      "application read-model views must not regain browser DML without an explicit architecture decision",
    ).toEqual([]);
  });
});
