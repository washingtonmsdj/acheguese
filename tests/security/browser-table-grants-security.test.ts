import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const BATCH1 = "20260818225113_tighten_browser_table_grants_batch1.sql";
const BATCH2 = "20260818225150_tighten_anon_read_update_grants_batch2.sql";
const FUNCTION_AUDIT =
  "20260819081931_harden_function_audit_browser_write_grants.sql";
const NO_POLICY_TABLES_MIGRATION =
  "20260819082244_revoke_browser_grants_from_no_policy_tables.sql";
const VAGA_APPLICATIONS_HARDENING =
  "20260821001800_restrict_vaga_applications_browser_authority.sql";

const NO_POLICY_TABLES = [
  "analytics_sessions",
  "gastronomy_business_categories",
  "gastronomy_business_tags",
  "gastronomy_businesses",
  "gastronomy_categories",
  "gastronomy_tags",
  "tourist_points_backup",
] as const;

function migrationsFromBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= BATCH1)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

describe("browser table grant hardening", () => {
  it("keeps remote grant-hardening migrations versioned", () => {
    const migrations = migrationsFromBaseline();
    expect(migrations.some(({ name }) => name === BATCH1)).toBe(true);
    expect(migrations.some(({ name }) => name === BATCH2)).toBe(true);
    expect(migrations.some(({ name }) => name === FUNCTION_AUDIT)).toBe(true);
    expect(
      migrations.some(({ name }) => name === NO_POLICY_TABLES_MIGRATION),
    ).toBe(true);
    expect(
      migrations.some(({ name }) => name === VAGA_APPLICATIONS_HARDENING),
    ).toBe(true);

    const batch1 = migrations.find(({ name }) => name === BATCH1)?.sql ?? "";
    const batch2 = migrations.find(({ name }) => name === BATCH2)?.sql ?? "";
    const functionAudit =
      migrations.find(({ name }) => name === FUNCTION_AUDIT)?.sql ?? "";
    const noPolicyTables =
      migrations.find(({ name }) => name === NO_POLICY_TABLES_MIGRATION)?.sql ?? "";
    const vagaApplications =
      migrations.find(({ name }) => name === VAGA_APPLICATIONS_HARDENING)?.sql ?? "";

    expect(batch1).toMatch(/revoke\s+all\s+privileges\s+on\s+table\s+public\.api_cache\s+from\s+anon,\s*authenticated/i);
    expect(batch1).toContain("public.billing_plans");
    expect(batch1).toContain("public.subscription_plans");
    expect(batch1).toContain("public.pii_access_log");
    expect(batch1).toContain("public.profile_audit_log");
    expect(batch1).toContain("public.user_consents");

    expect(batch2).toMatch(/revoke\s+select\s+on\s+table\s+public\.pii_access_log\s+from\s+anon/i);
    expect(batch2).toMatch(/revoke\s+select\s+on\s+table\s+public\.profile_audit_log\s+from\s+anon/i);
    expect(batch2).toMatch(/revoke\s+select,\s*update\s+on\s+table\s+public\.user_consents\s+from\s+anon/i);

    expect(functionAudit).toMatch(
      /revoke\s+insert,\s*update,\s*delete,\s*truncate,\s*references,\s*trigger\s+on\s+table\s+public\.function_audit\s+from\s+anon,\s*authenticated/i,
    );
    expect(functionAudit).toContain(
      "has_table_privilege('service_role','public.function_audit','INSERT')",
    );
    expect(functionAudit).not.toMatch(
      /revoke\s+select\s+on\s+table\s+public\.function_audit/i,
    );

    expect(noPolicyTables).toContain("revoke all privileges on table public.%I from anon, authenticated");
    expect(noPolicyTables).toContain("c.relrowsecurity");
    expect(noPolicyTables).toContain("from pg_policies p");
    for (const table of NO_POLICY_TABLES) {
      expect(noPolicyTables).toContain(`'${table}'`);
    }

    expect(vagaApplications).toMatch(
      /revoke\s+all\s+privileges\s+on\s+table\s+public\.vaga_applications[\s\S]*from\s+public,\s*anon,\s*authenticated/i,
    );
    expect(vagaApplications).toMatch(
      /grant\s+select,\s*insert,\s*update,\s*delete\s+on\s+table\s+public\.vaga_applications[\s\S]*to\s+authenticated/i,
    );
    for (const policy of [
      "vaga_applications_select",
      "vaga_applications_insert",
      "vaga_applications_update",
      "vaga_applications_delete_admin",
    ]) {
      expect(vagaApplications).toMatch(
        new RegExp(
          `alter\\s+policy\\s+"${policy}"[\\s\\S]*?on\\s+public\\.vaga_applications[\\s\\S]*?to\\s+authenticated`,
          "i",
        ),
      );
    }
    expect(vagaApplications).toContain(
      "postcondition failed: anon retains table privileges on vaga_applications",
    );
    expect(vagaApplications).toContain(
      "postcondition failed: vaga_applications policies are not authenticated-only",
    );
  });

  it("does not silently restore browser writes to service-authoritative tables", () => {
    const later = migrationsFromBaseline().filter(
      ({ name }) => name !== BATCH1 && name !== BATCH2,
    );
    const protectedTables = [
      "api_cache",
      "billing_plans",
      "subscription_plans",
      "pii_access_log",
      "profile_audit_log",
      "function_audit",
    ];
    const regressions: string[] = [];

    for (const { name, sql } of later) {
      for (const table of protectedTables) {
        const grant = new RegExp(
          `grant\\s+(?:all(?:\\s+privileges)?|insert|update|delete|truncate|references|trigger)(?:\\s*,[\\s\\w]+)*\\s+on(?:\\s+table)?\\s+public\\.${table}\\s+to\\s+(?:anon|authenticated)`,
          "i",
        );
        if (grant.test(sql)) regressions.push(`${name}: ${table}`);
      }
    }

    expect(regressions, "service-authoritative tables must not regain browser DML").toEqual([]);
  });

  it("does not silently restore any browser grant to RLS-without-policy tables", () => {
    const later = migrationsFromBaseline().filter(
      ({ name }) => name !== BATCH1 && name !== BATCH2,
    );
    const regressions: string[] = [];

    for (const { name, sql } of later) {
      for (const table of NO_POLICY_TABLES) {
        const grant = new RegExp(
          `grant\\s+(?:all(?:\\s+privileges)?|select|insert|update|delete|truncate|references|trigger)(?:\\s*,[\\s\\w]+)*\\s+on(?:\\s+table)?\\s+public\\.${table}\\s+to\\s+(?:anon|authenticated)`,
          "i",
        );
        if (grant.test(sql)) regressions.push(`${name}: ${table}`);
      }
    }

    expect(
      regressions,
      "RLS-without-policy tables must remain unreachable by browser roles until access is explicitly designed",
    ).toEqual([]);
  });

  it("does not silently restore anonymous consent or audit-log grants", () => {
    const later = migrationsFromBaseline().filter(
      ({ name }) => name !== BATCH1 && name !== BATCH2,
    );
    const regressions = later
      .filter(({ sql }) =>
        /grant\s+(?:select|update|all(?:\s+privileges)?)(?:\s*,[\s\w]+)*\s+on(?:\s+table)?\s+public\.(?:pii_access_log|profile_audit_log|user_consents)\s+to\s+anon\b/i.test(sql),
      )
      .map(({ name }) => name);

    expect(regressions, "anonymous grants must remain aligned with authenticated-only RLS policies").toEqual([]);
  });

  it("keeps vaga_applications authenticated-only after the hardening migration", () => {
    const later = migrationsFromBaseline().filter(
      ({ name }) => name > VAGA_APPLICATIONS_HARDENING,
    );
    const regressions: string[] = [];

    for (const { name, sql } of later) {
      if (
        /grant\s+(?:all(?:\s+privileges)?|select|insert|update|delete|truncate|references|trigger|maintain)(?:\s*,[\s\w]+)*\s+on(?:\s+table)?\s+public\.vaga_applications\s+to\s+anon\b/i.test(sql)
      ) {
        regressions.push(`${name}: anonymous table grant`);
      }

      if (
        /grant\s+(?:all(?:\s+privileges)?|truncate|references|trigger|maintain)(?:\s*,[\s\w]+)*\s+on(?:\s+table)?\s+public\.vaga_applications\s+to\s+authenticated\b/i.test(sql)
      ) {
        regressions.push(`${name}: elevated authenticated table grant`);
      }

      if (
        /alter\s+policy\s+"?vaga_applications_(?:select|insert|update|delete_admin)"?[\s\S]*?on\s+public\.vaga_applications[\s\S]*?to\s+(?:public|anon)\b/i.test(sql)
      ) {
        regressions.push(`${name}: anonymous policy role`);
      }
    }

    expect(
      regressions,
      "vaga_applications must remain authenticated-only with CRUD-only browser authority",
    ).toEqual([]);
  });
});
