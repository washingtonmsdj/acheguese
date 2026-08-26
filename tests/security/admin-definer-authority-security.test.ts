import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

const ADMIN_DEFINERS = [
  "apply_trust_admin_actions",
  "get_community_rpc_operational_metrics",
  "get_community_rpc_slo_status",
  "get_review_aggregates_admin",
  "list_community_social_audit_events",
  "list_federated_moderation_queue",
  "list_trust_admin_actions_admin",
  "list_trust_events_admin",
  "review_trust_events_admin",
] as const;

const CANONICAL_ADMIN_CHECK =
  /private\.is_admin_user\s*\(\s*auth\.uid\s*\(\s*\)\s*\)/i;

function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function latestFunctionDefinition(functionName: string) {
  const marker = `create or replace function public.${functionName.toLowerCase()}(`;
  let latest: { name: string; definition: string } | null = null;

  for (const { name, sql } of migrationFiles()) {
    const lower = sql.toLowerCase();
    let searchFrom = 0;

    while (true) {
      const start = lower.indexOf(marker, searchFrom);
      if (start === -1) break;

      const nextReplace = lower.indexOf("create or replace function ", start + marker.length);
      const nextCreate = lower.indexOf("create function ", start + marker.length);
      const candidates = [nextReplace, nextCreate].filter((index) => index !== -1);
      const end = candidates.length > 0 ? Math.min(...candidates) : sql.length;

      latest = { name, definition: sql.slice(start, end) };
      searchFrom = start + marker.length;
    }
  }

  return latest;
}

describe("administrative SECURITY DEFINER authority", () => {
  it.each(ADMIN_DEFINERS)(
    "%s keeps canonical admin authorization inside the latest definition",
    (functionName) => {
      const latest = latestFunctionDefinition(functionName);

      expect(latest, `${functionName} must remain versioned in migrations`).not.toBeNull();
      expect(latest?.definition, `${functionName} must remain SECURITY DEFINER`).toMatch(
        /security\s+definer/i,
      );
      expect(
        latest?.definition,
        `${functionName} must authorize through private.is_admin_user(auth.uid())`,
      ).toMatch(CANONICAL_ADMIN_CHECK);
    },
  );
});
