import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

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

describe("track_analytics_event authority boundary", () => {
  it("keeps anonymous analytics session-bound and blocks identity spoofing", () => {
    const latest = latestFunctionDefinition("track_analytics_event");

    expect(latest, "track_analytics_event must remain versioned in migrations").not.toBeNull();
    expect(latest?.definition).toMatch(/security\s+definer/i);
    expect(latest?.definition).toMatch(/v_auth_uid\s+uuid\s*:=\s*auth\.uid\s*\(\s*\)/i);
    expect(latest?.definition).toMatch(/analytics_session_required/i);
    expect(latest?.definition).toMatch(/analytics_user_spoofing_blocked/i);
    expect(latest?.definition).toMatch(/analytics_session_not_owned/i);
  });

  it("keeps operational events service-role only and strips client network telemetry", () => {
    const latest = latestFunctionDefinition("track_analytics_event");

    expect(latest).not.toBeNull();
    expect(latest?.definition).toMatch(/analytics_operational_event_requires_service_role/i);
    expect(latest?.definition).toMatch(/case\s+when\s+v_is_service_role\s+then\s+p_ip_address\s+else\s+null\s+end/i);
    expect(latest?.definition).toMatch(/case\s+when\s+v_is_service_role\s+then\s+p_user_agent\s+else\s+null\s+end/i);
    expect(latest?.definition).toMatch(/case\s+when\s+v_is_service_role\s+then\s+p_referrer\s+else\s+null\s+end/i);
    expect(latest?.definition).toMatch(/analytics_rate_limit_exceeded/i);
  });
});
