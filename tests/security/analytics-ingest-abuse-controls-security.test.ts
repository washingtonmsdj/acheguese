import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const MIGRATION = join(
  ROOT,
  "supabase",
  "migrations",
  "20260926011000_harden_analytics_ingest_abuse_controls.sql",
);
const sql = readFileSync(MIGRATION, "utf8");

describe("analytics public-ingest abuse controls", () => {
  it("keeps rate-limit state private and unreachable by browser roles", () => {
    expect(sql).toMatch(
      /create\s+table\s+if\s+not\s+exists\s+private\.analytics_ingest_rate_limits/i,
    );
    expect(sql).toMatch(
      /primary\s+key\s*\(scope,\s*bucket_key\)/i,
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+table\s+private\.analytics_ingest_rate_limits[\s\S]*from\s+public,\s*anon,\s*authenticated,\s*service_role/i,
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+private\.consume_analytics_ingest_rate_limit[\s\S]*from\s+public,\s*anon,\s*authenticated,\s*service_role/i,
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+private\.enforce_analytics_ingest_rate_limits[\s\S]*from\s+public,\s*anon,\s*authenticated,\s*service_role/i,
    );
  });

  it("derives the network identity from PostgREST headers instead of caller input", () => {
    expect(sql).toContain("current_setting('request.headers', true)");
    expect(sql).toContain("x-forwarded-for");
    expect(sql).toMatch(/split_part\(v_forwarded_for,\s*',',\s*1\)/i);
    expect(sql).toContain("analytics_client_ip_unavailable");
    expect(sql).toContain("analytics_client_ip_invalid");
    expect(sql).toMatch(/family\(v_client_ip\)\s+when\s+6\s+then\s+64\s+else\s+32/i);
    expect(sql).not.toMatch(
      /enforce_analytics_ingest_rate_limits\s*\([^)]*p_ip_address/i,
    );
  });

  it("closes session rotation for both anonymous and authenticated callers", () => {
    expect(sql).toMatch(
      /consume_analytics_ingest_rate_limit\(\s*'network'[\s\S]*?240\s*\)/i,
    );
    expect(sql).toMatch(
      /if\s+p_auth_uid\s+is\s+not\s+null[\s\S]*?consume_analytics_ingest_rate_limit\(\s*'user'[\s\S]*?120\s*\)/i,
    );
    expect(sql).toMatch(
      /elsif\s+p_session_id\s+is\s+not\s+null[\s\S]*?consume_analytics_ingest_rate_limit\(\s*'session'[\s\S]*?120\s*\)/i,
    );
    expect(sql).toMatch(
      /perform\s+private\.enforce_analytics_ingest_rate_limits\(v_auth_uid,\s*v_session_id\)/i,
    );
  });

  it("uses an atomic bounded counter instead of scanning analytics_events per request", () => {
    expect(sql).toMatch(/on\s+conflict\s*\(scope,\s*bucket_key\)\s+do\s+update/i);
    expect(sql).toContain("interval '1 minute'");

    const functionStart = sql.toLowerCase().indexOf(
      "create or replace function public.track_analytics_event(",
    );
    expect(functionStart).toBeGreaterThanOrEqual(0);
    const trackDefinition = sql.slice(functionStart);
    expect(trackDefinition).not.toMatch(
      /select\s+count\(\*\)[\s\S]*?from\s+public\.analytics_events/i,
    );
    expect(trackDefinition).not.toContain("v_recent_count");
  });

  it("keeps privileged telemetry fields service-role only", () => {
    expect(sql).toMatch(
      /case\s+when\s+v_is_service_role\s+then\s+p_ip_address\s+else\s+null\s+end/i,
    );
    expect(sql).toMatch(
      /case\s+when\s+v_is_service_role\s+then\s+p_user_agent\s+else\s+null\s+end/i,
    );
    expect(sql).toContain("analytics_operational_event_requires_service_role");
    expect(sql).toContain("analytics_user_spoofing_blocked");
    expect(sql).toContain("analytics_session_not_owned");
  });

  it("bounds stale limiter state without adding a hot cleanup loop", () => {
    expect(sql).toContain("updated_at < clock_timestamp() - interval '24 hours'");
    expect(sql).toContain("p_batch_size integer DEFAULT 5000");
    expect(sql).toContain("acheguese-analytics-ingest-rate-limit-retention");
    expect(sql).toContain("'47 * * * *'");
  });

  it("preserves explicit least-privilege execution grants", () => {
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.track_analytics_event[\s\S]*?from\s+public/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.track_analytics_event[\s\S]*?to\s+anon,\s*authenticated,\s*service_role/i,
    );
  });
});
