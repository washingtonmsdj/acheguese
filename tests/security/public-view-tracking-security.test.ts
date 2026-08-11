import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function readProjectJson<T>(path: string): T {
  return JSON.parse(readProjectFile(path)) as T;
}

describe("public view tracking security", () => {
  it("routes public view counters through the constrained Edge Function broker", () => {
    const clientService = readProjectFile(
      "src/core/analytics/services/PublicViewTrackingService.ts",
    );
    const businessMutations = readProjectFile(
      "src/core/business/services/business.mutations.ts",
    );
    const professionalMutations = readProjectFile(
      "src/core/professional/services/professional.mutations.ts",
    );
    const vagasService = readProjectFile(
      "src/modules/classifieds/jobs/services/VagasService.ts",
    );
    const edgeFunction = readProjectFile(
      "supabase/functions/track-public-view/index.ts",
    );
    const functionConfig = readProjectFile("supabase/config.toml");
    const migration = readProjectFile(
      "supabase/migrations/20260707122417_harden_public_view_counters_edge_broker.sql",
    );
    const parameterFixMigration = readProjectFile(
      "supabase/migrations/20260707123630_fix_public_view_counter_rpc_parameters.sql",
    );
    const edgeFunctionAuthPolicy = readProjectJson<{
      noJwtAllowlist: Record<
        string,
        { label: string; requiredPatterns: string[] }
      >;
    }>("docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json");

    expect(clientService).toContain(
      'buildSupabaseFunctionUrl("track-public-view")',
    );
    expect(clientService).toContain("PUBLIC_SUPABASE_CONFIG.publishableKey");
    expect(businessMutations).toContain(
      'PublicViewTrackingService.track("business"',
    );
    expect(professionalMutations).toContain(
      'PublicViewTrackingService.track("professional"',
    );
    expect(vagasService).toContain("PublicViewTrackingService.track('vaga'");

    expect(businessMutations).not.toContain("increment_business_views");
    expect(professionalMutations).not.toContain("increment_professional_views");
    expect(vagasService).not.toContain("increment_vaga_view_count");

    expect(edgeFunction).toContain("VIEW_COUNTER_RPCS");
    expect(edgeFunction).toContain("publicViewEventSchema");
    expect(edgeFunction).toContain("rateLimitMiddleware(req, 120, 60_000)");
    expect(edgeFunction).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(edgeFunction).toContain("increment_business_views");
    expect(edgeFunction).toContain("increment_professional_views");
    expect(edgeFunction).toContain("increment_vaga_view_count");
    expect(edgeFunction).toContain('resource: "track-public-view"');
    expect(edgeFunction).not.toMatch(/rawBody\.data[\s\S]{0,240}\.rpc/);

    expect(functionConfig).toContain("[functions.track-public-view]");
    expect(functionConfig).toContain("verify_jwt = false");

    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM PUBLIC;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.increment_professional_views(uuid) FROM anon;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.increment_vaga_view_count(uuid) FROM authenticated;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.increment_business_views(uuid) TO service_role;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.increment_professional_views(uuid) TO service_role;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.increment_vaga_view_count(uuid) TO service_role;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.business_stats FROM PUBLIC, anon;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.professional_stats FROM PUBLIC, anon;",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER",
    );

    expect(parameterFixMigration).toContain(
      "WHERE stats.profile_id = increment_business_views.business_id;",
    );
    expect(parameterFixMigration).toContain(
      "WHERE stats.profile_id = increment_professional_views.professional_id;",
    );
    expect(parameterFixMigration).toContain(
      "COALESCE(stats.views_count, 0) + 1",
    );
    expect(parameterFixMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.increment_business_views(uuid) TO service_role;",
    );
    expect(parameterFixMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.increment_professional_views(uuid) TO service_role;",
    );
    expect(parameterFixMigration).not.toContain(
      "WHERE profile_id = business_id",
    );
    expect(parameterFixMigration).not.toContain(
      "WHERE profile_id = professional_id",
    );

    expect(
      edgeFunctionAuthPolicy.noJwtAllowlist["track-public-view"]?.label,
    ).toBe("public view counter broker");
    expect(
      edgeFunctionAuthPolicy.noJwtAllowlist["track-public-view"]
        ?.requiredPatterns,
    ).toContain("VIEW_COUNTER_RPCS");
  });
});
