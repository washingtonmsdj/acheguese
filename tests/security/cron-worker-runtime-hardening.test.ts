import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926023000_bound_cron_worker_runtime.sql",
  "utf8",
);

const thirtySecondFunctions = [
  "private.process_notification_outbox(integer, text)",
  "private.invoke_emergency_delivery_worker()",
  "private.invoke_media_asset_cleanup()",
];

const sixtySecondFunctions = [
  "private.prune_community_rpc_function_audit(timestamp with time zone, integer, integer)",
  "private.prune_notification_outbox(integer, integer)",
  "private.prune_cron_job_run_details(timestamp with time zone, integer)",
];

describe("pg_cron worker runtime hardening", () => {
  it("bounds minute and HTTP workers to thirty seconds", () => {
    for (const signature of thirtySecondFunctions) {
      expect(migration).toContain(
        `ALTER FUNCTION ${signature}\n  SET statement_timeout = '30s';`,
      );
    }
  });

  it("bounds retention workers to sixty seconds", () => {
    for (const signature of sixtySecondFunctions) {
      expect(migration).toContain(
        `ALTER FUNCTION ${signature}\n  SET statement_timeout = '60s';`,
      );
    }
  });

  it("changes exactly six function timeout settings", () => {
    expect(migration.match(/^ALTER FUNCTION /gm)).toHaveLength(6);
    expect(migration.match(/SET statement_timeout = /g)).toHaveLength(6);
  });

  it("does not change bodies, ownership, grants, security mode, search path, cron schedules, or data", () => {
    expect(migration).not.toMatch(/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+/im);
    expect(migration).not.toMatch(/^\s*ALTER\s+FUNCTION\b.*\bOWNER\s+TO\b/im);
    expect(migration).not.toMatch(/^\s*SECURITY\s+(?:DEFINER|INVOKER)\b/im);
    expect(migration).not.toMatch(/SET\s+search_path\s*=/i);
    expect(migration).not.toMatch(/cron\.(?:schedule|unschedule|alter_job)/i);
    expect(migration).not.toMatch(/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE)\b/im);
  });
});
