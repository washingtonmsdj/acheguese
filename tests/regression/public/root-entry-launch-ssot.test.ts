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

  it("renders launch neighborhoods from the resolved territorial group", () => {
    const entry = read("src/app/pages/TerritoryEntryPage.tsx");
    const fallbacks = read("src/core/routing/utils/publicTerritoryFallbacks.ts");

    expect(entry).toContain("const launchCommunityMembers =");
    expect(entry).toContain('launchTerritory?.kind === "group"');
    expect(entry).toContain("launchTerritory.group.members");
    expect(entry).toContain("launchCommunityMembers.map((member) => (");
    expect(entry).toContain("getPublicTerritoryLocationLabel(member)");

    expect(entry).not.toContain("<span>Nordeste de Amaralina</span>");
    expect(entry).not.toContain("<span>Santa Cruz</span>");
    expect(entry).not.toContain("<span>Vale das Pedrinhas</span>");
    expect(entry).not.toContain("<span>Chapada</span>");

    expect(fallbacks).toContain('const PUBLIC_LABEL_KEY = "public_label";');
    expect(fallbacks).toContain('name: "Chapada do Rio Vermelho"');
    expect(fallbacks).toContain('publicLabel: "Chapada"');
    expect(fallbacks).toContain("export function getPublicTerritoryLocationLabel");
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
    const wrapper = read(
      "src/app/components/territory-vivo/TerritoryEntryMap.tsx",
    );

    expect(runtime).toContain("const cityContext = formatCityContext(city);");
    expect(runtime).toContain("{cityContext ? <small>{cityContext}</small> : null}");
    expect(runtime).toContain("entrando em {territoryLabel} normalmente");
    expect(runtime).toContain("contorno aproximado ou incompleto de {territoryLabel}");
    expect(runtime).not.toContain("<small>Salvador · BA</small>");

    expect(wrapper).toContain("function resolveTerritoryLabel(");
    expect(wrapper).toContain("return resolvedTerritory.group.name;");
    expect(wrapper).toContain("return resolvedTerritory.location.name;");
    expect(wrapper).toContain('return city?.name ?? "Território";');
    expect(wrapper).not.toContain('label ?? "Complexo do Nordeste de Amaralina"');
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

  it("makes a slow official boundary non-blocking while it keeps loading in background", () => {
    const runtime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(runtime).toContain("!boundarySlow &&");
    expect(runtime).toContain("boundarySlow ? (");
    expect(runtime).toContain("Mapa pronto. Limite oficial ainda carregando.");
    expect(runtime).toContain("segue sendo buscado em segundo plano, sem usar aproximação");
    expect(runtime).not.toContain(
      'boundarySlow ? "Mapa aberto. Limite oficial ainda carregando." : "Mapa pronto. Carregando limite oficial..."',
    );
  });
});
