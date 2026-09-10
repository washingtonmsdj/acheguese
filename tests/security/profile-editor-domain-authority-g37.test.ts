import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Professional coverage authority", () => {
  it("keeps textual legacy coverage out of current editor and broker surface", () => {
    const types = read("src/core/profiles/services/multi-profile/types.ts");
    const professionalService = read(
      "src/core/profiles/services/multi-profile/professionalService.ts",
    );
    const editor = read("src/modules/profile/pages/ContaEditarPerfilPage.tsx");
    const profileEdge = read("supabase/functions/profile-rpc/index.ts");
    const contract = read(
      "supabase/migrations/20260910011000_block_professional_legacy_coverage_writes_g37.sql",
    );

    expect(types).not.toContain("service_area?: string[]");
    expect(professionalService).not.toContain("service_area,");
    expect(editor).not.toContain('id="service_area"');
    expect(editor).not.toContain("data.service_area");
    expect(editor).toContain("Cobertura territorial");

    const professionalPatchKeys = profileEdge.match(
      /const PROFESSIONAL_PATCH_KEYS = new Set\(\[([\s\S]*?)\]\);/,
    )?.[1];
    expect(professionalPatchKeys).toBeDefined();
    expect(professionalPatchKeys).not.toContain('"service_area"');
    expect(professionalPatchKeys).not.toContain('"service_areas"');
    expect(professionalPatchKeys).not.toContain('"service_radius_km"');
    expect(profileEdge).toContain("PROFESSIONAL_LEGACY_COVERAGE_KEYS");
    expect(profileEdge).toContain("assertNoProfessionalLegacyCoverage(extensionData");
    expect(profileEdge).toContain("assertNoProfessionalLegacyCoverage(input");

    expect(contract).toContain("Professional coverage is owned by service_areas");
    expect(contract).toContain("'service_area'");
    expect(contract).toContain("'service_areas'");
    expect(contract).toContain("'service_radius_km'");
  });
});

describe("Driver operational authority", () => {
  it("keeps presence and live location out of profile-data self service", () => {
    const sanitizer = read(
      "src/core/mobility/services/driverDataSelfService.ts",
    );
    const types = read("src/core/profiles/services/multi-profile/types.ts");
    const editor = read("src/modules/profile/pages/ContaEditarPerfilPage.tsx");
    const driverService = read(
      "src/core/profiles/services/multi-profile/driverService.ts",
    );

    for (const field of [
      '"is_online"',
      '"is_available"',
      '"last_location_update"',
      '"current_location"',
    ]) {
      expect(sanitizer).not.toContain(field);
    }

    expect(types).not.toContain("is_available: boolean;");
    expect(types).not.toContain("current_location?:");
    expect(types).not.toContain("last_location_update?:");
    expect(editor).not.toContain('label="Disponível para corridas"');
    expect(editor).toContain("Disponibilidade operacional");
    expect(driverService).not.toContain("static async updateAvailability");
    expect(driverService).not.toContain("static async updateLocation");
    expect(driverService).not.toContain(".select('*')");

    const editorSelect = driverService.match(
      /const DRIVER_DATA_PROFILE_EDITOR_SELECT = \[([\s\S]*?)\]\.join/,
    )?.[1];
    expect(editorSelect).toBeDefined();
    expect(editorSelect).not.toContain("is_online");
    expect(editorSelect).not.toContain("is_available");
    expect(editorSelect).not.toContain("current_location");
    expect(editorSelect).not.toContain("last_location_update");
  });
});
