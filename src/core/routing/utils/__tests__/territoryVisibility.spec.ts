import { describe, expect, it } from "vitest";

import {
  isTerritoryLandingEnabled,
  isTerritoryPubliclyNavigable,
  isTerritorySelectorActive,
  isTerritoryVisibleInLanding,
} from "@/core/routing/utils/territoryVisibility";

describe("isTerritoryPubliclyNavigable", () => {
  it("permite navegacao quando apenas o seletor esta desativado", () => {
    expect(
      isTerritoryPubliclyNavigable({
        is_selector_active: false,
      }),
    ).toBe(true);
  });

  it("bloqueia navegacao apenas quando is_navigable for false", () => {
    expect(
      isTerritoryPubliclyNavigable({
        is_selector_active: true,
        is_navigable: false,
      }),
    ).toBe(false);
  });

  it("assume navegavel por padrao quando a metadata nao define a flag", () => {
    expect(isTerritoryPubliclyNavigable({})).toBe(true);
    expect(isTerritoryPubliclyNavigable(null)).toBe(true);
  });

  it("separa seletor, landing e navegacao publica", () => {
    const metadata = {
      is_selector_active: false,
      is_landing_enabled: false,
      is_navigable: true,
    };

    expect(isTerritorySelectorActive(metadata)).toBe(false);
    expect(isTerritoryLandingEnabled(metadata)).toBe(false);
    expect(isTerritoryPubliclyNavigable(metadata)).toBe(true);
    expect(isTerritoryVisibleInLanding(metadata)).toBe(false);
  });

  it("remove da landing sem bloquear a detail page publica", () => {
    const metadata = {
      is_selector_active: true,
      is_landing_enabled: false,
      is_navigable: true,
    };

    expect(isTerritoryLandingEnabled(metadata)).toBe(false);
    expect(isTerritoryVisibleInLanding(metadata)).toBe(false);
    expect(isTerritoryPubliclyNavigable(metadata)).toBe(true);
  });
});
