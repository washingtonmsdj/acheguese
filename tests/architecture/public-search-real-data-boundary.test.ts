import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public search real-data boundary", () => {
  const page = readFileSync("src/app/pages/BuscaPage.tsx", "utf8");

  it("does not expose a concept-mock runtime path", () => {
    expect(page).not.toContain("concept-mock");
    expect(page).not.toContain("BUSCA_CONCEPT");
    expect(page).not.toContain("conceptMockEnabled");
    expect(
      existsSync("src/app/mocks/buscaConceptMock.ts"),
    ).toBe(false);
  });

  it("keeps global search enabled only by real territory readiness", () => {
    expect(page).toContain("{ enabled: searchEnabled }");
    expect(page).toContain("documents: results.documents");
    expect(page).toContain("professionals: results.professionals.map");
    expect(page).toContain('"professional",');
  });

  it("keeps the map bound to the resolved real territory", () => {
    expect(page).toContain("resolved={territoryResolution.resolved ?? null}");
    expect(page).toContain("fitTerritoryBounds");
    expect(page).not.toContain("initialViewport={");
    expect(page).not.toContain("territoryPolygons={");
  });
});
