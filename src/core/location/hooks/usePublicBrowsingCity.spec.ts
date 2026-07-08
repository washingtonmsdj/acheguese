import { describe, expect, it } from "vitest";
import { parsePublicBrowsingCityFromPathname } from "./usePublicBrowsingCity";

describe("parsePublicBrowsingCityFromPathname", () => {
  it("extracts city context from territorial module routes", () => {
    expect(parsePublicBrowsingCityFromPathname("/gastronomia/ba/salvador")).toEqual({
      state: "ba",
      city: "salvador",
    });
    expect(
      parsePublicBrowsingCityFromPathname("/empresas/ba/salvador/nordeste-de-amaralina"),
    ).toEqual({
      state: "ba",
      city: "salvador",
    });
  });

  it("extracts city context from bare territorial routes", () => {
    expect(parsePublicBrowsingCityFromPathname("/ba/salvador")).toEqual({
      state: "ba",
      city: "salvador",
    });
  });

  it("ignores public non-territorial subroutes", () => {
    expect(
      parsePublicBrowsingCityFromPathname("/gastronomia/pedidos/d756058c-c068-4eca-bc0c-f3dba74a27f7"),
    ).toBeNull();
    expect(parsePublicBrowsingCityFromPathname("/central/empresas")).toBeNull();
    expect(parsePublicBrowsingCityFromPathname("/conta/preferencias")).toBeNull();
  });
});
