import { describe, expect, it } from "vitest";
import {
  buildTerritoryNavigationModes,
  resolveTerritoryNavigationBase,
} from "../territoryNavigationModes";

const CITY_FALLBACK = { state: "ba", city: "salvador" };
const COMPLEX_BASE = "/ba/salvador/complexo-do-nordeste-de-amaralina";

describe("territoryNavigationModes", () => {
  it("preserves the remembered territory on non-territorial routes", () => {
    expect(
      resolveTerritoryNavigationBase("/conta", CITY_FALLBACK, COMPLEX_BASE),
    ).toBe(COMPLEX_BASE);

    const modes = buildTerritoryNavigationModes({
      pathname: "/conta",
      fallback: CITY_FALLBACK,
      fallbackBaseUrl: COMPLEX_BASE,
      authenticated: true,
    });

    expect(modes.find((mode) => mode.id === "today")?.href).toBe(COMPLEX_BASE);
    expect(modes.find((mode) => mode.id === "explore")?.href).toBe(
      `/busca${COMPLEX_BASE}`,
    );
  });

  it("keeps the current URL territory ahead of remembered fallback", () => {
    expect(
      resolveTerritoryNavigationBase(
        "/busca/ba/salvador/santa-cruz",
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
