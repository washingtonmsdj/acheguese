import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = resolve(ROOT, "supabase/migrations");
const BASELINE =
  "20260830062051_consolidate_profile_username_history_trigger.sql";
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G5 profile username history authority", () => {
  it("consolidates username audit to one trigger-only writer", () => {
    const sql = read(`supabase/migrations/${BASELINE}`);

    expect(sql).toContain(
      "DROP TRIGGER IF EXISTS log_username_change_trigger ON public.profiles",
    );
    expect(sql).toContain("DROP FUNCTION IF EXISTS public.log_username_change()");
    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.fn_record_profile_username_history()",
    );
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = public, pg_temp");
    expect(sql).toContain(
      "CREATE TRIGGER trg_record_profile_username_history",
    );
    expect(sql).toContain("WHEN (OLD.username IS DISTINCT FROM NEW.username)");
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.fn_record_profile_username_history()",
    );
    expect(sql).toContain("FROM PUBLIC, anon, authenticated, service_role");
  });

  it("records first assignment/removal without violating string history columns", () => {
    const sql = read(`supabase/migrations/${BASELINE}`);
    const policy = read(
      "src/core/public-identity/policies/ProfileIdentityPolicy.ts",
    );
    const adapter = read(
      "src/core/public-identity/adapters/ProfileIdentityAdapter.ts",
    );

    expect(sql).toContain("COALESCE(OLD.username, '')");
    expect(sql).toContain("COALESCE(NEW.username, '')");
    expect(sql).toContain("THEN 'user_requested'");
    expect(sql).toContain("ELSE 'admin_action'");
    expect(sql).toContain(
      "CHECK (change_reason IN ('user_requested', 'admin_action', 'policy_violation', 'territory_changed'))",
    );
    expect(policy).toContain("readonly cooldownDays = 30");
    expect(adapter).toContain("reason: record.change_reason as ChangeReason");
  });

  it("rejects resurrection of the obsolete writer or direct trigger execution", () => {
    const offenders: string[] = [];
    const later = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith(".sql") && name > BASELINE)
      .sort();

    for (const name of later) {
      const sql = readFileSync(join(MIGRATIONS, name), "utf8");
      if (
        /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?log_username_change\s*\(/i.test(
          sql,
        ) ||
        /CREATE\s+TRIGGER\s+log_username_change_trigger\b/i.test(sql) ||
        /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.fn_record_profile_username_history\s*\(\s*\)\s+TO\s+[^;]*(?:\bPUBLIC\b|\banon\b|\bauthenticated\b|\bservice_role\b)/i.test(
          sql,
        )
      ) {
        offenders.push(name);
      }
    }

    expect(
      offenders,
      "profile username history must keep one trigger-only writer",
    ).toEqual([]);
  });
});
