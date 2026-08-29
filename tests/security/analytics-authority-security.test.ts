import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const BASELINE = "20260818222234_harden_analytics_event_rpc_authority.sql";
const INTERACTION_ENUM_MIGRATION =
  "20260818222702_add_business_interaction_analytics_event_type.sql";
const ANON_SESSION_MIGRATION =
  "20260825201000_require_anonymous_analytics_session.sql";
const READ_AUTHORITY_MIGRATION =
  "20260829164446_repair_analytics_business_read_authority.sql";
const LEGACY_TRACKING_WRAPPER = join(
  ROOT,
  "src",
  "core",
  "analytics",
  "services",
  "AnalyticsService.ts",
);
const CANONICAL_ANALYTICS_SERVICE = join(
  ROOT,
  "src",
  "core",
  "analytics",
  "AnalyticsService.ts",
);
const WORK_OPPORTUNITY_TELEMETRY = join(
  ROOT,
  "src",
  "core",
  "work-opportunities",
  "services",
  "WorkOpportunityTelemetryService.ts",
);

function migrationsFromBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

describe("SEC-006 analytics authority hardening", () => {
  it("keeps the canonical broker hardening migration versioned", () => {
    const baseline = migrationsFromBaseline().find(({ name }) => name === BASELINE);
    expect(baseline, `${BASELINE} must remain versioned`).toBeDefined();

    const sql = baseline?.sql ?? "";
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.track_analytics_event/i);
    expect(sql).toMatch(/security\s+definer/i);
    expect(sql).toContain("search_path to 'pg_catalog', 'public', 'extensions', 'private', 'pg_temp'");
    expect(sql).toContain("analytics_user_spoofing_blocked");
    expect(sql).toContain("analytics_session_not_owned");
    expect(sql).toContain("analytics_rate_limit_exceeded");
    expect(sql).toContain("v_recent_count >= 120");
    expect(sql).toMatch(/revoke\s+insert,\s*update,\s*delete,\s*truncate,\s*references,\s*trigger\s+on\s+table\s+public\.analytics_events\s+from\s+anon,\s*authenticated/i);
    expect(sql).toMatch(/revoke\s+insert,\s*update,\s*delete,\s*truncate,\s*references,\s*trigger\s+on\s+table\s+public\.analytics_sessions\s+from\s+anon,\s*authenticated/i);
    expect(sql).toMatch(/revoke\s+all\s+on\s+function\s+public\.track_analytics_event[\s\S]*from\s+public/i);
    expect(sql).toMatch(/grant\s+execute\s+on\s+function\s+public\.track_analytics_event[\s\S]*to\s+anon,\s*authenticated,\s*service_role/i);
  });

  it("keeps the database enum compatible without requiring a parallel tracking service", () => {
    const migration = migrationsFromBaseline().find(
      ({ name }) => name === INTERACTION_ENUM_MIGRATION,
    );

    expect(
      migration,
      `${INTERACTION_ENUM_MIGRATION} must remain versioned`,
    ).toBeDefined();
    expect(migration?.sql).toMatch(
      /alter\s+type\s+public\.analytics_event_type\s+add\s+value\s+if\s+not\s+exists\s+'business_interaction'/i,
    );
    expect(existsSync(LEGACY_TRACKING_WRAPPER)).toBe(false);
  });

  it("routes active browser telemetry through the canonical analytics service", () => {
    const service = readFileSync(CANONICAL_ANALYTICS_SERVICE, "utf8");
    expect(service).toContain('analyticsDb.rpc<string>("track_analytics_event"');
    expect(service).toContain(
      "const sessionId = input.session_id || this.getSessionId() || null;",
    );
    expect(service).toContain("p_session_id: sessionId");

    const opportunityTelemetry = readFileSync(WORK_OPPORTUNITY_TELEMETRY, "utf8");
    expect(opportunityTelemetry).toContain('from "@/core/analytics"');
    expect(opportunityTelemetry).toContain("AnalyticsService.trackEvent");
    expect(opportunityTelemetry).toContain(
      "session_id: AnalyticsService.getSessionId()",
    );
  });

  it("repairs Business analytics reads through canonical profile management authority", () => {
    const migration = migrationsFromBaseline().find(
      ({ name }) => name === READ_AUTHORITY_MIGRATION,
    );
    expect(
      migration,
      `${READ_AUTHORITY_MIGRATION} must remain versioned`,
    ).toBeDefined();

    const sql = migration?.sql ?? "";
    expect(sql).toContain("private.can_manage_profile(bd.profile_id)");
    expect(sql).toContain("private.is_admin(auth.uid())");
    expect(sql).toContain("TO authenticated");
    expect(sql).toContain("REVOKE SELECT ON TABLE public.analytics_events FROM anon");
    expect(sql).toContain("REVOKE SELECT ON TABLE public.analytics_daily_metrics FROM anon");
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.get_analytics_metrics[\s\S]*FROM PUBLIC/i);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.get_recent_analytics_events[\s\S]*FROM PUBLIC/i);
    expect(sql).not.toContain("business_data.profile_id = auth.uid()");
  });

  it("requires anonymous analytics writes to remain session-bound and rate-limitable", () => {
    const migration = migrationsFromBaseline().find(
      ({ name }) => name === ANON_SESSION_MIGRATION,
    );
    expect(
      migration,
      `${ANON_SESSION_MIGRATION} must remain versioned`,
    ).toBeDefined();

    const sql = migration?.sql ?? "";
    expect(sql).toContain("analytics_session_required");
    expect(sql).toMatch(
      /if\s+not\s+v_is_service_role\s+and\s+v_auth_uid\s+is\s+null\s+and\s+v_session_id\s+is\s+null\s+then/i,
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.track_analytics_event[\s\S]*from\s+public/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.track_analytics_event[\s\S]*to\s+anon,\s*authenticated,\s*service_role/i,
    );
  });

  it("does not silently re-grant direct analytics table DML to browser roles", () => {
    const later = migrationsFromBaseline().filter(({ name }) => name !== BASELINE);
    const regressions: string[] = [];

    for (const { name, sql } of later) {
      for (const table of ["analytics_events", "analytics_sessions"]) {
        const directDmlGrant = new RegExp(
          `grant\\s+(?:all|insert|update|delete|truncate|references|trigger)(?:\\s*,[\\s\\w]+)*\\s+on(?:\\s+table)?\\s+public\\.${table}\\s+to\\s+(?:anon|authenticated)`,
          "i",
        );
        if (directDmlGrant.test(sql)) regressions.push(`${name}: ${table}`);
      }
    }

    expect(
      regressions,
      "browser roles must keep using track_analytics_event instead of direct table DML",
    ).toEqual([]);
  });

  it("does not silently restore PUBLIC execution on the privileged analytics RPC", () => {
    const later = migrationsFromBaseline().filter(({ name }) => name !== BASELINE);
    const regressions = later
      .filter(({ sql }) =>
        /grant\s+execute\s+on\s+function\s+public\.track_analytics_event[\s\S]*?\s+to\s+public\b/i.test(sql),
      )
      .map(({ name }) => name);

    expect(regressions, "PUBLIC must not regain blanket EXECUTE on track_analytics_event").toEqual([]);
  });
});
