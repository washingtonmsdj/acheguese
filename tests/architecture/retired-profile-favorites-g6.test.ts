import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 retired profile favorites", () => {
  it("keeps both obsolete profile-favorite aggregates retired", () => {
    const migration = read(
      "supabase/migrations/20260906094125_drop_retired_business_and_profile_favorites_g6.sql",
    );
    const generated = read("src/integrations/supabase/types.generated.ts");

    expect(migration).toContain("DROP TABLE public.profile_favorites RESTRICT");
    expect(migration).toContain(
      "DROP TABLE public.profile_favorites_new RESTRICT",
    );
    expect(generated).not.toContain("profile_favorites_new: {");
    expect(generated).not.toContain("profile_favorites: {");
  });

  it("does not query, mutate or advertise the dropped aggregate in active source", () => {
    const queries = read("src/core/favorites/services/favorites.queries.ts");
    const mutations = read("src/core/favorites/services/favorites.mutations.ts");
    const profileExternal = read(
      "src/core/profiles/services/profile.external-data.queries.ts",
    );
    const profileService = read(
      "src/core/profiles/services/ProfileService.ts",
    );
    const adminSsot = read("src/modules/admin/pages/AdminSSOT.tsx");

    for (const source of [
      queries,
      mutations,
      profileExternal,
      profileService,
      adminSsot,
    ]) {
      expect(source).not.toContain("profile_favorites_new");
    }

    expect(queries).toContain("BusinessFavoriteStore");
    expect(mutations).toContain("BusinessFavoriteStore");
    expect(adminSsot).toContain("user_favorite_businesses");
  });

  it("keeps only an explicit zero compatibility adapter for legacy profile counters", () => {
    const queries = read("src/core/favorites/services/favorites.queries.ts");

    expect(queries).toContain("export async function getFavoriteStats");
    expect(queries).toContain("total_favorites_given: 0");
    expect(queries).toContain("total_favorites_received: 0");
    expect(queries).not.toContain(".from(");
  });
});
