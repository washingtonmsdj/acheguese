import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const RLS_INITPLAN_CUTOVER_VERSION = "20260831032111";
const MIGRATION_NAME_PATTERN = /^(\d+)_.*\.sql$/;

function stripSqlComments(content: string): string {
  return content.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function validateRlsAuthInitPlan(fileName: string, rawContent: string): string[] {
  const version = fileName.match(MIGRATION_NAME_PATTERN)?.[1];
  if (!version || version < RLS_INITPLAN_CUTOVER_VERSION) return [];

  const content = stripSqlComments(rawContent);
  const policyStatements =
    content.match(/\b(?:CREATE|ALTER)\s+POLICY\b[\s\S]*?;/gi) ?? [];
  const violations: string[] = [];

  for (const statement of policyStatements) {
    const withoutInitPlanCalls = statement.replace(
      /\(\s*SELECT\s+auth\.(?:uid|role|jwt)\(\)\s*\)/gi,
      "(AUTH_INITPLAN)",
    );

    if (/\bauth\.(?:uid|role|jwt)\(\)/i.test(withoutInitPlanCalls)) {
      const policyName =
        statement.match(/\b(?:CREATE|ALTER)\s+POLICY\s+([^\s;]+)/i)?.[1] ??
        "unknown_policy";
      violations.push(
        `${fileName}: ${policyName} calls an auth helper directly; wrap it in (SELECT auth.*()) so PostgreSQL can evaluate it as an InitPlan`,
      );
    }
  }

  return violations;
}

describe("G5 RLS auth InitPlan ratchet", () => {
  it("keeps future RLS policies on the InitPlan form for auth helpers", () => {
    const violations = readdirSync(MIGRATIONS_DIR)
      .filter((fileName) => fileName.endsWith(".sql"))
      .flatMap((fileName) =>
        validateRlsAuthInitPlan(
          fileName,
          readFileSync(join(MIGRATIONS_DIR, fileName), "utf8"),
        ),
      );

    expect(violations).toEqual([]);
  });

  it("rejects direct auth helper evaluation in future policies", () => {
    const violations = validateRlsAuthInitPlan(
      "20260831032112_bad_policy.sql",
      `
        CREATE POLICY bad_owner_read
          ON public.example
          FOR SELECT
          TO authenticated
          USING (owner_user_id = auth.uid());
      `,
    );

    expect(violations.join("\n")).toMatch(/InitPlan/);
  });

  it("accepts canonical InitPlan-wrapped auth helpers", () => {
    const violations = validateRlsAuthInitPlan(
      "20260831032113_good_policy.sql",
      `
        ALTER POLICY owner_read
          ON public.example
          USING (
            owner_user_id = (SELECT auth.uid())
            OR ((SELECT auth.jwt()) ->> 'role') = 'service_role'
          );
      `,
    );

    expect(violations).toEqual([]);
  });
});
