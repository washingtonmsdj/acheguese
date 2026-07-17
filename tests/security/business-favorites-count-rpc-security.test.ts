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
    const gastronomyAdapter = readProjectFile(
      "src/modules/business/gastronomy/services/favorites.queries.ts",
    );
    const store = readProjectFile(
      "src/core/favorites/services/BusinessFavoriteStore.ts",
    );
    const legacyRemoval = readProjectFile(
      "supabase/migrations/20260714123000_drop_empty_legacy_business_favorites.sql",
    );

    expect(gastronomyAdapter).not.toContain(".select('favorites_count')");
    expect(gastronomyAdapter).toContain("BusinessFavoriteService.getFavoritesCount");
    expect(store).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']get_business_favorites_count/);
    expect(store).toContain(".from('business_data')");
    expect(store).toContain(".select('favorites_count')");
    expect(store).toContain(".maybeSingle()");
    expect(store).toContain("data?.favorites_count ?? 0");
    expect(legacyRemoval).toContain(
      "DROP FUNCTION IF EXISTS public.get_business_favorites_count(UUID)",
    );
  });
});
