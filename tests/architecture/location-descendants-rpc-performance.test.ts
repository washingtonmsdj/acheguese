import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const migration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260831030016_optimize_location_descendants_prefix_g5.sql",
  ),
  "utf8",
);

describe("location descendants RPC performance contract", () => {
  it("keeps group semantics and uses the indexed geographic path for locations", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.rpc_get_location_descendants_ids",
    );
    expect(migration).toContain("LANGUAGE plpgsql");
    expect(migration).toContain("STABLE");
    expect(migration).toContain("SET search_path TO 'public', 'pg_temp'");

    expect(migration).toContain("FROM public.territorial_groups");
    expect(migration).toContain("FROM public.territorial_group_members");
    expect(migration).toContain("SELECT geographic_path");
    expect(migration).toContain("geographic_path = v_path");
    expect(migration).toContain("geographic_path LIKE v_path || '/%'");

    expect(migration).not.toContain("WITH RECURSIVE descendants");
    expect(migration).not.toContain("SECURITY DEFINER");

    for (const role of ["anon", "authenticated", "service_role"]) {
      expect(migration).toContain(`has_function_privilege('${role}'`);
    }
  });
});
