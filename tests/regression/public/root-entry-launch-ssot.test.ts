import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (filePath: string) => fs.readFileSync(path.join(ROOT, filePath), "utf8");

describe("public root launch territory SSOT", () => {
  it("derives launch identity and navigation from TERRITORY_CONFIG", () => {
    const entry = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(entry).toContain("const LAUNCH_STATE = TERRITORY_CONFIG.launch.state;");
    expect(entry).toContain("const LAUNCH_CITY = TERRITORY_CONFIG.launch.city;");
    expect(entry).toContain(
      "const LAUNCH_COMMUNITY_SLUG = TERRITORY_CONFIG.launch.community.slug;",
    );
    expect(entry).toContain(
      "const LAUNCH_COMMUNITY_NAME = TERRITORY_CONFIG.launch.community.name;",
    );
    expect(entry).toContain("TERRITORY_CONFIG.launch.name");
    expect(entry).toContain("TERRITORY_CONFIG.launch.state.toUpperCase()");
    expect(entry).toContain("href={LAUNCH_URLS.community}");
    expect(entry).toContain("baseUrl: TERRITORY_CONFIG.launch.community.path");
    expect(entry).toContain("<em>{LAUNCH_PLACE_LABEL}</em>");

    expect(entry).not.toContain('TERRITORY_CONFIG.launch.state || "ba"');
    expect(entry).not.toContain('TERRITORY_CONFIG.launch.city || "salvador"');
    expect(entry).not.toContain("COMPLEX_FALLBACK_SLUG");
    expect(entry).not.toContain('const COMPLEX_TERRITORY_NAME = "');
    expect(entry).not.toContain("<em>Salvador · Bahia</em>");
  });

  it("keeps the root map fallback on canonical map defaults", () => {
    const runtime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(runtime).toContain(
      'import { MAP_DEFAULT_COORDINATES } from "@/shared/config/mapDefaults";',
    );
    expect(runtime).toContain("center: MAP_DEFAULT_COORDINATES");
    expect(runtime).not.toContain("SALVADOR_VIEWPORT");
    expect(runtime).not.toContain("latitude: -12.95");
    expect(runtime).not.toContain("longitude: -38.48");
  });

  it("renders map context and fallback messaging from resolved territory data", () => {
    const runtime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(runtime).toContain("const cityContext = formatCityContext(city);");
    expect(runtime).toContain("{cityContext ? <small>{cityContext}</small> : null}");
    expect(runtime).toContain("entrando em {territoryLabel} normalmente");
    expect(runtime).toContain("contorno aproximado ou incompleto de {territoryLabel}");
    expect(runtime).not.toContain("<small>Salvador · BA</small>");
  });

  it("settles aria-busy when the map timeout fallback becomes final", () => {
    const runtime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(runtime).toContain("const mapRegionBusy =");
    expect(runtime).toContain("!mapUnavailable &&");
    expect(runtime).toContain("aria-busy={mapRegionBusy}");
    expect(runtime).not.toContain(
      "aria-busy={!mapReady || isLoading || !boundaryStarted || isBoundaryLoading}",
    );
  });
});
