import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260819125641_guard_spatial_ref_sys_browser_writes.sql",
);

describe("spatial_ref_sys browser write guard provenance", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("keeps the production guard migration versioned with fail-closed preflight", () => {
    expect(sql).toContain("v_owner IS DISTINCT FROM 'supabase_admin'");
    expect(sql).toContain("v_rls IS DISTINCT FROM false");
    expect(sql).toContain("browser SELECT baseline changed");
    expect(sql).toContain("guard trigger already exists");
  });

  it("uses an invoker trigger function with a fixed search path", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.block_spatial_ref_sys_browser_writes\(\)/i);
    expect(sql).toMatch(/SECURITY INVOKER/i);
    expect(sql).toMatch(/SET search_path = pg_catalog, pg_temp/i);
    expect(sql).toContain("current_user IN ('anon', 'authenticated')");
    expect(sql).toContain("browser writes to spatial_ref_sys are blocked");
  });

  it("keeps both row-DML and truncate guards", () => {
    expect(sql).toMatch(/CREATE TRIGGER block_spatial_ref_sys_browser_dml[\s\S]*BEFORE INSERT OR UPDATE OR DELETE ON public\.spatial_ref_sys/i);
    expect(sql).toMatch(/CREATE TRIGGER block_spatial_ref_sys_browser_truncate[\s\S]*BEFORE TRUNCATE ON public\.spatial_ref_sys/i);
    expect(sql).toContain("v_trigger_count <> 2");
  });

  it("does not expose the trigger function to browser or service roles", () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.block_spatial_ref_sys_browser_writes\(\) FROM PUBLIC, anon, authenticated, service_role/i);
  });

  it("preserves browser SELECT as an explicit compatibility contract", () => {
    expect(sql.match(/has_table_privilege\('anon', 'public\.spatial_ref_sys', 'SELECT'\)/g)?.length).toBe(2);
    expect(sql.match(/has_table_privilege\('authenticated', 'public\.spatial_ref_sys', 'SELECT'\)/g)?.length).toBe(2);
  });
});
