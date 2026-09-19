import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public home real-data boundary", () => {
  const page = readFileSync("src/app/pages/TerritoryHomePage.tsx", "utf8");

  it("does not expose a concept-mock runtime path", () => {
    expect(page).not.toContain("concept-mock");
    expect(page).not.toContain("CONCEPT_HOME_MOCK");
    expect(page).not.toContain("conceptMockEnabled");
    expect(page).not.toContain("ConceptMockPostCard");
    expect(
      existsSync("src/app/mocks/territoryHomeConceptMock.ts"),
    ).toBe(false);
  });

  it("keeps the home bound to the live territory owner", () => {
    expect(page).toContain("const data = liveData;");
    expect(page).toContain(
      "const communityVisibleInView = isCommunityAvailable;",
    );
    expect(page).toContain("useTerritoryHomeData");
  });

  it("does not restore invented home opportunities", () => {
    expect(page).not.toContain("Roda de conversa");
    expect(page).not.toContain("Aulas de reforço escolar");
    expect(page).toContain("Agenda do bairro");
    expect(page).toContain("Vagas e oportunidades");
  });
});
