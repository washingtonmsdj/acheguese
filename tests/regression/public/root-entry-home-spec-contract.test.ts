import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root home redesign contract", () => {
  it("keeps the first screen focused on territorial discovery", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(page).toContain("A praça digital do seu bairro");
    expect(page).toContain("Por perto");
    expect(page).toContain("Território: {LAUNCH_COMMUNITY_NAME}");
    expect(page).toContain("Negócios, serviços, eventos e gente");
    expect(page).toContain("Tudo que importa,");
    expect(page).toContain("logo ali.");
    expect(page).toContain("Explorar o {LAUNCH_COMMUNITY_DISCOVERY_LABEL}");
    expect(page).toContain("ag-explore-cta");
    expect(page).toContain("href={LAUNCH_URLS.businessTerritory}");
    expect(page).toContain("Explorar negócios");
    expect(page).toContain("href={LAUNCH_URLS.map}");
    expect(page).toContain('href="/perto-de-mim"');
    expect(page).toContain("A comunidade sabe primeiro.");
    expect(page).toContain("Seu bairro primeiro. O resto vem depois.");

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
