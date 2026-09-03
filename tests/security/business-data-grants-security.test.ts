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
  it("keeps broad business_data writes out of browser Data API grants", () => {
    const historicalWriteBoundary = readProjectFile(
      "supabase/migrations/20260707162026_harden_business_data_column_grants.sql",
    );
    const adminService = readProjectFile("src/core/admin/services/AdminBusinessService.ts");
    const adminFunction = readProjectFile("supabase/functions/admin-business-rpc/index.ts");

    expect(historicalWriteBoundary).toContain(
      "REVOKE ALL ON TABLE public.business_data FROM authenticated",
    );
    expect(historicalWriteBoundary).toContain("GRANT INSERT (");
    expect(historicalWriteBoundary).toContain("GRANT UPDATE (");
    expect(historicalWriteBoundary).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*is_verified/);
    expect(historicalWriteBoundary).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*is_premium/);
    expect(historicalWriteBoundary).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*favorites_count/);
    expect(historicalWriteBoundary).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*recommendations_count/);
    expect(historicalWriteBoundary).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*rating/);
    expect(historicalWriteBoundary).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*total_reviews/);
    expect(historicalWriteBoundary).not.toMatch(/GRANT (?:INSERT|UPDATE) \([\s\S]*total_products/);
    expect(historicalWriteBoundary).not.toContain(
      "GRANT DELETE ON TABLE public.business_data TO authenticated",
    );
    expect(historicalWriteBoundary).not.toContain(
      "GRANT TRUNCATE ON TABLE public.business_data",
    );

    expect(adminService).toContain("invokeSupabaseBrokerCommand");
    expect(adminService).toContain('functionName: "admin-business-rpc"');
    expect(adminService).not.toContain("BusinessService.updateBusiness(id, { is_verified");
    expect(adminService).not.toContain("BusinessService.updateBusiness(id, { is_premium");

    expect(adminFunction).toContain("requireAdmin(req)");
    expect(adminFunction).toContain("setVerification");
    expect(adminFunction).toContain("setPremium");
    expect(adminFunction).toContain('from("business_data")');
    expect(adminFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("keeps public business discovery on a sanitized read-only projection", () => {
    const privacyBoundary = readProjectFile(
      "supabase/migrations/20260825233458_isolate_public_business_catalog.sql",
    );
    const readModelBoundary = readProjectFile(
      "supabase/migrations/20260826003019_replace_public_business_search_with_read_model.sql",
    );
    const facade = readProjectFile("src/core/business/services/BusinessService.ts");

    expect(privacyBoundary).toContain(
      "WITH (security_barrier = true, security_invoker = false)",
    );
    expect(privacyBoundary).toContain("REVOKE ALL ON TABLE public.business_data FROM anon");
    expect(privacyBoundary).toContain(
      "GRANT SELECT ON TABLE public.public_business_search TO anon, authenticated",
    );
    expect(privacyBoundary).toContain('DROP POLICY IF EXISTS "Active businesses viewable"');
    expect(privacyBoundary).toContain('CREATE POLICY "business_data_private_read"');
    expect(privacyBoundary).toContain("private.auth_can_access_profile(profile_id)");

    expect(readModelBoundary).toContain(
      "DROP VIEW IF EXISTS public.public_business_search RESTRICT",
    );
    expect(readModelBoundary).toContain(
      "CREATE TABLE public.public_business_search",
    );
    expect(readModelBoundary).toContain(
      "ALTER TABLE public.public_business_search ENABLE ROW LEVEL SECURITY",
    );
    expect(readModelBoundary).toContain(
      'CREATE POLICY "public_business_search_public_read"',
    );
    expect(readModelBoundary).toContain(
      "GRANT SELECT ON TABLE public.public_business_search TO anon, authenticated, service_role",
    );
    expect(readModelBoundary).toContain(
      "REVOKE ALL ON FUNCTION private.sync_public_business_search_row()",
    );
    expect(readModelBoundary).toContain(
      "DROP TRIGGER IF EXISTS trg_sync_public_business_search",
    );
    expect(readModelBoundary).toContain(
      "AFTER INSERT OR UPDATE OR DELETE ON public.business_data",
    );
    expect(readModelBoundary).toContain(
      "FROM public.public_business_search bd",
    );
    expect(readModelBoundary).toContain(
      "public snapshot functions are not invoker/read-model backed",
    );
    expect(readModelBoundary).not.toContain(
      "CREATE OR REPLACE VIEW public.public_business_search",
    );
    expect(readModelBoundary).not.toContain(
      "security_invoker = false",
    );

    for (const publicMetadataKey of [
      "logo_url",
      "banner_url",
      "modos_atendimento",
      "tem_delivery",
      "aceita_cartao",
      "aceita_pix",
      "neighborhood",
      "cep",
      "city",
      "state",
    ]) {
      expect(readModelBoundary).toContain(`'${publicMetadataKey}'`);
    }

    for (const privateMetadataKey of [
      "source_authority_profile_id",
      "custody_status",
      "coordinate_geocoding_source",
      "coordinate_source",
      "archived_at",
      "source_kind",
    ]) {
      expect(readModelBoundary).not.toContain(`'${privateMetadataKey}', NEW.metadata`);
      expect(readModelBoundary).not.toContain(`'${privateMetadataKey}', bd.metadata`);
    }

    expect(facade).toContain("BusinessQueries.getBusinessesList");
    expect(facade).not.toContain("static getBusinesses = BusinessQueries.getBusinesses");
    expect(facade).toContain("static getBusinesses = getBusinesses");
  });
});
