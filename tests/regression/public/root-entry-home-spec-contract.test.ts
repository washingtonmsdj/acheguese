import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("public root HOME-SPEC contract", () => {
  it("keeps the MVP entry limited to the first community contract", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");
    const homeSpec = read("docs/05-ux/HOME-SPEC.md");

    expect(homeSpec).toContain("a **entrada pública é deliberadamente community-first**");
    expect(homeSpec).toContain("a busca por cidade e o botão de geolocalização **não pertencem à primeira tela**");
    expect(homeSpec).toContain("**“Explorar o Complexo”**");

    expect(page).toContain("Nossa primeira comunidade");
    expect(page).toContain("Seu lugar, mais perto.");
    expect(page).toContain("launchCommunityMembers.map");
    expect(page).toContain("href={LAUNCH_URLS.community}");
    expect(page).toContain("Explorar {launchCommunityDefiniteLabel}");
    expect(page).toContain('href={AUTH_PATHS.signup}');
    expect(page).toContain('href="/indicar-comunidade"');
    expect(page).toContain("Sem cadastro para explorar.");
    expect(page).toContain("A expansão será por etapas.");

    expect(page).not.toContain("entry-search");
    expect(page).not.toContain("entry-location-action");
    expect(page).not.toContain("navigator.geolocation");
    expect(page).not.toContain("useRobustGeolocation");
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
    expect(page).toContain("launchCommunityOriginLabel");
  });

  it("keeps low mobile viewports reachable without important overrides", () => {
    const page = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(page).toContain("data-entry-mobile-scroll-owner");
    expect(page).toContain("max-md:overflow-y-auto");
    expect(page).toContain("max-md:overscroll-contain");
    expect(page).toContain("max-md:pt-[env(safe-area-inset-top)]");
    expect(page).toContain("max-md:pb-[calc(0.35rem+env(safe-area-inset-bottom))]");
    expect(page).toContain("max-md:min-h-[calc(3.5rem+env(safe-area-inset-top))]");
    expect(page).not.toContain("max-md:!overflow-y-auto");
  });
});
