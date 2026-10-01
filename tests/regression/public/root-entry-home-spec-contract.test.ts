import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root home MVP contract", () => {
  it("keeps the first screen focused on territorial discovery", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(page).toContain("A praça digital do seu bairro");
    expect(page).toContain("Tudo que importa,");
    expect(page).toContain("logo ali.");
    expect(page).toContain("Empresas, mapa, busca e o que está perto de você");
    expect(page).toContain("Explorar o {LAUNCH_COMMUNITY_DISCOVERY_LABEL}");
    expect(page).toContain("ag-explore-cta");

    expect(page).toContain("const launchBusinessUrl = LAUNCH_URLS.business");
    expect(page).toContain("const launchMapUrl = LAUNCH_URLS.map");
    expect(page).toContain("const launchNearbyUrl = LAUNCH_URLS.nearby");
    expect(page).toContain("const launchSearchUrl = LAUNCH_URLS.search");

    expect(page).toContain('link: "Explorar empresas"');
    expect(page).toContain('link: "Abrir o mapa"');
    expect(page).toContain('link: "Ver perto de mim"');
    expect(page).toContain('link: "Buscar no território"');

    expect(page).not.toContain("entry-search");
    expect(page).not.toContain("entry-location-action");
    expect(page).not.toContain("navigator.geolocation");
    expect(page).not.toContain("useRobustGeolocation");
    expect(page).not.toContain('href={AUTH_PATHS.signup}');
  });

  it("keeps paused product domains out of root discovery cards", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");
    const modulesBlock =
      page.match(/const modules = \[[\s\S]*?\] as const;/)?.[0] ?? "";

    for (const active of [
      'link: "Explorar empresas"',
      'link: "Abrir o mapa"',
      'link: "Ver perto de mim"',
      'link: "Buscar no território"',
    ]) {
      expect(modulesBlock).toContain(active);
    }

    for (const paused of [
      'link: "Comunidade"',
      'link: "Classificados"',
      'link: "Serviços"',
      'link: "Eventos"',
      'link: "Vagas"',
      'link: "Educação"',
    ]) {
      expect(modulesBlock).not.toContain(paused);
    }
  });

  it("uses public presentation labels without corrupting canonical geography", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");
    const fallback = read("src/core/routing/utils/publicTerritoryFallbacks.ts");

    expect(fallback).toContain('name: "Complexo do Nordeste de Amaralina"');
    expect(fallback).toContain('[PUBLIC_LABEL_KEY]: "Complexo"');
    expect(fallback).toContain('[PUBLIC_ARTICLE_KEY]: "o"');
    expect(fallback).toContain('name: "Chapada do Rio Vermelho"');
    expect(fallback).toContain('publicLabel: "Chapada"');

    expect(page).toContain("getPublicTerritoryGroupPresentation");
    expect(page).toContain("getPublicTerritoryLocationLabel");
    expect(page).toContain("launchCommunityGenitiveLabel");
    expect(page).not.toContain("launchCommunityOriginLabel");
  });

  it("keeps low mobile viewports responsive without horizontal clipping", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");
    const styles = read("src/app/pages/TerritoryEntryPage.css");

    expect(page).toContain('className="ag-home"');
    expect(styles).toContain("overflow: hidden;");
    expect(styles).toContain("@media (max-width: 640px)");
    expect(styles).toContain("grid-template-columns: 1fr;");
    expect(styles).toContain("padding-bottom: calc(2.5rem + env(safe-area-inset-bottom));");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
