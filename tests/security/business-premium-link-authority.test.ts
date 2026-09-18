import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = resolve(root, "supabase/migrations");
const migrationName =
  "20260918134639_bound_business_premium_link_browser_columns.sql";

const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migration = read(`supabase/migrations/${migrationName}`);
const urlService = read("src/core/business/services/BusinessUrlService.ts");

describe("business premium link authority", () => {
  it("keeps public resolution column-scoped", () => {
    expect(migration).toContain(
      "REVOKE SELECT, INSERT, UPDATE ON TABLE public.business_premium_links",
    );
    expect(migration).toContain("GRANT SELECT (");
    for (const column of [
      "id",
      "business_id",
      "slug",
      "created_at",
      "updated_at",
    ]) {
      expect(migration).toContain(column);
    }
    expect(migration).toContain(
      ") ON TABLE public.business_premium_links\nTO anon, authenticated;",
    );

    expect(urlService).toContain('.from("business_premium_links")');
    expect(urlService).toContain("slug,");
    expect(urlService).not.toMatch(
      /from\(["']business_premium_links["']\)[\s\S]{0,120}\.select\(["']\*["']\)/,
    );
  });

  it("keeps server-owned columns out of owner-supplied mutations", () => {
    expect(migration).toContain(
      "GRANT INSERT (\n  business_id,\n  slug\n) ON TABLE public.business_premium_links",
    );
    expect(migration).toContain(
      "GRANT UPDATE (\n  slug\n) ON TABLE public.business_premium_links",
    );
    expect(migration).toContain(
      "GRANT ALL PRIVILEGES ON TABLE public.business_premium_links\nTO service_role;",
    );

    for (const column of ["id", "created_at", "updated_at"]) {
      expect(migration).toContain(
        `has_column_privilege('authenticated', 'public.business_premium_links', '${column}', 'INSERT')`,
      );
      expect(migration).toContain(
        `has_column_privilege('authenticated', 'public.business_premium_links', '${column}', 'UPDATE')`,
      );
    }

    expect(migration).toContain(
      "has_column_privilege('authenticated', 'public.business_premium_links', 'business_id', 'UPDATE')",
    );
  });

  it("keeps the current browser runtime read-only for premium links", () => {
    const runtimeWrite = /\.from\(["']business_premium_links["']\)[\s\S]{0,180}\.(?:insert|update|upsert|delete)\s*\(/m;
    expect(runtimeWrite.test(urlService)).toBe(false);
  });

  it("prevents later table-wide browser grants from reopening the boundary", () => {
    const regressions: string[] = [];
    const later = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql") && name > migrationName)
      .sort();

    for (const name of later) {
      const sql = readFileSync(resolve(migrationsDir, name), "utf8");

      if (
        /GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|SELECT|INSERT|UPDATE)\s+ON\s+(?:TABLE\s+)?public\.business_premium_links\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        regressions.push(`${name}: table-wide browser grant`);
      }
    }

    expect(regressions).toEqual([]);
  });
});
