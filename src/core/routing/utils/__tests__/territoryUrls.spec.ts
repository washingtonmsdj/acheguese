import { describe, expect, it } from "vitest";

import { normalizePublicTerritoryPath } from "@/core/routing/utils/territoryUrls";

describe("normalizePublicTerritoryPath", () => {
  it("normaliza geographic_path interno com /br", () => {
    expect(normalizePublicTerritoryPath("/br/ba/salvador/pituba")).toBe(
      "/ba/salvador/pituba",
    );
  });

  it("preserva path publico com barra inicial", () => {
    expect(normalizePublicTerritoryPath("/ba/salvador/pituba")).toBe(
      "/ba/salvador/pituba",
    );
  });

  it("adiciona barra inicial quando o path vier sem slash", () => {
    expect(normalizePublicTerritoryPath("ba/salvador/pituba")).toBe(
      "/ba/salvador/pituba",
    );
  });
});
