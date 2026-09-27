import { describe, expect, it } from "vitest";
import { resolveHomeCommunityHref } from "../homeCommunityHref";

describe("resolveHomeCommunityHref", () => {
  it("opens Community as a child of the preferred active territorial group", () => {
    const href = resolveHomeCommunityHref({
      groups: [
        {
          slug: "complexo-do-nordeste-de-amaralina",
          name: "Complexo do Nordeste de Amaralina",
          status: "active",
        },
      ],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/chapada-do-rio-vermelho",
    });

    expect(href).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
    );
  });

  it("uses the home district when no active group exists", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/pituba",
    });

    expect(href).toBe("/ba/salvador/pituba/comunidade");
  });

  it("uses the city Community when there is no district", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: null,
    });

    expect(href).toBe("/ba/salvador/comunidade");
  });

  it("prefers the last active group visited inside the home city", () => {
    const href = resolveHomeCommunityHref({
      groups: [
        { slug: "pituba-plus", name: "Pituba Plus", status: "active" },
        {
          slug: "complexo-do-nordeste-de-amaralina",
          name: "Complexo do Nordeste de Amaralina",
          status: "active",
        },
      ],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/nordeste-de-amaralina",
      lastTerritoryBaseUrl:
        "/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(href).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
    );
  });

  it("uses the current canonical territory before an explicit fallback", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      currentTerritoryBaseUrl:
        "/ba/salvador/complexo-do-nordeste-de-amaralina",
      fallbackHref: "/ba/salvador/pituba/comunidade",
    });

    expect(href).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
    );
  });

  it("normalizes a canonical Community fallback without creating aliases", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      fallbackHref: "/ba/salvador/pituba/comunidade",
    });

    expect(href).toBe("/ba/salvador/pituba/comunidade");
  });
});
