import { describe, expect, it } from "vitest";

import {
  buildContextualModuleUrl,
  shouldUseCommunityScopedModuleUrls,
} from "@/core/routing/utils/communityModuleUrls";
import { MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";

describe("communityModuleUrls", () => {
  it("mantem alias explicito quando a rota atual esta dentro da comunidade publica", () => {
    const useScoped = shouldUseCommunityScopedModuleUrls({
      pathname: "/comunidade/complexo-do-nordeste-de-amaralina/feed",
      territoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
      communityBaseUrl: "/comunidade/complexo-do-nordeste-de-amaralina",
    });

    expect(useScoped).toBe(true);
    expect(
      buildContextualModuleUrl({
        module: MODULE_SLUGS.business,
        territoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
        communityBaseUrl: "/comunidade/complexo-do-nordeste-de-amaralina",
        useCommunityScopedModules: useScoped,
      }),
    ).toBe("/comunidade/complexo-do-nordeste-de-amaralina/empresas");
  });

  it("usa comunidade fallback quando a base comunitaria e a propria base territorial", () => {
    const useScoped = shouldUseCommunityScopedModuleUrls({
      pathname: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed",
      territoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
      communityBaseUrl: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    expect(useScoped).toBe(true);
    expect(
      buildContextualModuleUrl({
        module: MODULE_SLUGS.services,
        territoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
        communityBaseUrl: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
        useCommunityScopedModules: useScoped,
      }),
    ).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/servicos");
  });

  it("mantem rota canonica quando a rota atual esta fora da comunidade publica", () => {
    const useScoped = shouldUseCommunityScopedModuleUrls({
      pathname: "/empresas/ba/salvador/complexo-do-nordeste-de-amaralina",
      territoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
      communityBaseUrl: "/comunidade/complexo-do-nordeste-de-amaralina",
    });

    expect(useScoped).toBe(false);
    expect(
      buildContextualModuleUrl({
        module: MODULE_SLUGS.business,
        territoryBaseUrl: "/ba/salvador/complexo-do-nordeste-de-amaralina",
        communityBaseUrl: "/comunidade/complexo-do-nordeste-de-amaralina",
        useCommunityScopedModules: useScoped,
      }),
    ).toBe("/empresas/ba/salvador/complexo-do-nordeste-de-amaralina");
  });
});
