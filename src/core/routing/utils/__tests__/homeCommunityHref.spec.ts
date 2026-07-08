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
      homeDistrictPath: "/ba/salvador/chapada-do-rio-vermelho",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("normaliza alias resolvido do grupo para portal comunitario explicito", () => {
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
      communityUrlsByTerritoryBaseUrl: {
        "/ba/salvador/complexo-do-nordeste-de-amaralina":
          "/complexo-do-nordeste-de-amaralina",
      },
    });

    expect(href).toBe("/comunidade/complexo-do-nordeste-de-amaralina");
  });

  it("abre o bairro quando nao existe grupo ativo para a residencia", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/pituba",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/ba/salvador/pituba");
  });

  it("normaliza alias resolvido do bairro para portal comunitario explicito", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/pituba",
      fallbackHref: "/comunidade/ba/salvador",
      communityUrlsByTerritoryBaseUrl: {
        "/ba/salvador/pituba": "/pituba",
      },
    });

    expect(href).toBe("/comunidade/pituba");
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

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("usa o territorio atual antes de cair no fallback", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      currentTerritoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("normaliza ultimo territorio curto salvo pelo shell de comunidade", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      lastTerritoryBaseUrl: "/complexo-do-nordeste-de-amaralina",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/complexo-do-nordeste-de-amaralina");
  });
});
