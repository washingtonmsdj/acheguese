import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("business favorites count RPC security", () => {
  it("reads the canonical counter through business_data RLS instead of a privileged RPC", () => {
    const service = readProjectFile(
      "src/modules/business/gastronomy/services/favorites.queries.ts",
    );
    const migration = readProjectFile(
      "supabase/migrations/20260707160719_harden_business_favorites_count_rpc.sql",
    );

    expect(service).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']get_business_favorites_count/);
    expect(service).toContain(".from('business_data')");
    expect(service).toContain(".select('favorites_count')");
    expect(service).toContain(".maybeSingle()");
    expect(service).toContain("data?.favorites_count ?? 0");

    expect(migration).toContain("ALTER FUNCTION public.get_business_favorites_count(uuid)");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.get_business_favorites_count\(uuid\)\s+FROM PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_business_favorites_count\(uuid\)\s+TO service_role/,
    );
  });
});
