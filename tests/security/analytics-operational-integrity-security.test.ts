import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const TRACK_ANALYTICS_DEFINITION =
  /create\s+or\s+replace\s+function\s+public\.track_analytics_event\s*\(/i;

function migrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function latestTrackAnalyticsMigration() {
  return migrations()
    .filter(({ sql }) => TRACK_ANALYTICS_DEFINITION.test(sql))
    .at(-1);
}

describe("analytics operational integrity boundary", () => {
  it("keeps operational lifecycle events trusted-server only", () => {
    const latest = latestTrackAnalyticsMigration();
    expect(latest, "track_analytics_event must remain versioned").toBeDefined();

    const sql = latest?.sql ?? "";
    expect(sql).toContain("analytics_operational_event_requires_service_role");

    for (const eventType of [
      "order_started",
      "order_completed",
      "order_cancelled",
      "delivery_requested",
      "delivery_completed",
    ]) {
      expect(sql).toContain(`'${eventType}'::public.analytics_event_type`);
    }

    expect(sql).toMatch(/if\s+not\s+v_is_service_role[\s\S]*p_event_type\s+in\s*\(/i);
    expect(sql).toMatch(/using\s+errcode\s*=\s*'42501'/i);
  });

  it("neutralizes browser-declared network and geolocation fields", () => {
    const latest = latestTrackAnalyticsMigration();
    expect(latest, "track_analytics_event must remain versioned").toBeDefined();

    const sql = latest?.sql ?? "";
    for (const field of [
      "p_ip_address",
      "p_user_agent",
      "p_referrer",
      "p_latitude",
      "p_longitude",
    ]) {
      expect(sql).toContain(
        `CASE WHEN v_is_service_role THEN ${field} ELSE NULL END`,
      );
    }
  });

  it("keeps privileged execution explicit instead of default PUBLIC", () => {
    const latest = latestTrackAnalyticsMigration();
    expect(latest, "track_analytics_event must remain versioned").toBeDefined();

    const sql = latest?.sql ?? "";
    expect(sql).toMatch(/security\s+definer/i);
    expect(sql).toContain(
      "SET search_path TO 'pg_catalog', 'public', 'extensions', 'private', 'pg_temp'",
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.track_analytics_event[\s\S]*?from\s+public/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.track_analytics_event[\s\S]*?to\s+anon,\s*authenticated,\s*service_role/i,
    );
  });

  it("does not let later migrations silently weaken the latest analytics broker", () => {
    const allMigrations = migrations();
    const latest = latestTrackAnalyticsMigration();
    expect(latest, "track_analytics_event must remain versioned").toBeDefined();
    if (!latest) return;

    const latestIndex = allMigrations.findIndex(({ name }) => name === latest.name);
    const laterMigrations = allMigrations.slice(latestIndex + 1);
    const regressions = laterMigrations
      .filter(({ sql }) =>
        /grant\s+execute\s+on\s+function\s+public\.track_analytics_event[\s\S]*?\s+to\s+public\b/i.test(
          sql,
        ),
      )
      .map(({ name }) => name);

    expect(
      regressions,
      "later migrations must not restore blanket PUBLIC execution on track_analytics_event",
    ).toEqual([]);
  });
});
