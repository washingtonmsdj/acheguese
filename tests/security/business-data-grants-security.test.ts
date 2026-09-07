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

  it("keeps server-owned Business fields out of normal create/update inputs", () => {
    const mutations = readProjectFile(
      "src/core/business/services/business.mutations.ts",
    );
    const mapper = readProjectFile(
      "src/core/business/services/business.mappers.ts",
    );
    const schemas = readProjectFile(
      "src/shared/schemas/business/businessSchemas.ts",
    );
    const inputTypes = readProjectFile("src/core/business/types/index.ts");

    const createStart = mutations.indexOf(
      "export async function createBusiness",
    );
    const updateStart = mutations.indexOf(
      "export async function updateBusiness",
      createStart,
    );
    const createBlock = mutations.slice(createStart, updateStart);

    expect(createBlock).not.toContain("rating: 0");
    expect(createBlock).not.toContain("total_reviews: 0");
    expect(createBlock).not.toContain("total_products: 0");
    expect(createBlock).not.toContain("validatedInput.is_verified");
    expect(createBlock).not.toContain("validatedInput.is_premium");

    expect(schemas).not.toContain("is_verified: z.boolean().optional()");
    expect(schemas).not.toContain("is_premium: z.boolean().optional()");
    expect(inputTypes).not.toMatch(
      /export interface BusinessInput[\s\S]*?is_verified\?: boolean;/,
    );
    expect(inputTypes).not.toMatch(
      /export interface BusinessInput[\s\S]*?is_premium\?: boolean;/,
    );
    expect(mapper).not.toContain(
      'setIfDefined(result, "is_verified", input.is_verified)',
    );
    expect(mapper).not.toContain(
      'setIfDefined(result, "is_premium", input.is_premium)',
    );
  });

  it("keeps tax_id readable but out of authenticated profile-extension writes", () => {
    const extension = readProjectFile(
      "src/core/business/services/business.profile-extension.ts",
    );

    expect(extension).toContain('"tax_id"');
    expect(extension).toContain(
      '"profile_id" | "created_at" | "updated_at" | "tax_id"',
    );
    expect(extension).toContain("delete mutableUpdates.tax_id");
    expect(extension).toContain(
      ".update(mutableUpdates as BusinessProfileExtensionUpdate)",
    );
    expect(extension).not.toContain(".update(updates)");
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
  it("keeps the remote Business authorization probe rollback-only and owner-scoped", () => {
    const probe = readProjectFile(
      "tests/security/business-data-authorization-remote-probe.sql",
    );

    expect(probe).toContain("BEGIN;");
    expect(probe).toContain("ROLLBACK;");
    expect(probe).toContain("SET LOCAL ROLE authenticated");
    expect(probe).toContain("'request.jwt.claim.sub'");
    expect(probe).toContain("private.can_operate_business_profile(v_profile_id)");
    expect(probe).toContain("business_authorization_probe_owner_helper_denied");
    expect(probe).toContain("business_authorization_probe_non_owner_helper_allowed");
    expect(probe).toContain("business_authorization_probe_non_owner_read_count_");
    expect(probe).toContain("business_authorization_probe_non_owner_update_count_");
    expect(probe).toContain("WHEN insufficient_privilege THEN");
    expect(probe).toContain("'transaction', 'rollback'");
    expect(probe).not.toMatch(/\bCOMMIT\b/i);
  });

});
