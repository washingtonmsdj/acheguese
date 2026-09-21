import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public home real-data boundary", () => {
  const page = readFileSync("src/app/pages/TerritoryHomePage.tsx", "utf8");

  it("does not expose a concept-mock runtime path", () => {
    expect(page).not.toContain("concept-mock");
    expect(page).not.toContain("CONCEPT_HOME_MOCK");
    expect(page).not.toContain("conceptMockEnabled");
    expect(page).not.toContain("ConceptMockPostCard");
    expect(existsSync("src/app/mocks/territoryHomeConceptMock.ts")).toBe(false);
  });

  it("does not load post-MVP domain data into the Home", () => {
    expect(page).not.toContain("useTerritoryHomeData");
    expect(page).not.toContain("useQuery");
    expect(page).not.toContain("useCommunityAccess");
    expect(page).not.toContain("eventsReadService");
    expect(page).not.toContain("WorkOpportunitiesService");
    expect(page).not.toContain("classifiedUrlService");
  });

  it("advertises only the three active product modules", () => {
    expect(page).toContain('title="Empresas"');
    expect(page).toContain('title="Mapa"');
    expect(page).toContain('title="Perto de mim"');

    for (const pausedCopy of [
      "Agenda do bairro",
      "Vagas e oportunidades",
      "Classificados",
      "Gastronomia",
      "Serviços",
      "Comunidade",
    ]) {
      expect(page).not.toContain(pausedCopy);
    }
  });
});
