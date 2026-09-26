import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root MVP 118 contract", () => {
  it("keeps the first screen focused on nearby business discovery", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(page).toContain("COMEÇAMOS PELO COMPLEXO");
    expect(page).toContain("Tudo perto de você.");
    expect(page).toContain("Encontre empresas e estabelecimentos");
    expect(page).toContain("Buscar empresas");
    expect(page).toContain("Qual empresa você procura?");
    expect(page).toContain("mvp-business-search");
    expect(page).toContain("action={LAUNCH_URLS.search}");
    expect(page).toContain('method="get"');
    expect(page).toContain("href={LAUNCH_URLS.business}");
    expect(page).toContain("Explorar empresas");
    expect(page).toContain("href={LAUNCH_URLS.map}");
    expect(page).toContain('href="/perto-de-mim"');
    expect(page).toContain("Sem cadastro para explorar.");
    expect(page).toContain("Quatro bairros, um lugar para descobrir");
    expect(page).toContain("Você pode explorar mesmo morando em outro lugar.");

    expect(page).not.toContain("entry-search");
    expect(page).not.toContain("entry-location-action");
    expect(page).not.toContain("navigator.geolocation");
    expect(page).not.toContain("useRobustGeolocation");
    expect(page).not.toContain("href={AUTH_PATHS.signup}");
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

  it("keeps low mobile viewports reachable without legacy scroll overrides", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");
    const styles = read("src/index.css");
    const mapRuntime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(page).toContain("data-entry-mobile-scroll-owner");
    expect(page).toContain("mvp-entry-content max-md:overflow-y-visible");
    expect(page).toContain("max-md:min-h-[calc(3.5rem+env(safe-area-inset-top))]");
    expect(page).not.toContain("max-md:!overflow-y-auto");
    expect(page).not.toContain("max-md:overscroll-contain");
    expect(styles).toContain("white-space: nowrap;");
    expect(styles).toContain("min-height: 16.5rem;");
    expect(styles).toContain("flex: 1 1 16.5rem;");
    expect(styles).toContain("height: 100%;");
    expect(mapRuntime).toContain("customAttribution={false}");
  });
});
