import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const BASELINE = "20260825172740_remove_legacy_ad_public_select_shadow.sql";

const SENSITIVE_TABLES = [
  "ad_campaigns",
  "ad_targets",
  "addresses",
  "driver_availability",
  "driver_data",
  "driver_locations",
  "driver_profiles",
  "event_review_helpfulness",
  "profile_favorites_new",
  "profile_members",
  "question_answer_likes",
  "issue_blocked_terms",
] as const;

const REMOVED_PERMISSIVE_POLICIES = [
  "public_read_active_campaigns",
  "public_read_active_campaign_targets",
  "Addresses viewable by all",
  "Driver data viewable",
  "driver_locations_select_policy",
  "Public can read online drivers",
  "Anyone can read driver profiles",
  "Event review helpfulness is visible to authenticated users",
  "Anyone can read favorites",
  "Answer likes viewable by authenticated",
  "Members viewable by authenticated",
  "Owners manage members",
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSql(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/\s+/g, " ").trim();
}

function createPolicyStatements(sql: string): string[] {
  return normalizeSql(sql).match(/create\s+policy\s+[\s\S]*?;/gi) ?? [];
}

function sensitiveTableFor(statement: string): string | null {
  for (const table of SENSITIVE_TABLES) {
    const onTable = new RegExp(
      `\\bon\\s+(?:public\\.)?["']?${escapeRegex(table)}["']?\\b`,
      "i",
    );
    if (onTable.test(statement)) return table;
  }
  return null;
}

function policyCommand(statement: string): string {
  return statement.match(/\bfor\s+(select|insert|update|delete|all)\b/i)?.[1]?.toLowerCase() ?? "all";
}

function targetsClientRoles(statement: string): boolean {
  const roles = statement.match(/\bto\s+(.+?)(?=\s+using\b|\s+with\s+check\b|;)/i)?.[1];
  if (!roles) return true; // PostgreSQL defaults TO PUBLIC.
  return /\b(public|anon|authenticated)\b/i.test(roles);
}

function hasBroadPredicate(statement: string, clause: "using" | "with check"): boolean {
  const marker = clause === "using" ? "using" : "with\\s+check";
  const broad = new RegExp(
    `\\b${marker}\\s*\\(\\s*(?:true|auth\\.uid\\(\\)\\s+is\\s+not\\s+null|\\(\\s*select\\s+auth\\.uid\\(\\)\\s*\\)\\s+is\\s+not\\s+null)\\s*\\)`,
    "i",
  );
  return broad.test(statement);
}

function hasClause(statement: string, clause: "using" | "with check"): boolean {
  return clause === "using"
    ? /\busing\s*\(/i.test(statement)
    : /\bwith\s+check\s*\(/i.test(statement);
}

describe("sensitive RLS policy regression guard", () => {
  it("keeps the advertising shadow-removal baseline versioned", () => {
    const baseline = migrationsFromBaseline().find(({ name }) => name === BASELINE);
    expect(baseline, `${BASELINE} must remain versioned`).toBeDefined();
    expect(baseline?.sql).toContain("DROP POLICY IF EXISTS public_read_active_campaigns");
    expect(baseline?.sql).toContain("DROP POLICY IF EXISTS public_read_active_campaign_targets");
  });

  it("does not recreate known permissive policies after hardening", () => {
    const regressions: string[] = [];

    for (const { name, sql } of migrationsFromBaseline()) {
      for (const policy of REMOVED_PERMISSIVE_POLICIES) {
        const createPolicy = new RegExp(
          `create\\s+policy\\s+["']?${escapeRegex(policy)}["']?`,
          "i",
        );
        if (createPolicy.test(sql)) regressions.push(`${name}: ${policy}`);
      }
    }

    expect(
      regressions,
      "known permissive policies must not be reintroduced without explicit security review",
    ).toEqual([]);
  });

  it("fails closed for new client-facing policies on sensitive tables", () => {
    const regressions: string[] = [];

    for (const { name, sql } of migrationsFromBaseline()) {
      for (const statement of createPolicyStatements(sql)) {
        const table = sensitiveTableFor(statement);
        if (!table || !targetsClientRoles(statement)) continue;

        const command = policyCommand(statement);
        const requiresUsing = ["select", "update", "delete", "all"].includes(command);
        const requiresWithCheck = command === "insert";

        if (requiresUsing && !hasClause(statement, "using")) {
          regressions.push(`${name}: ${table} ${command} defaults USING to true`);
          continue;
        }

        if (requiresWithCheck && !hasClause(statement, "with check")) {
          regressions.push(`${name}: ${table} insert defaults WITH CHECK to true`);
          continue;
        }

        if (hasBroadPredicate(statement, "using")) {
          regressions.push(`${name}: ${table} ${command} has a broad USING predicate`);
        }
        if (hasBroadPredicate(statement, "with check")) {
          regressions.push(`${name}: ${table} ${command} has a broad WITH CHECK predicate`);
        }
      }
    }

    expect(
      regressions,
      "client-facing RLS on sensitive tables must remain row-authorized instead of role-only/broad",
    ).toEqual([]);
  });
});
