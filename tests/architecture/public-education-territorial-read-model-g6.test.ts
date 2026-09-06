import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 public Education territorial read model", () => {
  it("keeps resolved location scope inside the canonical city envelope", () => {
    const migration = read(
      "supabase/migrations/20260906133701_scope_public_education_search_to_resolved_locations_g6.sql",
    );

    expect(migration).toContain(
      "p_location_ids uuid[] DEFAULT '{}'::uuid[]",
    );
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("cardinality(v_location_ids) > 250");
    expect(migration).toContain(
      "location.geographic_path = v_city_path",
    );
    expect(migration).toContain(
      "location.geographic_path LIKE v_city_path || '/%'",
    );
    expect(migration).toContain(
      "pbs.location_id = ANY(v_location_ids)",
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.list_public_education_profiles(",
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS public.list_public_education_districts(text, text);",
    );
  });

  it("routes a territorial group through its already-resolved active locations", () => {
    const page = read(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const hook = read(
      "src/modules/business/education/hooks/useEducationList.ts",
    );
    const queries = read(
      "src/core/education/services/education.queries.ts",
    );

    expect(page).toContain("resolved.group.members");
    expect(page).toContain("String(member.status) === 'active'");
    expect(page).toContain("if (resolved?.kind === 'group') return null");
    expect(page).toContain("locationIds: groupLocationIds");
    expect(page).toContain("enabled: educationScopeReady");
    expect(page).not.toContain("if (district) return district;");

    expect(hook).toContain("locationIds?: string[]");
    expect(hook).toContain(
      "'education', 'public-districts', state, city, locationIds",
    );
    expect(hook).toContain("locationIds,");

    expect(queries).toContain("locationIds?: string[]");
    expect(queries).toContain(
      "p_location_ids: locationIds.length > 0 ? locationIds : undefined",
    );
  });

  it("does not reintroduce page-local filtering as a second result authority", () => {
    const page = read(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const filters = read(
      "src/modules/business/education/pages/explorerFilters.ts",
    );

    expect(page).not.toContain("filterEnrichedProfiles");
    expect(filters).not.toContain("export function filterEnrichedProfiles");
    expect(page).toContain("const totalCount = data?.pages[0]?.totalCount ?? 0");
    expect(page).toContain("fetchNextPage");
  });

  it("does not expose a removable district filter when the URL already locks the district", () => {
    const page = read(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );
    const controls = read(
      "src/modules/business/education/pages/explorerFilterControls.tsx",
    );

    expect(page).toContain("const districtLocked = Boolean(routeDistrict)");
    expect(page).toContain("districtLocked={districtLocked}");
    expect(controls).toContain("districtLocked?: boolean");
    expect(controls).toContain("!districtLocked && districts.length > 0");
    expect(controls).toContain("{!districtLocked && (");
  });
});
