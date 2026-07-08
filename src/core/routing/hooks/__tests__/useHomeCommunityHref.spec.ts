import { describe, expect, it } from "vitest";
import { resolveHomeCommunityHref } from "../../utils/homeCommunityHref";

describe("resolveHomeCommunityHref", () => {
  it("prioriza grupo territorial ativo quando o bairro do usuario pertence a uma area", () => {
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

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("normaliza alias resolvido do grupo para portal comunitario explicito", () => {
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
      communityUrlsByTerritoryBaseUrl: {
        "/ba/salvador/complexo-do-nordeste-de-amaralina":
          "/complexo-do-nordeste-de-amaralina",
      },
    });

    expect(href).toBe("/comunidade/complexo-do-nordeste-de-amaralina");
  });

  it("usa o bairro quando nao existe grupo territorial ativo", () => {
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

    expect(href).toBe("/comunidade/ba/salvador/pituba");
  });

  it("mantem comunidade municipal quando nao ha bairro", () => {
    const href = resolveHomeCommunityHref({
      homeCityPath: "/ba/salvador",
      homeDistrictPath: null,
      groups: [],
      fallbackHref: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(href).toBe("/comunidade/ba/salvador");
  });

  it("usa fallback configurado quando o usuario nao tem territorio resolvido", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      fallbackHref: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("usa o ultimo territorio visitado antes do fallback global", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      lastTerritoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
      fallbackHref: "/comunidade/ba/salvador/pituba",
    });

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("aceita ultimo territorio municipal valido", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      lastTerritoryBaseUrl: "/ba/salvador",
      fallbackHref: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(href).toBe("/comunidade/ba/salvador");
  });

  it("prioriza o territorio atual quando nao ha residencia resolvida", () => {
    const href = resolveHomeCommunityHref({
      groups: [],
      homeCityPath: null,
      homeDistrictPath: null,
      currentTerritoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
      fallbackHref: "/comunidade/ba/salvador",
    });

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("prioriza o ultimo grupo visitado quando ele ainda esta ativo", () => {
    const href = resolveHomeCommunityHref({
      homeCityPath: "/ba/salvador",
      homeDistrictPath: "/ba/salvador/nordeste-de-amaralina",
      groups: [
        {
          slug: "pituba-plus",
          name: "Pituba Plus",
          status: "active",
        },
        {
          slug: "complexo-do-nordeste-de-amaralina",
          name: "Complexo do Nordeste de Amaralina",
          status: "active",
        },
      ],
      lastTerritoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(href).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina");
  });
});
