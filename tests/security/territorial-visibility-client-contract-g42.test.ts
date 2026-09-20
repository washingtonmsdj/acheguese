import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const mutation = read("src/core/territorial/services/territorial.mutations.ts");
const locationEdge = read(
  "supabase/functions/territorial-update-location-visibility/index.ts",
);
const groupEdge = read(
  "supabase/functions/territorial-update-group-visibility/index.ts",
);
const locationCascade = read(
  "supabase/migrations/20260919003851_transactional_location_visibility_cascade_g42.sql",
);

describe("G42 territorial visibility client contract", () => {
  it("preserves structured Edge errors instead of flattening FunctionsHttpError", () => {
    expect(mutation).toContain("resolveSupabaseFunctionErrorMessage");
    expect(mutation).toContain(
      "Falha ao atualizar a visibilidade territorial.",
    );
  });

  it("requires the returned entity to match id, flag and requested value", () => {
    expect(mutation).toContain("data.success !== true");
    expect(mutation).toContain("entity.id !== id");
    expect(mutation).toContain("metadata[flag] !== value");
    expect(mutation).not.toContain("return (data ?? {})");
  });

  it("keeps group visibility on the authoritative group response envelope", () => {
    expect(groupEdge).toContain(
      "JSON.stringify({ success: true, group: updatedGroup })",
    );
  });

  it("routes location visibility through one indexed transactional RPC", () => {
    expect(locationEdge).toContain("'territorial_update_location_visibility'");
    expect(locationEdge).toContain("p_location_id: locationId");
    expect(locationEdge).toContain("p_actor_user_id: userId");
    expect(locationEdge).toContain("affectedCount");
    expect(locationEdge).toContain("cascaded");

    expect(locationEdge).not.toMatch(/\.from\(['\"]locations['\"]\)/);
    expect(locationEdge).not.toContain("for (const child of children)");

    expect(locationCascade).toContain(
      "CREATE OR REPLACE FUNCTION public.territorial_update_location_visibility(",
    );
    expect(locationCascade).toContain("SECURITY INVOKER");
    expect(locationCascade).toContain(
      "idx_locations_geographic_path_pattern",
    );
    expect(locationCascade).toContain(
      "rpc_get_location_descendants_ids(uuid)",
    );
    expect(locationCascade).toContain(
      "target.geographic_path LIKE v_path || '/%'",
    );
    expect(locationCascade).not.toContain("WITH RECURSIVE mutation_scope");
    expect(locationCascade).toContain(
      "LOCK TABLE public.locations IN SHARE ROW EXCLUSIVE MODE",
    );
    expect(locationCascade).toContain(
      "p_flag = 'is_selector_active'",
    );
    expect(locationCascade).toContain("p_value IS FALSE");
    expect(locationCascade).toContain("FROM PUBLIC, anon, authenticated");
    expect(locationCascade).toContain("TO service_role");
    expect(locationCascade).not.toMatch(/IF\s+(?:\(SELECT\s+)?auth\.role\(\)/);
    expect(locationCascade).toContain("deprecated auth.role boundary reintroduced");
  });

  it("requires a correlated transactional acknowledgement before reporting success", () => {
    expect(locationEdge).toContain("updatedLocation.id !== locationId");
    expect(locationEdge).toContain("metadata[canonicalFlag] !== body.value");
    expect(locationEdge).toContain("Number.isSafeInteger(affectedCount)");
    expect(locationEdge).toContain("cascaded !== shouldCascade");
    expect(locationEdge).toContain("success: true");
    expect(locationEdge).toContain("location: updatedLocation");
  });
});
