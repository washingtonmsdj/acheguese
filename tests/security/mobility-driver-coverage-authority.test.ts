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
    expect(service).toContain("profileService.getProfileById(profileId)");
    expect(service).toContain("getBusinessDataIdByProfileId(profileId)");
    expect(service).toContain(
      "ProfessionalService.getProfessionalDataIdByProfileId(profileId)",
    );
    expect(service).toContain("getDriverDataIdByProfileId(profileId)");
    expect(service).toContain("coverageRepository.replaceByEntity(");
    expect(service).toContain("coverage_type: CoverageType.DISTRICT");
    expect(service).toContain("status: CoverageStatus.ACTIVE");
    const createPage = readProjectFile(
      "src/modules/professionals/services/pages/CadastrarServicoPage.tsx",
    );
    const createModel = readProjectFile(
      "src/modules/professionals/services/pages/CadastrarServicoPage.model.ts",
    );
    expect(createPage).toContain("serviceAreasService.replaceServiceAreas(");
    expect(createPage).toContain("form.serviceAreaLocationIds");
    expect(createPage).not.toContain("service_areas: form.");
    expect(createPage).not.toContain("neighborhood: form.serviceArea");
    expect(createModel).toContain("serviceAreaLocationIds: string[]");
    expect(createModel).not.toContain("serviceAreas: string[]");
    const editPage = readProjectFile(
      "src/modules/professionals/services/pages/EditarServicoPage.tsx",
    );
    const editModel = readProjectFile(
      "src/modules/professionals/services/pages/EditarServicoPage.model.ts",
    );
    expect(editPage).toContain("useServiceAreas(professional?.profile_id");
    expect(editPage).toContain("serviceAreasService.replaceServiceAreas(");
    expect(editPage).toContain("form.serviceAreaLocationIds");
    expect(editModel).toContain("serviceAreaLocationIds: string[]");
    expect(editModel).not.toContain("professional.service_areas");
    expect(editModel).not.toContain("service_areas: form.");
    const professionalTypes = readProjectFile("src/core/professional/types.ts");
    const professionalMapper = readProjectFile(
      "src/core/professional/services/professional.mappers.ts",
    );
    const professionalQueries = readProjectFile(
      "src/core/professional/services/professional.queries.ts",
    );
    const professionalLifecycle = readProjectFile(
      "src/core/professional/services/professional.profile-lifecycle.ts",
    );
    const professionalSchema = readProjectFile(
      "src/shared/schemas/professional/professionalSchemas.ts",
    );
    const professionalDetail = readProjectFile(
      "src/modules/professionals/services/hooks/useProfessionalDetail.ts",
    );
    const centralProfessional = readProjectFile(
      "src/modules/central/pages/CentralProfissionalPageSections.tsx",
    );
    expect(professionalTypes).not.toContain("service_radius_km");
    expect(professionalTypes).not.toMatch(/\bservice_areas\??:/);
    expect(professionalMapper).not.toContain("row.service_areas");
    expect(professionalMapper).not.toContain("row.service_radius_km");
    expect(professionalQueries).not.toMatch(/^\s*service_areas,?$/m);
    expect(professionalQueries).not.toMatch(/^\s*service_radius_km,?$/m);
    expect(professionalLifecycle).not.toContain("input.service_areas");
    expect(professionalLifecycle).not.toContain("input.service_radius_km");
    expect(professionalSchema).not.toMatch(/\bservice_areas\s*:/);
    expect(professionalSchema).not.toMatch(/\bservice_radius_km\s*:/);
    expect(professionalDetail).toContain('useServiceAreas(professional?.profile_id');
    expect(centralProfessional).toContain("useServiceAreas(service.profile_id)");
    expect(centralProfessional).not.toContain("service.service_radius_km");
    expect(centralProfessional).not.toContain("service.service_areas");
    expect(service).not.toContain("findSingleIdByProfile");
    expect(service).not.toContain("ProfileEntityDbClient");
    expect(service).not.toMatch(/\.from(?:<[^>]+>)?\(\s*table\s*\)/);
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

    const retiredMobilityCoverageBridges = [
      "src/modules/mobility/hooks/useDriverServiceArea.ts",
      "src/modules/mobility/components/driver/ServiceAreaSettings.tsx",
      "src/modules/mobility/components/driver/DriverSettingsLayout.tsx",
    ];

    for (const retiredPath of retiredMobilityCoverageBridges) {
      expect(
        fs.existsSync(path.resolve(process.cwd(), retiredPath)),
        `retired mobility coverage bridge must stay removed: ${retiredPath}`,
      ).toBe(false);
    }
  });
});
