import { describe, expect, it } from "vitest";

import { buildPublicHeaderNavigation } from "./publicHeaderNavigation";

const URLS = {
  home: "/",
  community: "/comunidade/pituba",
  business: "/comunidade/pituba/empresas",
  gastronomy: "/comunidade/pituba/gastronomia",
  services: "/comunidade/pituba/servicos",
  classifieds: "/comunidade/pituba/classificados",
  map: "/comunidade/pituba/mapa",
  search: "/busca/ba/salvador",
} as const;

describe("publicHeaderNavigation", () => {
  it("builds the complete launch-enabled public menu in canonical order", () => {
    const items = buildPublicHeaderNavigation(URLS);

    expect(items.map((item) => item.id)).toEqual([
      "home",
      "community",
      "business",
      "gastronomy",
      "services",
      "classifieds",
      "map",
      "search",
    ]);
    expect(items.map((item) => item.href)).toEqual([
      URLS.home,
      URLS.community,
      URLS.business,
      URLS.gastronomy,
      URLS.services,
      URLS.classifieds,
      URLS.map,
      URLS.search,
    ]);
    expect(items.every((item) => item.icon && item.description)).toBe(true);
  });

  it("allows contextual home and community labels without duplicating definitions", () => {
    const items = buildPublicHeaderNavigation(URLS, {
      homeLabel: "Cidade",
      communityLabel: "Comunidade",
    });

    expect(items.find((item) => item.id === "home")?.label).toBe("Cidade");
    expect(items.find((item) => item.id === "community")?.label).toBe("Comunidade");
  });
});
