import { describe, expect, it } from "vitest";
import { resolveHomeCommunityHref } from "../../utils/homeCommunityHref";

describe("resolveHomeCommunityHref hook contract", () => {
  it("prioritizes an active territorial group", () => {
    const href = resolveHomeCommunityHref({
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/chapada-do-rio-vermelho",
      groups: [
        {
          slug: "complexo-do-nordeste-de-amaralina",
          name: "Complexo do Nordeste de Amaralina",
          status: "active",
        },
      ],
    });

    expect(href).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
    );
  });

  it("uses the district when groups are inactive", () => {
    const href = resolveHomeCommunityHref({
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/pituba",
      groups: [
        {
          slug: "complexo-do-nordeste-de-amaralina",
          name: "Complexo do Nordeste de Amaralina",
          status: "inactive",
        },
      ],
    });

    expect(href).toBe("/ba/salvador/pituba/comunidade");
  });

  it("keeps the city as the territory container", () => {
    const href = resolveHomeCommunityHref({
      homeCityPath: "/ba/salvador",
      homeDistrictPath: null,
      groups: [],
    });

    expect(href).toBe("/ba/salvador/comunidade");
  });

  it("uses the last canonical territory when residence is unavailable", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      lastTerritoryBaseUrl:
        "/ba/salvador/complexo-do-nordeste-de-amaralina",
      fallbackHref: "/ba/salvador/pituba/comunidade",
    });

    expect(href).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
    );
  });

  it("rejects alias-shaped fallback and keeps the canonical launch fallback", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      fallbackHref: "/comunidade/pituba",
    });

    expect(href).not.toBe("/comunidade/pituba");
    expect(href).toContain("/comunidade");
  });
});
