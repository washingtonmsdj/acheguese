import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("location rpc broker security", () => {
  it("routes canonical city upserts through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/location-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/location/services/LocationRpcService.ts");
    const geocodingService = readProjectFile(
      "src/core/location/services/LocationGeocodingService.ts",
    );

    expect(config).toContain("[functions.location-rpc]");
    expect(config).toMatch(/\[functions\.location-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("rpc_upsert_canonical_city_by_ibge"');
    expect(edgeFunction).toContain("requireStateCode");
    expect(edgeFunction).toContain("requireCityName");
    expect(edgeFunction).toContain("requireIbgeCode");
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/p_user_id:\s*rawBody/);

    expect(broker).toContain('const FUNCTION_NAME = "location-rpc"');
    expect(geocodingService).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']rpc_upsert_canonical_city_by_ibge/,
    );
  });

  it("revokes direct browser execution of the backing location RPC", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707213810_route_location_city_upsert_through_edge_function.sql",
    );

    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(text, text, text)",
    );
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.rpc_upsert_canonical_city_by_ibge(text, text, text)",
    );
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("v_is_service_role");
  });
});
