import { describe, expect, it } from "vitest";
import { resolveHomeCommunityHref } from "../homeCommunityHref";

describe("resolveHomeCommunityHref", () => {
  it("abre a comunidade do grupo ativo quando o bairro pertence a um grupo", () => {
    const href = resolveHomeCommunityHref({
      groups: [
        {
          slug: "complexo-do-nordeste-de-amaralina",
          name: "Complexo do Nordeste de Amaralina",
          status: "active",
        },
      ],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/nordeste-de-amaralina",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/ba/salvador");
  });

  it("abre o bairro quando nao existe grupo ativo para a residencia", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/pituba",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/ba/salvador");
  });

  it("respeita o ultimo grupo territorial usado quando ele esta ativo", () => {
    const href = resolveHomeCommunityHref({
      groups: [
        { slug: "pituba", name: "Pituba", status: "active" },
        {
          slug: "complexo-do-nordeste-de-amaralina",
          name: "Complexo do Nordeste de Amaralina",
          status: "active",
        },
      ],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/nordeste-de-amaralina",
      lastTerritoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(href).toBe("/comunidade/ba/salvador");
  });

  it("usa o territorio atual antes de cair no fallback", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      currentTerritoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/ba/salvador");
  });
});
