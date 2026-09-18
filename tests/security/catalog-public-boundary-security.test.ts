import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = resolve(root, "supabase/migrations");
const migrationName =
  "20260918123823_harden_catalog_eligibility_entitlement_boundary.sql";

const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = read(`supabase/migrations/${migrationName}`);
const catalogService = read("src/core/billing/services/CatalogService.ts");

describe("catalog public boundary", () => {
  it("keeps commercial eligibility server-owned", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Anyone can view eligibility rules"',
    );
    expect(migration).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.catalog_eligibility_rule",
    );
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain(
      "GRANT ALL PRIVILEGES ON TABLE public.catalog_eligibility_rule",
    );
    expect(migration).toContain("TO service_role");
    expect(migration).toContain(
      "browser eligibility read authority remains",
    );

    expect(catalogService).not.toContain("catalog_eligibility_rule");
  });

  it("limits browser entitlements to published catalog items", () => {
    expect(migration).toContain(
      "CREATE POLICY catalog_entitlement_policy_published_read",
    );
    expect(migration).toContain("FOR SELECT TO anon, authenticated");
    expect(migration).toContain(
      "item.id = catalog_entitlement_policy.catalog_item_id",
    );
    expect(migration).toContain(
      "version.status = 'published'::public.catalog_status",
    );
    expect(migration).not.toMatch(
      /CREATE POLICY\s+"?Anyone can view entitlement policies"?[\s\S]*?USING\s*\(\s*true\s*\)/i,
    );
    expect(migration).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.catalog_entitlement_policy",
    );
    expect(migration).toContain("GRANT SELECT (");
    expect(migration).toContain(
      ")\nON public.catalog_entitlement_policy\nTO anon, authenticated;",
    );
  });

  it("keeps browser entitlement columns aligned with CatalogService", () => {
    for (const column of [
      "can_use_premium_public_page",
      "can_use_short_premium_link",
      "can_use_custom_qr_code",
      "can_use_advanced_menu",
      "can_receive_internal_orders",
      "can_use_motoboy_network",
      "can_use_promotions",
      "can_use_basic_analytics",
      "can_use_advanced_analytics",
      "max_menu_items",
      "max_promotions",
      "max_images",
      "max_categories",
      "max_orders_per_day",
      "additional_entitlements",
    ]) {
      expect(migration).toContain(column);
      expect(catalogService).toContain(column);
    }

    expect(migration).not.toMatch(
      /GRANT SELECT \([\s\S]*?\bcreated_at\b[\s\S]*?\)\s*ON public\.catalog_entitlement_policy/i,
    );
    expect(migration).not.toMatch(
      /GRANT SELECT \([\s\S]*?\bupdated_at\b[\s\S]*?\)\s*ON public\.catalog_entitlement_policy/i,
    );
  });

  it("prevents later migrations from reopening the reviewed browser boundary", () => {
    const later = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql") && name > migrationName)
      .sort();

    const regressions: string[] = [];

    for (const name of later) {
      const sql = readFileSync(resolve(migrationsDir, name), "utf8");

      if (
        /GRANT\s+(?:SELECT|ALL(?:\s+PRIVILEGES)?)\s+ON\s+(?:TABLE\s+)?public\.catalog_eligibility_rule\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        regressions.push(`${name}: eligibility browser SELECT`);
      }

      if (
        /CREATE\s+POLICY[\s\S]{0,240}ON\s+public\.catalog_entitlement_policy[\s\S]{0,240}FOR\s+SELECT[\s\S]{0,240}USING\s*\(\s*true\s*\)/i.test(
          sql,
        )
      ) {
        regressions.push(`${name}: broad entitlement SELECT policy`);
      }

      if (
        /GRANT\s+SELECT\s+ON\s+(?:TABLE\s+)?public\.catalog_entitlement_policy\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        regressions.push(`${name}: table-wide entitlement SELECT`);
      }
    }

    expect(regressions).toEqual([]);
  });
});
