import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("business_data grants security", () => {
  it("keeps broad business_data writes out of anon/authenticated Data API grants", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707162026_harden_business_data_column_grants.sql",
    );
    const adminService = readProjectFile("src/core/admin/services/AdminBusinessService.ts");
    const adminFunction = readProjectFile("supabase/functions/admin-business-rpc/index.ts");

    expect(migration).toContain("REVOKE ALL ON TABLE public.business_data FROM anon");
    expect(migration).toContain("GRANT SELECT ON TABLE public.business_data TO anon");
    expect(migration).toContain("REVOKE ALL ON TABLE public.business_data FROM authenticated");
    expect(migration).toContain("GRANT SELECT ON TABLE public.business_data TO authenticated");
    expect(migration).toContain("GRANT INSERT (");
    expect(migration).toContain("GRANT UPDATE (");
    expect(migration).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*is_verified/);
    expect(migration).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*is_premium/);
    expect(migration).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*favorites_count/);
    expect(migration).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*recommendations_count/);
    expect(migration).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*rating/);
    expect(migration).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*total_reviews/);
    expect(migration).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*total_products/);
    expect(migration).not.toContain("GRANT DELETE ON TABLE public.business_data TO authenticated");
    expect(migration).not.toContain("GRANT TRUNCATE ON TABLE public.business_data");

    expect(adminService).toContain('supabase.functions.invoke("admin-business-rpc"');
    expect(adminService).not.toContain("BusinessService.updateBusiness(id, { is_verified");
    expect(adminService).not.toContain("BusinessService.updateBusiness(id, { is_premium");

    expect(adminFunction).toContain("requireAdmin(req)");
    expect(adminFunction).toContain("setVerification");
    expect(adminFunction).toContain("setPremium");
    expect(adminFunction).toContain('from("business_data")');
    expect(adminFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
