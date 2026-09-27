import { describe, expect, it } from "vitest";
import {
  buildTerritoryNavigationModes,
  resolveTerritoryNavigationBase,
} from "../territoryNavigationModes";

const CITY_FALLBACK = { state: "ba", city: "salvador" };
const COMPLEX_BASE = "/ba/salvador/complexo-do-nordeste-de-amaralina";

describe("territoryNavigationModes", () => {
  it("preserves remembered territory and exposes only MVP modules", () => {
    expect(
      resolveTerritoryNavigationBase("/conta", CITY_FALLBACK, COMPLEX_BASE),
    ).toBe(COMPLEX_BASE);

    const modes = buildTerritoryNavigationModes({
      pathname: "/conta",
      fallback: CITY_FALLBACK,
      fallbackBaseUrl: COMPLEX_BASE,
      authenticated: true,
    });

    expect(modes.map((mode) => mode.id)).toEqual([
      "home",
      "map",
      "business",
      "nearby",
      "search",
      "account",
    ]);
    expect(modes.find((mode) => mode.id === "home")?.href).toBe(COMPLEX_BASE);
    expect(modes.find((mode) => mode.id === "map")?.href).toBe(
      `${COMPLEX_BASE}/mapa`,
    );
    expect(modes.find((mode) => mode.id === "business")?.href).toBe(
      `${COMPLEX_BASE}/empresas`,
    );
    expect(modes.find((mode) => mode.id === "nearby")?.href).toBe(
      `${COMPLEX_BASE}/perto-de-mim`,
    );
    expect(modes.find((mode) => mode.id === "search")?.href).toBe(
      `${COMPLEX_BASE}/busca`,
    );
    expect(modes.some((mode) => mode.id === ("community" as never))).toBe(false);
    expect(modes.some((mode) => mode.id === ("explore" as never))).toBe(false);
  });

  it("keeps the current URL territory ahead of remembered fallback", () => {
    expect(
      resolveTerritoryNavigationBase(
        "/ba/salvador/santa-cruz/mapa",
        CITY_FALLBACK,
        COMPLEX_BASE,
      ),
    ).toBe("/ba/salvador/santa-cruz");
  });

  it("falls back safely to the configured city when the remembered base is invalid", () => {
    expect(
      resolveTerritoryNavigationBase(
        "/conta",
        CITY_FALLBACK,
        "/rota-invalida",
      ),
    ).toBe("/ba/salvador");
  });
});
