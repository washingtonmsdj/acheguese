import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const BASELINE = "20260826033134_restrict_module_rollout_audit_columns.sql";

// Live production audit on 2026-08-26 classified these application-owned
// SECURITY DEFINER endpoints as intentionally anonymous. Extension-owned
// PostGIS functions are deliberately outside this migration-level allowlist.
const ALLOWED_ANON_DEFINERS = new Set([
  "public.get_community_poll_for_post(uuid)",
  "public.get_professional_trust_reputation(uuid)",
  "public.get_ride_rating_summary(uuid)",
  "public.get_shared_ride_safety_data(text)",
  "public.profile_public_territory_projection(uuid)",
  "public.track_analytics_event(text,uuid,public.analytics_event_type,public.analytics_event_source,uuid,text,inet,text,text,numeric,numeric,jsonb)",
]);

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function normalizeSignature(raw: string): string {
  return raw
    .replace(/\s+/g, "")
    .replace(/\"/g, "")
    .toLowerCase();
}

function anonFunctionGrants(sql: string): string[] {
  const grants: string[] = [];
  const grantPattern =
    /grant\s+execute\s+on\s+function\s+([^;]+?)\s+to\s+([^;]+);/gis;

  for (const match of sql.matchAll(grantPattern)) {
    const roles = match[2]
      .split(",")
      .map((role) => role.trim().replace(/\"/g, "").toLowerCase());
    if (!roles.includes("anon")) continue;

    for (const signature of match[1].split(/,(?=\s*(?:public\.)?[a-z_][a-z0-9_]*\s*\()/i)) {
      grants.push(normalizeSignature(signature));
    }
  }

  return grants;
}

describe("anonymous SECURITY DEFINER allowlist", () => {
  it("keeps the audited public-definer surface explicit", () => {
    expect([...ALLOWED_ANON_DEFINERS].map(normalizeSignature).sort()).toEqual([
      "public.get_community_poll_for_post(uuid)",
      "public.get_professional_trust_reputation(uuid)",
      "public.get_ride_rating_summary(uuid)",
      "public.get_shared_ride_safety_data(text)",
      "public.profile_public_territory_projection(uuid)",
      "public.track_analytics_event(text,uuid,public.analytics_event_type,public.analytics_event_source,uuid,text,inet,text,text,numeric,numeric,jsonb)",
    ].sort());
  });

  it("rejects future blanket anonymous execution grants", () => {
    const offenders = migrationsAfterBaseline()
      .filter(({ sql }) =>
        /grant\s+execute\s+on\s+all\s+functions\s+in\s+schema\s+(?:public|private)\s+to\s+[^;]*\banon\b/i.test(
          sql,
        ),
      )
      .map(({ name }) => name);

    expect(
      offenders,
      "anon must never receive blanket EXECUTE over application schemas",
    ).toEqual([]);
  });

  it("rejects future anonymous function grants outside the audited allowlist", () => {
    const allowed = new Set([...ALLOWED_ANON_DEFINERS].map(normalizeSignature));
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      for (const signature of anonFunctionGrants(sql)) {
        if (!allowed.has(signature)) {
          offenders.push(`${name}: ${signature}`);
        }
      }
    }

    expect(
      offenders,
      "new anon EXECUTE grants require explicit security review and allowlist update",
    ).toEqual([]);
  });

  it("rejects PUBLIC execution grants after the audited baseline", () => {
    const offenders = migrationsAfterBaseline()
      .filter(({ sql }) =>
        /grant\s+execute\s+on\s+(?:function|all\s+functions\s+in\s+schema)[\s\S]*?\s+to\s+public\b/i.test(
          sql,
        ),
      )
      .map(({ name }) => name);

    expect(
      offenders,
      "PUBLIC must not regain executable privileged application APIs",
    ).toEqual([]);
  });
});
