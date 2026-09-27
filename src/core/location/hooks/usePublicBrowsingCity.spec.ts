import { describe, expect, it } from "vitest";
import { parsePublicBrowsingCityFromPathname } from "./usePublicBrowsingCity";

describe("parsePublicBrowsingCityFromPathname", () => {
  it("extracts city context from territorial module routes", () => {
    expect(
      parsePublicBrowsingCityFromPathname("/ba/salvador/gastronomia"),
    ).toEqual({
      state: "ba",
      city: "salvador",
    });
    expect(
      parsePublicBrowsingCityFromPathname("/ba/salvador/nordeste-de-amaralina/empresas"),
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

  it("rejects retired module-first and non-territorial routes", () => {
    expect(
      parsePublicBrowsingCityFromPathname("/gastronomia/ba/salvador"),
    ).toBeNull();
    expect(
      parsePublicBrowsingCityFromPathname("/gastronomia/pedidos/d756058c-c068-4eca-bc0c-f3dba74a27f7"),
    ).toBeNull();
    expect(parsePublicBrowsingCityFromPathname("/central/empresas")).toBeNull();
    expect(parsePublicBrowsingCityFromPathname("/conta/preferencias")).toBeNull();
  });
});
