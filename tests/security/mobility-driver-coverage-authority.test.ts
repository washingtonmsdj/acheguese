import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility driver coverage authority", () => {
  it("uses canonical service_areas with server-owned mutations and Location ids", () => {
    const baseline = readProjectFile(
      "supabase/migrations/20260717140000_consolidate_coverage_commands.sql",
    );
    const pointCommand = readProjectFile(
      "supabase/migrations/20260909202000_add_point_coverage_command_g14.sql",
    );
    const semanticGuard = readProjectFile(
      "supabase/migrations/20260909203000_enforce_coverage_location_semantics_g14.sql",
    );
    const repository = readProjectFile(
      "src/core/coverage/repositories/CoverageRepositorySupabase.ts",
    );
    const service = readProjectFile(
      "src/core/service-areas/services/ServiceAreasService.ts",
    );
    const manager = readProjectFile(
      "src/core/service-areas/components/ServiceAreasManager.tsx",
    );
    const settingsLayout = readProjectFile(
      "src/core/mobility/components/driver/DriverSettingsLayout.tsx",
    );
    const mobilityMutations = readProjectFile(
      "src/core/mobility/services/mobility.mutations.ts",
    );

    expect(baseline).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.service_areas FROM PUBLIC, anon, authenticated",
    );
    expect(baseline).toContain(
      "GRANT SELECT ON TABLE public.service_areas TO anon, authenticated",
    );
    expect(baseline).toContain("private.require_coverage_entity_write");
    expect(baseline).toContain("'mobility_driver'");
    expect(baseline).toContain("driver.id = p_entity_id");
    expect(baseline).toContain("driver.profile_id = v_actor_profile_id");

    expect(pointCommand).toContain(
      "CREATE OR REPLACE FUNCTION public.upsert_entity_coverage",
    );
    expect(pointCommand).toContain(
      "PERFORM private.require_coverage_entity_write(p_entity_type, p_entity_id)",
    );
    expect(pointCommand).toContain("pg_advisory_xact_lock");
    expect(pointCommand).toContain(
      "TO authenticated, service_role",
    );
    expect(pointCommand).not.toMatch(
      /GRANT EXECUTE[\s\S]*?TO[^;]*\banon\b/i,
    );

    expect(semanticGuard).toContain(
      "trg_validate_service_area_location_semantics",
    );
    expect(semanticGuard).toContain(
      "City coverage requires a city location",
    );
    expect(semanticGuard).toContain(
      "District coverage requires a district or neighborhood location",
    );

    expect(repository).toContain("'upsert_entity_coverage'");
    expect(repository).toContain("'remove_entity_coverage'");
    expect(repository).toContain("'update_entity_coverage_status'");

    expect(service).toContain('entityType = "mobility_driver"');
    expect(service).toContain(
      'findSingleIdByProfile("driver_data", profileId)',
    );
    expect(service).not.toContain("driver_accepted_neighborhoods");
    expect(service).not.toMatch(
      /\.from(?:<[^>]+>)?\(["']service_areas["']\)[\s\S]{0,200}\.(?:insert|update|upsert|delete)\(/,
    );

    expect(manager).toContain("TerritorialSelector");
    expect(manager).toContain("CoverageType.CITY");
    expect(manager).toContain("CoverageType.DISTRICT");
    expect(manager).toContain("CoverageType.RADIUS");
    expect(manager).not.toContain("Bairros (opcional)");
    expect(manager).not.toContain('placeholder="Ex: cidade atendida"');

    expect(settingsLayout).toContain(
      "<ServiceAreasManager profileId={identity.driverProfileId} />",
    );
    expect(mobilityMutations).not.toContain("driver_accepted_neighborhoods");
    expect(mobilityMutations).not.toContain("deleteDriverServiceArea");

    expect(
      fs.existsSync(
        path.resolve(
          process.cwd(),
          "src/modules/mobility/hooks/useDriverServiceArea.ts",
        ),
      ),
    ).toBe(false);
  });
});
